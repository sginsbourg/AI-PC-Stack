/**
 * Podcast Generator App - Resilient Redesign with Enhanced Debugging
 * 
 * Enhancements:
 * - Fallback FFmpeg PATH addition (C:\ffmpeg\bin).
 * - SKIP_STARTUP_CHECKS env var to bypass FFmpeg/Ollama checks.
 * - Safe child_process handling to avoid DEP0190 warnings.
 * - Automatic port fallback (3001 -> 3002).
 * - Granular logging for startup, PATH, FFmpeg, and port binding.
 * - Non-fatal startup checks with warnings.
 * 
 * Workflow: (unchanged)
 * Dependencies: Express, Multer, pdf-parse, axios, cheerio, fluent-ffmpeg, form-data, fs-extra, winston.
 * Launch: node podcast_server.js (default http://localhost:3001).
 */

const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');
const ffmpeg = require('fluent-ffmpeg');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const { spawn, exec } = require('child_process');
const net = require('net'); // For port checking
const config = require('./config.json');

// Logging setup
const logLevel = process.env.DEBUG === 'true' ? 'debug' : 'info';
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'podcast-gen.log' })
  ]
});

// App setup
const app = express();
const BASE_PORT = 3001;
const FALLBACK_PORT = 3002;
const HUB_URL = 'http://localhost:7860';
const upload = multer({ dest: 'uploads/' });
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));
app.set('view engine', 'ejs');

// Temp directories
const TMP_DIR = 'tmp/';
const AUDIO_DIR = 'audio/';
try {
  logger.debug('Ensuring directories exist');
  fs.ensureDirSync(TMP_DIR);
  fs.ensureDirSync(AUDIO_DIR);
  logger.debug(`Directories ensured: ${TMP_DIR}, ${AUDIO_DIR}`);
} catch (error) {
  logger.error(`Failed to create directories: ${error.message}`);
  process.exit(1);
}

// Config
let OLLAMA_PORT, OLLAMA_URL, MELO_PATH, AI_VOICE_SCRIPT, OLLAMA_START_SCRIPT, FFMPEG_BIN;
try {
  logger.debug('Validating config.json');
  OLLAMA_PORT = process.env.OLLAMA_PORT || 11435;
  OLLAMA_URL = `http://localhost:${OLLAMA_PORT}/api/generate`;
  MELO_PATH = config.melo_path;
  AI_VOICE_SCRIPT = config.ai_voice_script;
  OLLAMA_START_SCRIPT = config.ollama_start_script;
  FFMPEG_BIN = config.ffmpeg_bin || 'C:\\ffmpeg\\bin';

  // Validate paths
  const paths = [
    { name: 'MeloTTS Python', path: MELO_PATH },
    { name: 'AI Voice Script', path: AI_VOICE_SCRIPT },
    { name: 'Ollama Start Script', path: OLLAMA_START_SCRIPT },
    { name: 'FFmpeg Bin', path: FFMPEG_BIN }
  ];
  for (const { name, path } of paths) {
    if (!fs.existsSync(path)) {
      logger.warn(`${name} path does not exist: ${path}`);
    } else {
      logger.debug(`${name} path validated: ${path}`);
    }
  }
} catch (error) {
  logger.error(`Config validation failed: ${error.message}`);
  if (process.env.SKIP_STARTUP_CHECKS !== 'true') {
    process.exit(1);
  }
  logger.warn('Continuing due to SKIP_STARTUP_CHECKS=true');
}

// Royalty-free music URLs
const INTRO_MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/03/10/audio_5a7b7c3a7e.mp3';
const OUTRO_MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_8f2d4e1a4b.mp3';
const TRANSITION_EFFECT_URL = 'https://cdn.pixabay.com/audio/2022/03/20/audio_9e3f5a2b6c.mp3';

// Check if port is available
async function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      logger.error(`Port ${port} check failed: ${err.message}`);
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      logger.debug(`Port ${port} is available`);
      resolve(true);
    });
    server.listen(port);
  });
}

