const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

class ServiceManager {
    constructor() {
        // Services array based on the original ai-dashboard.js
        this.services = [
            {
                name: 'Nutch',
                port: 8899,
                // CRITICAL FIX: Absolute path to java.exe without quotes, and useShell: false below.
                command: 'C:\\Program Files\\Java\\jdk-24\\bin\\java.exe', 
                args: ['-cp', 'lib/*;conf', 'org.apache.nutch.service.NutchServer', '-port', '8899'],
                workingDir: path.join(process.env.USERPROFILE, 'AI_STACK', 'apache-nutch-1.21'),
                logFile: 'nutch.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false,
                type: 'java',
                useShell: false, // <-- Bypasses Windows shell parsing for path with spaces
                // FIX: Use a valid Nutch REST endpoint to prevent 404 errors on health checks
                healthCheckPath: '/rest/server/version' 
            },
            {
                name: 'Ollama',
                port: 11434,
                command: 'ollama',
                args: ['serve'],
                workingDir: process.cwd(),
                logFile: 'ollama.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false,
                type: 'executable',
                useShell: true,
                healthCheckPath: '/'
            },
            {
                name: 'MeloTTS',
                port: 9880,
                command: 'python',
                args: ['test_melotts.py'],
                workingDir: path.join(process.env.USERPROFILE, 'AI_STACK', 'MeloTTS'),
                logFile: 'melotts.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false,
                type: 'python',
                useShell: true,
                healthCheckPath: '/'
            },
            {
                name: 'OpenManus',
                port: 7860,
                command: 'streamlit',
                args: ['run', 'main.py', '--server.port', '7860', '--server.address', '0.0.0.0'],
                workingDir: path.join(process.env.USERPROFILE, 'AI_STACK', 'OpenManus'),
                logFile: 'openmanus.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false,
                type: 'streamlit',
                useShell: true,
                healthCheckPath: '/'
            },
            {
                name: 'OpenSora',
                port: 7861,
                command: 'streamlit',
                args: ['run', 'opensora_web.py', '--server.port', '7861', '--server.address', '0.0.0.0'],
                workingDir: path.join(process.env.USERPROFILE, 'AI_STACK', 'OpenSora'),
                logFile: 'opensora.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false,
                type: 'streamlit',
                useShell: true,
                healthCheckPath: '/'
            },
            {
                name: 'tg-webui',
                port: 7862,
                command: 'python',
                args: ['server.py', '--api'],
                workingDir: path.join(process.env.USERPROFILE, 'AI_STACK', 'tg-webui'),
                logFile: 'tg-webui.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false,
                type: 'python',
                useShell: true,
                healthCheckPath: '/'
            }
        ];

        this.logDir = path.join(process.cwd(), 'service_logs');
        this.voidConfig = path.join(process.cwd(), 'void_local.yaml');
        this.voidFound = false;
        this.voidProcess = null;
        this.voidPath = null;
        this.voidAlreadyRunning = false;
        this.monitoringInterval = null;
        this.isReady = false; 
    }

    // --- PUBLIC METHODS FOR IPC ---
    getServiceData() {
        const now = Date.now();
        return {
            services: this.services.map(s => ({
                name: s.name,
                port: s.port,
                status: this.getStatusDisplay(s.status, s.alreadyRunning),
                icon: this.getStatusIcon(s.status),
                responseTime: s.responseTime ? s.responseTime + 'ms' : '---',
                pid: s.pid || 'N/A',
                uptime: s.startTime ? Math.round((now - s.startTime) / 1000) + 's' : 'N/A',
                command: s.command + ' ' + s.args.join(' '),
                directory: s.workingDir,
                logFile: s.logFile
            })),
            voidStatus: this.getVoidStatus(),
            isReady: this.isReady
        };
    }

    getServiceLog(serviceName) {
        const service = this.services.find(s => s.name === serviceName);
        if (!service) return 'Error: Service not found.';

        const logPath = path.join(this.logDir, service.logFile);
        if (fs.existsSync(logPath)) {
            try {
                const logContent = fs.readFileSync(logPath, 'utf8');
                // Return only the last 50 lines for efficiency
                return logContent.split('\n').slice(-50).join('\n');
            } catch (e) {
                return 'Error reading log file: ' + e.message;
            }
        } else {
            return `No log file found for ${serviceName}.`;
        }
    }
    
