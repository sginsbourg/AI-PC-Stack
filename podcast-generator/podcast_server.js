/**
 * Podcast Generator App - Resilient Redesign with Enhanced Debugging
 * 
 * ... (original comments omitted for brevity)
 * 
 * New Improvements:
 * - Fallback to append FFmpeg bin to process.env.PATH if not found.
 * - Configurable ffmpeg_bin in config.json.
 * - SKIP_FFMPEG_CHECK env var to bypass FFmpeg check for debugging.
 * - Log current PATH and FFmpeg version on startup.
 * - Handle port binding errors.
 * - Global unhandled error listeners.
 */

// ... (all previous imports and logger setup remain the same)

// Config updates
let OLLAMA_PORT, OLLAMA_URL, MELO_PATH, AI_VOICE_SCRIPT, OLLAMA_START_SCRIPT, FFMPEG_BIN;
try {
  // ... (existing config loading)
  FFMPEG_BIN = config.ffmpeg_bin || 'C:\\ffmpeg\\bin';

  // Validate existing paths...
  if (!fs.existsSync(FFMPEG_BIN)) {
    logger.warn(`FFmpeg bin path does not exist: ${FFMPEG_BIN}. Will attempt detection without it.`);
  }
} catch (error) {
  logger.error(`Config validation failed: ${error.message}`);
  process.exit(1);
}

// ... (all other functions remain the same, with potential added logger.debug calls if needed)

// Start server with enhanced checks
async function startServer() {
  try {
    logger.info('Starting Podcast Generator startup checks');

    // Log current PATH for debugging
    logger.debug(`Current process.env.PATH: ${process.env.PATH}`);

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
      // Fallback: Append FFmpeg bin to PATH
      logger.info(`Attempting to add FFmpeg bin to process.env.PATH: ${FFMPEG_BIN}`);
      process.env.PATH = `${FFMPEG_BIN};${process.env.PATH}`;
      logger.debug(`Updated process.env.PATH: ${process.env.PATH}`);

      // Retry FFmpeg check
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
    }

    // Get and log FFmpeg version for verification
    try {
      const { stdout } = await new Promise((resolve, reject) => {
        require('child_process').exec('ffmpeg -version', (err, stdout, stderr) => {
          if (err) reject(err);
          resolve({ stdout, stderr });
        });
      });
      logger.info(`FFmpeg version: ${stdout.split('\n')[0]}`);
    } catch (error) {
      logger.warn(`Failed to get FFmpeg version: ${error.message}`);
    }

    // Skip check if env var set
    const skipFfmpegCheck = process.env.SKIP_FFMPEG_CHECK === 'true';
    if (!ffmpegAvailable && !skipFfmpegCheck) {
      throw new Error('FFmpeg not found even after PATH fallback. Set SKIP_FFMPEG_CHECK=true to bypass (audio features will fail).');
    } else if (!ffmpegAvailable && skipFfmpegCheck) {
      logger.warn('Bypassing FFmpeg check due to SKIP_FFMPEG_CHECK=true. Audio generation may fail.');
    }

    // ... (Hub and Ollama checks remain the same)

    const server = app.listen(PORT, () => {
      logger.info(`Podcast Generator running on http://localhost:${PORT}`);
      logger.info(`Debug mode: ${logLevel === 'debug'}`);
      logger.info('For detailed logs, check podcast-gen.log');
    });

    // Handle port binding errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Try a different port or close the conflicting process.`);
      } else {
        logger.error(`Server startup error: ${err.message}`);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
}

// Global unhandled error handlers
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message} - Stack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled promise rejection: ${reason}`);
});

// ... (all routes remain the same)

startServer();