// Ollama health check
async function checkOllamaHealth() {
  try {
    logger.debug(`Checking Ollama health on port ${OLLAMA_PORT}`);
    const response = await axios.get(`http://localhost:${OLLAMA_PORT}`, { timeout: 5000 });
    logger.debug(`Ollama health check successful: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    logger.warn(`Ollama health check failed on port ${OLLAMA_PORT}: ${error.message}`);
    return false;
  }
}

// Auto-launch Ollama via hub
async function launchOllama() {
  try {
    logger.debug(`Attempting to launch Ollama via hub: ${HUB_URL}`);
    const response = await axios.post(`${HUB_URL}/api/launch`, {
      filenames: [OLLAMA_START_SCRIPT]
    });
    const results = response.data;
    const ollamaResult = results.find(r => r.message.includes('start_ollama.bat'));
    if (ollamaResult && ollamaResult.success) {
      logger.info('Ollama launched via hub successfully');
      return true;
    } else {
      logger.error('Ollama launch via hub failed: No success in results');
      return false;
    }
  } catch (error) {
    logger.error(`Failed to launch Ollama: ${error.message}`);
    return false;
  }
}

// Fallback script template
const FALLBACK_SCRIPT_TEMPLATE = `
[Music Intro - Upbeat]
Shay: Welcome to our AI podcast! Today we're discussing {topic} from the PDF.
Omer: Hi Shay! Let's dive in.
[Dialog - Placeholder]
[Transition Effect]
[Outro Music - Slow]
Shay: Thanks for listening! See you next time.
`;

// Download resource
async function downloadResource(url, filename) {
  try {
    logger.debug(`Downloading resource from ${url} to ${filename}`);
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    });
    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logger.debug(`Download completed: ${filename}`);
        resolve();
      });
      writer.on('error', (err) => {
        logger.error(`Download writer error for ${filename}: ${err.message}`);
        reject(err);
      });
    });
  } catch (error) {
    logger.error(`Failed to download ${url}: ${error.message}`);
    throw new Error(`Download failed: ${error.message}`);
  }
}

// PDF text extraction
async function extractPdfText(pdfPath) {
  try {
    logger.debug(`Extracting text from PDF: ${pdfPath}`);
    const stats = fs.statSync(pdfPath);
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error('PDF file too large (max 10MB)');
    }
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    logger.debug(`PDF extraction successful: ${data.text.length} characters`);
    return data.text;
  } catch (error) {
    logger.error(`PDF extraction failed for ${pdfPath}: ${error.message}`);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

// Research function
async function researchTopic(pdfText, title) {
  try {
    logger.debug(`Starting research for topic: ${title}`);
    const isOllamaReady = await checkOllamaHealth();
    if (isOllamaReady) {
      logger.debug('Ollama ready, using AI for research');
      const response = await axios.post(OLLAMA_URL, {
        model: 'deepseek-llm:7b',
        prompt: `Research this PDF topic: ${title}. Extract title/author, find Amazon reviews, news updates, author/publisher credibility. Output JSON.`,
        stream: false
      }, { timeout: 30000 });
      const parsed = JSON.parse(response.data.response);
      logger.debug('AI research completed successfully');
      return parsed;
    } else {
      logger.warn('Ollama not ready, using fallback research');
      const lines = pdfText.split('\n').slice(0, 20);
      let bookTitle = title || 'Unknown Title';
      let author = 'Unknown Author';
      for (const line of lines) {
        if (line.match(/title/i)) bookTitle = line.split(':').slice(1).join(':').trim() || bookTitle;
        if (line.match(/author/i)) author = line.split(':').slice(1).join(':').trim() || author;
      }
      const fallbackResult = {
        bookTitle,
        author,
        amazonReviews: [],
        news: [],
        credibility: ['Fallback research: No Ollama available.']
      };
      logger.debug('Fallback research completed');
      return fallbackResult;
    }
  } catch (error) {
    logger.error(`Research failed for ${title}: ${error.message}`);
    return { error: `Research failed - Ollama unavailable: ${error.message}. Using fallback template.` };
  }
}

// Script generation
async function generateScript(research, welcomeText, endingText, retryCount = 0, maxRetries = 2) {
  try {
    logger.debug(`Generating script (retry ${retryCount}/${maxRetries})`);
    const isOllamaReady = await checkOllamaHealth();
    if (isOllamaReady) {
      const prompt = `
You are a podcast script writer. Hosts: Shay Ginsbourg (main host, enthusiastic) and Omer (AI co-host, witty).
Welcome: ${welcomeText}
Research: ${JSON.stringify(research)}
Generate a dialog script between Shay and Omer discussing the PDF topic, incorporating updates, reviews, author/publisher credibility, and news. Keep it engaging, 10-15 minutes (2000-3000 words). End with: ${endingText}
Format: 
[Music Intro - Upbeat]
Shay: Welcome...
Omer: Hi Shay...
[Dialog]
[Transition Effect]
[Outro Music - Slow]
      `;
      logger.debug('Sending prompt to Ollama for script generation');
      const response = await axios.post(OLLAMA_URL, {
        model: 'deepseek-llm:7b',
        prompt,
        stream: false
      }, { timeout: 60000 });
      logger.debug('Script generation via Ollama completed');
      return response.data.response;
    } else if (retryCount < maxRetries) {
      logger.warn(`Ollama not ready, attempting launch (retry ${retryCount + 1})`);
      const launched = await launchOllama();
      if (launched) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        logger.debug('Retrying script generation after launch');
        return generateScript(research, welcomeText, endingText, retryCount + 1, maxRetries);
      }
    }
    logger.warn('Using fallback script template');
    const topic = research.bookTitle || 'Unknown Topic';
    const fallbackScript = FALLBACK_SCRIPT_TEMPLATE.replace('{topic}', topic);
    logger.debug('Fallback script generated');
    return fallbackScript;
  } catch (error) {
    logger.error(`Script generation failed (retry ${retryCount}): ${error.message}`);
    const topic = research.bookTitle || 'Unknown Topic';
    return FALLBACK_SCRIPT_TEMPLATE.replace('{topic}', topic);
  }
}

// Generate TTS audio
async function generateTTS(text, voice = 'EN-BR', outputFile) {
  return new Promise((resolve, reject) => {
    try {
      logger.debug(`Generating TTS for voice ${voice}: ${text.substring(0, 100)}... to ${outputFile}`);
      const scriptPath = AI_VOICE_SCRIPT;
      const python = spawn(MELO_PATH, [scriptPath, text, voice, outputFile], { cwd: path.dirname(scriptPath) });
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
        logger.debug(`TTS stdout: ${data.toString().trim()}`);
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.error(`TTS stderr: ${data.toString().trim()}`);
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          logger.info(`TTS generated successfully: ${outputFile}`);
          resolve(`Generated ${outputFile}`);
        } else {
          const errorMsg = `TTS failed with code ${code}. Stdout: ${stdout}. Stderr: ${stderr}`;
          logger.error(errorMsg);
          reject(new Error(errorMsg));
        }
      });
      
      python.on('error', (err) => {
        logger.error(`TTS spawn error: ${err.message}`);
        reject(new Error(`TTS spawn failed: ${err.message}`));
      });
    } catch (error) {
      logger.error(`TTS setup error: ${error.message}`);
      reject(error);
    }
  });
}

// Mix audio with FFmpeg
async function mixAudio(scriptAudio, introMusic, outroMusic, effects, finalFile) {
  try {
    logger.debug(`Mixing audio: ${scriptAudio}, ${introMusic}, ${outroMusic}, ${effects} -> ${finalFile}`);
    const inputs = [scriptAudio, introMusic, outroMusic, effects];
    for (const file of inputs) {
      if (!fs.existsSync(file)) {
        throw new Error(`Input file missing: ${file}`);
      }
      logger.debug(`Input file validated: ${file}`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(introMusic)
        .input(scriptAudio)
        .input(effects)
        .input(outroMusic)
        .complexFilter([
          '[0:a]atrim=duration=10[intro]',
          '[2:a]atrim=duration=1[effect]',
          '[3:a]atrim=duration=10[outro]',
          '[intro][1:a][effect][outro]concat=n=4:v=0:a=1[out]'
        ])
        .output(finalFile)
        .on('start', (commandLine) => {
          logger.debug(`FFmpeg started: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.debug(`FFmpeg progress: ${progress.percent}%`);
        })
        .on('end', () => {
          logger.info(`Audio mixing completed: ${finalFile}`);
          resolve('Audio mixed');
        })
        .on('error', (err) => {
          logger.error(`FFmpeg error: ${err.message}`);
          reject(new Error(`FFmpeg error: ${err.message}`));
        })
        .run();
    });
  } catch (error) {
    logger.error(`Audio mixing setup failed: ${error.message}`);
    throw error;
  }
}

