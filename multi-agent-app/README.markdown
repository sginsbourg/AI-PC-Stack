# Multi-Agent Performance & Load Testing Application

**Version: 1.0.0**  
**Date: September 28, 2025**  
**Author: Grok 4 (built by xAI)**  
**Repository: Local Setup (No External Dependencies Beyond Specified Tools)**  

## Table of Contents

1. [Project Overview](#project-overview)  
   1.1 [Key Features](#key-features)  
   1.2 [Architecture](#architecture)  
   1.3 [Agents and Their Roles](#agents-and-their-roles)  
   1.4 [Local AI Integration](#local-ai-integration)  
   1.5 [Load Testing Tools](#load-testing-tools)  
   1.6 [Monitoring and Observability](#monitoring-and-observability)  

2. [Prerequisites](#prerequisites)  
   2.1 [Hardware Requirements](#hardware-requirements)  
   2.2 [Software Requirements](#software-requirements)  
   2.3 [AI_STACK Setup](#ai_stack-setup)  

3. [Installation and Setup](#installation-and-setup)  
   3.1 [Directory Structure](#directory-structure)  
   3.2 [Setting Up Node.js Dependencies](#setting-up-nodejs-dependencies)  
   3.3 [Configuring Environment Variables](#configuring-environment-variables)  
   3.4 [Docker and Container Setup](#docker-and-container-setup)  

4. [Running the Application](#running-the-application)  
   4.1 [Using the Launch Batch File](#using-the-launch-batch-file)  
   4.2 [Manual Startup Steps](#manual-startup-steps)  
   4.3 [Verifying Services](#verifying-services)  

5. [Using the Dashboard](#using-the-dashboard)  
   5.1 [Accessing the Dashboard](#accessing-the-dashboard)  
   5.2 [Dashboard Interface Overview](#dashboard-interface-overview)  
   5.3 [Performing Load Tests](#performing-load-tests)  
   5.4 [Viewing Results and Metrics](#viewing-results-and-metrics)  
   5.5 [Customizing Workflows](#customizing-workflows)  

6. [Advanced Usage](#advanced-usage)  
   6.1 [Extending Agents](#extending-agents)  
   6.2 [Integrating Additional AI Tools](#integrating-additional-ai-tools)  
   6.3 [Custom Load Test Scripts](#custom-load-test-scripts)  
   6.4 [Scaling the Application](#scaling-the-application)  

7. [Troubleshooting](#troubleshooting)  
   7.1 [Common Issues and Solutions](#common-issues-and-solutions)  
   7.2 [Logs and Debugging](#logs-and-debugging)  
   7.3 [Error Codes Reference](#error-codes-reference)  

8. [Contributing and Customization](#contributing-and-customization)  
   8.1 [Modifying Code](#modifying-code)  
   8.2 [Adding New Agents](#adding-new-agents)  
   8.3 [Feedback and Improvements](#feedback-and-improvements)  

9. [License](#license)  

10. [Appendix](#appendix)  
    10.1 [Glossary](#glossary)  
    10.2 [References](#references)  

## 1. Project Overview

This multi-agent application is a comprehensive, locally-run system designed for performance and load testing of web applications, APIs, and systems under test (SUT). Built primarily with Node.js, it leverages a modular agent-based architecture to interpret user requirements, generate test scripts, execute tests, and analyze results—all powered by local AI tools to ensure privacy, offline capability, and no reliance on external API keys.

The system simulates a distributed environment on a single Windows PC using Docker containerization, making it portable and scalable. AI-driven tasks (e.g., natural language processing for requirements interpretation or log analysis) are handled by local LLM servers from the `AI_STACK` directory, such as tg-webui running the DeepSeek-V3.1 model.

### 1.1 Key Features
- **AI-Powered Workflow**: Use natural language to define test requirements; the system generates, runs, and analyzes tests automatically.
- **Multi-Tool Support**: Integrates k6 (JavaScript-based), Locust (Python-based), and Apache JMeter (Java/XML-based) for versatile load testing.
- **Local AI Integration**: Utilizes tg-webui or Ollama for LLM capabilities, ensuring no cloud dependency.
- **Monitoring Dashboard**: Embedded Grafana for real-time metrics visualization, powered by Prometheus.
- **User-Friendly Dashboard**: A web-based interface to trigger workflows, view statuses, and display results.
- **Modular and Extensible**: Add new agents or tools easily; supports asynchronous communication via RabbitMQ.
- **Offline Operation**: All components run locally after initial setup.
- **Security and Privacy**: No external keys; data stays on your machine.

### 1.2 Architecture
The application is structured as a multi-agent system:
- **Orchestrator**: Central coordinator that routes tasks using LangChain.js and local LLM.
- **Generator**: Interprets requirements and generates test scripts.
- **Runner**: Executes tests on the SUT and collects results.
- **Analyzer**: Processes results with AI insights to identify bottlenecks.

Communication uses HTTP/REST or RabbitMQ for async tasks. Data storage includes PostgreSQL for metadata, ChromaDB for vector knowledge bases, and MinIO for artifacts. Monitoring via Prometheus and Grafana.

High-level flow:
1. User inputs requirements via dashboard.
2. Orchestrator uses LLM to plan workflow.
3. Generator creates script (e.g., `test-script.js`).
4. Runner executes test, saves results (e.g., `k6-results.json`).
5. Analyzer generates report.
6. Dashboard displays everything.

### 1.3 Agents and Their Roles
- **Orchestrator Agent** (`orchestrator.js`): Handles user inputs, coordinates agents via tools in LangChain.js, exposes API at `http://localhost:3000/orchestrate`.
- **Generator Agent** (`generator.js`): Uses local LLM to generate load test scripts based on natural language requirements.
- **Runner Agent** (`runner.js`): Controls execution of k6, Locust, or JMeter using `child_process`.
- **Analyzer Agent** (`analyzer.js`): Analyzes results with LLM to provide insights (e.g., bottlenecks, performance metrics).

### 1.4 Local AI Integration
- Primary: tg-webui with DeepSeek-V3.1 model (from `C:\Users\sgins\AI_STACK\tg-webui`).
- Alternative: Ollama (from `C:\Users\sgins\AI_STACK\Ollama`).
- API Endpoint: `http://localhost:5000/v1` (configurable in `.env`).
- Usage: Agents call the local LLM via `@langchain/openai` client (compatible with OpenAI-style APIs).

Optional TTS integration with MeloTTS or Orpheus-TTS for audio reports (add scripts to `scripts` folder if needed).

### 1.5 Load Testing Tools
- **k6**: Native Node.js support; script in `test-script.js`.
- **Locust**: Python-based; script in `locustfile.py`.
- **JMeter**: Java-based; plan in `test-plan.jmx`.
- Results stored in `results` subfolders.

### 1.6 Monitoring and Observability
- **Prometheus**: Collects metrics from agents and SUT.
- **Grafana**: Visualizes data at `http://localhost:3001` (default credentials: admin/admin).
- Configured in `prometheus.yml` and `docker-compose.yml`.

## 2. Prerequisites

### 2.1 Hardware Requirements
- **Minimum**: 16GB RAM, multi-core CPU (Intel VT-x or AMD-V enabled), 50GB free storage.
- **Recommended**: 32GB+ RAM, GPU (for faster LLM inference with tg-webui), 100GB+ storage for large models and results.

### 2.2 Software Requirements
- **Operating System**: Windows 10/11 Professional or Server (with WSL 2 for Docker).
- **Core Tools**:
  - Node.js LTS (v20.x+): For running agents.
  - Docker Desktop: For containerization.
  - Visual Studio Code: For editing code (optional but recommended).
- **Load Testing Tools**:
  - k6: Binary from k6.io, add to PATH.
  - Python 3: For Locust (`pip install locust`).
  - JDK 17+: For JMeter (binary from apache.org, add `bin` to PATH).
- **Package Managers**: npm (bundled with Node.js), Yarn (optional).
- **Browsers**: Chrome/Edge for the dashboard.

### 2.3 AI_STACK Setup
- Ensure `C:\Users\sgins\AI_STACK\tg-webui` has the DeepSeek-V3.1 model downloaded.
- Test: `cd C:\Users\sgins\AI_STACK\tg-webui && python server.py --model deepseek-ai_DeepSeek-V3.1 --api`.
- Alternative: Use Ollama (`ollama serve && ollama run llama3`).

## 3. Installation and Setup

### 3.1 Directory Structure
Verify or create the structure in `C:\multi-agent-app` as shown above. All files should be populated as per the provided artifacts.

### 3.2 Setting Up Node.js Dependencies
Navigate to each agent folder (`orchestrator`, `generator`, `runner`, `analyzer`) and run:
```
npm install
```
This installs required packages like Express, LangChain.js, etc.

### 3.3 Configuring Environment Variables
Edit `configs\.env`:
```
LOCAL_LLM_URL=http://localhost:5000/v1  # tg-webui endpoint
PORT=3000  # Orchestrator port
```
Add any custom vars (e.g., database passwords).

### 3.4 Docker and Container Setup
- Install Docker Desktop and enable WSL 2.
- Build images: From each agent folder, run `docker build -t <agent-name> .`.
- Or use `docker-compose build` from `configs`.

## 4. Running the Application

### 4.1 Using the Launch Batch File
The `launch-dashboard.bat` file automates everything:
1. Double-click `launch-dashboard.bat` (or run via cmd: `cd C:\multi-agent-app && launch-dashboard.bat`).
2. It will:
   - Start tg-webui if not running.
   - Start Docker Compose services.
   - Open the dashboard in your browser.
3. Wait for services to initialize (5-10 seconds).

### 4.2 Manual Startup Steps
1. Start tg-webui:
   ```
   cd C:\Users\sgins\AI_STACK\tg-webui
   python server.py --model deepseek-ai_DeepSeek-V3.1 --api
   ```
2. Start Docker services:
   ```
   cd C:\multi-agent-app\configs
   docker-compose up -d
   ```
3. Open dashboard: Double-click `dashboard\index.html` or open in browser (`file:///C:/multi-agent-app/dashboard/index.html`).

### 4.3 Verifying Services
- Orchestrator: `curl http://localhost:3000/orchestrate` (should respond).
- Grafana: `http://localhost:3001` (login: admin/admin).
- RabbitMQ Management: `http://localhost:15672` (guest/guest).
- Check Docker: `docker ps` (all containers running).

## 5. Using the Dashboard

### 5.1 Accessing the Dashboard
- After launching, the browser opens `index.html`.
- If not, navigate to `file:///C:/multi-agent-app/dashboard/index.html`.

### 5.2 Dashboard Interface Overview
- **Header**: Project title.
- **Test Requirements Textarea**: Enter natural language descriptions.
- **Action Buttons**:
  - Generate Script: Triggers generator.
  - Run Test: Triggers runner.
  - Analyze Results: Triggers analyzer.
- **Status Section**: Shows processing status, errors, and results (JSON format).
- **Agent Statuses Grid**: Displays status of each agent (e.g., Running, Completed).
- **Metrics Dashboard**: Embedded Grafana iframe for visualizations (response times, errors, etc.).

### 5.3 Performing Load Tests
1. Enter requirements (e.g., "Load test example.com/api with 200 users ramping up over 30 seconds").
2. Click "Generate Script" to create the script.
3. Click "Run Test" to execute.
4. Click "Analyze Results" to get insights.
5. View results in the "Result" section.

### 5.4 Viewing Results and Metrics
- Results appear in the dashboard's preformatted text.
- Metrics: Interact with the Grafana iframe (add dashboards for CPU, response times).
- Raw files: Check `results` folder for JSON/CSV/JTL files.

### 5.5 Customizing Workflows
- Edit prompts in agent `.js` files (e.g., in `generator.js` for script generation).
- Add more tools in `orchestrator.js`.

## 6. Advanced Usage

### 6.1 Extending Agents
- Add new tools to `orchestrator.js` (e.g., for TTS: integrate MeloTTS via child_process).
- Example: In `analyzer.js`, add audio report generation using MeloTTS.

### 6.2 Integrating Additional AI Tools
- Switch to Ollama: Update `.env` to `LOCAL_LLM_URL=http://localhost:11434`.
- Add TTS: Create `scripts/audio-report.py` using MeloTTS, call from analyzer.

### 6.3 Custom Load Test Scripts
- Edit `test-script.js`, `locustfile.py`, or `test-plan.jmx` for custom scenarios.
- Regenerate via generator for AI-assisted changes.

### 6.4 Scaling the Application
- Run on multiple machines: Use Kubernetes or Docker Swarm.
- Increase resources: Edit `docker-compose.yml` for more replicas.

## 7. Troubleshooting

### 7.1 Common Issues and Solutions
- **tg-webui Not Starting**: Verify path and model; check Python version.
- **Docker Errors**: Ensure Docker Desktop is running; pull images manually (`docker pull node:20`).
- **NPM Install Fails**: Run as admin; clear cache (`npm cache clean --force`).
- **Dashboard Not Loading**: Allow local file access in browser; test in Incognito.
- **API Errors**: Check if orchestrator is running (`docker logs orchestrator`).
- **LLM Response Slow**: Use a GPU-accelerated setup or smaller model in Ollama.

### 7.2 Logs and Debugging
- Docker Logs: `docker-compose logs -f`.
- Agent Logs: Run agents manually (e.g., `node orchestrator.js`).
- Browser Console: F12 in dashboard for JS errors.

### 7.3 Error Codes Reference
- **ECONNREFUSED**: Service not running (e.g., orchestrator port 3000).
- **ENOENT**: File not found (check paths in scripts).
- **LLM Timeout**: Increase timeout in LangChain.js calls.

## 8. Contributing and Customization

### 8.1 Modifying Code
- Use VS Code for editing `.js` files.
- Rebuild Docker images after changes: `docker-compose build`.

### 8.2 Adding New Agents
- Create a new folder (e.g., `reporter`), add `.js`, `package.json`, `Dockerfile`.
- Update `docker-compose.yml` to include the service.
- Add tool to `orchestrator.js`.

### 8.3 Feedback and Improvements
- This setup is generated by Grok 4. For enhancements (e.g., add TTS, more tools), regenerate with updated queries.

## 9. License

This project is licensed under the MIT License. Feel free to modify and distribute.

MIT License

Copyright (c) 2025 xAI

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 10. Appendix

### 10.1 Glossary
- **SUT**: System Under Test.
- **LLM**: Large Language Model (e.g., DeepSeek-V3.1).
- **REPL**: Read-Eval-Print Loop (for code execution, if needed in extensions).
- **VU**: Virtual User (in load testing).

### 10.2 References
- Node.js Documentation: https://nodejs.org/en/docs
- Docker Documentation: https://docs.docker.com/
- LangChain.js: https://js.langchain.com/docs/
- k6: https://k6.io/docs/
- Locust: https://docs.locust.io/en/stable/
- JMeter: https://jmeter.apache.org/usermanual/
- Grafana: https://grafana.com/docs/grafana/latest/
- tg-webui: Local setup from AI_STACK (no external link).

For questions or updates, consult the Grok AI assistant.