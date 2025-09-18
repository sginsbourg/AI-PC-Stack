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
const HUB_FILE = path.resolve(__dirname, 'server.js'); // Prevent launching the hub itself

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname, { index: false })); // Serve static files, disable default index

// Check if a port is in use
function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000); // 1s timeout
        socket.on('connect', () => {
            socket.destroy();
            resolve(true); // Port is in use
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false); // Port is free
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false); // Port is free
        });
        socket.connect(port, host);
    });
}

// Load configuration
function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            logger.info('config.json not found. Creating default configuration.');
            const defaultConfig = [
                { app_name: 'Application 1', description: 'A default application.', filename: 'app1.py', url: 'http://localhost:3000', launch_delay: 0, prerequisites: [], status: '', status_class: '' },
                { app_name: 'Application 2', description: 'Another default application.', filename: 'app2.bat', url: 'http://localhost:3001', launch_delay: 0, prerequisites: [], status: '', status_class: '' }
            ];
            fs.writeJsonSync(CONFIG_FILE, defaultConfig, { spaces: 2 });
            return defaultConfig;
        }
        const data = fs.readJsonSync(CONFIG_FILE);
        if (!Array.isArray(data)) {
            throw new Error('config.json must contain a list of applications');
        }
        // Ensure all apps have required fields
        return data.map(app => ({
            app_name: app.app_name ? String(app.app_name).trim() : 'Unnamed',
            description: app.description ? String(app.description).trim() : '',
            filename: app.filename ? String(app.filename).trim() : '',
            url: app.url ? String(app.url).trim() : '',
            launch_delay: typeof app.launch_delay === 'number' ? Math.max(0, app.launch_delay) : 0,
            prerequisites: Array.isArray(app.prerequisites) ? app.prerequisites.map(p => String(p).trim()) : [],
            status: app.status || '',
            status_class: app.status_class || ''
        }));
    } catch (error) {
        logger.error(`Failed to load or parse config.json: ${error.message}`);
        throw new Error(`Failed to load config.json: ${error.message}`);
    }
}

// Save configuration
function saveConfig(apps) {
    try {
        if (!Array.isArray(apps)) {
            throw new Error('Apps must be an array');
        }
        // Validate each app
        apps.forEach(app => {
            if (!app.app_name) {
                throw new Error('All applications must have an app_name');
            }
        });
        fs.writeJsonSync(CONFIG_FILE, apps, { spaces: 2 });
        logger.info('Configuration saved successfully.');
        return { success: true, message: 'Configuration saved successfully!' };
    } catch (error) {
        logger.error(`Failed to save config: ${error.message}`);
        return { success: false, message: `Failed to save configuration: ${error.message}` };
    }
}

// Launch application(s)
function launchApp(filenames) {
    if (!Array.isArray(filenames)) {
        filenames = [filenames];
    }
    const results = [];
    for (const filename of filenames) {
        logger.info(`Attempting to launch file: ${filename}`);
        if (!filename) {
            logger.error('No filename provided for launch.');
            results.push({ success: false, message: 'Error: No filename provided.' });
            continue;
        }

        // Normalize and validate file path
        const resolvedPath = path.resolve(filename);
        if (resolvedPath === HUB_FILE || resolvedPath.toLowerCase().endsWith('.js')) {
            logger.error(`Attempt to launch Node.js file blocked: ${resolvedPath}`);
            results.push({ success: false, message: 'Error: Cannot launch Node.js files or the hub itself.' });
            continue;
        }

        if (!fs.existsSync(resolvedPath)) {
            logger.error(`File not found: ${resolvedPath}`);
            results.push({ success: false, message: `Error: File '${resolvedPath}' not found.` });
            continue;
        }

        // Skip execute permission check for .bat files on Windows; check read access only
        try {
            fs.accessSync(resolvedPath, fs.constants.R_OK); // Read access for all files
        } catch (error) {
            logger.error(`File is not readable: ${resolvedPath}: ${error.message}`);
            results.push({ success: false, message: `Error: File '${resolvedPath}' is not readable: ${error.message}` });
            continue;
        }

        if (!resolvedPath.toLowerCase().endsWith('.py') && !resolvedPath.toLowerCase().endsWith('.bat')) {
            logger.error(`Unsupported file type: ${resolvedPath}`);
            results.push({ success: false, message: 'Error: Unsupported file type. Use .py or .bat.' });
            continue;
        }

        try {
            const cwd = path.dirname(resolvedPath);
            logger.info(`Spawning process with cwd: ${cwd}`);
            let child;
            if (resolvedPath.toLowerCase().endsWith('.py')) {
                child = spawn('python', [resolvedPath], { 
                    detached: true, 
                    stdio: ['ignore', 'pipe', 'pipe'], 
                    cwd, 
                    shell: true,
                    windowsHide: true
                });
            } else {
                child = spawn('cmd.exe', ['/c', resolvedPath], { 
                    detached: true, 
                    stdio: ['ignore', 'pipe', 'pipe'], 
                    cwd, 
                    shell: true,
                    windowsHide: true
                });
            }
            let errorOutput = '';
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            child.on('error', (error) => {
                logger.error(`Failed to launch ${resolvedPath}: ${error.message}`);
            });
            child.on('close', (code) => {
                if (code !== 0) {
                    logger.error(`Process exited with code ${code}: ${errorOutput}`);
                } else {
                    logger.info(`Process completed successfully: ${resolvedPath}`);
                }
            });
            child.unref();
            logger.info(`Successfully launched: ${resolvedPath}`);
            results.push({ success: true, message: `Successfully launched '${resolvedPath}'.` });
        } catch (error) {
            logger.error(`Failed to launch ${resolvedPath}: ${error.message}`);
            results.push({ success: false, message: `Failed to launch '${resolvedPath}': ${error.message}` });
        }
    }
    return results;
}