// Clean up temporary files
async function cleanupTempFiles() {
  try {
    logger.debug('Starting temporary file cleanup');
    await fs.emptyDir(TMP_DIR);
    logger.info('Cleaned up temporary files successfully');
  } catch (error) {
    logger.error(`Failed to clean up temporary files: ${error.message}`);
  }
}

// Upload to Buzzsprout
async function uploadToBuzzsprout(audioFile, title, description, token, podcastId) {
  try {
    logger.debug(`Uploading to Buzzsprout: ${title}`);
    const form = new FormData();
    form.append('episode[title]', title);
    form.append('episode[description]', description);
    form.append('episode[media]', fs.createReadStream(audioFile));
    const response = await axios.post(`https://www.buzzsprout.com/api/${podcastId}/episodes.json`, form, {
      headers: {
        'Authorization': `Token token=${token}`,
        ...form.getHeaders()
      },
      timeout: 300000
    });
    logger.info(`Buzzsprout upload successful: ${response.data.id || 'unknown'}`);
    return response.data;
  } catch (error) {
    logger.error(`Buzzsprout upload failed: ${error.message}`);
    throw new Error(`Buzzsprout upload failed: ${error.message}`);
  }
}

// Upload to Libsyn
async function uploadToLibsyn(audioFile, title, description, apiKey) {
  try {
    logger.debug(`Uploading to Libsyn: ${title}`);
    const form = new FormData();
    form.append('episode_title', title);
    form.append('episode_description', description);
    form.append('episode_file', fs.createReadStream(audioFile));
    const response = await axios.post('https://api.libsyn.com/2.0/create_episode', form, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders()
      },
      timeout: 300000
    });
    logger.info(`Libsyn upload successful: ${response.data.id || 'unknown'}`);
    return response.data;
  } catch (error) {
    logger.error(`Libsyn upload failed: ${error.message}`);
    throw new Error(`Libsyn upload failed: ${error.message}`);
  }
}

