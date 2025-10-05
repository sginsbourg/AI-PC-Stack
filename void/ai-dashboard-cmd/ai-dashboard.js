const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const http = require('http');
const os = require('os');

class AIDashboard {
    constructor() {
        this.services = [
            {
                name: 'Nutch',
                port: 8899,
                command: 'java',
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
                restartCount: 0,
                maxRestarts: 5
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
                restartCount: 0,
                maxRestarts: 5
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
                restartCount: 0,
                maxRestarts: 5
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
                restartCount: 0,
                maxRestarts: 5
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
                restartCount: 0,
                maxRestarts: 5
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
                restartCount: 0,
                maxRestarts: 5
            }
        ];

        this.logDir = path.join(process.cwd(), 'service_logs');
        this.voidConfig = path.join(process.cwd(), 'void_local.yaml');
        this.voidFound = false;
        this.voidProcess = null;
        this.voidPath = null;
        this.voidAlreadyRunning = false;
        this.monitoringInterval = null;
        this.dashboardUpdateInterval = null;
        this.prevSent = 0;
        this.prevRecv = 0;
        this.prevTime = Date.now();
        this.systemMetrics = {
            cpu: 'N/A',
            ram: 'N/A',
            disk: 'N/A',
            net: 'N/A'
        };
        
        this.innerWidth = 78;
        this.columnWidths = {
            service: 12,
            port: 8,
            statusIcon: 8,
            statusInfo: 15,
            responseTime: 16,
            lastCheck: 14
        };
        this.red = '\x1b[31m';
        this.green = '\x1b[32m';
        this.yellow = '\x1b[33m';
        this.blue = '\x1b[34m';
        this.blinkGreen = '\x1b[32;5m';
        this.reset = '\x1b[0m';
        
        // Create log directory
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        
        this.validateServices();
        this.setupConsole();
        this.checkVoidAI();
        this.generateVoidConfig();
    }

    validateServices() {
        try {
            this.services.forEach((service, index) => {
                if (!service.name || typeof service.port !== 'number' || !service.command || !Array.isArray(service.args) || !service.logFile || !service.type) {
                    throw new Error(`Invalid service configuration for ${service.name || `service ${index}`}: Missing required fields`);
                }
                if (service.port < 1 || service.port > 65535) {
                    throw new Error(`Invalid port for ${service.name}: ${service.port}`);
                }
                if (service.maxRestarts < 1) {
                    service.maxRestarts = 5;
                }
            });
        } catch (error) {
            console.error('Service validation failed:', error.message);
            process.exit(1);
        }
    }

    setupConsole() {
        console.clear();
        process.title = 'AI Services Dashboard';
        
        // Handle Ctrl+C gracefully
        process.on('SIGINT', () => {
            this.shutdown();
        });
    }

    checkVoidAI() {
        exec('where void', (error) => {
            this.voidFound = !error;
        });
    }

    generateVoidConfig() {
        const config = {
            local_services: {}
        };
        
        this.services.forEach(service => {
            config.local_services[service.name.toLowerCase()] = `http://localhost:${service.port}`;
        });

        fs.writeFileSync(this.voidConfig, YAML.stringify(config));
    }

    getStatusIcon(status) {
        const icons = {
            'running': '🟢',
            'starting': '🟡',
            'stopped': '⚪',
            'crashed': '🔴',
            'slow': '🟠'
        };
        return icons[status] || '⚪';
    }

    formatResponseTime(ms) {
        if (ms === null) return 'N/A';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    }

    formatUptime(startTime) {
        if (!startTime) return 'N/A';
        const uptime = Date.now() - startTime;
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    async checkServiceHealth(service) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const req = http.get(`http://localhost:${service.port}`, (res) => {
                service.responseTime = Date.now() - startTime;
                service.lastCheck = new Date().toLocaleTimeString();
                
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    service.status = service.responseTime > 5000 ? 'slow' : 'running';
                } else {
                    service.status = 'slow';
                }
                resolve(true);
            });

            req.on('error', () => {
                service.responseTime = null;
                service.lastCheck = new Date().toLocaleTimeString();
                if (service.process && service.status !== 'starting') {
                    service.status = 'crashed';
                }
                resolve(false);
            });

