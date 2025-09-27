const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Enhanced AI Services Configuration
const services = {
    meloTTS: {
        name: "MeloTTS",
        path: "C:/Users/sgins/AI_STACK/MeloTTS",
        startCommand: "python app.py",
        stopCommand: "taskkill /f /im python.exe",
        port: 8001,
        webInterface: true,
        description: "High-quality Text-to-Speech synthesis",
        status: "stopped",
        lastStarted: null
    },
    openManus: {
        name: "OpenManus",
        path: "C:/Users/sgins/AI_STACK/OpenManus", 
        startCommand: "set OLLAMA_HOST=127.0.0.1:11435 & streamlit run openmanus_web.py",
        stopCommand: "taskkill /f /im python.exe",
        port: 8501,
        webInterface: true,
        description: "AI agent framework with tool integration",
        status: "stopped",
        lastStarted: null
    },
    openSora: {
        name: "OpenSora",
        path: "C:/Users/sgins/AI_STACK/OpenSora",
        startCommand: "python opensora_web.py", 
        stopCommand: "taskkill /f /im python.exe",
        port: 8003,
        webInterface: true,
        description: "Open-source video generation AI",
        status: "stopped",
        lastStarted: null
    },
    orpheusTTS: {
        name: "Orpheus-TTS",
        path: "C:/Users/sgins/AI_STACK/Orpheus-TTS",
        startCommand: "python orpheus_web.py",
        stopCommand: "taskkill /f /im python.exe",
        port: 8004,
        webInterface: true, 
        description: "Advanced neural text-to-speech with emotional control",
        status: "stopped",
        lastStarted: null
    },
    tgWebUI: {
        name: "Text Generation WebUI",
        path: "C:/Users/sgins/AI_STACK/tg-webui",
        startCommand: "python server.py",
        stopCommand: "taskkill /f /im python.exe",
        port: 7860,
        webInterface: true,
        description: "Local large language model interface",
        status: "stopped", 
        lastStarted: null
    },
    ollama: {
        name: "Ollama",
        path: "C:/Users/sgins/AI_STACK/Ollama",
        startCommand: "run_ollama_server.bat",
        stopCommand: "taskkill /f /im ollama.exe",
        port: 11434,
        webInterface: false,
        description: "Local LLM manager for running models",
        status: "stopped",
        lastStarted: null
    }
};

// Active processes tracker
const activeProcesses = {};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    
    // Emit to all connected clients
    io.emit('log', { message: logMessage, type });
}

function updateServiceStatus(serviceName, status) {
    if (services[serviceName]) {
        services[serviceName].status = status;
        if (status === 'running') {
            services[serviceName].lastStarted = new Date();
        }
        io.emit('service-status-update', { 
            service: serviceName, 
            status: status,
            lastStarted: services[serviceName].lastStarted
        });
    }
}

// Service management functions
function startService(serviceName) {
    return new Promise((resolve) => {
        const service = services[serviceName];
        if (!service) {
            log(`Service not found: ${serviceName}`, 'error');
            return resolve({ success: false, error: 'Service not found' });
        }

        if (activeProcesses[serviceName]) {
            log(`Service already running: ${serviceName}`, 'warning');
            return resolve({ success: false, error: 'Service already running' });
        }

        log(`Starting service: ${service.name}`);
        
        const command = `cd "${service.path}" && ${service.startCommand}`;
        
        const childProcess = exec(command, { cwd: service.path }, (error, stdout, stderr) => {
            if (error) {
                log(`Error starting ${service.name}: ${error.message}`, 'error');
                updateServiceStatus(serviceName, 'error');
            }
        });

        activeProcesses[serviceName] = childProcess;
        updateServiceStatus(serviceName, 'starting');

        childProcess.stdout.on('data', (data) => {
            log(`${service.name} stdout: ${data}`, 'service');
        });

        childProcess.stderr.on('data', (data) => {
            log(`${service.name} stderr: ${data}`, 'error');
        });

        childProcess.on('close', (code) => {
            log(`${service.name} process exited with code ${code}`);
            delete activeProcesses[serviceName];
            updateServiceStatus(serviceName, 'stopped');
        });

        // Wait a bit before considering the service started
        setTimeout(() => {
            updateServiceStatus(serviceName, 'running');
            log(`Service started successfully: ${service.name}`);
            resolve({ success: true, message: `Started ${service.name}` });
        }, 3000);
    });
}