// Routes
app.get('/', (req, res) => {
  try {
    logger.debug('Serving index page');
    res.render('index', { ollamaPort: OLLAMA_PORT });
  } catch (error) {
    logger.error(`Failed to render index: ${error.message}`);
    res.status(500).send('Internal server error');
  }
});

app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    logger.debug('Processing PDF upload');
    if (!req.file) {
      throw new Error('No PDF file uploaded');
    }
    const pdfText = await extractPdfText(req.file.path);
    const research = await researchTopic(pdfText, 'PDF Title');
    fs.unlinkSync(req.file.path);
    logger.info('PDF upload and research completed');
    res.json({ success: true, text: pdfText, research });
  } catch (error) {
    logger.error(`PDF upload route error: ${error.message}`);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/generate-script', async (req, res) => {
  try {
    logger.debug('Generating script from request');
    const { research, welcomeText, endingText } = req.body;
    if (!research || !welcomeText || !endingText) {
      throw new Error('Missing required fields: research, welcomeText, endingText');
    }
    const script = await generateScript(research, welcomeText, endingText);
    logger.info('Script generation completed');
    res.json({ success: true, script });
  } catch (error) {
    logger.error(`Script generation route error: ${error.message}`);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/review-script', (req, res) => {
  try {
    logger.debug('Reviewing script');
    const { script } = req.body;
    if (!script) {
      throw new Error('Script is required');
    }
    logger.info('Script review completed');
    res.json({ success: true, script });
  } catch (error) {
    logger.error(`Script review route error: ${error.message}`);
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post('/generate-audio', async (req, res) => {
  try {
    logger.debug('Starting audio generation');
    const { script } = req.body;
    if (!script) {
      throw new Error('Script is required');
    }
    const shayParts = script.match(/Shay: (.*?)(\n|Omer:|$)/g) || [];
    const omerParts = script.match(/Omer: (.*?)(\n|Shay:|$)/g) || [];
    logger.debug(`Extracted ${shayParts.length} Shay parts, ${omerParts.length} Omer parts`);

    const shayAudio = 'tmp/shay_audio.wav';
    await generateTTS(shayParts.map(p => p.replace('Shay: ', '')).join('\n'), 'EN-BR', shayAudio);

    const omerAudio = 'tmp/omer_audio.wav';
    await generateTTS(omerParts.map(p => p.replace('Omer: ', '')).join('\n'), 'EN-US', omerAudio);

    const combinedAudio = 'tmp/combined.wav';
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(shayAudio)
        .input(omerAudio)
        .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[out]')
        .output(combinedAudio)
        .on('end', resolve)
        .on('error', (err) => {
          logger.error(`Audio combine error: ${err.message}`);
          reject(err);
        })
        .run();
    });
    logger.debug('Shay and Omer audio combined');

    const intro = 'tmp/intro.mp3';
    if (!fs.existsSync(intro)) await downloadResource(INTRO_MUSIC_URL, intro);
    const outro = 'tmp/outro.mp3';
    if (!fs.existsSync(outro)) await downloadResource(OUTRO_MUSIC_URL, outro);
    const effect = 'tmp/effect.mp3';
    if (!fs.existsSync(effect)) await downloadResource(TRANSITION_EFFECT_URL, effect);

    const finalAudio = `audio/podcast_${Date.now()}.wav`;
    await mixAudio(combinedAudio, intro, outro, effect, finalAudio);
    await cleanupTempFiles();

    logger.info(`Audio generation completed: ${finalAudio}`);
    res.json({ success: true, audioFile: finalAudio });
  } catch (error) {
    logger.error(`Audio generation route error: ${error.message}`);
    await cleanupTempFiles();
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/download/:filename', (req, res) => {
  try {
    logger.debug(`Downloading file: ${req.params.filename}`);
    const filePath = path.join(AUDIO_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
      logger.info(`File download started: ${filePath}`);
      res.download(filePath);
    } else {
      const errorMsg = `File not found: ${filePath}`;
      logger.error(errorMsg);
      res.status(404).json({ error: errorMsg });
    }
  } catch (error) {
    logger.error(`Download route error: ${error.message}`);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.post('/upload-podcast', async (req, res) => {
  try {
    logger.debug('Starting podcast upload');
    const { audioFile, title, description, buzzToken, buzzPodcastId, libsynApiKey } = req.body;
    if (!audioFile || !title || !description) {
      throw new Error('Missing required fields: audioFile, title, description');
    }
    const fullAudioPath = path.join(AUDIO_DIR, audioFile);
    if (!fs.existsSync(fullAudioPath)) {
      throw new Error(`Audio file not found: ${fullAudioPath}`);
    }
    let buzzResult = null;
    let libsynResult = null;

    if (buzzToken && buzzPodcastId) {
      buzzResult = await uploadToBuzzsprout(fullAudioPath, title, description, buzzToken, buzzPodcastId);
    }
    if (libsynApiKey) {
      libsynResult = await uploadToLibsyn(fullAudioPath, title, description, libsynApiKey);
    }

    logger.info('Podcast upload completed');
    res.json({ success: true, buzz: buzzResult, libsyn: libsynResult });
  } catch (error) {
    logger.error(`Podcast upload route error: ${error.message}`);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message} - Stack: ${err.stack}`);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server with enhanced checks
async function startServer() {
  try {
    logger.info('Starting Podcast Generator startup checks');
    logger.debug(`Environment: Node ${process.version}, Platform ${process.platform}, PID ${process.pid}`);
    logger.debug(`Current process.env.PATH: ${process.env.PATH}`);

    // Check port availability
    let port = BASE_PORT;
    let portAvailable = await checkPort(BASE_PORT);
    if (!portAvailable) {
      logger.warn(`Port ${BASE_PORT} is in use, trying fallback port ${FALLBACK_PORT}`);
      portAvailable = await checkPort(FALLBACK_PORT);
      if (portAvailable) {
        port = FALLBACK_PORT;
      } else {
        throw new Error(`Both ports ${BASE_PORT} and ${FALLBACK_PORT} are in use`);
      }
    }

    // Check FFmpeg
    let ffmpegAvailable = false;
    try {
      await new Promise((resolve, reject) => {
        ffmpeg.getAvailableFormats((err, formats) => {
          if (err) {
            logger.warn(`Initial FFmpeg check failed: ${err.message}`);
            reject(err);
          } else {
            logger.debug(`FFmpeg available with ${Object.keys(formats).length} formats`);
            ffmpegAvailable = true;
            resolve();
          }
        });
      });
    } catch (error) {
      logger.info(`Attempting to add FFmpeg bin to process.env.PATH: ${FFMPEG_BIN}`);
      process.env.PATH = `${FFMPEG_BIN};${process.env.PATH}`;
      logger.debug(`Updated process.env.PATH: ${process.env.PATH}`);

      try {
        await new Promise((resolve, reject) => {
          ffmpeg.getAvailableFormats((err, formats) => {
            if (err) {
              logger.error(`FFmpeg still not found after PATH update: ${err.message}`);
              reject(err);
            } else {
              logger.info(`FFmpeg detected after PATH update with ${Object.keys(formats).length} formats`);
              ffmpegAvailable = true;
              resolve();
            }
          });
        });
      } catch (err) {
        logger.warn(`FFmpeg detection failed: ${err.message}`);
      }
    }

    // Get FFmpeg version (safe, no shell: true)
    try {
      const { stdout } = await new Promise((resolve, reject) => {
        exec('ffmpeg -version', { shell: false }, (err, stdout, stderr) => {
          if (err) reject(new Error(`FFmpeg version check failed: ${err.message}. Stderr: ${stderr}`));
          resolve({ stdout, stderr });
        });
      });
      logger.info(`FFmpeg version: ${stdout.split('\n')[0]}`);
    } catch (error) {
      logger.warn(`Failed to get FFmpeg version: ${error.message}`);
    }

    const skipStartupChecks = process.env.SKIP_STARTUP_CHECKS === 'true';
    if (!ffmpegAvailable && !skipStartupChecks) {
      logger.error('FFmpeg not found. Set SKIP_STARTUP_CHECKS=true to bypass (audio features will fail).');
      process.exit(1);
    } else if (!ffmpegAvailable) {
      logger.warn('Bypassing FFmpeg check due to SKIP_STARTUP_CHECKS=true. Audio generation may fail.');
    }

    // Check Hub availability
    try {
      await axios.get(HUB_URL, { timeout: 5000 });
      logger.debug('Hub API accessible');
    } catch (error) {
      logger.warn(`Hub API not accessible: ${error.message}. Ollama auto-launch may fail.`);
    }

    // Initial Ollama health check
    const initialOllamaHealth = await checkOllamaHealth();
    if (!initialOllamaHealth && !skipStartupChecks) {
      logger.warn('Ollama not running initially. Will attempt launch on demand.');
    }

    const server = app.listen(port, () => {
      logger.info(`Podcast Generator running on http://localhost:${port}`);
      logger.info(`Debug mode: ${logLevel === 'debug'}`);
      logger.info('For detailed logs, check podcast-gen.log');
    });

    server.on('error', (err) => {
      logger.error(`Server startup error: ${err.message}`);
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use. Try closing the conflicting process or using a different port.`);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    if (process.env.SKIP_STARTUP_CHECKS !== 'true') {
      process.exit(1);
    }
    logger.warn('Continuing due to SKIP_STARTUP_CHECKS=true');
    app.listen(BASE_PORT, () => {
      logger.info(`Podcast Generator running on http://localhost:${BASE_PORT} (forced)`);
    });
  }
}

// Global error handlers
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message} - Stack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled promise rejection: ${reason}`);
});

startServer();