            req.setTimeout(5000, () => {
                req.destroy();
                service.responseTime = null;
                service.lastCheck = new Date().toLocaleTimeString();
                service.status = 'slow';
                resolve(false);
            });
        });
    }

    updateSystemMetrics() {
        try {
            // RAM
            const totalMem = os.totalmem() / 1024 / 1024 / 1024;
            const freeMem = os.freemem() / 1024 / 1024 / 1024;
            const usedMem = totalMem - freeMem;
            const ramPercent = Math.round((usedMem / totalMem) * 100);
            this.systemMetrics.ram = ramPercent + '%';
        } catch (error) {
            this.systemMetrics.ram = 'N/A';
        }

        // CPU (simplified for now)
        this.systemMetrics.cpu = 'N/A';
        
        // Disk (simplified for now)
        this.systemMetrics.disk = 'N/A';
    }

    displayHeader() {
        console.clear();
        console.log('='.repeat(80));
        console.log(`${this.green}🚀 AI SERVICES DASHBOARD${this.reset}`.padEnd(40) + `${this.blue}System: ${this.systemMetrics.cpu} CPU | ${this.systemMetrics.ram} RAM | ${this.systemMetrics.disk} Disk${this.reset}`);
        console.log('='.repeat(80));
    }

    displayServices() {
        console.log('\nSERVICE'.padEnd(this.columnWidths.service) + 
                   'PORT'.padEnd(this.columnWidths.port) +
                   'STATUS'.padEnd(this.columnWidths.statusIcon) +
                   'INFO'.padEnd(this.columnWidths.statusInfo) +
                   'RESPONSE'.padEnd(this.columnWidths.responseTime) +
                   'LAST CHECK'.padEnd(this.columnWidths.lastCheck));
        console.log('-'.repeat(80));

        this.services.forEach(service => {
            const statusIcon = this.getStatusIcon(service.status);
            const statusColor = service.status === 'running' ? this.green : 
                              service.status === 'starting' ? this.yellow :
                              service.status === 'crashed' ? this.red : 
                              service.status === 'slow' ? this.yellow : this.reset;

            const info = service.pid ? `PID: ${service.pid}` : 'Not running';
            const response = this.formatResponseTime(service.responseTime);
            const lastCheck = service.lastCheck || 'Never';

            console.log(service.name.padEnd(this.columnWidths.service) +
                       service.port.toString().padEnd(this.columnWidths.port) +
                       `${statusColor}${statusIcon}${this.reset}`.padEnd(this.columnWidths.statusIcon) +
                       info.padEnd(this.columnWidths.statusInfo) +
                       response.padEnd(this.columnWidths.responseTime) +
                       lastCheck.padEnd(this.columnWidths.lastCheck));
        });
    }

    displayFooter() {
        console.log('\n' + '='.repeat(80));
        console.log(`${this.green}CONTROLS:${this.reset} [V] Void AI | [S] Start All | [R] Restart All | [T] Stop All | [L] Logs | [Q] Quit`);
        console.log('='.repeat(80));
    }

    displayDashboard() {
        this.displayHeader();
        this.displayServices();
        this.displayFooter();
    }

    async startService(service) {
        if (service.process) {
            return; // Already running
        }

        service.status = 'starting';
        service.startTime = Date.now();

        try {
            const logStream = fs.createWriteStream(path.join(this.logDir, service.logFile), { flags: 'a' });
            
            const child = spawn(service.command, service.args, {
                cwd: service.workingDir,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false
            });

            service.process = child;
            service.pid = child.pid;

            child.stdout.on('data', (data) => {
                logStream.write(`[STDOUT] ${data}`);
            });

            child.stderr.on('data', (data) => {
                logStream.write(`[STDERR] ${data}`);
            });

            child.on('close', (code) => {
                service.process = null;
                service.pid = null;
                service.status = code === 0 ? 'stopped' : 'crashed';
                logStream.write(`[INFO] Process exited with code ${code}\n`);
                logStream.end();
            });

            // Wait a bit for service to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
        } catch (error) {
            service.status = 'crashed';
            console.error(`Failed to start ${service.name}:`, error.message);
        }
    }

    async stopService(service) {
        if (!service.process) {
            return;
        }

        try {
            service.process.kill();
            service.process = null;
            service.pid = null;
            service.status = 'stopped';
            service.startTime = null;
        } catch (error) {
            console.error(`Failed to stop ${service.name}:`, error.message);
        }
    }

    async startAllServices() {
        console.log('\nStarting all services...');
        for (const service of this.services) {
            await this.startService(service);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Stagger starts
        }
    }

    async stopAllServices() {
        console.log('\nStopping all services...');
        for (const service of this.services) {
            await this.stopService(service);
        }
    }

    async restartAllServices() {
        await this.stopAllServices();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.startAllServices();
    }

    showLogsMenu() {
        console.log('\n=== SERVICE LOGS ===');
        this.services.forEach((service, index) => {
            console.log(`[${index + 1}] ${service.name}`);
        });
        console.log('[0] Back to dashboard');
        
        this.getUserInput('Select service to view logs: ', (input) => {
            const choice = parseInt(input);
            if (choice === 0) return;
            
            if (choice >= 1 && choice <= this.services.length) {
                this.viewServiceLogs(this.services[choice - 1]);
            }
        });
    }

    viewServiceLogs(service) {
        const logPath = path.join(this.logDir, service.logFile);
        
        if (!fs.existsSync(logPath)) {
            console.log(`No logs found for ${service.name}`);
            return;
        }

        console.log(`\n=== ${service.name} LOGS ===`);
        try {
            const logContent = fs.readFileSync(logPath, 'utf8');
            const lines = logContent.split('\n').slice(-50); // Last 50 lines
            console.log(lines.join('\n'));
        } catch (error) {
            console.log(`Error reading logs: ${error.message}`);
        }
        
        console.log('\nPress any key to continue...');
        process.stdin.once('data', () => {
            this.displayDashboard();
        });
    }

    getUserInput(prompt, callback) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(prompt, (answer) => {
            rl.close();
            callback(answer);
        });
    }

    setupInputHandling() {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        process.stdin.on('data', (key) => {
            const str = key.toString();
            
            switch (str.toLowerCase()) {
                case 'v':
                    this.launchVoidAI();
                    break;
                case 's':
                    this.startAllServices();
                    break;
                case 'r':
                    this.restartAllServices();
                    break;
                case 't':
                    this.stopAllServices();
                    break;
                case 'l':
                    this.showLogsMenu();
                    break;
                case 'q':
                    this.shutdown();
                    break;
                case '\u0003': // Ctrl+C
                    this.shutdown();
                    break;
            }
        });
    }

    launchVoidAI() {
        if (!this.voidFound) {
            console.log('\nVoid AI not found in PATH. Please install Void AI first.');
            return;
        }

        if (this.voidProcess) {
            console.log('\nVoid AI is already running.');
            return;
        }

        console.log('\nLaunching Void AI...');
        this.voidProcess = spawn('void', ['--config', this.voidConfig], {
            stdio: 'inherit',
            detached: true
        });

        this.voidProcess.on('close', () => {
            this.voidProcess = null;
        });
    }

    async monitorServices() {
        for (const service of this.services) {
            await this.checkServiceHealth(service);
        }
        this.updateSystemMetrics();
    }

    async start() {
        console.log('Initializing AI Services Dashboard...');
        
        // Start monitoring
        this.monitoringInterval = setInterval(() => {
            this.monitorServices();
        }, 5000);

        // Start dashboard updates
        this.dashboardUpdateInterval = setInterval(() => {
            this.displayDashboard();
        }, 2000);

        // Setup input handling
        this.setupInputHandling();

        // Initial display
        this.displayDashboard();
        
        console.log('\nDashboard started. Use keyboard controls to manage services.');
    }

    async shutdown() {
        console.log('\nShutting down AI Services Dashboard...');
        
        clearInterval(this.monitoringInterval);
        clearInterval(this.dashboardUpdateInterval);
        
        await this.stopAllServices();
        
        if (this.voidProcess) {
            this.voidProcess.kill();
        }
        
        console.log('All services stopped. Goodbye!');
        process.exit(0);
    }
}

// Simple YAML stringify for config
const YAML = {
    stringify(obj) {
        let yaml = '';
        for (const [key, value] of Object.entries(obj)) {
            yaml += `${key}:\n`;
            for (const [subKey, subValue] of Object.entries(value)) {
                yaml += `  ${subKey}: ${subValue}\n`;
            }
        }
        return yaml;
    }
};

// Create and start the dashboard
const dashboard = new AIDashboard();
dashboard.start();