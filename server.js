```javascript
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const path = require('path');
const logger = require('winston');
const net = require('net');

// Configure logging with basic format to avoid syntax issues
logger.configure({
    transports: [
        new logger.transports.Console({
            level: 'debug',
            format: logger.format.combine(
                logger.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logger.format.simple()
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
app.use(express.static(__dirname));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Health endpoint for debugging
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
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
        logger.debug('Loaded config with ' + config.length + ' apps');
        return config;
    } catch (error) {
        logger.error('Error loading config: ' + error.message);
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
        logger.error('Error saving config: ' + error.message);
        return { success: false, message: 'Failed to save configuration: ' + error.message };
    }
}

// VERBOSE path normalization function
function normalizeWindowsPath(filePath) {
    logger.debug('VERBOSE Original path from client: ' + filePath);
    
    // If the path is already corrupted (missing backslashes after drive letter)
    if (filePath.match(/^[A-Z]:[^\\]/)) {
        // Fix paths like "C:Users..." to "C:\Users..."
        filePath = filePath.replace(/^([A-Z]:)([^\\])/, '$1\\$2');
        logger.debug('VERBOSE Fixed path: ' + filePath);
    }
    
    // Use path.normalize to clean up the path
    const normalized = path.normalize(filePath);
    logger.debug('VERBOSE Final normalized path: ' + normalized);
    
    return normalized;
}

// FIXED: Launch application function with enhanced error handling
async function launchApp(filenames) {
    logger.debug('VERBOSE Launch request received for files: ' + filenames.join(', '));
    const apps = loadConfig();
    const results = [];
    
    for (const filename of filenames) {
        logger.debug('VERBOSE === LAUNCH ATTEMPT START ===');
        logger.debug('VERBOSE Processing filename: ' + filename);
        
        if (filename === HUB_FILE) {
            logger.debug('VERBOSE Cannot launch hub itself');
            results.push({ success: false, message: 'Cannot launch the hub itself' });
            continue;
        }
        
        try {
            const app = apps.find(a => a.filename === filename);
            if (!app) {
                logger.debug('VERBOSE Application not found in config');
                results.push({ success: false, message: 'Application not found: ' + filename });
                continue;
            }

            logger.debug('VERBOSE Found app: ' + app.app_name);
            
            // Use our custom path normalization
            const normalizedPath = normalizeWindowsPath(filename);
            
            // Check if file exists
            const fileExists = fs.existsSync(normalizedPath);
            logger.debug('VERBOSE File exists check: ' + fileExists + ' - ' + normalizedPath);
            
            if (!fileExists) {
                logger.debug('VERBOSE FILE NOT FOUND: ' + normalizedPath);
                results.push({ success: false, message: 'File not found: ' + normalizedPath });
                continue;
            }

            logger.debug('VERBOSE File exists, proceeding with launch...');

            // Check prerequisites
            const missingPrereqs = [];
            logger.debug('VERBOSE Checking prerequisites: ' + app.prerequisites.join(', '));
            
            for (const prereq of app.prerequisites) {
                const prereqApp = apps.find(a => a.app_name === prereq || a.filename === prereq);
                if (prereqApp && prereqApp.url) {
                    const [host, port] = prereqApp.url.replace('http://', '').split(':');
                    const isPortOpen = await checkPort(host, parseInt(port));
                    logger.debug('VERBOSE Prerequisite ' + prereq + ' (' + host + ':' + port + ') - Port open: ' + isPortOpen);
                    if (!isPortOpen) {
                        missingPrereqs.push(prereq);
                    }
                }
            }

            if (missingPrereqs.length > 0) {
                logger.debug('VERBOSE Missing prerequisites: ' + missingPrereqs.join(', '));
                results.push({ 
                    success: false, 
                    message: 'Missing prerequisites: ' + missingPrereqs.join(', ') + '. Launch them first.'
                });
                continue;
            }

            logger.debug('VERBOSE All prerequisites satisfied. Launching...');

            // Launch with 'start' to open in a new console window and capture errors
            logger.debug('VERBOSE Launching batch file: cmd.exe /c start "" "' + normalizedPath + '"');
            const batProcess = spawn('cmd.exe', ['/c', 'start', '""', '"' + normalizedPath + '"'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });

            // Capture stdout and stderr for debugging
            let output = '';
            batProcess.stdout.on('data', (data) => {
                output += data.toString();
                logger.debug('VERBOSE Process stdout: ' + data);
            });
            batProcess.stderr.on('data', (data) => {
                output += data.toString();
                logger.error('VERBOSE Process stderr: ' + data);
            });

            batProcess.on('error', (error) => {
                logger.error('VERBOSE Spawn error: ' + error.message);
                results.push({ success: false, message: 'Failed to spawn process: ' + error.message });
            });

            batProcess.on('close', (code) => {
                logger.debug('VERBOSE Process exited with code ' + code);
                if (code !== 0) {
                    logger.error('VERBOSE Non-zero exit code: ' + code + ', Output: ' + output);
                    results.push({ success: false, message: 'Process failed with code ' + code + ': ' + output });
                }
            });

            batProcess.unref();

            // Update status after delay (if URL exists, check port; otherwise, assume success)
            if (app.url) {
                setTimeout(async () => {
                    const [host, port] = app.url.replace('http://', '').split(':');
                    const isPortOpen = await checkPort(host, parseInt(port));
                    logger.debug('VERBOSE Post-launch port check (' + host + ':' + port + '): ' + isPortOpen);
                    if (isPortOpen) {
                        app.status = 'Launched at ' + new Date().toLocaleTimeString();
                        app.status_class = 'success';
                    } else {
                        app.status = 'Launch failed - port ' + port + ' not open';
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
            logger.error('VERBOSE Launch error for ' + filename + ': ' + error.message);
            results.push({ success: false, message: 'Failed to launch: ' + error.message });
        }
        logger.debug('VERBOSE === LAUNCH ATTEMPT END ===');
    }

    saveConfig(apps);
    return results;
}

// Get apps endpoint
app.get('/api/apps', (req, res) => {
    try {
        const apps = loadConfig();
        logger.debug('VERBOSE Sending ' + apps.length + ' apps to client');
        res.json({ success: true, apps });
    } catch (error) {
        logger.error('Error fetching apps: ' + error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch apps: ' + error.message });
    }
});

app.post('/api/add-app', (req, res) => {
    logger.debug('VERBOSE POST /api/add-app request received');
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
            logger.info('Added application: ' + newApp.app_name);
            res.json({ success: true, message: 'Application ' + newApp.app_name + ' added successfully!', apps });
        } else {
            res.status(500).json(saveResult);
        }
    } catch (error) {
        logger.error('Error adding app: ' + error.message);
        res.status(500).json({ success: false, message: 'Failed to add application: ' + error.message });
    }
});

app.delete('/api/delete-app', (req, res) => {
    logger.debug('VERBOSE DELETE /api/delete-app request received');
    try {
        const { index } = req.body;
        const apps = loadConfig();
        if (index >= 0 && index < apps.length) {
            const deletedName = apps[index].app_name;
            apps.splice(index, 1);
            const saveResult = saveConfig(apps);
            if (saveResult.success) {
                logger.info('Application ' + deletedName + ' deleted successfully.');
                res.json({ success: true, message: 'Application ' + deletedName + ' deleted successfully!', apps });
            } else {
                res.status(500).json(saveResult);
            }
        } else {
            logger.error('Invalid application index: ' + index);
            res.status(400).json({ success: false, message: 'Error: Invalid application index!' });
        }
    } catch (error) {
        logger.error('Error deleting app: ' + error.message);
        res.status(500).json({ success: false, message: 'Failed to delete application: ' + error.message });
    }
});

app.put('/api/save-config', (req, res) => {
    logger.debug('VERBOSE PUT /api/save-config request received');
    const { apps: appsToSave } = req.body;
    if (!Array.isArray(appsToSave)) {
        logger.error('Invalid request: apps must be an array.');
        return res.status(400).json({ success: false, message: 'Error: Invalid apps array provided.' });
    }
    try {
        const saveResult = saveConfig(appsToSave);
        if (saveResult.success) {
            logger.info('Configuration saved successfully with ' + appsToSave.length + ' apps.');
            res.json({ success: true, message: saveResult.message, apps: appsToSave });
        } else {
            res.status(500).json(saveResult);
        }
    } catch (error) {
        logger.error('Error saving config: ' + error.message);
        res.status(500).json({ success: false, message: 'Failed to save configuration: ' + error.message });
    }
});

// Launch endpoint with verbose logging
app.post('/api/launch', async (req, res) => {
    const { filenames } = req.body;
    logger.debug('VERBOSE POST /api/launch request received for: ' + filenames.join(', '));
    
    if (!Array.isArray(filenames)) {
        logger.error('Invalid request: filenames must be an array.');
        return res.status(400).json({ success: false, message: 'Error: Invalid filenames array provided.' });
    }
    try {
        const results = await launchApp(filenames);
        logger.debug('VERBOSE Launch results: ' + JSON.stringify(results));
        res.json(results);
    } catch (error) {
        logger.error('Error in /api/launch: ' + error.message);
        res.status(500).json({ success: false, message: 'Error launching apps: ' + error.message });
    }
});

// Test endpoint for debugging launch issues
app.post('/api/test-launch', async (req, res) => {
    const { filenames } = req.body;
    logger.debug('TEST Test launch request received');
    
    try {
        const results = await launchApp(filenames); // Reuse launchApp for testing
        res.json(results);
    } catch (error) {
        logger.error('Error in test launch: ' + error.message);
        res.status(500).json({ success: false, message: 'Error testing launch: ' + error.message });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    logger.debug('VERBOSE Serving index.html');
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            logger.error('Error serving index.html: ' + err.message);
            res.status(500).send('Error loading the application');
        }
    });
});

// Start server with verbose logging
app.listen(PORT, '0.0.0.0', () => {
    logger.info('=== AI HUB SERVER STARTING ===');
    logger.info('Server running at http://127.0.0.1:' + PORT);
    logger.info('Serving from directory: ' + __dirname);
    logger.info('Log level: DEBUG (verbose mode enabled)');
    
    // Check if essential files exist
    const filesToCheck = ['index.html', 'style.css', 'config.json'];
    filesToCheck.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            logger.debug('VERBOSE File found: ' + file);
        } else {
            logger.warn('File not found: ' + file);
        }
    });
    
    const { exec } = require('child_process');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'start http://127.0.0.1:' + PORT : 'open http://127.0.0.1:' + PORT;
    exec(command, (error) => {
        if (error) logger.error('Failed to open browser: ' + error.message);
    });
});
```