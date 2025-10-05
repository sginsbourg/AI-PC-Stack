# AI Services Dashboard

A comprehensive Node.js dashboard for managing and monitoring your local AI services ecosystem. This application provides a beautiful terminal interface to launch, monitor, and control all your AI tools with real-time status updates.

## 🚀 Features

- **One-Click Launch**: Start all AI services simultaneously
- **Real-time Monitoring**: Live status updates every 2 seconds
- **Process Management**: Track PIDs, uptime, and service health
- **Response Time Tracking**: Monitor HTTP response times
- **Interactive Controls**: Menu-driven service management
- **Log Viewer**: Access service logs directly from the dashboard
- **Auto-Restart**: Restart individual or all services
- **Void AI Integration**: Seamless Void AI launch with configuration
- **Graceful Shutdown**: Properly stops all services on exit

## 📋 Supported Services

| Service | Port | Description |
|---------|------|-------------|
| Nutch | 8899 | Apache Nutch REST server |
| Ollama | 11434 | Local LLM server |
| MeloTTS | 9880 | Text-to-speech API |
| OpenManus | 7860 | AI assistant interface |
| OpenSora | 7861 | Video generation AI |
| tg-webui | 7862 | Telegram web UI with API |

## 🛠️ Installation

### Prerequisites

- Node.js 16+ installed
- All AI services installed in `%USERPROFILE%\AI_STACK\`
- Void AI (optional, for full interface)

### Quick Setup

1. **Download the files** to your preferred directory:
   - `ai-dashboard.js`
   - `launch-ai.bat`

2. **Ensure your AI services are installed** in the correct paths:
   ```
   %USERPROFILE%\AI_STACK\apache-nutch-1.21\
   %USERPROFILE%\AI_STACK\MeloTTS\
   %USERPROFILE%\AI_STACK\OpenManus\
   %USERPROFILE%\AI_STACK\OpenSora\
   %USERPROFILE%\AI_STACK\tg-webui\
   ```

3. **Install Void AI** (optional):
   - Download from: https://github.com/void-ai/void
   - Ensure it's in your system PATH

## 🎮 Usage

### Basic Launch
```bash
# Double-click or run:
launch-ai.bat
```

### Manual Launch
```bash
node ai-dashboard.js
```

### Dashboard Controls

| Key | Action |
|-----|--------|
| `V` | Launch Void AI |
| `R` | Restart services menu |
| `S` | Detailed status view |
| `L` | View service logs |
| `T` | Run connection tests |
| `Q` | Quit and stop all services |
| `Ctrl+C` | Emergency shutdown |

## 📊 Monitoring Features

### Real-time Status
The dashboard provides continuous monitoring with:
- 🟢 **Green**: Service running and responsive
- 🟡 **Yellow**: Service starting up
- 🟠 **Orange**: Service slow to respond
- 🔴 **Red**: Service crashed or failed
- ⚪ **White**: Service stopped

### Metrics Tracked
- **Process Status**: Running, starting, crashed, etc.
- **Response Times**: HTTP response in milliseconds
- **Uptime**: How long services have been running
- **PID Tracking**: Process identification
- **Void AI Status**: Whether Void AI is running

## 🔧 Configuration

### Service Paths
Edit the `services` array in `ai-dashboard.js` to modify paths:

```javascript
{
    name: 'Your Service',
    port: 8080,
    command: `cd "your/path/here" && your-command`,
    logFile: 'service.log'
}
```

### Void AI Configuration
The dashboard automatically generates `void_local.yaml`:

```yaml
local_services:
  nutch: http://localhost:8899
  ollama: http://localhost:11434
  melotts: http://localhost:9880
  openmanus: http://localhost:7860
  opensora: http://localhost:7861
  tg_webui: http://localhost:7862
```

## 🗂️ File Structure

```
ai-stack-manager/
├── ai-dashboard.js     # Main dashboard application
├── launch-ai.bat       # Windows launcher script
├── void_local.yaml     # Auto-generated Void AI config
└── service_logs/       # Service log directory
    ├── nutch.log
    ├── ollama.log
    ├── melotts.log
    ├── openmanus.log
    ├── opensora.log
    └── tg-webui.log
```

## 🐛 Troubleshooting

### Common Issues

1. **"Void AI not found"**
   - Install Void AI and add to PATH
   - Or run manually: `void --config void_local.yaml`

2. **Service not starting**
   - Check paths in `ai-dashboard.js`
   - View logs with `L` key
   - Verify Python/Java are installed

3. **Port conflicts**
   - Ensure no other applications using ports 7860-7862, 8899, 9880, 11434

4. **Dashboard crashes**
   - Run from Command Prompt for better error messages
   - Check Node.js version (requires 16+)

### Log Files
All service logs are stored in `service_logs/` directory. Use the `L` key in the dashboard to view them directly.

## 🔄 Restarting Services

### Individual Service
1. Press `R`
2. Select service number
3. Service restarts automatically

### All Services
1. Press `R`
2. Select `0` for "Restart ALL"
3. All services restart in sequence

## 🎯 Advanced Usage

### Running Without Void AI
The dashboard works perfectly without Void AI. All services are accessible directly:
- Nutch: http://localhost:8899
- Ollama: http://localhost:11434
- MeloTTS: http://localhost:9880
- OpenManus: http://localhost:7860
- OpenSora: http://localhost:7861
- tg-webui: http://localhost:7862

### Custom Service Integration
Add new services by extending the `services` array in the code. Each service needs:
- Unique name and port
- Correct command line
- Log file path

## 📝 License

MIT License - feel free to modify and distribute.

## 🤝 Contributing

Contributions welcome! Please feel free to submit pull requests or open issues for:
- New service integrations
- UI improvements
- Additional monitoring features
- Bug fixes

## 🆘 Support

If you encounter issues:
1. Check the service logs using the `L` key
2. Verify all prerequisite software is installed
3. Ensure no port conflicts exist
4. Open an issue with relevant log output

---

**Happy AI Developing!** 🚀