// API Endpoints
app.get('/api/apps', (req, res) => {
    try {
        const apps = loadConfig();
        logger.info(`Fetched ${apps.length} apps from config.json`);
        res.json(apps);
    } catch (error) {
        logger.error(`Error in /api/apps: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to fetch apps: ${error.message}` });
    }
});

app.post('/api/check-port', async (req, res) => {
    const { host, port } = req.body;
    if (!host || !port) {
        logger.error('Host and port are required for port check.');
        return res.status(400).json({ success: false, message: 'Error: Host and port are required.' });
    }
    try {
        const isPortInUse = await checkPort(host, port);
        logger.info(`Port check: ${host}:${port} is ${isPortInUse ? 'in use' : 'free'}`);
        res.json({ success: true, inUse: isPortInUse });
    } catch (error) {
        logger.error(`Error checking port ${host}:${port}: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to check port: ${error.message}` });
    }
});

app.post('/api/apps', (req, res) => {
    const { app_name, description, filename, url, launch_delay, prerequisites } = req.body;
    if (!app_name) {
        logger.error('Application name is required.');
        return res.status(400).json({ success: false, message: 'Error: Application name is required!' });
    }
    try {
        const apps = loadConfig();
        const newApp = { 
            app_name, 
            description: description || '', 
            filename: filename || '', 
            url: url || '', 
            launch_delay: typeof launch_delay === 'number' ? Math.max(0, launch_delay) : 0,
            prerequisites: Array.isArray(prerequisites) ? prerequisites.map(p => String(p).trim()) : [],
            status: '', 
            status_class: '' 
        };
        apps.push(newApp);
        const saveResult = saveConfig(apps);
        if (saveResult.success) {
            logger.info(`Application '${app_name}' added successfully.`);
            res.json({ success: true, message: `Application '${app_name}' added successfully!`, apps });
        } else {
            res.status(500).json(saveResult);
        }
    } catch (error) {
        logger.error(`Error adding app: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to add application: ${error.message}` });
    }
});

app.put('/api/apps/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    const { app_name, description, filename, url, launch_delay, prerequisites } = req.body;
    if (!app_name) {
        logger.error('Application name is required for update.');
        return res.status(400).json({ success: false, message: 'Error: Application name is required!' });
    }
    try {
        const apps = loadConfig();
        if (index >= 0 && index < apps.length) {
            const oldName = apps[index].app_name;
            apps[index] = { 
                app_name, 
                description: description || '', 
                filename: filename || '', 
                url: url || '', 
                launch_delay: typeof launch_delay === 'number' ? Math.max(0, launch_delay) : 0,
                prerequisites: Array.isArray(prerequisites) ? prerequisites.map(p => String(p).trim()) : [],
                status: '', 
                status_class: '' 
            };
            const saveResult = saveConfig(apps);
            if (saveResult.success) {
                logger.info(`Application '${oldName}' updated to '${app_name}'.`);
                res.json({ success: true, message: `Application '${app_name}' updated successfully!`, apps });
            } else {
                res.status(500).json(saveResult);
            }
        } else {
            logger.error(`Invalid application index for update: ${index}`);
            res.status(400).json({ success: false, message: 'Error: Invalid application index!' });
        }
    } catch (error) {
        logger.error(`Error updating app: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to update application: ${error.message}` });
    }
});

app.delete('/api/apps/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    try {
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
    const results = launchApp(filenames);
    res.json(results);
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