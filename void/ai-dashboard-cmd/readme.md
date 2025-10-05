# AI Services Dashboard - Complete Management System

A comprehensive Node.js dashboard for managing and monitoring your local AI services ecosystem with real-time hardware monitoring.

## 🚀 Features

### **Core Dashboard**
- **One-Click Launch**: Start all AI services simultaneously
- **Real-time Monitoring**: Live status updates every 10 seconds
- **Process Management**: Track PIDs, uptime, and service health
- **Response Time Tracking**: Monitor HTTP response times
- **Interactive Controls**: Menu-driven service management
- **Log Viewer**: Access service logs directly from dashboard
- **Auto-Restart**: Restart individual or all services
- **Void AI Integration**: Seamless Void AI launch with configuration
- **Graceful Shutdown**: Properly stops all services on exit

### **Hardware Monitoring**
- **CPU Usage**: Real-time CPU utilization percentage
- **GPU Monitoring**: NVIDIA, AMD, and Intel GPU support
- **NPU Monitoring**: Intel and AMD NPU detection and monitoring
- **RAM Usage**: Memory utilization with GB display
- **Disk Usage**: Storage utilization with GB display
- **Multi-Architecture**: Supports x86, ARM, and AI-accelerated hardware

## 📋 Supported Services

| Service | Port | Description | Type |
|---------|------|-------------|------|
| Nutch | 8899 | Apache Nutch REST server | Java |
| Ollama | 11434 | Local LLM server | Executable |
| MeloTTS | 9880 | Text-to-speech API | Python |
| OpenManus | 7860 | AI assistant interface | Streamlit |
| OpenSora | 7861 | Video generation AI | Streamlit |
| tg-webui | 7862 | Telegram web UI with API | Python |

## 🛠️ System Requirements

### **Minimum Requirements**
- **OS**: Windows 10/11, Linux, or macOS
- **Node.js**: 18.0 or higher
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB available space

### **Recommended for AI Workloads**
- **CPU**: Multi-core processor (Intel i7/Ryzen 7 or better)
- **GPU**: NVIDIA RTX 3060+ or AMD RX 6700+ with latest drivers
- **NPU**: Intel Meteor Lake NPU or AMD Ryzen AI
- **RAM**: 32GB or higher for large models
- **Storage**: SSD with 50GB+ free space

## 🎯 Quick Installation

### **Option 1: Automated Setup (Windows)**
1. Download `install-ai-dashboard.bat`
2. Right-click and "Run as administrator"
3. Follow the prompts to install all dependencies
4. Launch using `launch-ai.bat`

### **Option 2: Manual Installation**
```bash
# 1. Install Node.js from https://nodejs.org
# 2. Download dashboard files to your preferred directory
# 3. Run the installer
install-ai-dashboard.bat