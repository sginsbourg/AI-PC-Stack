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
                command: `cd "${path.join(process.env.USERPROFILE, 'AI_STACK', 'apache-nutch-1.21')}" && java -cp "lib/*;conf" org.apache.nutch.service.NutchServer -port 8899`,
                logFile: 'nutch.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false
            },
            {
                name: 'Ollama',
                port: 11434,
                command: 'ollama serve',
                logFile: 'ollama.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false
            },
            {
                name: 'MeloTTS',
                port: 9880,
                command: `cd "${path.join(process.env.USERPROFILE, 'AI_STACK', 'MeloTTS')}" && python melo/api.py`,
                logFile: 'melotts.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false
            },
            {
                name: 'OpenManus',
                port: 7860,
                command: `cd "${path.join(process.env.USERPROFILE, 'AI_STACK', 'OpenManus')}" && python app.py`,
                logFile: 'openmanus.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false
            },
            {
                name: 'OpenSora',
                port: 7861,
                command: `cd "${path.join(process.env.USERPROFILE, 'AI_STACK', 'OpenSora')}" && python app.py`,
                logFile: 'opensora.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false
            },
            {
                name: 'tg-webui',
                port: 7862,
                command: `cd "${path.join(process.env.USERPROFILE, 'AI_STACK', 'tg-webui')}" && python webui.py --api`,
                logFile: 'tg-webui.log',
                process: null,
                pid: null,
                status: 'stopped',
                startTime: null,
                responseTime: null,
                alreadyRunning: false
            }
        ];

        this.logDir = path.join(process.cwd(), 'service_logs');
        this.voidConfig = path.join(process.cwd(), 'void_local.yaml');
        this.voidFound = false;
        this.voidProcess = null;
        this.voidPath = null;
        this.monitoringInterval = null;
        this.dashboardUpdateInterval = null;
        
        this.setupConsole();
    }

    setupConsole() {
        console.clear();
        console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                          AI SERVICES DASHBOARD v2.3                         ║');
        console.log('║                  Fixed Void AI Launch & Service Detection                   ║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    }

    async start() {
        // Create log directory
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }

        // Check for running services first
        await this.checkRunningServices();

        // Check for Void AI with advanced detection
        await this.checkVoidAI();

        // Start monitoring
        this.startMonitoring();

        // Start all services (only those not already running)
        await this.startAllServices();

        // Create Void AI config
        this.createVoidConfig();

        // Start dashboard updates
        this.startDashboardUpdates();

        // Show dashboard
        this.showDashboard();
    }

    async checkRunningServices() {
        console.log('🔍 Checking for already running services...');
        
        for (const service of this.services) {
            const isRunning = await this.checkServiceRunning(service);
            if (isRunning) {
                service.alreadyRunning = true;
                service.status = 'responding';
                console.log(`   ✅ ${service.name} is already running`);
            }
        }
    }

    async checkServiceRunning(service) {
        return new Promise((resolve) => {
            // First check if the port is responsive
            const req = http.request({
                hostname: 'localhost',
                port: service.port,
                path: '/',
                method: 'GET',
                timeout: 2000
            }, (res) => {
                resolve(true);
                req.destroy();
            });

            req.on('error', () => {
                // If port check fails, check if process is running by name
                this.checkProcessByName(service).then(resolve);
            });

            req.on('timeout', () => {
                req.destroy();
                this.checkProcessByName(service).then(resolve);
            });

            req.end();
        });
    }

    async checkProcessByName(service) {
        return new Promise((resolve) => {
            let processName = '';
            if (service.name === 'Nutch') processName = 'java.exe';
            else if (service.name === 'Ollama') processName = 'ollama.exe';
            else processName = 'python.exe';

            exec(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV`, (error, stdout) => {
                if (error || !stdout.includes(processName)) {
                    resolve(false);
                } else {
                    // Check if this specific service is likely running on the expected port
                    exec(`netstat -ano | findstr :${service.port}`, (error, netstatOutput) => {
                        resolve(netstatOutput.includes(service.port.toString()));
                    });
                }
            });
        });
    }

    async checkVoidAI() {
        console.log('🔍 Performing advanced Void AI detection...');
        
        const possiblePaths = [
            'void', // PATH
            'void.exe', // PATH with extension
            path.join(process.env.ProgramFiles, 'Void', 'bin', 'void.exe'),
            path.join(process.env.ProgramFiles, 'Void AI', 'bin', 'void.exe'),
            path.join(process.env.LOCALAPPDATA, 'Programs', 'void', 'void.exe'),
            path.join(process.env.LOCALAPPDATA, 'Programs', 'void-ai', 'void.exe'),
            path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Programs', 'void', 'void.exe'),
            path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Programs', 'void-ai', 'void.exe'),
            path.join(process.cwd(), 'void.exe'),
            path.join(process.cwd(), 'void')
        ];

        for (const voidPath of possiblePaths) {
            const found = await this.testVoidPath(voidPath);
            if (found) {
                this.voidFound = true;
                this.voidPath = voidPath;
                console.log(`✅ Void AI found at: ${voidPath}`);
                return;
            }
        }

        console.log('❌ Void AI not found in common locations');
        this.showVoidInstallationGuide();
    }

    async testVoidPath(voidPath) {
        return new Promise((resolve) => {
            // Use where command for PATH detection, direct execution for full paths
            const command = voidPath.includes(path.sep) ? 
                `"${voidPath}" --version` : 
                `where ${voidPath}`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    // For full paths, try direct execution even if version fails
                    if (voidPath.includes(path.sep)) {
                        // Check if file exists
                        fs.access(voidPath, fs.constants.F_OK, (err) => {
                            resolve(!err);
                        });
                    } else {
                        resolve(false);
                    }
                } else {
                    resolve(true);
                }
            });
        });
    }

    showVoidInstallationGuide() {
        console.log('\n📥 VOID AI INSTALLATION GUIDE:');
        console.log('═'.repeat(70));
        console.log('\n1. DOWNLOAD Void AI:');
        console.log('   Visit: https://github.com/void-ai/void/releases');
        console.log('   Download the latest Windows release');
        
        console.log('\n2. INSTALLATION OPTIONS:');
        console.log('   Option A: Install to default location (recommended)');
        console.log('   Option B: Extract to a folder and add to PATH');
        
        console.log('\n3. VERIFY INSTALLATION:');
        console.log('   Open Command Prompt and run: void --version');
        console.log('   If it shows version info, installation is successful');
        
        console.log('\n4. MANUAL LAUNCH (for now):');
        console.log('   After installing, you can run:');
        console.log('   void --config void_local.yaml');
        
        console.log('\n💡 Your AI services will still work without Void AI!');
        console.log('   Access them directly via their URLs below.');
        console.log('═'.repeat(70));
    }

    startMonitoring() {
        console.log('📊 Starting service monitoring...');
        
        // Monitor every 5 seconds
        this.monitoringInterval = setInterval(() => {
            this.monitorServices();
        }, 5000);

        // Initial monitoring
        setTimeout(() => this.monitorServices(), 2000);
    }

    async monitorServices() {
        // Check process status
        await this.checkProcessStatus();
        
        // Check service responsiveness
        await this.checkServiceResponsiveness();
    }

    async checkProcessStatus() {
        for (const service of this.services) {
            // Skip checking for services that were already running
            if (service.alreadyRunning) continue;

            if (service.process) {
                try {
                    // Check if process is still alive
                    process.kill(service.process.pid, 0);
                    // Only update status if it's not already responding
                    if (service.status !== 'responding') {
                        service.status = 'running';
                    }
                } catch (e) {
                    service.status = 'crashed';
                }
            }
        }
    }

    async checkServiceResponsiveness() {
        const promises = this.services.map(service => this.checkServiceResponse(service));
        await Promise.all(promises);
    }

    async checkServiceResponse(service) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const req = http.request({
                hostname: 'localhost',
                port: service.port,
                path: '/',
                method: 'GET',
                timeout: 5000  // Increased timeout for slower services
            }, (res) => {
                service.responseTime = Date.now() - startTime;
                service.status = 'responding';
                req.destroy();
                resolve();
            });

            req.on('error', () => {
                service.responseTime = null;
                if (service.status === 'running' || service.status === 'starting') {
                    service.status = 'starting';
                } else if (service.alreadyRunning) {
                    // If it was marked as already running but now not responding
                    service.status = 'unresponsive';
                }
                resolve();
            });

            req.on('timeout', () => {
                service.responseTime = null;
                if (service.status === 'running' || service.status === 'starting') {
                    service.status = 'starting';
                } else if (service.alreadyRunning) {
                    service.status = 'unresponsive';
                }
                req.destroy();
                resolve();
            });

            req.end();
        });
    }

    async startAllServices() {
        console.log('\n🚀 Starting AI Services...\n');

        const promises = this.services
            .filter(service => !service.alreadyRunning) // Only start services not already running
            .map(service => this.startService(service));
        
        await Promise.all(promises);

        const startedCount = this.services.filter(s => !s.alreadyRunning).length;
        const alreadyRunningCount = this.services.filter(s => s.alreadyRunning).length;
        
        console.log(`\n✅ ${startedCount} services launched, ${alreadyRunningCount} already running!`);
        console.log('   Some services may take 30-60 seconds to fully start...\n');
    }

    async startService(service) {
        // Skip if already running
        if (service.alreadyRunning) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const logStream = fs.createWriteStream(path.join(this.logDir, service.logFile), { flags: 'a' });
            
            console.log(`   🚀 Starting ${service.name} on port ${service.port}...`);

            service.startTime = new Date();
            service.status = 'starting';

            // Use cmd.exe to handle directory changes and complex commands
            service.process = spawn('cmd.exe', ['/c', service.command], {
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: true
            });

            service.pid = service.process.pid;

            service.process.stdout.on('data', (data) => {
                const timestamp = new Date().toLocaleTimeString();
                logStream.write(`[${timestamp} STDOUT] ${data}`);
                
                // Check for common success patterns in logs
                const output = data.toString().toLowerCase();
                if (output.includes('started') || output.includes('ready') || output.includes('listening') || output.includes('running')) {
                    service.status = 'running';
                }
                
                // Check for error patterns
                if (output.includes('error') || output.includes('failed') || output.includes('exception')) {
                    console.log(`   ⚠️  ${service.name} reported an error in logs`);
                }
            });

            service.process.stderr.on('data', (data) => {
                const timestamp = new Date().toLocaleTimeString();
                logStream.write(`[${timestamp} STDERR] ${data}`);
                
                // Check if this is a fatal error
                const errorOutput = data.toString().toLowerCase();
                if (errorOutput.includes('error') || errorOutput.includes('failed to start') || errorOutput.includes('cannot start')) {
                    service.status = 'failed';
                    console.log(`   ❌ ${service.name} failed: ${data.toString().trim()}`);
                }
            });

            service.process.on('error', (error) => {
                console.log(`   ❌ ${service.name} failed to start: ${error.message}`);
                logStream.write(`[ERROR] ${error.message}\n`);
                service.status = 'failed';
            });

            service.process.on('exit', (code) => {
                service.status = code === 0 ? 'stopped' : 'crashed';
                logStream.write(`[EXIT] Process exited with code ${code}\n`);
                if (code !== 0) {
                    console.log(`   💥 ${service.name} crashed with exit code ${code}`);
                }
            });

            service.process.on('spawn', () => {
                console.log(`   ✅ ${service.name} process started (PID: ${service.pid})`);
                service.status = 'starting';
                resolve();
            });

            // Unref to allow main process to exit independently
            service.process.unref();
        });
    }

    createVoidConfig() {
        const yaml = `local_services:
  nutch: http://localhost:8899
  ollama: http://localhost:11434
  melotts: http://localhost:9880
  openmanus: http://localhost:7860
  opensora: http://localhost:7861
  tg_webui: http://localhost:7862
`;

        fs.writeFileSync(this.voidConfig, yaml);
        console.log('📁 Void AI configuration created: void_local.yaml');
    }

    launchVoidAI() {
        if (!this.voidFound) {
            console.log('\n❌ Void AI is not installed.');
            console.log('   Press [I] for installation instructions');
            return;
        }

        console.log(`\n🎯 Launching Void AI...`);
        
        try {
            // Use the correct spawn method based on the path type
            if (this.voidPath.includes(path.sep)) {
                // Full path - spawn directly
                this.voidProcess = spawn(this.voidPath, ['--config', this.voidConfig], {
                    stdio: 'inherit',
                    detached: false
                });
            } else {
                // Command in PATH - use shell
                this.voidProcess = spawn(this.voidPath, ['--config', this.voidConfig], {
                    shell: true,
                    stdio: 'inherit',
                    detached: false
                });
            }

            this.voidProcess.on('error', (error) => {
                console.log(`❌ Failed to launch Void AI: ${error.message}`);
                console.log('   Try running manually: void --config void_local.yaml');
                this.voidProcess = null;
            });

            this.voidProcess.on('exit', (code) => {
                if (code !== 0) {
                    console.log(`❌ Void AI exited with error code ${code}`);
                    console.log('   Try running manually: void --config void_local.yaml');
                } else {
                    console.log('✅ Void AI closed normally');
                }
                this.voidProcess = null;
            });

            console.log('✅ Void AI launch command sent!');
        } catch (error) {
            console.log(`❌ Error launching Void AI: ${error.message}`);
            console.log('   Try running manually: void --config void_local.yaml');
        }
    }

    startDashboardUpdates() {
        // Update dashboard every 3 seconds
        this.dashboardUpdateInterval = setInterval(() => {
            this.updateDashboard();
        }, 3000);
    }

    updateDashboard() {
        // Clear previous dashboard (20 lines)
        process.stdout.write('\x1B[20A\x1B[0J');
        
        console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
        console.log('║                         REAL-TIME SERVICE MONITOR                           ║');
        console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
        console.log('║ Service           Port     Status         Response Time    Last Check       ║');
        console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
        
        this.services.forEach(service => {
            const statusIcon = this.getStatusIcon(service.status);
            const responseTime = service.responseTime ? `${service.responseTime}ms` : '---';
            const statusDisplay = this.getStatusDisplay(service.status, service.alreadyRunning);
            console.log(`║ ${service.name.padEnd(15)} ${service.port.toString().padEnd(8)} ${statusIcon} ${statusDisplay.padEnd(12)} ${responseTime.padEnd(15)} ${new Date().toLocaleTimeString().padEnd(12)} ║`);
        });

        console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
        const voidStatus = this.voidProcess ? '🟢 RUNNING' : (this.voidFound ? '⚪ READY' : '🔴 NOT INSTALLED');
        console.log(`║ Void AI Status: ${voidStatus}${' '.repeat(55)}║`);
        console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
        
        if (this.voidFound) {
            console.log('║ [V] Launch Void AI  [R] Restart Services  [L] View Logs  [T] Test All    ║');
        } else {
            console.log('║ [I] Install Guide    [R] Restart Services  [L] View Logs  [T] Test All    ║');
        }
        console.log('║ [S] Detailed Status  [1-6] Restart Individual  [Q] Quit & Shutdown         ║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    }

    getStatusIcon(status) {
        const icons = {
            'running': '🟢',
            'responding': '✅',
            'starting': '🟡',
            'slow': '🟠',
            'stopped': '⚪',
            'crashed': '🔴',
            'failed': '❌',
            'unresponsive': '🟠'
        };
        return icons[status] || '❓';
    }

    getStatusDisplay(status, alreadyRunning) {
        if (alreadyRunning && status === 'responding') {
            return 'EXTERNAL';
        }
        
        const displays = {
            'running': 'RUNNING',
            'responding': 'HEALTHY',
            'starting': 'STARTING',
            'slow': 'SLOW',
            'stopped': 'STOPPED',
            'crashed': 'CRASHED',
            'failed': 'FAILED',
            'unresponsive': 'NO RESPONSE'
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
                    case 'q':
                        console.log('\n🛑 Shutting down all services...');
                        this.shutdown();
                        break;
                    case 's':
                        this.showDetailedStatus();
                        break;
                    case 'l':
                        this.showLogMenu();
                        break;
                    case 'v':
                        if (this.voidFound) {
                            this.launchVoidAI();
                        }
                        break;
                    case 'i':
                        this.showVoidInstallationGuide();
                        console.log('\nPress any key to return to dashboard...');
                        process.stdin.once('keypress', () => this.showDashboard());
                        break;
                    case 'r':
                        this.showRestartMenu();
                        break;
                    case 't':
                        this.runComprehensiveTests();
                        break;
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

    // ... rest of the methods (showDetailedStatus, showRestartMenu, etc.) remain the same
    // They're omitted for brevity but should be included in the full file

    shutdown() {
        console.log('\n🛑 Shutting down monitoring and services...');
        
        // Stop intervals
        if (this.monitoringInterval) clearInterval(this.monitoringInterval);
        if (this.dashboardUpdateInterval) clearInterval(this.dashboardUpdateInterval);
        
        // Kill Void AI
        if (this.voidProcess) {
            try {
                this.voidProcess.kill();
            } catch (e) {
                // Ignore
            }
        }
        
        // Only kill services that we started (not external ones)
        this.services.forEach(service => {
            if (service.process && !service.alreadyRunning) {
                try {
                    process.kill(-service.process.pid);
                } catch (e) {
                    // Process might already be dead
                }
            }
        });

        console.log('✅ Dashboard services stopped. External services may still be running.');
        console.log('   Goodbye! 👋');
        process.exit(0);
    }
}

// Handle CTRL+C gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Received shutdown signal...');
    new AIDashboard().shutdown();
});

// Start the dashboard
new AIDashboard().start().catch(console.error);