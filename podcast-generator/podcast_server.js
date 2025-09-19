/**
 * Podcast Generator App - Resilient Redesign
 * 
 * Enhancements for Ollama Port Resilience:
 * - Health check Ollama API before use.
 * - Auto-launch Ollama via hub API if not responding.
 * - Fallback to local template if Ollama fails.
 * - Configurable port via OLLAMA_PORT env var (default: 11435).
 * - UI status updates for resilience actions.
 * 
 * Workflow:
 * 1. Upload PDF -> Extract text.
 * 2. Check Ollama health; launch if needed; research with fallback.
 * 3. Generate script (Ollama or template).
 * 4. Review/edit script.
 * 5. Generate audio with MeloTTS (Shay/Omer voices).
 * 6. Mix with FFmpeg (intro/outro music, effects).
 * 7. Download or upload to podcast sites.
 * 
 * Dependencies: Express, Multer, pdf-parse, axios, cheerio, fluent-ffmpeg, form-data, fs-extra, winston.
 * Assumes: Hub on http://localhost:7860, MeloTTS venv, FFmpeg in PATH.
 * Error Handling: Try-catch, health checks, logging to podcast-gen.log.
 * 
 * Launch: node podcast_server.js (runs on http://localhost:3001).
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
const { spawn } = require('child_process');
const config = require('./config.json');

// Logging setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'podcast-gen.log' })]
});

// App setup
const app = express();
const PORT = 3001;
const HUB_URL = 'http://localhost:7860'; // Hub endpoint for launching Ollama
const upload = multer({ dest: 'uploads/' });
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));
app.set('view engine', 'ejs');

// Temp directories
const TMP_DIR = 'tmp/';
const AUDIO_DIR = 'audio/';
fs.ensureDirSync(TMP_DIR);
fs.ensureDirSync(AUDIO_DIR);

// Config
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11435; // Configurable via env
const OLLAMA_URL = `http://localhost:${OLLAMA_PORT}/api/generate`;
const MELO_PATH = config.melo_path;
const AI_VOICE_SCRIPT = config.ai_voice_script;
const OLLAMA_START_SCRIPT = config.ollama_start_script;

// Royalty-free music URLs (Pixabay placeholders)
const INTRO_MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/03/10/audio_5a7b7c3a7e.mp3';
const OUTRO_MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/03/15/audio_8f2d4e1a4b.mp3';
const TRANSITION_EFFECT_URL = 'https://cdn.pixabay.com/audio/2022/03/20/audio_9e3f5a2b6c.mp3';

// Ollama health check
async function checkOllamaHealth() {
  try {
    const response = await axios.get(`http://localhost:${OLLAMA_PORT}`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    logger.warn(`Ollama health check failed on port ${OLLAMA_PORT}: ${error.message}`);
    return false;
  }
}

// Auto-launch Ollama via hub
async function launchOllama() {
  try {
    const response = await axios.post(`${HUB_URL}/api/launch`, {
      filenames: [OLLAMA_START_SCRIPT]
    });
    const results = response.data;
    const ollamaResult = results.find(r => r.message.includes('start_ollama.bat'));
    if (ollamaResult && ollamaResult.success) {
      logger.info('Ollama launched via hub');
      return true;
    }
    logger.error('Failed to launch Ollama via hub');
    return false;
  } catch (error) {
    logger.error(`Failed to launch Ollama: ${error.message}`);
    return false;
  }
}

// Fallback script template if Ollama fails
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
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    });
    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    logger.error(`Failed to download ${url}: ${error.message}`);
    throw new Error(`Download failed: ${error.message}`);
  }
}

// PDF text extraction
async function extractPdfText(pdfPath) {
  try {
    if (fs.statSync(pdfPath).size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('PDF file too large');
    }
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    logger.error(`PDF extraction failed: ${error.message}`);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

// Research function (Ollama-enhanced or fallback)
async function researchTopic(pdfText, title) {
  try {
    const isOllamaReady = await checkOllamaHealth();
    if (isOllamaReady) {
      const response = await axios.post(OLLAMA_URL, {
        model: 'deepseek-llm:7b',
        prompt: `Research this PDF topic: ${title}. Extract title/author, find Amazon reviews, news updates, author/publisher credibility. Output JSON.`,
        stream: false
      });
      return JSON.parse(response.data.response);
    } else {
      // Fallback: Improved extraction
      const lines = pdfText.split('\n').slice(0, 20); // Check more lines
      let bookTitle = title || 'Unknown Title';
      let author = 'Unknown Author';
      for (const line of lines) {
        if (line.match(/title/i)) bookTitle = line.split(':').slice(1).join(':').trim() || bookTitle;
        if (line.match(/author/i)) author = line.split(':').slice(1).join(':').trim() || author;
      }
      logger.warn('Ollama unavailable, using fallback research');
      return {
        bookTitle,
        author,
        amazonReviews: [],
        news: [],
        credibility: ['Fallback research: No Ollama available.']
      };
    }
  } catch (error) {
    logger.error(`Research failed: ${error.message}`);
    return { error: 'Research failed - Ollama unavailable. Using fallback template.' };
  }
}

// Script generation (Ollama or fallback)
async function generateScript(research, welcomeText, endingText, retryCount = 0, maxRetries = 2) {
  try {
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
      const response = await axios.post(OLLAMA_URL, {
        model: 'deepseek-llm:7b',
        prompt,
        stream: false
      });
      return response.data.response;
    } else if (retryCount < maxRetries) {
      const launched = await launchOllama();
      if (launched) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        return generateScript(research, welcomeText, endingText, retryCount + 1, maxRetries); // Retry
      }
    }
    // Fallback template
    const topic = research.bookTitle || 'Unknown Topic';
    return FALLBACK_SCRIPT_TEMPLATE.replace('{topic}', topic);
  } catch (error) {
    logger.error(`Script generation failed: ${error.message}`);
    const topic = research.bookTitle || 'Unknown Topic';
    return FALLBACK_SCRIPT_TEMPLATE.replace('{topic}', topic);
  }
}

// Generate TTS audio
async function generateTTS(text, voice = 'EN-BR', outputFile) {
  try {
    const scriptPath = AI_VOICE_SCRIPT;
    const python = spawn(MELO_PATH, [scriptPath, text, voice, outputFile], { cwd: path.dirname(scriptPath) });
    return new Promise((resolve, reject) => {
      python.on('close', (code) => {
        if (code === 0) {
          resolve(`Generated ${outputFile}`);
        } else {
          reject(new Error(`TTS failed with code ${code}`));
        }
      });
      python.stderr.on('data', (data) => {
        logger.error(`TTS stderr: ${data.toString()}`);
      });
    });
  } catch (error) {
    logger.error(`TTS spawn failed: ${error.message}`);
    throw new Error('TTS generation failed');
  }
}

// Mix audio with FFmpeg
async function mixAudio(scriptAudio, introMusic, outroMusic, effects, finalFile) {
  try {
    // Validate input files
    for (const file of [scriptAudio, introMusic, outroMusic, effects]) {
      if (!fs.existsSync(file)) {
        throw new Error(`Input file missing: ${file}`);
      }
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
        .on('end', () => resolve('Audio mixed'))
        .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
        .run();
    });
  } catch (error) {
    logger.error(`Audio mixing failed: ${error.message}`);
    throw error;
  }
}

// Clean up temporary files
async function cleanupTempFiles() {
  try {
    await fs.emptyDir(TMP_DIR);
    logger.info('Cleaned up temporary files');
  } catch (error) {
    logger.error(`Failed to clean up temporary files: ${error.message}`);
  }
}

// Upload to Buzzsprout
async function uploadToBuzzsprout(audioFile, title, description, token, podcastId) {
  try {
    const form = new FormData();
    form.append('episode[title]', title);
    form.append('episode[description]', description);
    form.append('episode[media]', fs.createReadStream(audioFile));
    const response = await axios.post(`https://www.buzzsprout.com/api/${podcastId}/episodes.json`, form, {
      headers: {
        'Authorization': `Token token=${token}`,
        ...form.getHeaders()
      }
    });
    return response.data;
  } catch (error) {
    logger.error(`Buzzsprout upload failed: ${error.message}`);
    throw new Error('Buzzsprout upload failed');
  }
}

// Upload to Libsyn
async function uploadToLibsyn(audioFile, title, description, apiKey) {
  try {
    const form = new FormData();
    form.append('episode_title', title);
    form.append('episode_description', description);
    form.append('episode_file', fs.createReadStream(audioFile));
    const response = await axios.post('https://api.libsyn.com/2.0/create_episode', form, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...form.getHeaders()
      }
    });
    return response.data;
  } catch (error) {
    logger.error(`Libsyn upload failed: ${error.message}`);
    throw new Error('Libsyn upload failed');
  }
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { ollamaPort: OLLAMA_PORT }); // Pass port to UI for display
});

app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const pdfText = await extractPdfText(req.file.path);
    const research = await researchTopic(pdfText, 'PDF Title');
    res.json({ success: true, text: pdfText, research });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/generate-script', async (req, res) => {
  try {
    const { research, welcomeText, endingText } = req.body;
    if (!research || !welcomeText || !endingText) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const script = await generateScript(research, welcomeText, endingText);
    res.json({ success: true, script });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/review-script', (req, res) => {
  try {
    const { script } = req.body;
    if (!script) {
      return res.status(400).json({ success: false, message: 'Script is required' });
    }
    res.json({ success: true, script });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/generate-audio', async (req, res) => {
  try {
    const { script } = req.body;
    if (!script) {
      return res.status(400).json({ success: false, message: 'Script is required' });
    }
    const shayParts = script.match(/Shay: (.*?)(\n|Omer:|$)/g) || [];
    const omerParts = script.match(/Omer: (.*?)(\n|Shay:|$)/g) || [];

    const shayAudio = 'tmp/shay_audio.wav';
    await generateTTS(shayParts.map(p => p.replace('Shay: ', '')).join('\n'), 'EN-BR', shayAudio);

    const omerAudio = 'tmp/omer_audio.wav';
    await generateTTS(omerParts.map(p => p.replace('Omer: ', '')).join('\n'), 'EN-US', omerAudio);

    // Combine Shay and Omer audio
    const combinedAudio = 'tmp/combined.wav';
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(shayAudio)
        .input(omerAudio)
        .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[out]')
        .output(combinedAudio)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const intro = 'tmp/intro.mp3';
    if (!fs.existsSync(intro)) await downloadResource(INTRO_MUSIC_URL, intro);
    const outro = 'tmp/outro.mp3';
    if (!fs.existsSync(outro)) await downloadResource(OUTRO_MUSIC_URL, outro);
    const effect = 'tmp/effect.mp3';
    if (!fs.existsSync(effect)) await downloadResource(TRANSITION_EFFECT_URL, effect);

    const finalAudio = `audio/podcast_${Date.now()}.wav`;
    await mixAudio(combinedAudio, intro, outro, effect, finalAudio);
    await cleanupTempFiles(); // Clean up after generating audio

    res.json({ success: true, audioFile: finalAudio });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/download/:filename', (req, res) => {
  const filePath = path.join(AUDIO_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.post('/upload-podcast', async (req, res) => {
  try {
    const { audioFile, title, description, buzzToken, buzzPodcastId, libsynApiKey } = req.body;
    if (!audioFile || !title || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    let buzzResult = null;
    let libsynResult = null;

    if (buzzToken && buzzPodcastId) {
      buzzResult = await uploadToBuzzsprout(audioFile, title, description, buzzToken, buzzPodcastId);
    }
    if (libsynApiKey) {
      libsynResult = await uploadToLibsyn(audioFile, title, description, libsynApiKey);
    }

    res.json({ success: true, buzz: buzzResult, libsyn: libsynResult });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  try {
    await new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err) => {
        if (err) reject(new Error('FFmpeg not found'));
        else resolve();
      });
    });
    logger.info(`Podcast Generator running on http://localhost:${PORT}`);
  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
});