    // --- CORE LIFE CYCLE METHOD ---
    async start() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }
        
        await this.runEnhancedDiagnostics();
        await this.checkRunningServices(); 
        await this.checkVoidAI();
        
        this.startMonitoring();
        await this.startAllServices();
        this.createVoidConfig();
        this.isReady = true; 
    }
    
    // --- UTILITY AND DIAGNOSTIC METHODS ---
    
    async runEnhancedDiagnostics() {
        const checks = [
            { name: 'Python', command: 'python --version' },
            { name: 'Java', command: 'java -version' },
            { name: 'Pip', command: 'pip --version' },
            { name: 'Streamlit', command: 'streamlit --version' }
        ];

        for (const check of checks) {
            try {
                await new Promise((resolve, reject) => {
                    exec(check.command, (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (error) {
                // Silent failure is okay here, just means a dependency is missing.
            }
        }

        for (const service of this.services) {
            if (service.workingDir && service.workingDir !== process.cwd()) {
                if (fs.existsSync(service.workingDir)) {
                    let mainFile;
                    if (service.type === 'streamlit') {
                        const runIndex = service.args.indexOf('run');
                        mainFile = runIndex !== -1 && service.args[runIndex + 1] ? 
                            path.join(service.workingDir, service.args[runIndex + 1]) :
                            null;
                    } else if (service.type === 'python') {
                        mainFile = service.args.length > 0 ? 
                            path.join(service.workingDir, service.args[0]) :
                            null;
                    } else {
                        mainFile = service.workingDir;
                    }

                    if (!mainFile || !fs.existsSync(mainFile)) {
                        if (service.type === 'python' || service.type === 'streamlit') {
                            this.findAlternativeMainFiles(service);
                        }
                    }
                }
            }
        }
    }

    findAlternativeMainFiles(service) {
        const alternatives = ['main.py', 'server.py', 'run.py', 'start.py', 'application.py', 'app.py'];
        
        for (const alt of alternatives) {
            const altPath = path.join(service.workingDir, alt);
            if (fs.existsSync(altPath)) {
                if (service.type === 'streamlit') {
                    service.args = ['run', alt, '--server.port', service.port.toString(), '--server.address', '0.0.0.0'];
                } else {
                    service.args = [alt];
                }
                return;
            }
        }
    }

    async checkRunningServices() {
        for (const service of this.services) {
            const isRunning = await this.checkServiceRunning(service);
            if (isRunning) {
                service.alreadyRunning = true;
                service.status = 'responding';
            }
        }
        await this.checkVoidAIRunning();
    }

    async checkVoidAIRunning() {
        return new Promise((resolve) => {
            exec('tasklist /FI "IMAGENAME eq void.exe" /FO CSV', (error, stdout) => {
                if (!error && stdout.includes('void.exe')) {
                    this.voidAlreadyRunning = true;
                }
                resolve();
            });
        });
    }

    async checkServiceRunning(service) {
        return new Promise((resolve) => {
            // Use specific healthCheckPath or default to '/'
            const checkPath = service.healthCheckPath || '/'; 

            const req = http.request({
                hostname: 'localhost',
                port: service.port,
                path: checkPath,
                method: 'GET',
                // FIX: Increased timeout to 8000ms
                timeout: 8000 
            }, (res) => {
                // Check for successful connection, regardless of application error code.
                if (res.statusCode) {
                    resolve(true);
                } else {
                    resolve(false);
                }
                req.destroy();
            });

            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    async checkVoidAI() {
        return new Promise((resolve) => {
            exec('where void', (error, stdout) => {
                if (!error && stdout.trim()) {
                    this.voidFound = true;
                    this.voidPath = stdout.trim().split('\n')[0];
                }
                resolve();
            });
        });
    }

    startMonitoring() {
        if (this.monitoringInterval) clearInterval(this.monitoringInterval);
        this.monitoringInterval = setInterval(() => {
            this.services.forEach(service => this.checkHealth(service));
        }, 2000);
    }

    checkHealth(service) {
        if (service.pid || service.alreadyRunning) {
            const startTime = Date.now();
            // FIX: Use specific healthCheckPath or default to '/'
            const checkPath = service.healthCheckPath || '/'; 
            
            // FIX: Timeout is now 8000ms
            http.get(`http://localhost:${service.port}${checkPath}`, { timeout: 8000 }, (res) => {
                // FINAL FIX: Check HTTP status code for full success or just running status
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    service.status = 'responding'; // Fully healthy API response
                } else {
                    // Service is alive (connected successfully), but returned non-2xx/3xx (e.g., 404).
                    // Set to 'running' to display green status and avoid the false 'NO RESPONSE' error.
                    service.status = 'running'; 
                }
                service.responseTime = Date.now() - startTime;
                res.resume(); // Consume the response data
            }).on('error', (err) => {
                if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
                    service.status = 'unresponsive';
                } else if (err.code === 'EAGAIN' || err.code === 'ETIMEDOUT') {
                    service.status = 'slow';
                } else {
                    service.status = 'unresponsive';
                }
                service.responseTime = null;
            });
        } else {
            service.status = 'stopped';
            service.responseTime = null;
        }
    }
    
    async startAllServices() {
        for (const service of this.services) {
            if (service.status === 'stopped' && !service.alreadyRunning) {
                await this.startService(service);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    
    startService(service) {
        return new Promise(resolve => {
            if (service.alreadyRunning) {
                return resolve();
            }

            const logStream = fs.createWriteStream(path.join(this.logDir, service.logFile), { flags: 'a' });
            
            // FIX: Conditionally set shell based on the new service flag
            const child = spawn(service.command, service.args, {
                cwd: service.workingDir,
                detached: true,
                shell: service.useShell !== false 
            });

            service.process = child;
            service.pid = child.pid;
            service.startTime = Date.now();
            service.status = 'starting';

            // Correct way to pipe logs
            if (child.stdout) child.stdout.pipe(logStream);
            if (child.stderr) child.stderr.pipe(logStream);

            child.on('error', (err) => {
                service.status = 'failed';
                service.pid = null;
                logStream.write(`\n[SERVICE ERROR] Failed to start process: ${err.message}\n`);
                resolve();
            });

            child.on('exit', (code) => {
                service.status = code === 0 ? 'stopped' : 'crashed';
                service.pid = null;
                service.process = null;
                service.startTime = null;
                logStream.write(`\n[SERVICE EXIT] Process exited with code: ${code}\n`);
            });

            // Resolve immediately after spawning the process
            resolve();
        });
    }

    createVoidConfig() {
        const config = `local_services:
  nutch: http://localhost:8899
  ollama: http://localhost:11434
  melotts: http://localhost:9880
  openmanus: http://localhost:7860
  opensora: http://localhost:7861
  tg_webui: http://localhost:7862
`;
        
        fs.writeFileSync(this.voidConfig, config);
    }
    
    // Core control logic (made public for IPC)
    async restartService(serviceName) {
        const service = this.services.find(s => s.name === serviceName);
        if (service && (service.process || service.alreadyRunning)) {
            // Only kill if we started it OR if it's currently running (to ensure restart functionality)
            if (service.process && !service.alreadyRunning) {
                 try { process.kill(service.pid); } catch (e) {}
            }
            // Reset status
            service.pid = null;
            service.process = null;
            service.status = 'stopped';
            service.alreadyRunning = false; // Must reset to force a re-check/start
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.startService(service);
        }
    }

    async restartAllServices() {
        this.services.forEach(service => {
            if (service.process && !service.alreadyRunning) {
                try { process.kill(service.pid); } catch (e) {}
                service.pid = null;
                service.process = null;
                service.status = 'stopped';
                service.alreadyRunning = false;
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.startAllServices();
    }

    launchVoidAI() {
        if (!this.voidFound || this.voidAlreadyRunning || this.voidProcess) {
            return;
        }

        try {
            this.voidProcess = spawn(this.voidPath, ['--config', this.voidConfig], {
                shell: true,
                stdio: 'ignore',
                detached: true
            });

            this.voidProcess.on('error', (error) => {
                console.error('X Failed to launch Void AI: ' + error.message);
            });
        } catch (error) {
            console.error('X Error launching Void AI: ' + error.message);
        }
    }
    
    shutdown() {
        clearInterval(this.monitoringInterval);
        
        if (this.voidProcess && !this.voidAlreadyRunning) {
            try { process.kill(this.voidProcess.pid); } catch (e) {} 
        }
        
        this.services.forEach(service => {
            if (service.process && !service.alreadyRunning) {
                try { process.kill(service.pid); } catch (e) {}
            }
        });
    }

    // --- HELPER METHODS ---
    getStatusIcon(status) { 
        return (status === 'running' || status === 'responding' ? '✅' : status === 'slow' || status === 'unresponsive' ? '⚠️' : status === 'stopped' ? '🔴' : '❌'); 
    }
    getStatusDisplay(status, alreadyRunning) { 
        return (alreadyRunning && status === 'responding' ? 'EXTERNAL' : status === 'unresponsive' ? 'NO RESPONSE' : status.toUpperCase()); 
    }
    getVoidStatus() { 
        if (!this.voidFound) return 'X NOT INSTALLED';
        if (this.voidAlreadyRunning) return 'OK EXTERNAL';
        if (this.voidProcess) return 'OK RUNNING';
        return 'O READY';
    }
}

module.exports = ServiceManager;