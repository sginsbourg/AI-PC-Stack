const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const http = require('http');

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
                type: 'java'
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
                type: 'executable'
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
                type: 'python'
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
                type: 'streamlit'
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
                type: 'streamlit'
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
                type: 'python'
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
        
        this.setupConsole();
        this.innerWidth = 76; // Fixed inner content width for alignment
        this.red = '\x1b[31m';
        this.reset = '\x1b[0m';
    }

    setupConsole() {
        console.clear();
        console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                          AI SERVICES DASHBOARD v3.1                         ║');
        console.log('║                    Fixed Path Errors & Final Polish                        ║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    }

    async start() {
        // Create log directory
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }

        // Run enhanced diagnostics that checks for missing files
        await this.runEnhancedDiagnostics();

        // Check for running services
        await this.checkRunningServices();

        // Check for Void AI
        await this.checkVoidAI();

        // Start monitoring
        this.startMonitoring();

        // Start all services
        await this.startAllServices();

        // Create Void AI config
        this.createVoidConfig();

        // Start dashboard updates
        this.startDashboardUpdates();

        // Show dashboard
        this.showDashboard();
    }

    async runEnhancedDiagnostics() {
        console.log('Running enhanced diagnostics...');
        
        // Check basic prerequisites
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
                            console.log('   X ' + check.name + ': Not found in PATH');
                            if (check.name === 'Streamlit') {
                                console.log('   Tip: Install with: pip install streamlit');
                            }
                            reject(error);
                        } else {
                            console.log('   OK ' + check.name + ': Installed');
                            resolve();
                        }
                    });
                });
            } catch (error) {
                // Error already logged
            }
        }

        // Check project directories and main files
        console.log('\nChecking project files:');
        for (const service of this.services) {
            if (service.workingDir && service.workingDir !== process.cwd()) {
                if (fs.existsSync(service.workingDir)) {
                    // Get the main file path safely
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
                        mainFile = service.workingDir; // For Java/executable services
                    }

                    if (mainFile && fs.existsSync(mainFile)) {
                        console.log('   OK ' + service.name + ': Main file exists');
                    } else {
                        console.log('   X ' + service.name + ': Main file issue - ' + service.args.join(' '));
                        console.log('   Tip: Check if the project is properly downloaded/cloned');
                        
                        // Try to find alternative main files for Python services
                        if (service.type === 'python' || service.type === 'streamlit') {
                            this.findAlternativeMainFiles(service);
                        }
                    }
                } else {
                    console.log('   X ' + service.name + ': MISSING DIRECTORY - ' + service.workingDir);
                }
            }
        }
    }

    findAlternativeMainFiles(service) {
        const alternatives = ['main.py', 'server.py', 'run.py', 'start.py', 'application.py', 'app.py'];
        console.log('   Searching ' + service.name + ': Looking for alternative main files...');
        
        let found = false;
        for (const alt of alternatives) {
            const altPath = path.join(service.workingDir, alt);
            if (fs.existsSync(altPath)) {
                console.log('   Tip: Found: ' + alt + ' - service will use this file');
                // Update the service to use the found file
                if (service.type === 'streamlit') {
                    service.args = ['run', alt, '--server.port', service.port.toString(), '--server.address', '0.0.0.0'];
                } else {
                    service.args = [alt];
                }
                found = true;
                break;
            }
        }
        
        if (!found) {
            // List Python files in the directory
            try {
                const files = fs.readdirSync(service.workingDir);
                const pyFiles = files.filter(f => f.endsWith('.py') && !f.startsWith('__'));
                if (pyFiles.length > 0) {
                    console.log('   Files: Available Python files: ' + pyFiles.join(', '));
                    // Use the first Python file found
                    if (service.type === 'streamlit') {
                        service.args = ['run', pyFiles[0], '--server.port', service.port.toString(), '--server.address', '0.0.0.0'];
                    } else {
                        service.args = [pyFiles[0]];
                    }
                    console.log('   Tip: Using: ' + pyFiles[0]);
                } else {
                    console.log('   X No Python files found in directory');
                }
            } catch (e) {
                console.log('   X Cannot read directory');
            }
        }
    }

    async checkRunningServices() {
        console.log('\nChecking for already running services...');
        
        for (const service of this.services) {
            const isRunning = await this.checkServiceRunning(service);
            if (isRunning) {
                service.alreadyRunning = true;
                service.status = 'responding';
                console.log('   OK ' + service.name + ' is already running');
            }
        }

        await this.checkVoidAIRunning();
    }

    async checkVoidAIRunning() {
        return new Promise((resolve) => {
            exec('tasklist /FI "IMAGENAME eq void.exe" /FO CSV', (error, stdout) => {
                if (!error && stdout.includes('void.exe')) {
                    this.voidAlreadyRunning = true;
                    console.log('   OK Void AI is already running');
                }
                resolve();
            });
        });
    }

    async checkServiceRunning(service) {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: service.port,
                path: '/',
                method: 'GET',
                timeout: 3000
            }, (res) => {
                resolve(true);
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
                    console.log('   OK Void AI found at: ' + this.voidPath);
                } else {
                    console.log('   X Void AI not found in PATH');
                }
                resolve();
            });
        });
    }

    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.services.forEach(service => {
                this.updateServiceStatus(service);
            });
        }, 2000);
    }

    updateServiceStatus(service) {
        if (service.alreadyRunning) {
            service.status = 'responding';
            return;
        }

        if (service.process && !service.process.killed) {
            service.status = 'running';
            this.checkResponseTime(service);
        } else {
            service.status = 'stopped';
        }
    }

    checkResponseTime(service) {
        const start = Date.now();
        const req = http.request({
            hostname: 'localhost',
            port: service.port,
            path: '/',
            method: 'GET',
            timeout: 5000
        }, (res) => {
            const time = Date.now() - start;
            service.responseTime = time + 'ms';
            if (time > 2000) {
                service.status = 'slow';
            } else {
                service.status = 'responding';
            }
            req.destroy();
        });

        req.on('error', () => {
            service.responseTime = 'ERROR';
            service.status = 'unresponsive';
        });

        req.on('timeout', () => {
            service.responseTime = 'TIMEOUT';
            service.status = 'slow';
            req.destroy();
        });

        req.end();
    }

    async startAllServices() {
        console.log('\nStarting services...');
        for (const service of this.services) {
            if (!service.alreadyRunning) {
                await this.startService(service);
            }
        }
    }

    async startService(service) {
        return new Promise((resolve) => {
            const logPath = path.join(this.logDir, service.logFile);
            const logStream = fs.createWriteStream(logPath, { flags: 'a' });

            let cmdArgs = [service.command, ...service.args];
            if (service.type === 'java') {
                cmdArgs = service.args;
            }

            service.process = spawn(service.command, service.args, {
                cwd: service.workingDir,
                stdio: ['ignore', logStream, logStream],
                detached: true
            });

            service.process.on('spawn', () => {
                service.pid = service.process.pid;
                service.status = 'starting';
                service.startTime = Date.now();
            });

            service.process.on('error', (error) => {
                service.status = 'failed';
                console.log('   X ' + service.name + ' failed to start: ' + error.message);
                resolve();
            });

            service.process.on('close', (code) => {
                if (code !== 0) {
                    service.status = 'crashed';
                }
                resolve();
            });

            setTimeout(() => resolve(), 1000);
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

    startDashboardUpdates() {
        if (this.dashboardUpdateInterval) {
            clearInterval(this.dashboardUpdateInterval);
        }
        this.dashboardUpdateInterval = setInterval(() => {
            this.updateDashboard();
        }, 2000);
    }

    updateDashboard() {
        console.clear();
        this.setupConsole();

        console.log('║ SERVICE        PORT     STATUS   STATUS INFO      RESPONSE TIME    LAST CHECK  ║'.padEnd(80, ' '));
        console.log('╠═══════════════════════════════╤════════════╤═══════════════════╤══════════════╣');

        this.services.forEach(service => {
            const statusIcon = this.getStatusIcon(service.status);
            const statusDisplay = this.getStatusDisplay(service.status, service.alreadyRunning);
            const responseTime = service.responseTime || 'N/A';
            const lastCheck = new Date().toLocaleTimeString();

            // Color status if not OK
            let coloredIcon = statusIcon;
            let coloredDisplay = statusDisplay.padEnd(12);
            if (statusIcon !== 'OK') {
                coloredIcon = this.red + statusIcon + this.reset;
                const displayLength = statusDisplay.length;
                coloredDisplay = this.red + statusDisplay + this.reset + ' '.repeat(12 - displayLength);
            }

            let lineContent = service.name.padEnd(12) + ' ' + 
                              service.port.toString().padEnd(8) + ' ' + 
                              coloredIcon + ' ' + 
                              coloredDisplay + ' ' + 
                              responseTime.padEnd(15) + ' ' + 
                              lastCheck.padEnd(12);

            // Pad to fixed inner width
            lineContent = lineContent.padEnd(this.innerWidth);

            console.log('║ ' + lineContent + ' ║');
        });

        console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
        
        let voidStatus = 'X NOT INSTALLED';
        if (this.voidFound) {
            if (this.voidAlreadyRunning) {
                voidStatus = 'OK EXTERNAL';
            } else if (this.voidProcess) {
                voidStatus = 'OK RUNNING';
            } else {
                voidStatus = 'O READY';
            }
        }
        
        let voidLineContent = 'Void AI Status: ' + voidStatus;
        voidLineContent = voidLineContent.padEnd(this.innerWidth);
        console.log('║ ' + voidLineContent + ' ║');
        console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

        let controls1 = '[V] Launch Void AI  [R] Restart Services  [L] View Logs  [D] Diagnostics';
        controls1 = controls1.padEnd(this.innerWidth);
        console.log('║ ' + controls1 + ' ║');

        let controls2 = '[S] Detailed Status  [1-6] Restart Individual  [Q] Quit & Shutdown';
        controls2 = controls2.padEnd(this.innerWidth);
        console.log('║ ' + controls2 + ' ║');

        console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    }

    getStatusIcon(status) {
        const icons = {
            'running': 'OK', 'responding': 'OK', 'starting': 'WAIT', 'slow': 'SLOW',
            'stopped': 'O', 'crashed': 'X', 'failed': 'X', 'unresponsive': 'SLOW'
        };
        return icons[status] || '?';
    }

    getStatusDisplay(status, alreadyRunning) {
        if (alreadyRunning && status === 'responding') return 'EXTERNAL';
        const displays = {
            'running': 'RUNNING', 'responding': 'HEALTHY', 'starting': 'STARTING',
            'slow': 'SLOW', 'stopped': 'STOPPED', 'crashed': 'CRASHED',
            'failed': 'FAILED', 'unresponsive': 'NO RESPONSE'
        };
        return displays[status] || status.toUpperCase();
    }

    showDashboard() {
        this.updateDashboard();
        this.setupInputHandler();
    }

    setupInputHandler() {
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        process.stdin.on('keypress', (str, key) => {
            if (key.ctrl && key.name === 'c') {
                this.shutdown();
            } else {
                const keyName = key.name ? key.name.toLowerCase() : str.toLowerCase();
                switch (keyName) {
                    case 'q': this.shutdown(); break;
                    case 's': this.showDetailedStatus(); break;
                    case 'l': this.showLogMenu(); break;
                    case 'v': this.launchVoidAI(); break;
                    case 'd': this.runComprehensiveDiagnostics(); break;
                    case 'r': this.showRestartMenu(); break;
                    case '1': case '2': case '3': case '4': case '5': case '6':
                        const index = parseInt(keyName) - 1;
                        if (index >= 0 && index < this.services.length) {
                            this.restartService(this.services[index]);
                        }
                        break;
                }
            }
        });
    }

    showDetailedStatus() {
        clearInterval(this.dashboardUpdateInterval);
        
        console.log('\n\nDETAILED SERVICE STATUS');
        console.log('='.repeat(70));
        
        this.services.forEach(service => {
            const uptime = service.startTime ? 
                Math.round((Date.now() - service.startTime) / 1000) + 's' : 'N/A';
            
            console.log('\n' + this.getStatusIcon(service.status) + ' ' + service.name + ':');
            console.log('   Status: ' + service.status);
            console.log('   Port: ' + service.port + ' | PID: ' + (service.pid || 'N/A') + ' | Uptime: ' + uptime);
            console.log('   Directory: ' + service.workingDir);
            console.log('   Command: ' + service.command + ' ' + service.args.join(' '));
            
            if (service.status === 'crashed' || service.status === 'failed') {
                console.log('   Tip: Test manually: cd "' + service.workingDir + '" && ' + service.command + ' ' + service.args.join(' '));
            }
        });

        console.log('\nPress any key to continue...');
        process.stdin.once('keypress', () => {
            this.startDashboardUpdates();
            this.showDashboard();
        });
    }

    showLogMenu() {
        clearInterval(this.dashboardUpdateInterval);
        
        console.log('\n\nSERVICE LOGS');
        console.log('='.repeat(60));
        this.services.forEach((service, index) => {
            const statusIcon = this.getStatusIcon(service.status);
            console.log('  ' + (index + 1) + '. ' + statusIcon + ' ' + service.name);
        });
        console.log('  0. Back to dashboard');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('\nSelect log to view: ', (choice) => {
            rl.close();
            const index = parseInt(choice) - 1;
            if (index >= 0 && index < this.services.length) {
                this.viewLog(this.services[index]);
            } else {
                this.startDashboardUpdates();
                this.showDashboard();
            }
        });
    }

    viewLog(service) {
        const logPath = path.join(this.logDir, service.logFile);
        if (fs.existsSync(logPath)) {
            console.log('\n' + service.name + ' LOG - Last 20 lines');
            console.log('='.repeat(80));
            
            const logContent = fs.readFileSync(logPath, 'utf8');
            const lines = logContent.split('\n').slice(-20);
            
            if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
                console.log('   (Log file is empty - service crashed immediately)');
            } else {
                lines.forEach(line => {
                    if (line.trim()) {
                        if (line.toLowerCase().includes('error')) console.log('X ' + line);
                        else if (line.toLowerCase().includes('warn')) console.log('! ' + line);
                        else if (line.toLowerCase().includes('start') || line.toLowerCase().includes('ready')) console.log('OK ' + line);
                        else console.log('   ' + line);
                    }
                });
            }
            
            console.log('='.repeat(80));
        } else {
            console.log('\nX No log file found for ' + service.name);
            console.log('   Service crashed before creating any output');
        }
        
        console.log('\nPress any key to return...');
        process.stdin.once('keypress', () => {
            this.startDashboardUpdates();
            this.showDashboard();
        });
    }

    showRestartMenu() {
        clearInterval(this.dashboardUpdateInterval);
        
        console.log('\n\nRESTART SERVICES');
        console.log('='.repeat(60));
        this.services.forEach((service, index) => {
            const statusIcon = this.getStatusIcon(service.status);
            console.log('  ' + (index + 1) + '. ' + statusIcon + ' ' + service.name + ' (' + service.status + ')');
        });
        console.log('  A. Restart ALL services');
        console.log('  B. Back to dashboard');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('\nSelect option: ', (choice) => {
            rl.close();
            const upperChoice = choice.toUpperCase();
            if (upperChoice === 'B') {
                this.startDashboardUpdates();
                this.showDashboard();
            } else if (upperChoice === 'A') {
                this.restartAllServices();
            } else {
                const index = parseInt(choice) - 1;
                if (index >= 0 && index < this.services.length) {
                    this.restartService(this.services[index]);
                }
            }
            setTimeout(() => {
                this.startDashboardUpdates();
                this.showDashboard();
            }, 3000);
        });
    }

    async restartService(service) {
        console.log('\nRestarting ' + service.name + '...');
        
        if (service.process) {
            try {
                process.kill(service.process.pid);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {}
        }
        
        await this.startService(service);
    }

    async restartAllServices() {
        console.log('\nRestarting ALL services...');
        
        for (const service of this.services) {
            if (service.alreadyRunning) continue;
            await this.restartService(service);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    launchVoidAI() {
        if (!this.voidFound) {
            console.log('\nX Void AI is not installed.');
            return;
        }

        if (this.voidAlreadyRunning) {
            console.log('\nOK Void AI is already running!');
            return;
        }

        console.log('\nLaunching Void AI...');
        
        try {
            if (this.voidPath.includes(path.sep)) {
                this.voidProcess = spawn(this.voidPath, ['--config', this.voidConfig], {
                    stdio: 'ignore',
                    detached: true
                });
            } else {
                this.voidProcess = spawn(this.voidPath, ['--config', this.voidConfig], {
                    shell: true,
                    stdio: 'ignore',
                    detached: true
                });
            }

            this.voidProcess.on('error', (error) => {
                console.log('X Failed to launch Void AI: ' + error.message);
            });

            console.log('OK Void AI launched!');
            
        } catch (error) {
            console.log('X Error launching Void AI: ' + error.message);
        }
    }

    runComprehensiveDiagnostics() {
        console.log('\nCOMPREHENSIVE DIAGNOSTICS');
        console.log('='.repeat(70));
        
        console.log('\nCURRENT SERVICE STATUS:');
        this.services.forEach(service => {
            console.log('   ' + this.getStatusIcon(service.status) + ' ' + service.name + ': ' + service.status);
        });

        console.log('\nQUICK FIXES:');
        console.log('1. For Python services, install dependencies: pip install -r requirements.txt');
        console.log('2. Check individual logs for specific error messages');
        console.log('3. Try running services manually to see exact errors');
        
        console.log('\nPress any key to continue...');
        process.stdin.once('keypress', () => this.showDashboard());
    }

    shutdown() {
        console.log('\nShutting down...');
        clearInterval(this.monitoringInterval);
        clearInterval(this.dashboardUpdateInterval);
        
        if (this.voidProcess && !this.voidAlreadyRunning) {
            try {
                this.voidProcess.kill();
            } catch (e) {
                console.log('Warning: Could not kill Void AI process: ' + e.message);
            }
        }
        
        // Kill all service processes
        this.services.forEach(service => {
            if (service.process && !service.alreadyRunning) {
                try {
                    service.process.kill();
                } catch (e) {
                    console.log('Warning: Could not kill ' + service.name + ' process: ' + e.message);
                }
            }
        });
        
        console.log('OK All services stopped gracefully.');
        process.exit(0);
    }
}

// Start the dashboard
const dashboard = new AIDashboard();
dashboard.start().catch(console.error);