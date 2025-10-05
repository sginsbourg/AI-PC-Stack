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
        this.blinkGreen = '\x1b[32;5m';
        this.reset = '\x1b[0m';
        
        this.validateServices();
        this.setupConsole();
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
            console.log('Service configurations validated successfully.');
        } catch (error) {
            console.error('Service validation failed:', error.message);
            process.exit(1);
        }
    }

    stripAnsi(str) {
        try {
            return str.replace(/\x1b\[[0-9;]*m/g, '');
        } catch (error) {
            console.error('Error in stripAnsi:', error.message);
            return str;
        }
    }

    isAllServicesHealthy() {
        try {
            return this.services.every(service => this.getStatusIcon(service.status) === 'OK');
        } catch (error) {
            console.error('Error in isAllServicesHealthy:', error.message);
            return false;
        }
    }

    updateSystemMetrics() {
        try {
            // RAM sync
            const totalMem = os.totalmem() / 1024 / 1024 / 1024; // GB
            const freeMem = os.freemem() / 1024 / 1024 / 1024;
            const usedMem = totalMem - freeMem;
            const ramPercent = Math.round((usedMem / totalMem) * 100);
            this.systemMetrics.ram = ramPercent + '%';
        } catch (error) {
            console.error('Error updating RAM metrics:', error.message);
            this.systemMetrics.ram = 'N/A';
        }

        try {
            // CPU
            exec('wmic cpu get loadpercentage /value', (err, stdout, stderr) => {
                if (err) {
                    console.error('Error fetching CPU metrics:', err.message);
                    return;
                }
                if (stdout) {
                    const lines = stdout.trim().split('\n');
                    for (let line of lines) {
                        if (line.includes('LoadPercentage')) {
                            const percent = line.match(/(\d+)/);
                            if (percent) {
                                this.systemMetrics.cpu = percent[1] + '%';
                                break;
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error in CPU metrics update:', error.message);
            this.systemMetrics.cpu = 'N/A';
        }

        try {
            // Disk C:
            exec('wmic logicaldisk where DeviceID="C:" get Size,FreeSpace /value', (err, stdout, stderr) => {
                if (err) {
                    console.error('Error fetching disk metrics:', err.message);
                    return;
                }
                if (stdout) {
                    const lines = stdout.trim().split('\n');
                    let size = 0, free = 0;
                    for (let line of lines) {
                        if (line.includes('Size=')) {
                            const match = line.match(/Size=(\d+)/);
                            if (match) size = parseInt(match[1]);
                        } else if (line.includes('FreeSpace=')) {
                            const match = line.match(/FreeSpace=(\d+)/);
                            if (match) free = parseInt(match[1]);
                        }
                    }
                    if (size > 0) {
                        const used = size - free;
                        const diskPercent = Math.round((used / size) * 100);
                        this.systemMetrics.disk = diskPercent + '%';
                    }
                }
            });
        } catch (error) {
            console.error('Error in disk metrics update:', error.message);
            this.systemMetrics.disk