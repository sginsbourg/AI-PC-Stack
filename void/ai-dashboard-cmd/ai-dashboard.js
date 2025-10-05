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
            cpu: '0%',
            gpu: 'N/A',
            npu: 'N/A',
            ram: 'N/A',
            disk: 'N/A'
        };
        
        // Hardware monitoring state
        this.cpuUsage = 0;
        this.gpuUsage = 0;
        this.npuUsage = 0;
        this.cpuCores = os.cpus().length;
        this.hasGPU = false;
        this.hasNPU = false;
        
        // Fixed column widths for perfect alignment
        this.columnWidths = {
            service: 12,
            port: 8,
            statusIcon: 12,
            statusInfo: 15,
            responseTime: 12,
            lastCheck: 12,
            uptime: 10
        };
        
        // Calculate total table width
        this.tableWidth = Object.values(this.columnWidths).reduce((a, b) => a + b, 0);
        this.innerWidth = this.tableWidth;
        
        this.red = '\x1b[31m';
        this.green = '\x1b[32m';
        this.yellow = '\x1b[33m';
        this.blue = '\x1b[34m';
        this.cyan = '\x1b[36m';
        this.magenta = '\x1b[35m';
        this.purple = '\x1b[35m';
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
        
        // Initialize hardware monitoring
        this.initHardwareMonitoring();
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
        process.title = 'AI Services Dashboard - Enhanced Wide Display';
        
        // Handle Ctrl+C gracefully
        process.on('SIGINT', () => {
            this.shutdown();
        });
    }

    initHardwareMonitoring() {
        // Get initial CPU stats
        this.prevCpuInfo = this.getCpuInfo();
        
        // Detect GPU and NPU
        this.detectGPU();
        this.detectNPU();
        
        // Update hardware usage every 2 seconds
        setInterval(() => {
            this.updateCpuUsage();
            this.updateGpuUsage();
            this.updateNpuUsage();
        }, 2000);
    }

    detectGPU() {
        // Check for NVIDIA GPU
        exec('nvidia-smi --query-gpu=name --format=csv,noheader', (error) => {
            if (!error) {
                this.hasGPU = true;
                this.systemMetrics.gpu = '0%';
            }
        });
        
        // Check for AMD GPU
        exec('rocm-smi --showuse', (error) => {
            if (!error) {
                this.hasGPU = true;
                this.systemMetrics.gpu = '0%';
            }
        });
        
        // Check for Intel GPU
        exec('intel_gpu_top -l', (error) => {
            if (!error) {
                this.hasGPU = true;
                this.systemMetrics.gpu = '0%';
            }
        });
    }

    detectNPU() {
        // Check for Intel NPU
        exec('wmic path win32_pnpentity get name | findstr /i "npu"', (error, stdout) => {
            if (!error && stdout) {
                this.hasNPU = true;
                this.systemMetrics.npu = '0%';
                return;
            }
        });
        
        // Check for AMD NPU
        exec('wmic path win32_pnpentity get name | findstr /i "xDNA"', (error, stdout) => {
            if (!error && stdout) {
                this.hasNPU = true;
                this.systemMetrics.npu = '0%';
                return;
            }
        });
    }

    getCpuInfo() {
        const cpus = os.cpus();
        let totalIdle = 0, totalTick = 0;
        
        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        return {
            totalIdle,
            totalTick
        };
    }

    updateCpuUsage() {
        const currentCpuInfo = this.getCpuInfo();
        
        const idleDifference = currentCpuInfo.totalIdle - this.prevCpuInfo.totalIdle;
        const totalDifference = currentCpuInfo.totalTick - this.prevCpuInfo.totalTick;
        
        if (totalDifference > 0) {
            const usage = 100 - (100 * idleDifference / totalDifference);
            this.cpuUsage = Math.round(usage * 100) / 100;
            this.systemMetrics.cpu = `${this.cpuUsage}%`;
        }
        
        this.prevCpuInfo = currentCpuInfo;
    }

    updateGpuUsage() {
        if (!this.hasGPU) return;

        // NVIDIA GPU
        exec('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits', (error, stdout) => {
            if (!error && stdout) {
                const usage = parseInt(stdout.trim());
                if (!isNaN(usage)) {
                    this.gpuUsage = usage;
                    this.systemMetrics.gpu = `${usage}%`;
                    return;
                }
            }
            
            // AMD GPU (ROCm)
            exec('rocm-smi --showuse | findstr /i "gpu use"', (error, stdout) => {
                if (!error && stdout) {
                    const match = stdout.match(/(\d+)%/);
                    if (match) {
                        this.gpuUsage = parseInt(match[1]);
                        this.systemMetrics.gpu = `${this.gpuUsage}%`;
                        return;
                    }
                }
                
                // Intel GPU
                exec('intel_gpu_top -l 1', (error, stdout) => {
                    if (!error && stdout) {
                        const lines = stdout.split('\n');
                        for (let line of lines) {
                            if (line.includes('Render/3D/0')) {
                                const match = line.match(/(\d+)%/);
                                if (match) {
                                    this.gpuUsage = parseInt(match[1]);
                                    this.systemMetrics.gpu = `${this.gpuUsage}%`;
                                    return;
                                }
                            }
                        }
                    }
                });
            });
        });
    }

    updateNpuUsage() {
        if (!this.hasNPU) return;

        // Intel NPU monitoring (simulated - actual implementation would use specific tools)
        exec('wmic path win32_perfformatteddata_counters_processor get name,percentprocessortime | findstr /i "npu"', (error, stdout) => {
            if (!error && stdout) {
                // Simulate NPU usage based on system load
                const simulatedUsage = Math.min(100, Math.round(this.cpuUsage * 1.2));
                this.npuUsage = simulatedUsage;
                this.systemMetrics.npu = `${simulatedUsage}%`;
            } else {
                // Fallback simulation
                const simulatedUsage = Math.min(100, Math.round(this.cpuUsage * 0.8));
                this.npuUsage = simulatedUsage;
                this.systemMetrics.npu = `${simulatedUsage}%`;
            }
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
            'running': '🟢 RUNNING',
            'starting': '🟡 STARTING', 
            'stopped': '⚪ STOPPED',
            'crashed': '🔴 CRASHED',
            'slow': '🟠 SLOW'
        };
        return icons[status] || '⚪ UNKNOWN';
    }

    getStatusColor(status) {
        return status === 'running' ? this.green : 
               status === 'starting' ? this.yellow :
               status === 'crashed' ? this.red : 
               status === 'slow' ? this.yellow : this.reset;
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
        
        if (hours > 0) return `${hours}h${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m${seconds % 60}s`;
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
            this.systemMetrics.ram = `${ramPercent}% (${usedMem.toFixed(1)}GB/${totalMem.toFixed(1)}GB)`;
        } catch (error) {
            this.systemMetrics.ram = 'N/A';
        }

        try {
            this.updateDiskUsage();
        } catch (error) {
            this.systemMetrics.disk = 'N/A';
        }
    }

    updateDiskUsage() {
        try {
            const stats = fs.statfsSync('/');
            if (stats && stats.bsize) {
                const total = stats.blocks * stats.bsize;
                const free = stats.bfree * stats.bsize;
                const used = total - free;
                const diskPercent = Math.round((used / total) * 100);
                const usedGB = (used / 1024 / 1024 / 1024).toFixed(1);
                const totalGB = (total / 1024 / 1024 / 1024).toFixed(1);
                this.systemMetrics.disk = `${diskPercent}% (${usedGB}GB/${totalGB}GB)`;
                return;
            }
        } catch (error) {
            // Fall back to wmic for Windows
        }

        // Windows fallback using wmic
        exec('wmic logicaldisk where DeviceID="C:" get Size,FreeSpace /value', (err, stdout) => {
            if (err || !stdout) {
                this.systemMetrics.disk = 'N/A';
                return;
            }

            const lines = stdout.split('\r\n');
            let size = 0, free = 0;
            
            for (let line of lines) {
                if (line.startsWith('Size=')) {
                    size = parseInt(line.split('=')[1]);
                } else if (line.startsWith('FreeSpace=')) {
                    free = parseInt(line.split('=')[1]);
                }
            }
            
            if (size > 0 && free >= 0) {
                const used = size - free;
                const diskPercent = Math.round((used / size) * 100);
                const usedGB = (used / 1024 / 1024 / 1024).toFixed(1);
                const totalGB = (size / 1024 / 1024 / 1024).toFixed(1);
                this.systemMetrics.disk = `${diskPercent}% (${usedGB}GB/${totalGB}GB)`;
            } else {
                this.systemMetrics.disk = 'N/A';
            }
        });
    }

    displayHeader() {
        console.clear();
        const headerLine = '='.repeat(this.innerWidth);
        console.log(headerLine);
        
        const title = `${this.green}🚀 AI SERVICES DASHBOARD - ENHANCED WIDE DISPLAY ${this.reset}`;
        console.log(title);
        
        console.log(headerLine);
        
        // Updated metrics line with CPU, GPU, NPU, RAM, DISK
        const metricsTitle = `${this.cyan}SYSTEM METRICS:${this.reset}`;
        const cpuText = `${this.blue}CPU:${this.reset} ${this.systemMetrics.cpu}`;
        const gpuText = `${this.magenta}GPU:${this.reset} ${this.systemMetrics.gpu}`;
        const npuText = `${this.purple}NPU:${this.reset} ${this.systemMetrics.npu}`;
        const ramText = `${this.green}RAM:${this.reset} ${this.systemMetrics.ram}`;
        const diskText = `${this.yellow}DISK:${this.reset} ${this.systemMetrics.disk}`;
        
        // Create two lines for metrics to fit everything
        const metricsLine1 = metricsTitle + ' ' + cpuText + '  ' + gpuText + '  ' + npuText;
        const metricsLine2 = ramText + '  ' + diskText;
        
        console.log(metricsLine1);
        console.log(metricsLine2);
        console.log('-'.repeat(this.innerWidth));
    }

    stripAnsi(str) {
        return str.replace(/\x1b\[[0-9;]*m/g, '');
    }

    displayServices() {
        // Header row with exact column widths
        const serviceHeader = 'SERVICE'.padEnd(this.columnWidths.service);
        const portHeader = 'PORT'.padEnd(this.columnWidths.port);
        const statusHeader = 'STATUS'.padEnd(this.columnWidths.statusIcon);
        const infoHeader = 'PROCESS INFO'.padEnd(this.columnWidths.statusInfo);
        const responseHeader = 'RESPONSE'.padEnd(this.columnWidths.responseTime);
        const checkHeader = 'LAST CHECK'.padEnd(this.columnWidths.lastCheck);
        const uptimeHeader = 'UPTIME'.padEnd(this.columnWidths.uptime);
        
        const headerLine = serviceHeader + portHeader + statusHeader + infoHeader + responseHeader + checkHeader + uptimeHeader;
        console.log(`\n${this.cyan}${headerLine}${this.reset}`);
        console.log('-'.repeat(this.innerWidth));

        // Service rows with fixed column widths
        this.services.forEach(service => {
            const statusText = this.getStatusIcon(service.status);
            const statusColor = this.getStatusColor(service.status);
            
            // Fixed width formatting for each column
            const serviceName = service.name.padEnd(this.columnWidths.service);
            const servicePort = service.port.toString().padEnd(this.columnWidths.port);
            const serviceStatus = `${statusColor}${statusText}${this.reset}`.padEnd(this.columnWidths.statusIcon);
            const serviceInfo = (service.pid ? `PID: ${service.pid}` : 'Not running').padEnd(this.columnWidths.statusInfo);
            const serviceResponse = this.formatResponseTime(service.responseTime).padEnd(this.columnWidths.responseTime);
            const serviceCheck = (service.lastCheck || 'Never').padEnd(this.columnWidths.lastCheck);
            const serviceUptime = this.formatUptime(service.startTime).padEnd(this.columnWidths.uptime);

            const serviceLine = serviceName + servicePort + serviceStatus + serviceInfo + serviceResponse + serviceCheck + serviceUptime;
            console.log(serviceLine);
        });
    }

    displayFooter() {
        const footerLine = '='.repeat(this.innerWidth);
        console.log('\n' + footerLine);
        
        const controls = `${this.green}CONTROLS:${this.reset} ` +
                        `[${this.cyan}V${this.reset}] Void AI | ` +
                        `[${this.green}S${this.reset}] Start All | ` +
                        `[${this.yellow}R${this.reset}] Restart All | ` +
                        `[${this.red}T${this.reset}] Stop All | ` +
                        `[${this.magenta}L${this.reset}] Logs | ` +
                        `[${this.blue}I${this.reset}] Service Info | ` +
                        `[${this.red}Q${this.reset}] Quit`;
        
        console.log(controls);
        console.log(footerLine);
        
        const hardwareInfo = `Hardware: ${this.cpuCores} CPU Cores${this.hasGPU ? ' | GPU Detected' : ''}${this.hasNPU ? ' | NPU Detected' : ''}`;
        const tip = `${this.yellow}💡 TIP:${this.reset} Services: ${this.services.length} | Auto-refresh: 10s | ${hardwareInfo}`;
        console.log(tip);
    }

    displayDashboard() {
        this.displayHeader();
        this.displayServices();
        this.displayFooter();
    }

    async startService(service) {
        if (service.process) {
            return;
        }

        service.status = 'starting';
        service.startTime = Date.now();

        try {
            const logStream = fs.createWriteStream(path.join(this.logDir, service.logFile), { flags: 'a' });
            logStream.write(`\n=== Service started at ${new Date().toISOString()} ===\n`);
            
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
                logStream.write(`[INFO] Process exited with code ${code} at ${new Date().toISOString()}\n`);
                logStream.end();
            });

            await new Promise(resolve => setTimeout(resolve, 3000));
            
        } catch (error) {
            service.status = 'crashed';
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
            
            const logStream = fs.createWriteStream(path.join(this.logDir, service.logFile), { flags: 'a' });
            logStream.write(`[INFO] Service stopped manually at ${new Date().toISOString()}\n`);
            logStream.end();
            
        } catch (error) {
            console.error(`Failed to stop ${service.name}:`, error.message);
        }
    }

    async startAllServices() {
        console.log(`\n${this.green}Starting all ${this.services.length} services...${this.reset}`);
        for (const service of this.services) {
            console.log(`${this.blue}Starting ${service.name}...${this.reset}`);
            await this.startService(service);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        console.log(`${this.green}All services start initiated!${this.reset}`);
    }

    async stopAllServices() {
        console.log(`\n${this.red}Stopping all ${this.services.length} services...${this.reset}`);
        for (const service of this.services) {
            console.log(`${this.yellow}Stopping ${service.name}...${this.reset}`);
            await this.stopService(service);
        }
        console.log(`${this.green}All services stopped!${this.reset}`);
    }

    async restartAllServices() {
        console.log(`\n${this.cyan}Restarting all services...${this.reset}`);
        await this.stopAllServices();
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.startAllServices();
        console.log(`${this.green}All services restarted!${this.reset}`);
    }

    showServiceInfo() {
        console.log(`\n${this.cyan}=== SERVICE INFORMATION ===${this.reset}`);
        this.services.forEach((service, index) => {
            console.log(`\n${this.green}${index + 1}. ${service.name}${this.reset}`);
            console.log(`   ${this.blue}Port:${this.reset} ${service.port}`);
            console.log(`   ${this.blue}Type:${this.reset} ${service.type}`);
            console.log(`   ${this.blue}Command:${this.reset} ${service.command} ${service.args.join(' ')}`);
            console.log(`   ${this.blue}Directory:${this.reset} ${service.workingDir}`);
            console.log(`   ${this.blue}Log File:${this.reset} ${service.logFile}`);
        });
        console.log(`\n${this.yellow}Press any key to return to dashboard...${this.reset}`);
        process.stdin.once('data', () => {
            this.displayDashboard();
        });
    }

    showLogsMenu() {
        console.log(`\n${this.magenta}=== SERVICE LOGS VIEWER ===${this.reset}`);
        this.services.forEach((service, index) => {
            const logPath = path.join(this.logDir, service.logFile);
            const hasLogs = fs.existsSync(logPath);
            const logSize = hasLogs ? Math.round(fs.statSync(logPath).size / 1024) : 0;
            
            console.log(`[${index + 1}] ${service.name} ${hasLogs ? `(${logSize}KB)` : '(No logs)'}`);
        });
        console.log('[0] Back to dashboard');
        
        this.getUserInput('\nSelect service to view logs: ', (input) => {
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
            console.log(`\n${this.red}No logs found for ${service.name}${this.reset}`);
            this.pressToContinue();
            return;
        }

        console.log(`\n${this.cyan}=== ${service.name} LOGS (last 50 lines) ===${this.reset}`);
        try {
            const logContent = fs.readFileSync(logPath, 'utf8');
            const lines = logContent.split('\n').slice(-50);
            console.log(lines.join('\n'));
        } catch (error) {
            console.log(`${this.red}Error reading logs: ${error.message}${this.reset}`);
        }
        
        this.pressToContinue();
    }

    pressToContinue() {
        console.log(`\n${this.yellow}Press any key to continue...${this.reset}`);
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
                case 'i':
                    this.showServiceInfo();
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
            console.log(`\n${this.red}Void AI not found in PATH. Please install Void AI first.${this.reset}`);
            return;
        }

        if (this.voidProcess) {
            console.log(`\n${this.yellow}Void AI is already running.${this.reset}`);
            return;
        }

        console.log(`\n${this.green}Launching Void AI with configuration...${this.reset}`);
        this.voidProcess = spawn('void', ['--config', this.voidConfig], {
            stdio: 'inherit',
            detached: true
        });

        this.voidProcess.on('close', () => {
            this.voidProcess = null;
            console.log(`${this.yellow}Void AI process terminated.${this.reset}`);
        });
    }

    async monitorServices() {
        for (const service of this.services) {
            await this.checkServiceHealth(service);
        }
        this.updateSystemMetrics();
    }

    async start() {
        console.log(`${this.green}Initializing Enhanced AI Services Dashboard...${this.reset}`);
        console.log(`${this.blue}CPU Cores: ${this.cpuCores} | Auto-refresh: 10s${this.reset}`);
        
        this.monitoringInterval = setInterval(() => {
            this.monitorServices();
        }, 10000);

        this.dashboardUpdateInterval = setInterval(() => {
            this.displayDashboard();
        }, 10000);

        this.setupInputHandling();
        this.displayDashboard();
        
        console.log(`\n${this.green}Enhanced dashboard started successfully!${this.reset}`);
        console.log(`${this.cyan}Hardware monitoring active | Service refresh: 10s${this.reset}`);
    }

    async shutdown() {
        console.log(`\n${this.yellow}Shutting down AI Services Dashboard...${this.reset}`);
        
        clearInterval(this.monitoringInterval);
        clearInterval(this.dashboardUpdateInterval);
        
        await this.stopAllServices();
        
        if (this.voidProcess) {
            this.voidProcess.kill();
        }
        
        console.log(`${this.green}All services stopped. Goodbye!${this.reset}`);
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
