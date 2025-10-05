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
        console.log('🔧 Running enhanced diagnostics...');
        
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
                            console.log(`   ❌ ${check.name}: Not found in PATH`);
                            if (check.name === 'Streamlit') {
                                console.log(`   💡 Install with: pip install streamlit`);
                            }
                            reject(error);
                        } else {
                            console.log(`   ✅ ${check.name}: Installed`);
                            resolve();
                        }
                    });
                });
            } catch (error) {
                // Error already logged
            }
        }

        // Check project directories and main files
        console.log('\n📁 Checking project files:');
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
                        console.log(`   ✅ ${service.name}: Main file exists`);
                    } else {
                        console.log(`   ❌ ${service.name}: Main file issue - ${service.args.join(' ')}`);
                        console.log(`   💡 Check if the project is properly downloaded/cloned`);
                        
                        // Try to find alternative main files for Python services
                        if (service.type === 'python' || service.type === 'streamlit') {
                            this.findAlternativeMainFiles(service);
                        }
                    }
                } else {
                    console.log(`   ❌ ${service.name}: MISSING DIRECTORY - ${service.workingDir}`);
                }
            }
        }
    }

    findAlternativeMainFiles(service) {
        const alternatives = ['main.py', 'server.py', 'run.py', 'start.py', 'application.py', 'app.py'];
        console.log(`   🔍 ${service.name}: Looking for alternative main files...`);
        
        let found = false;
        for (const alt of alternatives) {
            const altPath = path.join(service.workingDir, alt);
            if (fs.existsSync(altPath)) {
                console.log(`   💡 Found: ${alt} - service will use this file`);
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
                    console.log(`   📄 Available Python files: ${pyFiles.join(', ')}`);
                    // Use the first Python file found
                    if (service.type === 'streamlit') {
                        service.args = ['run', pyFiles[0], '--server.port', service.port.toString(), '--server.address', '0.0.0.0'];
                    } else {
                        service.args = [pyFiles[0]];
                    }
                    console.log(`   💡 Using: ${pyFiles[0]}`);
                } else {
                    console.log(`   ❌ No Python files found in directory`);
                }
            } catch (e) {
                console.log(`   ❌ Cannot read directory`);
            }
        }
    }

    async checkRunningServices() {
        console.log('\n🔍 Checking for already running services...');
        
        for (const service of this.services) {
            const isRunning = await this.checkServiceRunning(service);
            if (isRunning) {
                service.alreadyRunning = true;
                service.status = 'responding';
                console.log(`   ✅ ${service.name} is already running`);
            }
        }

        await this.checkVoidAIRunning();
    }

    async checkVoidAIRunning() {
        return new Promise((resolve) => {
            exec('tasklist /FI "IMAGENAME eq void.exe" /FO CSV', (error, stdout) => {
                if (!error && stdout.includes('void.exe')) {
                    this.voidAlreadyRunning = true;
                    console.log('   ✅ Void AI is already running');
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
        console.log('🔍 Checking for Void AI...');
        
        const possiblePaths = [
            'void', 'void.exe',
            path.join(process.env.ProgramFiles, 'Void', 'bin', 'void.exe'),
            path.join(process.env.ProgramFiles, 'Void AI', 'bin', 'void.exe'),
            path.join(process.env.LOCALAPPDATA, 'Programs', 'void', 'void.exe'),
            path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Programs', 'void', 'void.exe'),
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

        console.log('❌ Void AI not found');
    }

    async testVoidPath(voidPath) {
        return new Promise((resolve) => {
            const command = voidPath.includes(path.sep) ? 
                `"${voidPath}" --version` : `where ${voidPath}`;

            exec(command, (error) => {
                if (error) {
                    if (voidPath.includes(path.sep)) {
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

    startMonitoring() {
        console.log('\n📊 Starting service monitoring (10 second intervals)...');
        this.monitoringInterval = setInterval(() => {
            this.monitorServices();
        }, 10000);
    }

    async monitorServices() {
        await this.checkServiceResponsiveness();
    }

    async checkServiceResponsiveness() {
        const promises = this.services.map(service => this.checkServiceResponse(service));
        await Promise.all(promises);
    }

    async checkServiceResponse(service) {
        return new Promise((resolve) => {
            if (service.status === 'stopped' || service.status === 'failed') {
                resolve();
                return;
            }

            const startTime = Date.now();
            const req = http.request({
                hostname: 'localhost',
                port: service.port,
                path: '/',
                method: 'GET',
                timeout: 5000
            }, (res) => {
                service.responseTime = Date.now() - startTime;
                service.status = 'responding';
                req.destroy();
                resolve();
            });

            req.on('error', () => {
                service.responseTime = null;
                if (service.alreadyRunning) {
                    service.status = 'unresponsive';
                } else if (service.status === 'running' || service.status === 'starting') {
                    service.status = 'starting';
                }
                resolve();
            });

            req.on('timeout', () => {
                service.responseTime = null;
                if (service.alreadyRunning) {
                    service.status = 'unresponsive';
                } else if (service.status === 'running' || service.status === 'starting') {
                    service.status = 'starting';
                }
                req.destroy();
                resolve();
            });

            req.end();
        });
    }

    async startAllServices() {
        console.log('\n🚀 Starting AI Services...\n');

        const servicesToStart = this.services.filter(service => !service.alreadyRunning);
        
        if (servicesToStart.length === 0) {
            console.log('✅ All services are already running!');
            return;
        }

        // Start services sequentially
        for (const service of servicesToStart) {
            await this.startService(service);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Longer delay for streamlit
        }

        console.log(`\n✅ ${servicesToStart.length} services launched!`);
    }

    async startService(service) {
        return new Promise((resolve) => {
            const logStream = fs.createWriteStream(path.join(this.logDir, service.logFile), { flags: 'a' });
            
            console.log(`\n   🚀 Starting ${service.name}...`);

            service.startTime = new Date();
            service.status = 'starting';

            // Verify working directory exists
            if (!fs.existsSync(service.workingDir)) {
                console.log(`   ❌ ${service.name}: Working directory not found: ${service.workingDir}`);
                service.status = 'failed';
                resolve();
                return;
            }

            // Verify main file exists for Python/Streamlit services
            if (service.type === 'python' || service.type === 'streamlit') {
                let mainFile;
                if (service.type === 'streamlit') {
                    const runIndex = service.args.indexOf('run');
                    mainFile = runIndex !== -1 && service.args[runIndex + 1] ? 
                        path.join(service.workingDir, service.args[runIndex + 1]) :
                        null;
                } else {
                    mainFile = service.args.length > 0 ? 
                        path.join(service.workingDir, service.args[0]) :
                        null;
                }
                
                if (!mainFile || !fs.existsSync(mainFile)) {
                    console.log(`   ❌ ${service.name}: Main file not found: ${service.args.join(' ')}`);
                    console.log(`   💡 Check if the project is properly downloaded`);
                    service.status = 'failed';
                    resolve();
                    return;
                }
            }

            try {
                console.log(`   📁 Directory: ${service.workingDir}`);
                console.log(`   ⚡ Command: ${service.command} ${service.args.join(' ')}`);

                service.process = spawn(service.command, service.args, {
                    cwd: service.workingDir,
                    stdio: ['ignore', 'pipe', 'pipe'],
                    shell: false,
                    detached: true
                });

                service.pid = service.process.pid;

                let hasOutput = false;
                let hasStarted = false;

                service.process.stdout.on('data', (data) => {
                    hasOutput = true;
                    const output = data.toString();
                    logStream.write(`[STDOUT] ${output}`);
                    
                    // Better detection of service readiness
                    if (output.toLowerCase().includes('started') || 
                        output.toLowerCase().includes('ready') || 
                        output.toLowerCase().includes('listening') ||
                        output.toLowerCase().includes('running on') ||
                        output.includes('http://') ||
                        output.includes('port') ||
                        output.includes('You can now view your Streamlit app') ||
                        output.includes('Network URL:')) {
                        if (!hasStarted) {
                            service.status = 'running';
                            console.log(`   ✅ ${service.name}: Service reported ready`);
                            hasStarted = true;
                        }
                    }
                    
                    // Show informative output for streamlit
                    if (service.type === 'streamlit' && output.includes('Network URL:')) {
                        console.log(`   🌐 ${service.name}: ${output.trim()}`);
                    }
                });

                service.process.stderr.on('data', (data) => {
                    hasOutput = true;
                    const errorMsg = data.toString();
                    logStream.write(`[STDERR] ${errorMsg}`);
                    
                    // Don't treat streamlit warnings as errors
                    if ((service.name === 'OpenManus' || service.name === 'OpenSora') && 
                        (errorMsg.includes('Thread') || errorMsg.includes('ScriptRunContext'))) {
                        console.log(`   ⚠️  ${service.name}: Streamlit warning (normal)`);
                    } else {
                        this.analyzeServiceError(service, errorMsg);
                    }
                });

                service.process.on('error', (error) => {
                    console.log(`   ❌ ${service.name}: Spawn error - ${error.message}`);
                    logStream.write(`[SPAWN ERROR] ${error.message}\n`);
                    service.status = 'failed';
                    this.provideServiceGuidance(service);
                });

                service.process.on('exit', (code, signal) => {
                    if (!hasOutput) {
                        console.log(`   ❌ ${service.name}: No output - command may not exist`);
                    }
                    
                    if (code !== 0 && !hasStarted) {
                        service.status = 'crashed';
                        console.log(`   💥 ${service.name}: Crashed with code ${code}`);
                        logStream.write(`[CRASH] Exit code: ${code}, Signal: ${signal}\n`);
                        this.provideServiceGuidance(service);
                    } else if (hasStarted) {
                        // Service was running but exited
                        service.status = 'stopped';
                        console.log(`   ⚠️  ${service.name}: Service stopped`);
                        logStream.write(`[STOPPED] Exit code: ${code}\n`);
                    } else {
                        service.status = 'stopped';
                        logStream.write(`[STOPPED] Normal exit\n`);
                    }
                });

                service.process.on('spawn', () => {
                    console.log(`   ⚡ ${service.name}: Process started (PID: ${service.pid})`);
                    // Set longer timeout for streamlit services
                    const timeout = service.type === 'streamlit' ? 10000 : 5000;
                    setTimeout(() => {
                        if (service.status === 'starting' && !hasOutput) {
                            console.log(`   ❌ ${service.name}: No output after ${timeout/1000}s - command may be failing`);
                            service.status = 'failed';
                        }
                    }, timeout);
                });

                service.process.unref();
                resolve();

            } catch (error) {
                console.log(`   💥 ${service.name}: Unexpected error - ${error.message}`);
                service.status = 'failed';
                resolve();
            }
        });
    }

    analyzeServiceError(service, errorMsg) {
        const msg = errorMsg.toLowerCase();
        console.log(`   ❌ ${service.name}: ${errorMsg.trim()}`);

        if (msg.includes('modulenotfounderror') || msg.includes('no module named')) {
            const moduleMatch = errorMsg.match(/No module named '([^']+)'/);
            if (moduleMatch) {
                console.log(`   💡 Install missing module: pip install ${moduleMatch[1]}`);
                console.log(`   💡 Or install all dependencies: pip install -r requirements.txt`);
            } else {
                console.log(`   💡 Missing Python dependencies. Run: pip install -r requirements.txt`);
            }
        } else if (msg.includes('streamlit') && msg.includes('not found')) {
            console.log(`   💡 Streamlit not installed. Run: pip install streamlit`);
        } else if (msg.includes('attempted relative import with no known parent package')) {
            console.log(`   💡 Relative import issue. Try running as module or check file structure`);
        } else if (msg.includes('address already in use')) {
            console.log(`   💡 Port ${service.port} is busy. Kill process or change port`);
        } else if (msg.includes('file not found') || msg.includes('cannot find the path') || msg.includes('no such file')) {
            console.log(`   💡 File not found: ${service.args.join(' ')}`);
            console.log(`   💡 Check if the project is properly downloaded`);
        } else if (msg.includes('python') && msg.includes('not found')) {
            console.log(`   💡 Python not installed or not in PATH`);
        } else if (msg.includes('java') && msg.includes('not found')) {
            console.log(`   💡 Java not installed or not in PATH`);
        } else if (msg.includes('error') || msg.includes('exception')) {
            console.log(`   📖 Check ${service.logFile} for detailed error`);
        }
    }

    provideServiceGuidance(service) {
        console.log(`\n   🔧 ${service.name} TROUBLESHOOTING:`);
        
        switch(service.name) {
            case 'Nutch':
                console.log(`   • Service is actually running despite warnings`);
                console.log(`   • Check status: http://localhost:${service.port}`);
                break;
            case 'MeloTTS':
                console.log(`   • Using test_melotts.py which should work`);
                console.log(`   • Install dependencies: pip install -r requirements.txt`);
                console.log(`   • Run manually: cd "${service.workingDir}" && python test_melotts.py`);
                break;
            case 'OpenManus':
            case 'OpenSora':
                console.log(`   • Now using streamlit run command`);
                console.log(`   • Install streamlit: pip install streamlit`);
                console.log(`   • Install dependencies: pip install -r requirements.txt`);
                console.log(`   • Run manually: cd "${service.workingDir}" && streamlit run ${service.args[1]} --server.port ${service.port}`);
                break;
            case 'tg-webui':
                console.log(`   • Using server.py with --api flag`);
                console.log(`   • Install dependencies: pip install -r requirements.txt`);
                console.log(`   • Run manually: cd "${service.workingDir}" && python server.py --api`);
                break;
        }
        
        console.log(`   • View full logs: Press [L] then choose ${service.name}`);
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
        console.log('📁 Void AI configuration created');
    }

    startDashboardUpdates() {
        this.dashboardUpdateInterval = setInterval(() => {
            this.updateDashboard();
        }, 3000);
    }

    updateDashboard() {
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
        
        let voidStatus = '🔴 NOT INSTALLED';
        if (this.voidFound) {
            if (this.voidAlreadyRunning) {
                voidStatus = '🟢 EXTERNAL';
            } else if (this.voidProcess) {
                voidStatus = '🟢 RUNNING';
            } else {
                voidStatus = '⚪ READY';
            }
        }
        
        console.log(`║ Void AI Status: ${voidStatus}${' '.repeat(55)}║`);
        console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
        console.log('║ [V] Launch Void AI  [R] Restart Services  [L] View Logs  [D] Diagnostics    ║');
        console.log('║ [S] Detailed Status  [1-6] Restart Individual  [Q] Quit & Shutdown         ║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    }

    getStatusIcon(status) {
        const icons = {
            'running': '🟢', 'responding': '✅', 'starting': '🟡', 'slow': '🟠',
            'stopped': '⚪', 'crashed': '🔴', 'failed': '❌', 'unresponsive': '🟠'
        };
        return icons[status] || '❓';
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
        
        console.log('\n\n📊 DETAILED SERVICE STATUS');
        console.log('═'.repeat(70));
        
        this.services.forEach(service => {
            const uptime = service.startTime ? 
                Math.round((Date.now() - service.startTime) / 1000) + 's' : 'N/A';
            
            console.log(`\n${this.getStatusIcon(service.status)} ${service.name}:`);
            console.log(`   Status: ${service.status}`);
            console.log(`   Port: ${service.port} | PID: ${service.pid || 'N/A'} | Uptime: ${uptime}`);
            console.log(`   Directory: ${service.workingDir}`);
            console.log(`   Command: ${service.command} ${service.args.join(' ')}`);
            
            if (service.status === 'crashed' || service.status === 'failed') {
                console.log(`   💡 Test manually: cd "${service.workingDir}" && ${service.command} ${service.args.join(' ')}`);
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
        
        console.log('\n\n📋 SERVICE LOGS');
        console.log('═'.repeat(60));
        this.services.forEach((service, index) => {
            const statusIcon = this.getStatusIcon(service.status);
            console.log(`  ${index + 1}. ${statusIcon} ${service.name}`);
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
            console.log(`\n📄 ${service.name} LOG - Last 20 lines`);
            console.log('═'.repeat(80));
            
            const logContent = fs.readFileSync(logPath, 'utf8');
            const lines = logContent.split('\n').slice(-20);
            
            if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
                console.log('   (Log file is empty - service crashed immediately)');
            } else {
                lines.forEach(line => {
                    if (line.trim()) {
                        if (line.toLowerCase().includes('error')) console.log(`🔴 ${line}`);
                        else if (line.toLowerCase().includes('warn')) console.log(`🟡 ${line}`);
                        else if (line.toLowerCase().includes('start') || line.toLowerCase().includes('ready')) console.log(`🟢 ${line}`);
                        else console.log(`   ${line}`);
                    }
                });
            }
            
            console.log('═'.repeat(80));
        } else {
            console.log(`\n❌ No log file found for ${service.name}`);
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
        
        console.log('\n\n🔄 RESTART SERVICES');
        console.log('═'.repeat(60));
        this.services.forEach((service, index) => {
            const statusIcon = this.getStatusIcon(service.status);
            console.log(`  ${index + 1}. ${statusIcon} ${service.name} (${service.status})`);
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
        console.log(`\n🔄 Restarting ${service.name}...`);
        
        if (service.process) {
            try {
                process.kill(service.process.pid);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {}
        }
        
        await this.startService(service);
    }

    async restartAllServices() {
        console.log('\n🔄 Restarting ALL services...');
        
        for (const service of this.services) {
            if (service.alreadyRunning) continue;
            await this.restartService(service);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    launchVoidAI() {
        if (!this.voidFound) {
            console.log('\n❌ Void AI is not installed.');
            return;
        }

        if (this.voidAlreadyRunning) {
            console.log('\n✅ Void AI is already running!');
            return;
        }

        console.log(`\n🎯 Launching Void AI...`);
        
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
                console.log(`❌ Failed to launch Void AI: ${error.message}`);
            });

            console.log('✅ Void AI launched!');
            
        } catch (error) {
            console.log(`❌ Error launching Void AI: ${error.message}`);
        }
    }

    runComprehensiveDiagnostics() {
        console.log('\n🔧 COMPREHENSIVE DIAGNOSTICS');
        console.log('═'.repeat(70));
        
        console.log('\n📋 CURRENT SERVICE STATUS:');
        this.services.forEach(service => {
            console.log(`   ${this.getStatusIcon(service.status)} ${service.name}: ${service.status}`);
        });

        console.log('\n💡 QUICK FIXES:');
        console.log('1. For Python services, install dependencies: pip install -r requirements.txt');
        console.log('2. Check individual logs for specific error messages');
        console.log('3. Try running services manually to see exact errors');
        
        console.log('\nPress any key to continue...');
        process.stdin.once('keypress', () => this.showDashboard());
    }

    shutdown() {
        console.log('\n🛑 Shutting down...');
        clearInterval(this.monitoringInterval);
        clearInterval(this.dashboardUpdateInterval);
        
        if (this.voidProcess && !this.voidAlreadyRunning) {
            try { this.voidProcess.kill(); }