import gradio as gr
import subprocess
import sys
import time
import os
import json
import logging

# Set up logging for better debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CONFIG_FILE = "config.json"

def load_config():
    """Loads configuration from config.json, or creates a default if not found."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    raise ValueError("config.json must contain a list")
                return data
        except Exception as e:
            logger.error("Failed to load or parse config.json: %s", e)
    
    logger.info("config.json not found or invalid. Creating a default configuration.")
    default_config = [
        {"app_name": "Application 1", "description": "A default application.", "filename": "app1.py"},
        {"app_name": "Application 2", "description": "Another default application.", "filename": "app2.bat"},
    ]
    with open(CONFIG_FILE, "w") as f:
        json.dump(default_config, f, indent=2)
    return default_config

def save_config(apps):
    """Saves the current application list to config.json."""
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(apps, f, indent=2)
        logger.info("Configuration saved successfully.")
        return "Configuration saved successfully!"
    except Exception as e:
        logger.error("Failed to save config: %s", e)
        return f"Failed to save configuration: {e}"

def launch_app(filename):
    """Launches the specified Python or Batch script in a new process."""
    if not filename:
        return "Error: No filename provided."
    if not os.path.isfile(filename):
        return f"Error: File '{filename}' not found."

    try:
        if filename.lower().endswith(".py"):
            subprocess.Popen([sys.executable, filename], creationflags=subprocess.DETACHED_PROCESS)
        elif filename.lower().endswith(".bat"):
            subprocess.Popen(filename, shell=True, creationflags=subprocess.DETACHED_PROCESS)
        else:
            return "Error: Unsupported file type. Use .py or .bat."
        return f"Successfully launched '{filename}'."
    except Exception as e:
        return f"Failed to launch '{filename}': {e}"

def add_app(apps):
    """Adds a new blank application to the list."""
    new_app = {"app_name": f"New Application {len(apps) + 1}", "description": "", "filename": ""}
    apps.append(new_app)
    return apps

def delete_app(apps, index):
    """Deletes an application from the list by its index."""
    if 0 <= index < len(apps):
        del apps[index]
    return apps

def update_app_details(apps, app_index, app_name, description, filename):
    """Updates the details of a specific application."""
    if 0 <= app_index < len(apps):
        apps[app_index]["app_name"] = app_name
        apps[app_index]["description"] = description
        apps[app_index]["filename"] = filename
    return apps

def get_app_ui(apps):
    """Returns HTML representation of apps for display"""
    if not apps:
        return "<div class='no-apps'>No applications available. Click 'Add New Application' to create one.</div>"
    
    html = ""
    for i, app in enumerate(apps):
        html += f"""
        <div class='app-card'>
            <div class='card-header'>
                <h3>{app['app_name']}</h3>
            </div>
            <div class='card-content'>
                <p><strong>Description:</strong> {app['description']}</p>
                <p><strong>Filename:</strong> {app['filename']}</p>
                <button onclick='launchApp({i})'>Launch</button>
            </div>
        </div>
        """
    return html

# Simple static version that doesn't use dynamic UI updates
with gr.Blocks(css="style.css") as demo:
    gr.Markdown("<h1>AI Hub Dashboard</h1>", elem_id="header")
    
    app_data_state = gr.State(load_config())
    apps_display = gr.HTML(value=get_app_ui(load_config()))
    
    with gr.Row():
        app_name = gr.Textbox(label="Application Name")
        app_desc = gr.Textbox(label="Description")
        app_file = gr.Textbox(label="Filename (.py or .bat)")
    
    with gr.Row():
        add_btn = gr.Button("Add Application")
        save_btn = gr.Button("Save Configuration")
    
    status = gr.Label("")
    
    def add_application(apps, name, desc, filename):
        new_app = {"app_name": name, "description": desc, "filename": filename}
        apps.append(new_app)
        return apps, get_app_ui(apps), "", "", ""
    
    add_btn.click(
        add_application,
        inputs=[app_data_state, app_name, app_desc, app_file],
        outputs=[app_data_state, apps_display, app_name, app_desc, app_file]
    )
    
    save_btn.click(
        save_config,
        inputs=[app_data_state],
        outputs=[status]
    )

demo.launch(server_name="127.0.0.1", server_port=7860, inbrowser=True)