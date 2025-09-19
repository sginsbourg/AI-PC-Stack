const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const { spawn } = require('child_process');
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

// FIXED path normalization function
function normalizeWindowsPath(filePath) {
    // First, replace any forward slashes with backslashes
    let normalized = filePath.replace(/\//g, '\\');
    
    // Handle cases where backslashes might be escaped or missing
    // Ensure we have proper Windows path format
    if (!normalized.includes(':\\') && normalized.includes(':')) {
        // Fix paths like "C:Users..." to "C:\Users..."
        normalized = normalized.replace(/([A-Z]):([^\\])/, '$1:\\$2');
    }
    
    // Use path.normalize to clean up the path
    return path.normalize(normalized);
}

// Launch application function with FIXED path handling
async function launchApp(filenames) {
    const apps = loadConfig();
    const results = [];
    
    for (const filename of filenames) {
        logger.info(`Attempting to launch: ${filename}`);
        
        if (filename === HUB_FILE) {
            results.push({ success: false, message: `Cannot launch the hub itself` });
            continue;
        }
        
        try {
            const app = apps.find(a => a.filename === filename);
            if (!app) {
                results.push({ success: false, message: `Application not found: ${filename}` });
                continue;
            }

            // FIXED: Use our custom path normalization
            const normalizedPath = normalizeWindowsPath(filename);
            logger.info(`Normalized path: ${normalizedPath}`);
            
            if (!fs.existsSync(normalizedPath)) {
                results.push({ success: false, message: `File not found: ${normalizedPath}` });
                continue;
            }

            // Check if it's a batch file
            if (!normalizedPath.toLowerCase().endsWith('.bat')) {
                results.push({ success: false, message: `Only .bat files are supported: ${normalizedPath}` });
                continue;
            }

            // Check prerequisites
            const missingPrereqs = [];
            for (const prereq of app.prerequisites) {
                const prereqApp = apps.find(a => a.app_name === prereq || a.filename === prereq);
                if (prereqApp && prereqApp.url) {
                    const [host, port] = prereqApp.url.replace('http://', '').split(':');
                    if (!(await checkPort(host, parseInt(port)))) {
                        missingPrereqs.push(prereq);
                    }
                }
            }

            if (missingPrereqs.length > 0) {
                results.push({ 
                    success: false, 
                    message: `Missing prerequisites: ${missingPrereqs.join(', ')}. Please start them first.` 
                });
                continue;
            }

            // LAUNCH THE APPLICATION
            logger.info(`Launching: ${normalizedPath}`);
            
            const launchPromise = new Promise((resolve) => {
                try {
                    // Use the directory of the batch file as working directory
                    const workingDir = path.dirname(normalizedPath);
                    
                    const child = spawn('cmd.exe', [
                        '/c', 'start', 
                        `"${app.app_name}"`, 
                        '/D', workingDir,
                        'cmd.exe', '/c', normalizedPath
                    ], {
                        detached: true,
                        stdio: 'ignore',
                        windowsHide: true
                    });

                    child.unref();
                    
                    // Give it a moment to start
                    setTimeout(() => {
                        resolve({ success: true, message: `Launched ${app.app_name}` });
                    }, 1000);

                } catch (error) {
                    resolve({ success: false, message: `Failed to launch: ${error.message}` });
                }
            });

            const result = await launchPromise;
            
            // Update app status
            if (result.success) {
                app.status = `Launched at ${new Date().toLocaleTimeString()}`;
                app.status_class = 'success';
                saveConfig(apps);
            }
            
            results.push(result);
            logger.info(`Launch result for ${app.app_name}: ${result.success ? 'SUCCESS' : 'FAILED'}`);

        } catch (error) {
            logger.error(`Unexpected error launching ${filename}: ${error.message}`);
            results.push({ success: false, message: `Unexpected error: ${error.message}` });
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

// Launch endpoint
app.post('/api/launch', async (req, res) => {
    const { filenames } = req.body;
    if (!Array.isArray(filenames)) {
        logger.error('Invalid request: filenames must be an array.');
        return res.status(400).json({ success: false, message: 'Error: Invalid filenames array provided.' });
    }
    try {
        logger.info(`Received launch request for: ${filenames.join(', ')}`);
        const results = await launchApp(filenames);
        res.json(results);
    } catch (error) {
        logger.error(`Error in /api/launch: ${error.message}`);
        res.status(500).json({ success: false, message: `Error launching apps: ${error.message}` });
    }
});

// Debug endpoint to test file execution
app.post('/api/debug-launch', async (req, res) => {
    const { filename } = req.body;
    try {
        logger.info(`Debug launch: ${filename}`);
        
        // Test if file exists
        const normalizedPath = normalizeWindowsPath(filename);
        const exists = fs.existsSync(normalizedPath);
        
        if (!exists) {
            return res.json({ success: false, message: `File not found: ${normalizedPath}` });
        }
        
        // Test execution
        const workingDir = path.dirname(normalizedPath);
        const child = spawn('cmd.exe', [
            '/c', 'start', 
            '"Debug Test"', 
            '/D', workingDir,
            'cmd.exe', '/c', normalizedPath
        ], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
        });
        
        child.unref();
        
        res.json({ 
            success: true, 
            message: `Attempted to launch: ${normalizedPath}`,
            details: {
                fileExists: true,
                isBatch: normalizedPath.toLowerCase().endsWith('.bat'),
                normalizedPath: normalizedPath,
                workingDir: workingDir
            }
        });
        
    } catch (error) {
        res.json({ success: false, message: `Debug error: ${error.message}` });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running at http://127.0.0.1:${PORT}`);
    const { exec } = require('child_process');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? `start http://127.0.0.1:${PORT}` : `open http://127.0.0.1:${PORT}`;
    exec(command, (error) => {
        if (error) logger.error(`Failed to open browser: ${error.message}`);
    });
});