function stopService(serviceName) {
    return new Promise((resolve) => {
        const service = services[serviceName];
        if (!service) {
            log(`Service not found: ${serviceName}`, 'error');
            return resolve({ success: false, error: 'Service not found' });
        }

        if (!activeProcesses[serviceName]) {
            log(`Service not running: ${serviceName}`, 'warning');
            return resolve({ success: false, error: 'Service not running' });
        }

        log(`Stopping service: ${service.name}`);
        
        // Try graceful shutdown first
        activeProcesses[serviceName].kill();
        
        // Force kill after 5 seconds if still running
        setTimeout(() => {
            if (activeProcesses[serviceName]) {
                exec(service.stopCommand, (error) => {
                    if (error) {
                        log(`Error stopping ${service.name}: ${error.message}`, 'error');
                    }
                });
            }
        }, 5000);

        updateServiceStatus(serviceName, 'stopped');
        log(`Service stopped: ${service.name}`);
        resolve({ success: true, message: `Stopped ${service.name}` });
    });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/services', (req, res) => {
    res.json(services);
});

app.get('/api/status', (req, res) => {
    const status = {
        server: 'running',
        timestamp: new Date().toISOString(),
        services: Object.keys(services).length,
        active: Object.keys(activeProcesses).length
    };
    res.json(status);
});

app.post('/api/service/:name/start', async (req, res) => {
    const serviceName = req.params.name;
    const result = await startService(serviceName);
    res.json(result);
});

app.post('/api/service/:name/stop', async (req, res) => {
    const serviceName = req.params.name;
    const result = await stopService(serviceName);
    res.json(result);
});

app.post('/api/service/:name/restart', async (req, res) => {
    const serviceName = req.params.name;
    
    await stopService(serviceName);
    // Wait a bit before restarting
    setTimeout(async () => {
        const result = await startService(serviceName);
        res.json(result);
    }, 2000);
});

// Socket.io connection handling
io.on('connection', (socket) => {
    log(`Client connected: ${socket.id}`);
    
    // Send initial data to new client
    socket.emit('services-list', services);
    socket.emit('active-processes', Object.keys(activeProcesses));
    
    // Send current status of all services
    Object.keys(services).forEach(serviceName => {
        socket.emit('service-status-update', { 
            service: serviceName, 
            status: services[serviceName].status,
            lastStarted: services[serviceName].lastStarted
        });
    });

    socket.on('disconnect', () => {
        log(`Client disconnected: ${socket.id}`);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    log(`Server error: ${err.message}`, 'error');
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown handling
process.on('SIGINT', () => {
    log('Shutting down server gracefully...');
    
    // Stop all running services
    Object.keys(activeProcesses).forEach(serviceName => {
        stopService(serviceName);
    });
    
    server.close(() => {
        log('Server shut down successfully');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    log(`🚀 AI Stack Dashboard server started on http://localhost:${PORT}`);
    log(`📊 Managing ${Object.keys(services).length} AI services`);
    log(`💡 Health check available at http://localhost:${PORT}/health`);
    log(`🔌 Socket.io ready for real-time updates`);
    
    console.log('\n=== Available Services ===');
    Object.keys(services).forEach(key => {
        const service = services[key];
        console.log(`• ${service.name} (${service.description}) - Port: ${service.port}`);
    });
    console.log('==========================\n');
});

module.exports = { app, server, services, activeProcesses };