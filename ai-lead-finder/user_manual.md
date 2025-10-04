# AI-Powered Lead Finder - User Manual

![AI Lead Finder](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Local AI](https://img.shields.io/badge/AI-Local_Only-green.svg)
![No API Keys](https://img.shields.io/badge/API_Keys-Not_Required-success.svg)

## 📖 Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Quick Start Guide](#quick-start-guide)
4. [Detailed Installation](#detailed-installation)
5. [Application Workflow](#application-workflow)
6. [File Structure](#file-structure)
7. [Configuration Guide](#configuration-guide)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)
10. [Advanced Usage](#advanced-usage)

## 🎯 Overview

The **AI-Powered Lead Finder** is a comprehensive local AI system designed to automatically discover and qualify leads for AI-powered software performance and load testing services. The system combines web crawling with local AI analysis to provide targeted lead generation without requiring any external APIs or subscriptions.

### Key Features

- **🔍 Intelligent Web Crawling** - Apache Nutch for targeted content discovery
- **🤖 Local AI Analysis** - Qwen 7B and DeepSeek Coder 6.7B models
- **🔒 Complete Privacy** - All data stays on your local machine
- **💸 Zero Costs** - No API fees or subscription costs
- **🎯 Targeted Lead Generation** - Focused on performance testing services
- **📊 Comprehensive Reporting** - Multiple output formats for easy analysis

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.14+, or Linux Ubuntu 18.04+
- **RAM**: 16 GB minimum (32 GB recommended for optimal AI performance)
- **Storage**: 50 GB free space (for AI models and data)
- **Docker**: Docker Desktop 4.12+ with WSL2 enabled (Windows)
- **Python**: 3.8 or higher

### Recommended Specifications
- **RAM**: 32 GB or higher
- **Storage**: 100 GB SSD
- **CPU**: 8 cores or more
- **GPU**: NVIDIA GPU with 8GB+ VRAM (optional, for faster AI processing)

## 🚀 Quick Start Guide

### For Windows Users

1. **Download & Extract**
   ```cmd
   # Download the complete ZIP package
   # Extract to: C:\AI_Lead_Finder\
   ```

2. **Run Setup** (Right-click → Run as Administrator)
   ```cmd
   setup.bat
   ```

3. **Start Lead Generation**
   ```cmd
   run.bat
   ```

4. **View Results**
   - Check `results\` folder for output files
   - Access Kibana dashboard at: http://localhost:5601

### For Linux/macOS Users

1. **Download & Extract**
   ```bash
   unzip ai-lead-finder.zip
   cd ai-lead-finder
   ```

2. **Run Setup**
   ```bash
   chmod +x *.sh scripts/*.sh
   ./setup.sh
   ```

3. **Start Lead Generation**
   ```bash
   python main_enhanced.py
   ```

## 📥 Detailed Installation

### Step 1: Prerequisites Installation

#### Docker Installation
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Install and ensure WSL2 is enabled (Windows)
3. Start Docker Desktop and wait for it to be ready

#### Python Installation
1. Download Python 3.8+ from [python.org](https://python.org)
2. During installation, check "Add Python to PATH"
3. Verify installation:
   ```cmd
   python --version
   ```

### Step 2: Application Setup

1. **Verify File Structure**
   ```cmd
   verify_setup.bat
   ```
   This checks that all required files are present.

2. **Run Complete Setup**
   ```cmd
   setup.bat
   ```
   This will:
   - Download Docker images (~5 GB)
   - Initialize AI models (~8 GB download)
   - Configure all services
   - Start the application stack

3. **Monitor Setup Progress**
   - Initial setup: 10-30 minutes (depending on internet speed)
   - AI model download: 20-60 minutes (depending on connection)

### Step 3: First Run

1. **Start Lead Generation**
   ```cmd
   run.bat
   ```

2. **Monitor Progress**
   - Web crawling: 5-15 minutes
   - AI analysis: 2-10 minutes (depending on hardware)
   - Results generation: 1-2 minutes

3. **Access Results**
   - CSV file: `results\ai_leads.csv`
   - Detailed JSON: `results\ai_leads_detailed.json`
   - Summary report: `results\summary_report.md`

## 🔄 Application Workflow

### Data Flow Diagram
```
User Input
    ↓
Apache Nutch Crawler
    ↓
Elasticsearch Storage
    ↓
Open Manus AI Analysis
    ↓
Lead Analyzer Processing
    ↓
Results Generation
    ↓
Output Files + Kibana Dashboard
```

### Step-by-Step Process

1. **Web Crawling Phase**
   - Crawls predefined target websites
   - Extracts content from performance testing related pages
   - Stores raw data in Elasticsearch

2. **AI Analysis Phase**
   - Qwen 7B model analyzes content relevance
   - DeepSeek Coder generates personalized approaches
   - Scores leads based on multiple criteria

3. **Lead Qualification Phase**
   - Filters and ranks potential leads
   - Extracts contact information
   - Generates outreach recommendations

4. **Reporting Phase**
   - Creates multiple output formats
   - Updates Kibana dashboard
   - Generates executive summary

## 📁 File Structure

```
ai-lead-finder/
├── 📋 Configuration Files
│   ├── docker-compose.yml          # Container orchestration
│   ├── create_nutch_config.bat     # Nutch configuration
│   └── nutch_data/                 # Crawler configuration
│       ├── urls/seed.txt           # Target websites
│       └── conf/                   # Nutch settings
├── 🚀 Execution Scripts
│   ├── setup.bat                   # Initial setup
│   ├── run.bat                     # Main execution
│   ├── check_services.bat          # Service status check
│   ├── stop_services.bat           # Stop all services
│   └── scripts/
│       ├── crawl.bat               # Web crawling
│       └── init_models.bat         # AI model initialization
├── 🔍 Verification Scripts
│   ├── verify_setup.bat            # Complete verification
│   ├── quick_verify.bat            # Fast check
│   ├── create_missing_files.bat    # Auto-fix missing files
│   └── simple_check.bat            # Basic file check
├── 🤖 AI Services
│   ├── open-manus/                 # AI analysis service
│   │   ├── app.py                  # FastAPI application
│   │   ├── Dockerfile              # Container definition
│   │   └── requirements.txt        # Python dependencies
│   └── lead-analyzer/              # Lead processing
│       ├── analyzer.py             # Main analysis logic
│       ├── Dockerfile              # Container definition
│       └── requirements.txt        # Python dependencies
├── 📊 Results
│   ├── ai_leads.csv                # Excel-friendly format
│   ├── ai_leads_detailed.json      # Complete data
│   └── summary_report.md           # Executive summary
└── 📚 Documentation
    ├── README.md                   # Basic instructions
    └── user_manual.md              # This manual
```

## ⚙️ Configuration Guide

### Modifying Target Websites

Edit `nutch_data/urls/seed.txt` to add or remove target websites:

```txt
# Add your target websites here
https://example.com/performance-testing
https://forum.example.com/tags/load-testing
https://blog.example.com/category/qa
```

### Adjusting AI Analysis Parameters

Modify `open-manus/app.py` to change analysis criteria:

```python
# Example: Adjust relevance scoring
relevance_keywords = [
    'performance testing',
    'load testing', 
    'AI-powered testing',
    'automated testing'
]
```

### Customizing Output Formats

Edit `lead-analyzer/analyzer.py` to modify report formats:

```python
# Example: Add custom fields to CSV output
csv_data.append({
    'custom_field': 'your_value',
    # ... existing fields
})
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue: "Docker not running"
**Solution:**
- Start Docker Desktop
- Wait for Docker to fully initialize
- Run `check_services.bat` to verify

#### Issue: "Port already in use"
**Solution:**
- Stop other applications using ports 5601, 8000, 11434, 9200
- Or modify ports in `docker-compose.yml`

#### Issue: "Insufficient memory"
**Solution:**
- Close other applications
- Increase Docker memory allocation in settings
- For Windows: Docker Desktop → Settings → Resources → Advanced

#### Issue: "AI models not loading"
**Solution:**
- Check internet connection during setup
- Run `docker exec ollama ollama list` to verify models
- Re-run `scripts/init_models.bat`

#### Issue: "Python not found"
**Solution:**
- Install Python 3.8+ from python.org
- Ensure Python is added to PATH during installation
- Restart command prompt after installation

### Service Status Commands

```cmd
# Check all services
check_services.bat

# Check individual containers
docker ps

# View service logs
docker-compose logs

# Check AI models
docker exec ollama ollama list
```

### Reset Procedures

#### Complete Reset
```cmd
stop_services.bat
docker system prune -a
setup.bat
```

#### Reset Crawled Data Only
```cmd
stop_services.bat
docker volume rm ai-lead-finder_es_data
setup.bat
```

## ❓ FAQ

### Q: Is an internet connection required?
**A:** Only during initial setup for downloading Docker images and AI models. After setup, the system runs completely offline.

### Q: How much does it cost to run?
**A:** Completely free! No API fees, subscription costs, or usage limits.

### Q: What data is sent externally?
**A:** Nothing! All data processing happens locally on your machine.

### Q: How often should I run the lead generation?
**A:** Weekly or bi-weekly for fresh leads. The system can be scheduled to run automatically.

### Q: Can I add my own target websites?
**A:** Yes! Edit `nutch_data/urls/seed.txt` to add your preferred websites.

### Q: What if I encounter performance issues?
**A:** Try these optimizations:
- Close other applications during processing
- Increase Docker memory allocation
- Run during off-peak hours
- Consider upgrading hardware

### Q: How are leads scored and ranked?
**A:** Leads are scored based on:
- Relevance to performance testing (0-10)
- Presence of AI/ML keywords
- Company size indicators
- Contact information availability
- Content quality and recency

## 🚀 Advanced Usage

### Scheduling Automated Runs

#### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily/weekly)
4. Action: Start program: `run.bat`
5. Set working directory to application folder

#### Linux/macOS Cron
```bash
# Add to crontab (crontab -e)
0 2 * * 1 cd /path/to/ai-lead-finder && python main_enhanced.py
```

### Custom AI Model Integration

You can modify `open-manus/app.py` to use different Ollama models:

```python
# Example: Using different models
models = {
    'analysis': 'llama2:7b',
    'coding': 'codellama:7b',
    'general': 'mistral:7b'
}
```

### Extending Lead Criteria

Modify `lead-analyzer/analyzer.py` to add custom scoring:

```python
def custom_lead_score(self, content, url):
    # Add your custom scoring logic
    score = 0
    if 'your-keyword' in content.lower():
        score += 5
    return score
```

### Integration with CRM Systems

The CSV output can be easily imported into most CRM systems. Example format:

```csv
Company,Email,Score,URL,Insights
Example Corp,contact@example.com,8.5,https://...,"Interested in AI testing"
```

## 📞 Support and Resources

### Documentation
- This User Manual
- README.md (quick start guide)
- In-script comments and help

### Community Support
- GitHub Issues (if open-sourced)
- Docker community forums
- Python developer communities

### Maintenance Tips
- **Regular updates**: Check for Docker image updates monthly
- **Storage management**: Clean old results periodically
- **Backup**: Backup configuration files before major changes
- **Monitoring**: Use `check_services.bat` regularly

## 🔐 Security and Privacy

### Data Handling
- All web crawling respects robots.txt
- No personal data is stored permanently
- All processing occurs locally
- Results can be deleted at any time

### Compliance
- GDPR compliant (local processing only)
- No data sharing with third parties
- User maintains full data ownership

## 📈 Performance Optimization

### For Better Speed
1. **Use SSD storage** for Docker volumes
2. **Allocate more RAM** to Docker (8GB+)
3. **Enable GPU acceleration** if available
4. **Close other applications** during processing

### For Larger Scale
1. **Increase crawl limits** in Nutch configuration
2. **Add more target websites** to seed list
3. **Use cloud Docker hosting** for more resources
4. **Implement distributed crawling** (advanced)

---

## 🎉 Getting Started Checklist

- [ ] Install Docker Desktop
- [ ] Install Python 3.8+
- [ ] Download and extract AI Lead Finder
- [ ] Run `verify_setup.bat`
- [ ] Run `setup.bat` (as Administrator)
- [ ] Wait for AI models to download
- [ ] Run `run.bat` for first lead generation
- [ ] Check `results/` folder for output
- [ ] Access Kibana at http://localhost:5601

**Need Help?** Run `check_services.bat` to diagnose any issues, or refer to the troubleshooting section above.

---

*Last Updated: Version 1.0.0 | Local AI-Powered Lead Generation System*