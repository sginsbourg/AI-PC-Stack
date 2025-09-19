const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const { spawn, exec } = require('child_process');
const path = require('path');
const logger = require('winston');
const net = require('net');

// Configure logging
logger.configure({
    transports: [
        new logger.transports.Console({
            level: 'info',
            format: logger.format.combine(
                logger.format.timestamp(),
                logger.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
            )
        })
    ]
});

const app = express();
const PORT = 7860;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const HUB_FILE = path.resolve(__dirname, 'server.js');

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname, { index: false }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Check if a port is in use
function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('timeout', () => {
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
        logger.info(`Loaded config with ${config.length} apps`);
        return config;
    } catch (error) {
        logger.error(`Error loading config: ${error.message}`);
        return [];
    }
}

// Save configuration
function saveConfig(apps) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(apps, null, 2));
        logger.info('Configuration saved successfully');
        return { success: true, message: 'Configuration saved successfully' };
    } catch (error) {
        logger.error(`Error saving config: ${error.message}`);
        return { success: false, message: `Failed to save configuration: ${error.message}` };
    }
}

// Launch application
async function launchApp(filenames) {
    const apps = loadConfig();
    const results = [];
    for (const filename of filenames) {
        logger.info(`Attempting to launch filename: ${filename}`);
        if (filename === HUB_FILE) {
            logger.error(`Cannot launch the hub itself: ${filename}`);
            results.push({ success: false, message: `Cannot launch the hub itself: ${filename}` });
            continue;
        }
        try {
            const app = apps.find(a => a.filename === filename);
            if (!app) {
                logger.error(`Application not found: ${filename}`);
                results.push({ success: false, message: `Application not found: ${filename}` });
                continue;
            }

            // Normalize path for Windows
            const normalizedPath = path.normalize(filename);
            logger.info(`Normalized path: ${normalizedPath}`);
            if (!fs.existsSync(normalizedPath)) {
                logger.error(`File not found: ${normalizedPath}`);
                results.push({ success: false, message: `File not found: ${normalizedPath}` });
                continue;
            }

            // Check prerequisites (log warnings, don't block)
            for (const prereq of app.prerequisites) {
                const prereqApp = apps.find(a => a.app_name === prereq || a.filename === prereq);
                if (prereqApp && prereqApp.url) {
                    const [host, port] = prereqApp.url.replace('http://', '').split(':');
                    if (!(await checkPort(host, parseInt(port)))) {
                        logger.warn(`Prerequisite ${prereq} not running for ${app.app_name}`);
                    }
                }
            }

            // Try spawn first
            const extension = path.extname(normalizedPath).toLowerCase();
            const isWindows = process.platform === 'win32';
            const options = { 
                shell: isWindows && (extension === '.bat' || extension === '.cmd'),
                detached: true,
                stdio: 'ignore'
            };
            logger.info(`Spawning ${normalizedPath} with options: ${JSON.stringify(options)}`);
            try {
                const child = spawn(normalizedPath, [], options);
                child.on('error', (error) => {
                    logger.error(`Spawn error for ${app.app_name}: ${error.message}`);
                });
                child.unref();
                logger.info(`Spawn successful for ${app.app_name}`);
            } catch (spawnError) {
                logger.warn(`Spawn failed for ${app.app_name}: ${spawnError.message}. Trying exec...`);
                // Fallback to exec
                await new Promise((resolve, reject) => {
                    exec(`"${normalizedPath}"`, { windowsHide: false }, (error) => {
                        if (error) {
                            logger.error(`Exec error for ${app.app_name}: ${error.message}`);
                            results.push({ success: false, message: `Failed to launch ${app.app_name}: ${error.message}` });
                            reject(error);
                        } else {
                            logger.info(`Exec successful for ${app.app_name}`);
                            results.push({ success: true, message: `Launched ${app.app_name}` });
                            resolve();
                        }
                    });
                });
            }

            // Update app status
            app.status = `Launched at ${new Date().toLocaleTimeString()}`;
            app.status_class = 'success';
            saveConfig(apps);
        } catch (error) {
            logger.error(`Failed to launch ${filename}: ${error.message}`);
            results.push({ success: false, message: `Failed to launch ${filename}: ${error.message}` });
        }
    }
    return results.length === 1 ? results[0] : results;
}

