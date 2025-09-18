const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const path = require('path');
const logger = require('winston');

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

// Load configuration
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readJsonSync(CONFIG_FILE);
            if (!Array.isArray(data)) {
                throw new Error('config.json must contain a list');
            }
            // Ensure all apps have required fields
            return data.map(app => ({
                app_name: app.app_name || 'Unnamed',
                description: app.description || '',
                filename: app.filename || '',
                url: app.url || '', // New URL field
                status: app.status || '',
                status_class: app.status_class || ''
            }));
        }
        logger.info('config.json not found or invalid. Creating default configuration.');
        const defaultConfig = [
            { app_name: 'Application 1', description: 'A default application.', filename: 'app1.py', url: 'http://localhost:3000', status: '', status_class: '' },
            { app_name: 'Application 2', description: 'Another default application.', filename: 'app2.bat', url: 'http://localhost:3001', status: '', status_class: '' }
        ];
        fs.writeJsonSync(CONFIG_FILE, defaultConfig, { spaces: 2 });
        return defaultConfig;
    } catch (error) {
        logger.error(`Failed to load or parse config.json: ${error.message}`);
        return [];
    }
}

// Save configuration
function saveConfig(apps) {
    try {
        fs.writeJsonSync(CONFIG_FILE, apps, { spaces: 2 });
        logger.info('Configuration saved successfully.');
        return { success: true, message: 'Configuration saved successfully!' };
    } catch (error) {
        logger.error(`Failed to save config: ${error.message}`);
        return { success: false, message: `Failed to save configuration: ${error.message}` };
    }
}

// Launch application
function launchApp(filename) {
    logger.info(`Attempting to launch file: ${filename}`);
    if (!filename) {
        logger.error('No filename provided for launch.');
        return { success: false, message: 'Error: No filename provided.' };
    }

    // Normalize and validate file path
    const resolvedPath = path.resolve(filename);
    if (resolvedPath === HUB_FILE || resolvedPath.toLowerCase().endsWith('.js')) {
        logger.error(`Attempt to launch Node.js file blocked: ${resolvedPath}`);
        return { success: false, message: 'Error: Cannot launch Node.js files or the hub itself.' };
    }

    if (!fs.existsSync(resolvedPath)) {
        logger.error(`File not found: ${resolvedPath}`);
        return { success: false, message: `Error: File '${resolvedPath}' not found.` };
    }

    if (!fs.accessSync(resolvedPath, fs.constants.X_OK)) {
        logger.error(`File is not executable: ${resolvedPath}`);
        return { success: false, message: `Error: File '${resolvedPath}' is not executable.` };
    }

    if (!resolvedPath.toLowerCase().endsWith('.py') && !resolvedPath.toLowerCase().endsWith('.bat')) {
        logger.error(`Unsupported file type: ${resolvedPath}`);
        return { success: false, message: 'Error: Unsupported file type. Use .py or .bat.' };
    }

    try {
        const cwd = path.dirname(resolvedPath);
        logger.info(`Spawning process with cwd: ${cwd}`);
        let child;
        if (resolvedPath.toLowerCase().endsWith('.py')) {
            child = spawn('python', [resolvedPath], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], cwd });
        } else {
            // Use cmd.exe /c for .bat files to ensure proper execution
            child = spawn('cmd.exe', ['/c', resolvedPath], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], cwd });
        }
        // Capture output for debugging
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
            }
        });
        child.unref();
        logger.info(`Successfully launched: ${resolvedPath}`);
        return { success: true, message: `Successfully launched '${resolvedPath}'.` };
    } catch (error) {
        logger.error(`Failed to launch ${resolvedPath}: ${error.message}`);
        return { success: false, message: `Failed to launch '${resolvedPath}': ${error.message}` };
    }
}

// API Endpoints
app.get('/api/apps', (req, res) => {
    const apps = loadConfig();
    logger.info(`Fetched ${apps.length} apps from config.json`);
    res.json(apps);
});

app.post('/api/apps', (req, res) => {
    const { app_name, description, filename, url } = req.body;
    if (!app_name) {
        logger.error('Application name is required.');
        return res.status(400).json({ success: false, message: 'Error: Application name is required!' });
    }
    const apps = loadConfig();
    const newApp = { app_name, description: description || '', filename: filename || '', url: url || '', status: '', status_class: '' };
    apps.push(newApp);
    const saveResult = saveConfig(apps);
    if (saveResult.success) {
        logger.info(`Application '${app_name}' added successfully.`);
        res.json({ success: true, message: `Application '${app_name}' added successfully!`, apps });
    } else {
        res.status(500).json(saveResult);
    }
});

app.put('/api/apps/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    const { app_name, description, filename, url } = req.body;
    if (!app_name) {
        logger.error('Application name is required for update.');
        return res.status(400).json({ success: false, message: 'Error: Application name is required!' });
    }
    const apps = loadConfig();
    if (index >= 0 && index < apps.length) {
        const oldName = apps[index].app_name;
        apps[index] = { app_name, description: description || '', filename: filename || '', url: url || '', status: '', status_class: '' };
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
});

app.delete('/api/apps/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
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
});

app.post('/api/launch', (req, res) => {
    const { filename } = req.body;
    const result = launchApp(filename);
    res.json(result);
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
    logger.info(`Server running at http://127.0.0.1:${PORT}`);
    // Open browser
    const { exec } = require('child_process');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? `start http://127.0.0.1:${PORT}` : `open http://127.0.0.1:${PORT}`;
    exec(command, (error) => {
        if (error) logger.error(`Failed to open browser: ${error.message}`);
    });
});