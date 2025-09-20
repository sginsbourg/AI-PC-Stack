```javascript
// Debug: Log file content and size to diagnose TypeError
const fs = require('fs');
try {
    const fileContent = fs.readFileSync(__filename, 'utf8');
    const fileSize = fs.statSync(__filename).size;
    console.log('=== DEBUG: server.js Info ===');
    console.log('File size: ' + fileSize + ' bytes');
    console.log('First 5 lines:');
    console.log(fileContent.split('\n').slice(0, 5).join('\n'));
    console.log('====================');
    const syntaxCheck = require('syntax-error');
    const err = syntaxCheck(fileContent);
    if (err) {
        console.error('Syntax error in server.js:', err);
        process.exit(1);
    }
    console.log('server.js syntax validated successfully');
} catch (err) {
    console.error('Failed to read/validate server.js:', err.message);
    process.exit(1);
}

const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const logger = require('winston');
const net = require('net');
const os = require('os');

// Configure logging
logger.configure({
    transports: [
        new logger.transports.Console({
            level: 'debug',
            format: logger.format.combine(
                logger.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logger.format.simple()
            )
        }),
        new logger.transports.File({ filename: 'debug.log', level: 'debug' })
    ]
});

// Log system info
logger.info('System Info: OS ' + os.type() + ', Arch ' + os.arch() + ', Node v' + process.version + ', CWD ' + __dirname);

const app = express();
const PORT = 7860;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const HUB_FILE = path.resolve(__dirname, 'server.js');

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use((req, res, next) => {
    logger.debug('Request: ' + req.method + ' ' + req.url + ' from ' + req.ip + ', Body: ' + JSON.stringify(req.body));
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Health endpoint
app.get('/api/health', (req, res) => {
    const memoryUsage = process.memoryUsage();
    logger.debug('Health check: Memory ' + JSON.stringify(memoryUsage));
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        memoryUsage,
        uptime: process.uptime()
    });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
    try {
        const apps = loadConfig();
        const systemInfo = {
            os: os.type(),
            arch: os.arch(),
            nodeVersion: process.version,
            cwd: __dirname,
            configFileExists: fs.existsSync(CONFIG_FILE),
            configFilePath: CONFIG_FILE,
            appsCount: apps.length,
            apps: apps,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            serverFileSize: fs.statSync(__filename).size
        };
        logger.info('Debug info requested: ' + JSON.stringify(systemInfo));
        res.json(systemInfo);
    } catch (error) {
        logger.error('Error in /api/debug: ' + error.message + ', Stack: ' + error.stack);
        res.status(500).json({ success: false, message: 'Error fetching debug info: ' + error.message });
    }
});

// Check port
function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.on('connect', () => {
            logger.debug('Port check connected: ' + host + ':' + port);
            socket.destroy();
            resolve(true);
        });
        socket.on('error', () => {
            logger.debug('Port check error: ' + host + ':' + port);
            socket.destroy();
            resolve(false);
        });
        socket.on('timeout', () => {
            logger.debug('Port check timeout: ' + host + ':' + port);
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

// Load configuration
function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            logger.info('config.json not found. Creating default configuration.');
            const defaultConfig = [];
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
        const config = fs.readJsonSync(CONFIG_FILE);
        logger.debug('Loaded config with ' + config.length + ' apps');
        return config;
    } catch (error) {
        logger.error('Error loading config: ' + error.message + ', Stack: ' + error.stack);
        return [];
    }
}

// Save configuration
function saveConfig(apps) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(apps, null, 2));
        logger.debug('Configuration saved successfully');
        return { success: true, message: 'Configuration saved successfully' };
    } catch (error) {
        logger.error('Error saving config: ' + error.message + ', Stack: ' + error.stack);
        return { success: false, message: 'Failed to save configuration: ' + error.message };
    }
}

// Path normalization
function normalizeWindowsPath(filePath) {
    logger.debug('[VERBOSE] Original path: ' + filePath);
    if (filePath.match(/^[A-Z]:[^\\]/)) {
        filePath = filePath.replace(/^([A-Z]:)([^\\])/, '$1\\$2');
        logger.debug('[VERBOSE] Fixed path: ' + filePath);
    }
    const normalized = path.normalize(filePath);
    logger.debug('[VERBOSE] Final normalized path: ' + normalized);
    return normalized;
}

// Launch application
async function launchApp(filenames) {
    logger.debug('[VERBOSE] Launch request for: ' + filenames.join(', '));
    const apps = loadConfig();
    const results = [];

    for (const filename of filenames) {
        logger.debug('[VERBOSE] === LAUNCH ATTEMPT START ===');
        logger.debug('[VERBOSE] Processing filename: ' + filename);

        if (filename === HUB_FILE) {
            logger.debug('[VERBOSE] Cannot launch hub itself');
            results.push({ success: false, message: 'Cannot launch the hub itself' });
            continue;
        }

        try {
            const app = apps.find(a => a.filename === filename);
            if (!app) {
                logger.debug('[VERBOSE] Application not found in config');
                results.push({ success: false, message: 'Application not found: ' + filename });
                continue;
            }

            logger.debug('[VERBOSE] Found app: ' + app.app_name);

            const normalizedPath = normalizeWindowsPath(filename);
            const fileExists = fs.existsSync(normalizedPath);
            logger.debug('[VERBOSE] File exists: ' + fileExists + ' - ' + normalizedPath);

            if (!fileExists) {
                logger.debug('[VERBOSE] FILE NOT FOUND: ' + normalizedPath);
                results.push({ success: false, message: 'File not found: ' + normalizedPath });
                continue;
            }

            logger.debug('[VERBOSE] File exists, proceeding with launch...');

            const missingPrereqs = [];
            logger.debug('[VERBOSE] Checking prerequisites: ' + (app.prerequisites || []).join(', '));

            for (const prereq of app.prerequisites || []) {
                const prereqApp = apps.find(a => a.app_name === prereq || a.filename === prereq);
                if (prereqApp && prereqApp.url) {
                    const [host, port] = prereqApp.url.replace('http://', '').split(':');
                    const isPortOpen = await checkPort(host, parseInt(port));
                    logger.debug('[VERBOSE] Prerequisite ' + prereq + ' (' + host + ':' + port + ') - Port open: ' + isPortOpen);
                    if (!isPortOpen) missingPrereqs.push(prereq);
                }
            }

            if (missingPrereqs.length > 0) {
                logger.debug('[VERBOSE] Missing prerequisites: ' + missingPrereqs.join(', '));
                results.push({ success: false, message: 'Missing prerequisites: ' + missingPrereqs.join(', ') + '. Launch them first.' });
                continue;
            }

            logger.debug('[VERBOSE] All prerequisites satisfied. Launching...');

            logger.debug('[VERBOSE] Launching batch file: cmd.exe /c start "" "' + normalizedPath + '"');
            const batProcess = spawn('cmd.exe', ['/c', 'start', '""', '"' + normalizedPath + '"'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });

            let output = '';
            batProcess.stdout.on('data', (data) => {
                output += data.toString();
                logger.debug('[VERBOSE] Process stdout: ' + data);
            });
            batProcess.stderr.on('data', (data) => {
                output += data.toString();
                logger.error('[VERBOSE] Process stderr: ' + data);
            });

            batProcess.on('error', (error) => {
                logger.error('[VERBOSE] Spawn error: ' + error.message + ', Stack: ' + error.stack);
                results.push({ success: false, message: 'Failed to spawn process: ' + error.message });
            });

            batProcess.on('close', (code) => {
                logger.debug('[VERBOSE] Process exited with code ' + code);
                if (code !== 0) {
                    logger.error('[VERBOSE] Non-zero exit code: ' + code + ', Output: ' + output);
                    results.push({ success: false, message: 'Process failed with code ' + code + ': ' + output });
                }
            });

            batProcess.unref();

            if (app.url) {
                setTimeout(async () => {
                    const [host, port] = app.url.replace('http://', '').split(':');
                    const isPortOpen = await checkPort(host, parseInt(port));
                    logger.debug('[VERBOSE] Post-launch port check (' + host + ':' + port + '): ' + isPortOpen);
                    if (isPortOpen) {
                        app.status = 'Launched at ' + new Date().toLocaleTimeString();
                        app.status_class = 'success';
                    } else {
                        app.status = 'Launch failed - port not open';
                        app.status_class = 'error';
                    }
                    saveConfig(apps);
                }, (app.launch_delay || 5) * 1000);
            } else {
                app.status = 'Launched at ' + new Date().toLocaleTimeString();
                app.status_class = 'success';
                saveConfig(apps);
            }

            results.push({ success: true, message: 'Launched ' + app.app_name, status: app.status });
        } catch (error) {
            logger.error('[VERBOSE] Launch error for ' + filename + ': ' + error.message + ', Stack: ' + error.stack);
            results.push({ success: false, message: 'Failed to launch: ' + error.message });
        }
        logger.debug('[VERBOSE] === LAUNCH ATTEMPT END ===');
    }

    saveConfig(apps);
    return results;
}

// Get apps
app.get('/api/apps', (req, res) => {
    try {
        const apps = loadConfig();
        logger.debug('[VERBOSE] Sending ' + apps.length + ' apps to client');
        res.json({ success: true, apps });
    } catch (error) {
        logger.error('Error fetching apps: ' + error.message + ', Stack: ' + error.stack);
        res.status(500).json({ success: false, message: 'Failed to fetch apps: ' + error.message });
    }
});

// Add app
app.post('/api/add-app', (req, res) => {
    logger.debug('[VERBOSE] POST /api/add-app: ' + JSON.stringify(req.body));
    try {
        const newApp = req.body;
        if (!newApp.app_name || !newApp.filename) {
            logger.error('Invalid request: app_name and filename required');
            return res.status(400).json({ success: false, message: 'Error: app_name and filename are required.' });
        }
        const apps = loadConfig();
        apps.push({
            app_name: newApp.app_name,
            description: newApp.description || '',
            filename: newApp.filename,
            url: newApp.url || '',
            launch_delay: parseInt(newApp.launch_delay) || 0,
            prerequisites: newApp.prerequisites ? newApp.prerequisites.split(',').map(p => p.trim()) : [],
            status: '',
            status_class: ''
        });
        const saveResult = saveConfig(apps);
        if (saveResult.success) {
            logger.info('Added application: ' + newApp.app_name);
            res.json({ success: true, message: 'Application ' + newApp.app_name + ' added successfully!', apps });
        } else {
            res.status(500).json(saveResult);
        }
    } catch (error) {
        logger.error('Error adding app: ' + error.message + ', Stack: ' + error.stack);
        res.status(500).json({ success: false, message: 'Failed to add application: ' + error.message });
    }
});

// Delete app
app.delete('/api/delete-app', (req, res) => {
    logger.debug('[VERBOSE] DELETE /api/delete-app: ' + JSON.stringify(req.body));
    try {
        const { index } = req.body;
        const apps = loadConfig();
        if (index >= 0 && index < apps.length) {
            const deletedName = apps[index].app_name;
            apps.splice(index, 1);
            const saveResult = saveConfig(apps);
            if (saveResult.success) {
                logger.info('Application ' + deletedName + ' deleted successfully');
                res.json({ success: true, message: 'Application ' + deletedName + ' deleted successfully!', apps });
            } else {
                res.status(500).json(saveResult);
            }
        } else {
            logger.error('Invalid application index: ' + index);
            res.status(400).json({ success: false, message: 'Error: Invalid application index!' });
        }
    } catch (error) {
        logger.error('Error deleting app: ' + error.message + ', Stack: ' + error.stack);
        res.status(500).json({ success: false, message: 'Failed to delete application: ' + error.message });
    }
});

// Save config
app.put('/api/save-config', (req, res) => {
    logger.debug('[VERBOSE] PUT /api/save-config: ' + JSON.stringify(req.body));
    const { apps: appsToSave } = req.body;
    if (!Array.isArray(appsToSave)) {
        logger.error('Invalid request: apps must be an array');
        return res.status(400).json({ success: false, message: 'Error: Invalid apps array provided.' });
    }
    try {
        const saveResult = saveConfig(appsToSave);
        if (saveResult.success) {
            logger.info('Configuration saved with ' + appsToSave.length + ' apps');
            res.json({ success: true, message: saveResult.message, apps: appsToSave });
        } else {
            res.status(500).json(saveResult);
        }
    } catch (error) {
        logger.error('Error saving config: ' + error.message + ', Stack: ' + error.stack);
        res.status(500).json({ success: false, message: 'Failed to save configuration: ' + error.message });
    }
});

// Launch endpoint
app.post('/api/launch', async (req, res) => {
    const { filenames } = req.body;
    logger.debug('[VERBOSE] POST /api/launch: ' + JSON.stringify(filenames));
    if (!Array.isArray(filenames)) {
        logger.error('Invalid request: filenames must be an array');
        return res.status(400).json({ success: false, message: 'Error: Invalid filenames array provided.' });
    }
    try {
        const results = await launchApp(filenames);
        logger.debug('[VERBOSE] Launch results: ' + JSON.stringify(results));
        res.json(results);
    } catch (error) {
        logger.error('Error in /api/launch: ' + error.message + ', Stack: ' + error.stack);
        res.status(500).json({ success: false, message: 'Error launching apps: ' + error.message });
    }
});

// Test launch endpoint
app.post('/api/test-launch', async (req, res) => {
    const { filenames } = req.body;
    logger.debug('[VERBOSE] POST /api/test-launch: ' + JSON.stringify(filenames));
    try {
        const results = await launchApp(filenames);
        res.json(results);
    } catch (error) {
        logger.error('Error in test launch: ' + error.message + ', Stack: ' + error.stack);
        res.status(500).json({ success: false, message: 'Error testing launch: ' + error.message });
    }
});

// Serve main page
app.get('/', (req, res) => {
    logger.debug('[VERBOSE] Serving index.html');
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            logger.error('Error serving index.html: ' + err.message + ', Stack: ' + err.stack);
            res.status(500).send('Error loading the application');
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info('=== AI HUB SERVER STARTING ===');
    logger.info('Server running at http://127.0.0.1:' + PORT);
    logger.info('Serving from directory: ' + __dirname);
    logger.info('Log level: DEBUG (verbose mode enabled)');

    const filesToCheck = ['index.html', 'style.css', 'config.json', 'app.js'];
    filesToCheck.forEach(file => {
        try {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                logger.debug('[VERBOSE] File found: ' + file + ', Size: ' + stats.size + ' bytes');
            } else {
                logger.warn('File not found: ' + file);
            }
        } catch (error) {
            logger.error('Error checking file ' + file + ': ' + error.message + ', Stack: ' + error.stack);
        }
    });

    const { exec } = require('child_process');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'start http://127.0.0.1:' + PORT : 'open http://127.0.0.1:' + PORT;
    exec(command, (error) => {
        if (error) logger.error('Failed to open browser: ' + error.message + ', Stack: ' + error.stack);
    });
});
```