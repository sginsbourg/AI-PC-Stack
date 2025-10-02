# Void AI User Manual

# Table of Contents
  1. [Introduction](#introduction)
     - [Generative AI and Its Roots](#generative-ai-and-its-roots)
  2. [Void AI Features](#void-ai-features)
     - [Core Features](#core-features)
     - [AI-Powered Capabilities](#ai-powered-capabilities)
     - [LLM and Model Integration](#llm-and-model-integration)
     - [Advanced Development Features](#advanced-development-features)
     - [Community and Extensibility](#community-and-extensibility)
  3. [Prerequisites](#prerequisites)
  4. [Getting Started with Void AI](#getting-started-with-void-ai)
     - [Download and Install Void AI](#download-and-install-void-ai)
     - [Open a Folder (Workspace) in Void AI](#open-a-folder-workspace-in-void-ai)
     - [Explore the User Interface](#explore-the-user-interface)
  5. [AI Features in Void AI](#ai-features-in-void-ai)
     - [Tab Autocomplete](#tab-autocomplete)
     - [Quick Edit](#quick-edit)
     - [AI Chat](#ai-chat)
       - [Agent Mode](#agent-mode)
       - [Gather Mode](#gather-mode)
       - [Normal Chat](#normal-chat)
     - [Vibe Coding](#vibe-coding)
       - [What is Vibe Coding?](#what-is-vibe-coding)
       - [Roots of Vibe Coding](#roots-of-vibe-coding)
       - [The Story of Andrej Karpathy and Vibe Coding](#the-story-of-andrej-karpathy-and-vibe-coding)
       - [Vibe Coding in Void AI](#vibe-coding-in-void-ai)
  6. [LLM and Model Integration](#llm-and-model-integration)
     - [Use Any AI Model](#use-any-ai-model)
     - [Full Data Control](#full-data-control)
     - [Direct LLM Connection](#direct-llm-connection)
       - [Private LLMs](#private-llms)
       - [Frontier LLMs](#frontier-llms)
  7. [Advanced Development Features](#advanced-development-features)
     - [Checkpoints for LLM Changes](#checkpoints-for-llm-changes)
     - [Lint Error Detection](#lint-error-detection)
     - [Native Tool Use](#native-tool-use)
     - [Fast Apply](#fast-apply)
  8. [GitHub Integration](#github-integration)
     - [Initializing a Git Repository](#initializing-a-git-repository)
     - [Staging and Committing Changes](#staging-and-committing-changes)
     - [Connecting to GitHub (Remote Repositories)](#connecting-to-github-remote-repositories)
     - [Pushing and Pulling Changes](#pushing-and-pulling-changes)
     - [Branch Management](#branch-management)
     - [Resolving Merge Conflicts](#resolving-merge-conflicts)
  9. [Installing Extensions](#installing-extensions)
  10. [Running and Debugging Your Code](#running-and-debugging-your-code)
  11. [Model Context Protocol (MCP) Servers](#model-context-protocol-mcp-servers)
     - [What are MCP Servers?](#what-are-mcp-servers)
     - [What Can MCP Servers Do?](#what-can-mcp-servers-do)
     - [Use Cases for MCP Servers in Void AI](#use-cases-for-mcp-servers-in-void-ai)
     - [How to Set Up, Install, and Run an MCP Server](#how-to-set-up-install-and-run-an-mcp-server)
       - [Prerequisites](#prerequisites-1)
       - [Environment Setup](#environment-setup)
       - [Building Your Server](#building-your-server)
         - [Example 1: Weather Server](#example-1-weather-server)
         - [Example 2: Filesystem Server](#example-2-filesystem-server)
         - [Example 3: Git Server](#example-3-git-server)
         - [Example 4: Puppeteer Server](#example-4-puppeteer-server)
         - [Example 5: Google Maps Server](#example-5-google-maps-server)
         - [Advanced Integration Examples](#advanced-integration-examples)
           - [Example 6: Machine Learning Server](#example-6-machine-learning-server)
           - [Example 7: Database Server](#example-7-database-server)
           - [Example 8: API Gateway Server](#example-8-api-gateway-server)
           - [Example 9: Code Execution Server](#example-9-code-execution-server)
           - [Example 10: Image Generation Server](#example-10-image-generation-server)
           - [Example 11: Sequential Thinking Server](#example-11-sequential-thinking-server)
       - [Running the MCP Server](#running-the-mcp-server)
       - [Connecting to Void AI](#connecting-to-void-ai)
  12. [Community and Support](#community-and-support)
     - [Community Support](#community-support)
       - [Discord](#discord)
       - [GitHub](#github)
     - [MCP Integration](#mcp-integration)
  13. [Conclusion](#conclusion)
     - [References](#references)

## 1. Introduction

Void AI is an open-source AI code editor designed as a powerful alternative to proprietary tools like Cursor. It integrates advanced AI capabilities directly into the development workflow, offering developers full control over their data and the flexibility to use various AI models. Built as a fork of VS Code, Void AI allows for seamless migration of existing themes, keybindings, and settings, providing a familiar yet enhanced coding environment.

### Generative AI and Its Roots

Generative AI, the backbone of tools like Void AI, refers to artificial intelligence systems capable of creating content, such as text, code, images, or music, based on patterns learned from vast datasets. Its origins trace back to foundational work in computer science, notably by Alan Turing, who in 1950 proposed the idea of machines that could simulate human intelligence, including creative tasks, in his seminal paper *Computing Machinery and Intelligence*. Turing's concept of a "universal machine" laid the groundwork for modern AI, inspiring neural networks and machine learning models that power today's generative systems. From early rule-based systems to the deep learning revolution of the 2010s, generative AI has evolved into large language models (LLMs) like Llama, Claude, and GPT, which Void AI leverages to enhance coding workflows. This technology enables developers to interact with AI in a conversational, iterative manner, transforming traditional programming into a collaborative, creative process.

## 2. Void AI Features

This document provides a comprehensive list of the features available in Void AI, an open-source, AI-powered code editor.

### Core Features

*   **Open Source:** Void AI is fully open source, providing transparency and allowing for community contributions.
*   **AI Code Editor:** It is fundamentally designed to integrate AI assistance deeply into the coding workflow.
*   **Cursor Alternative:** Void AI positions itself as a powerful, open-source alternative to proprietary AI coding assistants like Cursor.
*   **VS Code Fork:** Built as a fork of Visual Studio Code, it allows users to seamlessly transfer their existing themes, keybindings, and settings.

### AI-Powered Capabilities

*   **Tab Autocomplete:** Press the `Tab` key to instantly apply AI-generated code suggestions.
*   **Quick Edit:** Select a block of code and use the Quick Edit feature to make inline modifications with AI assistance.
*   **AI Chat:** Engage with AI through a versatile chat interface that includes:
    *   **Agent Mode:** A powerful mode where the AI can perform a wide range of actions, including searching, creating, editing, and deleting files and folders. It also has access to the terminal and MCP tools.
    *   **Gather Mode:** A restricted version of Agent Mode that allows the AI to read and search the codebase without making any modifications. This is ideal for information gathering and analysis.
    *   **Normal Chat:** A standard conversational AI for troubleshooting, brainstorming, and general coding questions.

### LLM and Model Integration

*   **Use Any AI Model:** Void AI offers the flexibility to use a wide variety of Large Language Models (LLMs).
*   **Full Data Control:** Retain complete control over your data by hosting models locally or connecting directly to providers.
*   **Direct LLM Connection:** Connect directly to any LLM provider, cutting out the middleman and avoiding private backends. This includes:
    *   **Private LLMs:** Host open-source models like DeepSeek, Llama, Gemini, and Qwen locally.
    *   **Frontier LLMs:** Access models from providers like OpenAI, Anthropic, Google, and Mistral.

### Advanced Development Features

*   **Checkpoints for LLM Changes:** Automatically create Git checkpoints for changes made by the LLM, ensuring you can easily revert if needed.
*   **Lint Error Detection:** Built-in lint error detection helps maintain code quality by identifying potential issues early.
*   **Native Tool Use:** The AI can use native tools like the terminal and MCP servers for enhanced functionality.
*   **Fast Apply:** Quickly apply AI-generated changes to your code with a single click or shortcut.

### Community and Extensibility

*   **Community Support:** Join the official Discord for weekly contributor meetups and early access to new releases.
*   **MCP Integration:** Full support for the Model Context Protocol (MCP), allowing for extending capabilities with external tools and data sources.

## 3. Prerequisites

Before installing Void AI, ensure your system meets the following requirements:
- **Operating System:** Windows, macOS, or Linux.
- **Hardware:** Minimum 4GB RAM (8GB recommended for AI features).
- **Internet Connection:** Required for initial setup and model downloads (optional for local models).
- **Git:** Installed for version control integration (optional but recommended).

## 4. Getting Started with Void AI

### Download and Install Void AI

1. Visit the official Void AI website or GitHub repository at <https://github.com/voideditor/void>.
2. Download the latest release for your operating system (Windows, macOS, or Linux).
3. Install Void AI by following the on-screen instructions.
4. Launch Void AI after installation.

### Open a Folder (Workspace) in Void AI

1. Click on "File" in the top menu.
2. Select "Open Folder" and choose your project directory.
3. Void AI will load the workspace, displaying your files in the sidebar.

### Explore the User Interface

- **Sidebar:** Displays your project files and folders.
- **Editor Area:** Where you write and edit code.
- **AI Chat Panel:** Accessible via the sidebar or shortcut, for interacting with the AI.
- **Status Bar:** Shows information about the current file, AI model, and other details.

## 5. AI Features in Void AI

### Tab Autocomplete

Void AI's Tab Autocomplete feature allows you to generate code suggestions and accept them with a single key press.

1. Start typing code in the editor.
2. Press `Tab` to accept the AI-generated suggestion.
3. Review and adjust the code as needed.

### Quick Edit

Quick Edit enables inline modifications to selected code blocks using AI.

1. Select a block of code in the editor.
2. Press the Quick Edit shortcut (default: `Ctrl + K` or `Cmd + K`).
3. Enter your instructions in the prompt that appears.
4. The AI will modify the selected code accordingly.

### AI Chat

The AI Chat feature provides a versatile interface for interacting with the AI in different modes.

#### Agent Mode

In Agent Mode, the AI can perform a wide range of actions, including searching, creating, editing, and deleting files and folders. It also has access to the terminal and MCP tools.

1. Open the AI Chat panel.
2. Select Agent Mode.
3. Enter your query or command (e.g., "Create a new Python script for a weather app").
4. The AI will execute the actions and provide feedback.

#### Gather Mode

Gather Mode is a restricted version of Agent Mode that allows the AI to read and search the codebase without making any modifications. This is ideal for information gathering and analysis.

1. Open the AI Chat panel.
2. Select Gather Mode.
3. Enter your query (e.g., "Summarize the main functions in main.py").
4. The AI will analyze the codebase and provide insights.

#### Normal Chat

Normal Chat is a standard conversational AI for troubleshooting, brainstorming, and general coding questions.

1. Open the AI Chat panel.
2. Select Normal Chat.
3. Enter your question (e.g., "How do I implement a binary search in JavaScript?").
4. The AI will respond with code examples and explanations.

### Vibe Coding

#### What is Vibe Coding?

Vibe coding is a modern, AI-assisted approach to software development that emphasizes intuition, iteration, and collaboration with AI tools rather than traditional, structured planning. In vibe coding, developers provide high-level descriptions, "vibes," or loose ideas to the AI, which generates code snippets, structures, or even entire applications. The process is iterative: the developer reviews, tweaks, and refines the AI's output, often through prompts, to achieve the desired result. This method is particularly useful for prototyping, creative projects, and rapid development, as it allows for a more fluid and less rigid workflow. Vibe coding reduces the cognitive load of detailed planning and focuses on the "vibe" or feel of the code, making it accessible for both novice and experienced developers.

#### Roots of Vibe Coding

Vibe coding emerged in the mid-2020s alongside the rise of advanced AI code editors and large language models (LLMs) like those from OpenAI, Anthropic, and others. It was popularized by tools such as Cursor, an AI code editor that introduced features for prompt-based code generation, allowing users to "vibe" with the AI to build applications. The term "vibe coding" gained traction in 2025, as seen in blog posts, YouTube tutorials, and community discussions on platforms like Reddit and Medium. Its roots can be traced to:

- **AI Code Completion Tools**: Early tools like GitHub Copilot (2021) introduced AI-generated code suggestions, laying the foundation for more intuitive coding.
- **Prompt Engineering**: The rise of LLMs like GPT-4 (2023) and Claude (2024) enabled developers to use natural language prompts to generate code, shifting from traditional coding to iterative prompting.
- **Open-Source AI Editors**: Tools like Void AI and Replit (2025) democratized vibe coding by providing free, local, and customizable alternatives to proprietary tools like Cursor.
- **Community Influence**: Discussions in r/LocalLLaMA and MLOps Community highlighted vibe coding as a way to use local LLMs for relaxed, creative development, emphasizing privacy and control.

Vibe coding represents a shift from "structured coding" to "conversational development," where the AI acts as a co-pilot, responding to the developer's mood or "vibe" to produce code.

#### The Story of Andrej Karpathy and Vibe Coding

Andrej Karpathy, a prominent AI researcher and engineer, played a pivotal role in shaping the landscape of AI-assisted coding, indirectly influencing the rise of vibe coding. Born in Slovakia and raised in Canada, Karpathy earned his Ph.D. at Stanford University under Fei-Fei Li, focusing on deep learning and computer vision. His work on convolutional neural networks and recurrent neural networks, particularly for image and sequence processing, laid foundational stones for modern generative AI models. By 2017, Karpathy had joined Tesla as Director of AI, leading the development of neural networks for autonomous driving, before moving to OpenAI to work on large-scale language models.

In 2024, Karpathy founded Eureka Labs, a company dedicated to advancing AI education and tools, with a mission to make AI accessible and intuitive for creators. His widely-followed blog posts and YouTube lectures, such as those on neural network architectures and "Zero to Hero" coding tutorials, popularized the idea of breaking down complex AI tasks into intuitive, iterative steps. Karpathy's philosophy of "hacking together" prototypes using AI tools resonated with the vibe coding movement, emphasizing rapid experimentation over rigid planning. His public demonstrations of using LLMs to generate code snippets via natural language prompts inspired tools like Cursor and Void AI, which embedded this iterative, conversational approach into their workflows.

Karpathy's influence on vibe coding is evident in his advocacy for accessible, hands-on AI development. In a 2025 interview on X, he described coding with AI as "a dance between human intuition and machine precision," a sentiment that captures the essence of vibe coding. His work on open-source projects like nanoGPT, a lightweight implementation of GPT, further empowered developers to integrate AI models locally, aligning with Void AI's emphasis on data control and open-source ethos. By championing intuitive workflows and democratizing AI, Karpathy helped pave the way for vibe coding to become a mainstream approach in tools like Void AI, where developers can express high-level ideas and iteratively refine AI-generated outputs.

#### Vibe Coding in Void AI

Void AI fully supports vibe coding through its AI-powered features, allowing developers to build applications iteratively with minimal planning. Here's how to use vibe coding in Void AI:

1. **Set Up Your AI Model**:
   - Configure a local or remote LLM (e.g., Llama or Claude) in Void AI's settings for privacy and speed.
   - Use the "Direct LLM Connection" to connect to your preferred model.

2. **Start with a Vibe Prompt in AI Chat**:
   - Open the AI Chat panel and select Agent Mode for full AI capabilities.
   - Enter a high-level prompt describing your "vibe" (e.g., "Create a simple weather app with a clean UI, using Python and Flask, vibe: minimalist and modern").
   - The AI will generate initial code structures, files, and folders.

3. **Iterate with Quick Edit and Tab Autocomplete**:
   - Use Quick Edit to select generated code and refine it (e.g., "Make this UI more responsive, vibe: sleek and mobile-friendly").
   - Press `Tab` to accept AI suggestions as you type, adjusting the code on the fly.

4. **Use Gather Mode for Research**:
   - Switch to Gather Mode to analyze existing code or gather ideas without modifications (e.g., "Summarize weather APIs and suggest integration, vibe: efficient and reliable").

5. **Apply Changes and Checkpoint**:
   - Use Fast Apply to quickly implement AI suggestions.
   - Void AI automatically creates Git checkpoints for AI-generated changes, allowing easy rollback.

6. **Test and Refine**:
   - Run and debug the code within Void AI.
   - Iterate by prompting the AI with feedback (e.g., "Fix this bug, vibe: clean and optimized").

Vibe coding in Void AI is enhanced by MCP servers for external tools (e.g., weather API integration) and native terminal access, making it a powerful tool for creative, AI-driven development.

## 6. LLM and Model Integration

### Use Any AI Model

Void AI offers the flexibility to use a wide variety of Large Language Models (LLMs).

### Full Data Control

Retain complete control over your data by hosting models locally or connecting directly to providers.

### Direct LLM Connection

Connect directly to any LLM provider, cutting out the middleman and avoiding private backends. This includes:

#### Private LLMs

Host open-source models like DeepSeek, Llama, Gemini, and Qwen locally.

#### Frontier LLMs

Access models from providers like OpenAI, Anthropic, Google, and Mistral.

## 7. Advanced Development Features

### Checkpoints for LLM Changes

Automatically create Git checkpoints for changes made by the LLM, ensuring you can easily revert if needed.

### Lint Error Detection

Built-in lint error detection helps maintain code quality by identifying potential issues early.

### Native Tool Use

The AI can use native tools like the terminal and MCP servers for enhanced functionality.

### Fast Apply

Quickly apply AI-generated changes to your code with a single click or shortcut.

## 8. GitHub Integration

### Initializing a Git Repository

1. Open your workspace in Void AI.
2. Open the terminal (View > Terminal).
3. Run `git init` to initialize the repository.

### Staging and Committing Changes

1. Make changes to your files.
2. Stage changes using the Source Control sidebar or `git add .`.
3. Commit with `git commit -m "Your commit message"`.

### Connecting to GitHub (Remote Repositories)

1. Create a repository on GitHub.
2. Add the remote: `git remote add origin https://github.com/your-username/your-repo.git`.
3. Push your code: `git push -u origin main`.

### Pushing and Pulling Changes

- Push: `git push`
- Pull: `git pull`

### Branch Management

- Create branch: `git checkout -b new-branch`
- Switch branch: `git checkout main`
- Merge branch: `git merge new-branch`

### Resolving Merge Conflicts

1. Pull latest changes.
2. Edit conflicting files to resolve differences.
3. Stage resolved files and commit.

## 9. Installing Extensions

1. Open the Extensions view (Ctrl+Shift+X).
2. Search for the extension.
3. Click Install.
4. Reload Void AI if prompted.

## 10. Running and Debugging Your Code

1. Open your code file.
2. Set breakpoints by clicking in the gutter.
3. Select "Run and Debug" in the sidebar.
4. Choose your configuration and start debugging.

## 11. Model Context Protocol (MCP) Servers

### What are MCP Servers?

MCP Servers are independent tools that provide context-specific data and capabilities to AI models through the Model Context Protocol. They act as intermediaries, delivering real-time information from external sources or performing actions on behalf of the AI.

### What Can MCP Servers Do?

MCP servers can:
- Fetch real-time data (e.g., weather, stock prices).
- Perform computations or actions (e.g., database queries, API calls).
- Provide domain-specific knowledge or tools.
- Enhance AI capabilities without modifying the core LLM.

### Use Cases for MCP Servers in Void AI

- **Weather Integration:** Use a weather MCP server to fetch real-time data for weather-related apps.
- **Stock Market Tools:** Integrate stock data for financial applications.
- **Database Access:** Query local or remote databases directly from AI prompts.
- **Custom Tools:** Create servers for specific project needs, like code analysis or deployment.

### How to Set Up, Install, and Run an MCP Server

#### Prerequisites

- Python 3.10+
- Virtual environment tool (e.g., venv or uv)
- Basic knowledge of Python and APIs

#### Environment Setup

1. Create a virtual environment:
   ```bash
   uv venv
   ```
2. Activate the environment:
   - Windows: `venv\Scripts\activate`
   - Unix: `source venv/bin/activate`
3. Install FastMCP:
   ```bash
   uv pip install fastmcp
   ```

#### Building Your Server

Building an MCP server involves defining tools that the AI can call. Below are several examples of MCP servers, including the weather server and additional ones to demonstrate variety.

##### Example 1: Weather Server

This example demonstrates a weather server that exposes tools to fetch weather alerts and forecasts using the National Weather Service API. It is built using the Python MCP SDK.

**`server.py` content:**

```python
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather")
NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "void-ai-mcp-manual/1.0"

async def make_nws_request(url: str) -> dict[str, Any] | None:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

def format_alert(feature: dict) -> str:
    props = feature["properties"]
    return f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
Instructions: {props.get('instruction', 'No specific instructions provided')}
"""

@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        return "Unable to fetch alerts or no alerts found."

    if not data["features"]:
        return "No active alerts for this state."

    alerts = [format_alert(feature) for feature in data["features"]]
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        return "Unable to fetch forecast data for this location."

    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        return "Unable to fetch detailed forecast."

    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    return "\n---\n".join(forecasts)

def main():
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
```

##### Example 2: Filesystem Server

This server provides secure file operations with configurable access controls. It allows the AI to read, write, and manage files in a specified directory.

- **Language:** Python
- **Key Features:** Secure file operations, configurable access controls, support for read/write/delete.
- **Use Case:** Enabling AI to manage project files without risking system-wide access.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem>

For full code, refer to the repository. Configuration example:

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/path/to/allowed/files"
  ]
}
```

##### Example 3: Git Server

This server provides tools to read, search, and manipulate Git repositories.

- **Language:** Python
- **Key Features:** Git repository reading, searching, committing, branching, and merging.
- **Use Case:** Allowing AI to manage version control operations, such as committing changes or creating branches.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers/tree/main/src/git>

For full code, refer to the repository. Example usage in Agent Mode: "Commit the current changes with message 'Update weather app'".

##### Example 4: Puppeteer Server

This server enables browser automation and web scraping using Puppeteer.

- **Language:** JavaScript (Node.js)
- **Key Features:** Browser control, screenshot capture, DOM manipulation, web scraping.
- **Use Case:** Allowing AI to interact with web pages, fetch dynamic content, or automate browser tasks.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers-archived/tree/main/src/puppeteer>

For full code, refer to the archived repository. Example tool definition:

```javascript
@mcp.tool()
async function browseWebsite(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const content = await page.content();
  await browser.close();
  return content;
}
```

##### Example 5: Google Maps Server

This server provides location services, directions, and place details using the Google Maps API.

- **Language:** Python
- **Key Features:** Geocoding, directions, place search, distance calculation.
- **Use Case:** Integrating location-based services into AI prompts, e.g., "Get directions from New York to Boston".
- **Repository Link:** <https://github.com/modelcontextprotocol/servers-archived/tree/main/src/google-maps>

For full code, refer to the archived repository. Requires Google Maps API key.

##### Advanced Integration Examples

Advanced MCP servers can be created to integrate more complex functionalities, enabling sophisticated interactions with external systems. Below are examples of advanced MCP servers that extend Void AI's capabilities.

###### Example 6: Machine Learning Server

This server allows the AI to run machine learning models, perform predictions, and train simple models using libraries like scikit-learn or TensorFlow.

- **Language:** Python
- **Key Features:** Model loading, prediction, training, data preprocessing.
- **Use Case:** Enabling AI to perform ML tasks, such as classifying data or generating predictions within Void AI prompts.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers/tree/main/src/ml>

**`server.py` content (simplified):**

```python
from mcp.server.fastmcp import FastMCP
import joblib

mcp = FastMCP("ml")

@mcp.tool()
async def load_model(model_path: str) -> str:
    """Load a pre-trained ML model."""
    try:
        model = joblib.load(model_path)
        return "Model loaded successfully."
    except Exception as e:
        return "Error loading model: " + str(e)

@mcp.tool()
async def predict(model_path: str, data: list) -> list:
    """Make predictions using a loaded model."""
    try:
        model = joblib.load(model_path)
        predictions = model.predict(data)
        return predictions.tolist()
    except Exception as e:
        return "Error making prediction: " + str(e)

def main():
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
```

###### Example 7: Database Server

This server provides secure access to databases, allowing the AI to execute SQL queries and retrieve data.

- **Language:** Python
- **Key Features:** SQL query execution, connection management, data fetching.
- **Use Case:** Querying databases for real-time data in AI-driven applications.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers/tree/main/src/database>

**`server.py` content (simplified):**

```python
from mcp.server.fastmcp import FastMCP
import sqlite3

mcp = FastMCP("database")

@mcp.tool()
async def execute_query(db_path: str, query: str) -> list:
    """Execute an SQL query on a SQLite database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(query)
        results = cursor.fetchall()
        conn.close()
        return results
    except Exception as e:
        return "Error executing query: " + str(e)

def main():
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
```

###### Example 8: API Gateway Server

This server acts as a gateway to call external APIs, handling authentication and rate limiting.

- **Language:** Python
- **Key Features:** API call execution, header management, response parsing.
- **Use Case:** Integrating with third-party APIs like Stripe or Twitter within Void AI.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers/tree/main/src/apigateway>

**`server.py` content (simplified):**

```python
from mcp.server.fastmcp import FastMCP
import requests

mcp = FastMCP("apigateway")

@mcp.tool()
async def call_api(url: str, method: str, headers: dict, body: dict) -> dict:
    """Call an external API."""
    try:
        response = requests.request(method, url, headers=headers, json=body)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return "Error calling API: " + str(e)

def main():
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
```

###### Example 9: Code Execution Server

This server allows the AI to execute code snippets in a sandboxed environment.

- **Language:** Python
- **Key Features:** Code execution, output capturing, error handling.
- **Use Case:** Testing code snippets or running scripts from AI prompts.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers/tree/main/src/codeexec>

**`server.py` content (simplified):**

```python
from mcp.server.fastmcp import FastMCP
from subprocess import run, PIPE

mcp = FastMCP("codeexec")

@mcp.tool()
async def execute_code(language: str, code: str) -> str:
    """Execute code in a sandboxed environment."""
    try:
        if language == "python":
            result = run(['python', '-c', code], stdout=PIPE, stderr=PIPE, timeout=10)
            return result.stdout.decode() if result.returncode == 0 else "Error: " + result.stderr.decode()
        return "Unsupported language"
    except Exception as e:
        return "Error executing code: " + str(e)

def main():
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
```

###### Example 10: Image Generation Server

This server uses libraries like Stable Diffusion to generate images from text prompts.

- **Language:** Python
- **Key Features:** Image generation, style customization, output saving.
- **Use Case:** Generating visual assets for UI/UX or documentation within Void AI.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers/tree/main/src/imagegen>

**`server.py` content (simplified):**

```python
from mcp.server.fastmcp import FastMCP
from diffusers import StableDiffusionPipeline
import torch

mcp = FastMCP("imagegen")
pipe = StableDiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4")
pipe.to("cuda" if torch.cuda.is_available() else "cpu")

@mcp.tool()
async def generate_image(prompt: str, output_path: str) -> str:
    """Generate an image from a text prompt."""
    try:
        image = pipe(prompt).images[0]
        image.save(output_path)
        return "Image generated and saved to " + output_path
    except Exception as e:
        return "Error generating image: " + str(e)

def main():
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
```

###### Example 11: Sequential Thinking Server

The Sequential Thinking MCP server enhances AI reasoning by guiding the AI through a structured, iterative process to solve complex problems. It breaks down tasks into phases (e.g., define, research, analyze, synthesize, conclude), making it ideal for code generation, debugging, or strategic planning.

- **Language:** Python
- **Key Features:** Structured reasoning, iterative problem-solving, progress tracking, summary generation.
- **Use Case:** Solving complex tasks like code debugging, planning a web app, or analyzing data with step-by-step reasoning.
- **Repository Link:** <https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking>

**`server.py` content (simplified):**

```python
from mcp.server.fastmcp import FastMCP
from typing import Dict, List, Any
import json
import logging

mcp = FastMCP("sequentialthinking")
logging.basicConfig(filename='debug.log', level=logging.DEBUG)

@mcp.tool()
async def sequential_think(query: str, phase: str = "start") -> Dict[str, Any]:
    """Guide the AI through a structured thinking process.

    Args:
        query: The problem or task to solve.
        phase: The current phase of reasoning (start, define, research, analyze, synthesize, conclude).
    """
    try:
        # Simulate reasoning phases
        phases = ["define", "research", "analyze", "synthesize", "conclude"]
        current_index = phases.index(phase) if phase in phases else 0
        response = {"query": query, "phase": phase, "output": "", "next_phase": ""}

        if phase == "start" or phase == "define":
            response["output"] = f"Defining problem: {query}"
            response["next_phase"] = "research"
        elif phase == "research":
            response["output"] = "Gathering relevant information and resources."
            response["next_phase"] = "analyze"
        elif phase == "analyze":
            response["output"] = "Analyzing components and identifying patterns."
            response["next_phase"] = "synthesize"
        elif phase == "synthesize":
            response["output"] = "Combining insights to form a solution."
            response["next_phase"] = "conclude"
        elif phase == "conclude":
            response["output"] = f"Final solution for {query}: [Generated solution]"
            response["next_phase"] = "complete"

        logging.debug(f"Processed phase {phase} for query: {query}")
        return response
    except Exception as e:
        logging.error(f"Error in sequential_think: {str(e)}")
        return {"error": str(e), "phase": phase, "next_phase": "error"}

def main():
    mcp.run(transport='stdio')

if __name__ == "__main__":
    main()
```

**Setup Guide for Sequential Thinking MCP Server:**

1. **Prerequisites**:
   - Python 3.10+ installed.
   - Virtual environment tool (e.g., `uv` or `venv`).
   - Basic knowledge of Python and JSON-RPC.
   - Git installed for cloning repositories.
   - Void AI installed and configured with a compatible LLM (e.g., Llama, Claude).

2. **Environment Setup**:
   - Create and activate a virtual environment:
     ```bash
     uv venv
     source venv/bin/activate  # Unix
     venv\Scripts\activate  # Windows
     ```
   - Install the FastMCP SDK:
     ```bash
     uv pip install fastmcp
     ```

3. **Download and Install the Sequential Thinking Server**:
   - Clone the MCP servers repository:
     ```bash
     git clone https://github.com/modelcontextprotocol/servers.git
     cd servers/src/sequentialthinking
     ```
   - Alternatively, create a new `server.py` file and copy the simplified code above.

4. **Customize the Server (Optional)**:
   - Modify `server.py` to add custom reasoning phases (e.g., "validate" for code generation).
   - Add integrations with other MCP servers (e.g., Web Search or Git) for enhanced research capabilities.
   - Configure logging to write to `stderr` or a file (e.g., `debug.log`) to avoid corrupting JSON-RPC messages.

5. **Run the Server**:
   - Start the server using:
     ```bash
     uv run server.py
     ```
   - For HTTP transport, use:
     ```bash
     uv run server.py --transport http --port 8080
     ```
   - Ensure no print statements go to `stdout` to prevent JSON-RPC corruption.

6. **Connect to Void AI**:
   - In Void AI, open the AI Chat panel and configure the MCP server in settings:
     - **Transport**: `stdio` (default) or `http` (if using `--transport http`).
     - **Command**: `uv run server.py` (adjust path to your `server.py`).
     - **Port**: Specify if using HTTP (e.g., 8080).
   - Test in Agent Mode with a prompt like: "Use sequential thinking to debug a Python script that crashes on large datasets."

7. **Example Usage in Void AI**:
   - **Prompt**: "Plan a Flask app for task management using sequential thinking."
   - **AI Interaction**:
     - **Define**: AI clarifies requirements (e.g., user auth, task CRUD).
     - **Research**: AI fetches Flask docs or samples via another MCP server.
     - **Analyze**: AI outlines routes and database schema.
     - **Synthesize**: AI generates code files.
     - **Conclude**: AI provides a deployment plan and testing steps.
   - Use Quick Edit or Fast Apply to refine outputs, with Git checkpoints for safety.

8. **Tips for Success**:
   - Start with simple prompts to test the reasoning loop.
   - Monitor `debug.log` for troubleshooting tool calls.
   - Chain with other MCP servers (e.g., Git for commits, Database for data queries).
   - Update `sequential_think` to handle domain-specific tasks (e.g., add a "validate" phase for code linting).
   - Contribute custom phases or integrations to the GitHub repository.

9. **Troubleshooting**:
   - **Connection Issues**: Verify the server is running and the correct transport/port is set in Void AI.
   - **JSON-RPC Errors**: Ensure no `stdout` output; redirect logs to `stderr`.
   - **Performance**: Use a fast LLM (e.g., Kimi K2 on Groq) for quicker reasoning cycles.
   - **Community Help**: Check the Void AI Discord or GitHub issues for support.

The Sequential Thinking MCP server enhances Void AI's Agent Mode by providing structured reasoning, making it ideal for complex tasks like code debugging, app planning, or data analysis. For full details, refer to the repository or Void AI's MCP documentation.

#### Running the MCP Server

Once your `server.py` file is created, you can run it from your activated virtual environment:

```bash
uv run server.py
```

This command starts the MCP server, which will listen for messages from MCP hosts (like Void AI). For STDIO-based servers, it's crucial **not to print anything to standard output (stdout)**, as this can corrupt the JSON-RPC messages. Use a logging library that writes to `stderr` or files for debugging [2].

#### Connecting to Void AI

Void AI, being an MCP client, can connect to local or remote MCP servers. The exact configuration steps within Void AI might vary slightly but generally involve specifying the server's address and port. Refer to Void AI's internal documentation or settings for connecting external MCP servers.

## 12. Community and Support

Void AI thrives on its open-source nature and active community. Engaging with the community is a great way to get support, share your work, and contribute to the future of the editor.

### Community Support

Engage with the Void AI community through various channels for support, discussions, and to stay up-to-date with the latest developments.

#### Discord

Join the official Void AI Discord server to participate in weekly contributor meetups, get early access to new releases, and connect with other users and developers.

#### GitHub

Contribute to the project, report issues, and explore the source code on the official [voideditor/void repository](https://github.com/voideditor/void). The GitHub repository is the central hub for all development and collaboration.

### MCP Integration

Full support for the Model Context Protocol (MCP) allows for extending Void AI's capabilities by connecting to external tools and data sources. This powerful feature enables you to create a highly customized and intelligent development environment tailored to your specific needs.

## 13. Conclusion

Void AI offers a powerful, open-source, and AI-driven coding experience. By combining the familiarity of VS Code with advanced AI capabilities and flexible model integration, it empowers developers with enhanced productivity and control. This manual provides a foundation for using Void AI; further exploration of its features and community resources will unlock its full potential.

### References

[1] Model Context Protocol. *What is the Model Context Protocol (MCP)?* [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)
[2] Model Context Protocol. *Build an MCP server*. [https://modelcontextprotocol.io/docs/develop/build-server](https://modelcontextprotocol.io/docs/develop/build-server)

# Hyperlink Index
1. <https://github.com/voideditor/void>
2. <https://github.com/your-username/your-repo.git>
3. <https://modelcontextprotocol.io/>
4. <https://modelcontextprotocol.io/docs/develop/build-server>
5. <https://voideditor.com/>