// Routes
app.get('/api/apps', (req, res) => {
    try {
        const apps = loadConfig();
        res.json({ success: true, apps });
    } catch (error) {
        logger.error(`Error fetching apps: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to fetch apps: ${error.message}` });
    }
});

app.post('/api/add-app', (req, res) => {
    try {
        const newApp = req.body;
        if (!newApp.app_name || !newApp.filename) {
            logger.error('Invalid request: app_name and filename are required.');
            return res.status(400).json({ success: false, message: 'Error: app_name and filename are required.' });
        }
        const apps = loadConfig();
        apps.push({
            app_name: newApp.app_name,
            description: newApp.description || '',
            filename: newApp.filename,
            url: newApp.url || '',
            launch_delay: newApp.launch_delay || 0,
            prerequisites: newApp.prerequisites || [],
            status: '',
            status_class: ''
        });
        const saveResult = saveConfig(apps);
        if (saveResult.success) {
            logger.info(`Added application: ${newApp.app_name}`);
            res.json({ success: true, message: `Application '${newApp.app_name}' added successfully!`, apps });
        } else {
            res.status(500).json(saveResult);
        }
    } catch (error) {
        logger.error(`Error adding app: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to add application: ${error.message}` });
    }
});

app.delete('/api/delete-app', (req, res) => {
    try {
        const { index } = req.body;
        const apps = loadConfig();
        if (index >= 0 && index < apps.length) {
            const deletedName = apps[index].app_name;
            apps.splice(index, 1);
            const saveResult = saveConfig(apps);
            if (saveResult.success) {
                logger.info(`Application '${deletedName}' deleted successfully.`);
                res.json({ success: true, message: `Application '${deletedName}' deleted successfully!`, apps });
            } else {
                res.status(500).json(saveResult);
            }
        } else {
            logger.error(`Invalid application index: ${index}`);
            res.status(400).json({ success: false, message: 'Error: Invalid application index!' });
        }
    } catch (error) {
        logger.error(`Error deleting app: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to delete application: ${error.message}` });
    }
});

app.put('/api/save-config', (req, res) => {
    const { apps: appsToSave } = req.body;
    if (!Array.isArray(appsToSave)) {
        logger.error('Invalid request: apps must be an array.');
        return res.status(400).json({ success: false, message: 'Error: Invalid apps array provided.' });
    }
    try {
        const saveResult = saveConfig(appsToSave);
        if (saveResult.success) {
            logger.info(`Configuration saved successfully with ${appsToSave.length} apps.`);
            res.json({ success: true, message: saveResult.message, apps: appsToSave });
        } else {
            res.status(500).json(saveResult);
        }
    } catch (error) {
        logger.error(`Error saving config: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to save configuration: ${error.message}` });
    }
});

app.post('/api/launch', (req, res) => {
    const { filenames } = req.body;
    if (!Array.isArray(filenames)) {
        logger.error('Invalid request: filenames must be an array.');
        return res.status(400).json({ success: false, message: 'Error: Invalid filenames array provided.' });
    }
    try {
        logger.info(`Received launch request for filenames: ${filenames.join(', ')}`);
        const results = launchApp(filenames);
        res.json(results);
    } catch (error) {
        logger.error(`Error in /api/launch: ${error.message}`);
        res.status(500).json({ success: false, message: `Error launching apps: ${error.message}` });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
    logger.info(`Server running at http://127.0.0.1:${PORT}`);
    const { exec } = require('child_process');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? `start http://127.0.0.1:${PORT}` : `open http://127.0.0.1:${PORT}`;
    exec(command, (error) => {
        if (error) logger.error(`Failed to open browser: ${error.message}`);
    });
});