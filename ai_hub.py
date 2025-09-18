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
    logger.info(f"Attempting to launch file: {filename}")
    if not filename:
        logger.error("No filename provided for launch.")
        return "Error: No filename provided."
    if not os.path.isfile(filename):
        logger.error(f"File not found: {filename}")
        return f"Error: File '{filename}' not found."

    try:
        if filename.lower().endswith(".py"):
            subprocess.Popen([sys.executable, filename], creationflags=subprocess.DETACHED_PROCESS)
        elif filename.lower().endswith(".bat"):
            subprocess.Popen(filename, shell=True, creationflags=subprocess.DETACHED_PROCESS)
        else:
            logger.error(f"Unsupported file type: {filename}")
            return "Error: Unsupported file type. Use .py or .bat."
        logger.info(f"Successfully launched: {filename}")
        return f"Successfully launched '{filename}'."
    except Exception as e:
        logger.error(f"Failed to launch {filename}: {e}")
        return f"Failed to launch '{filename}': {e}"

def add_app(apps, name, desc, filename):
    """Adds a new application to the list."""
    logger.info(f"Adding application: {name}, filename: {filename}")
    if not name:
        logger.error("Application name is required.")
        return apps, "Error: Application name is required!"
    
    new_app = {"app_name": name, "description": desc, "filename": filename}
    apps.append(new_app)
    logger.info(f"Application '{name}' added successfully.")
    return apps, f"Application '{name}' added successfully!"

def delete_app(apps, index):
    """Deletes an application from the list by its index."""
    logger.info(f"Attempting to delete app at index: {index}")
    if 0 <= index < len(apps):
        deleted_name = apps[index]["app_name"]
        del apps[index]
        logger.info(f"Application '{deleted_name}' deleted successfully.")
        return apps, f"Application '{deleted_name}' deleted successfully!"
    logger.error(f"Invalid application index: {index}")
    return apps, "Error: Invalid application index!"

def get_app_ui(apps):
    """Returns HTML representation of apps for display"""
    if not apps:
        return "<div class='no-apps'>No applications available. Add applications using the form below.</div>"
    
    html = "<div class='apps-container'>"
    for i, app in enumerate(apps):
        html += f"""
        <div class='app-card' id='app-card-{i}'>
            <div class='card-header'>
                <h3>{app['app_name']}</h3>
            </div>
            <div class='card-content'>
                <p><strong>Description:</strong> {app['description'] or 'No description'}</p>
                <p><strong>Filename:</strong> {app['filename'] or 'No file specified'}</p>
                <div class='card-actions'>
                    <button class='launch-btn' onclick='handleLaunch({i})'>🚀 Launch</button>
                    <button class='delete-btn' onclick='handleDelete({i})'>🗑️ Delete</button>
                </div>
            </div>
        </div>
        """
    html += "</div>"
    return html

def update_app_display(apps):
    """Updates the app display and returns clean form fields"""
    return get_app_ui(apps), "", "", "", ""

# Create the main interface
with gr.Blocks(css="style.css") as demo:
    gr.Markdown("<h1>AI Hub Dashboard</h1>", elem_id="header")
    
    # State to hold the applications data
    app_data_state = gr.State(load_config())
    
    # Display area for applications
    apps_display = gr.HTML(value=get_app_ui(load_config()))
    
    # Form for adding new applications
    with gr.Row():
        with gr.Column(scale=2):
            gr.Markdown("### Add New Application")
            with gr.Row():
                app_name = gr.Textbox(label="Application Name", placeholder="Enter application name")
                app_file = gr.Textbox(label="Filename", placeholder="app.py or script.bat")
            app_desc = gr.Textbox(label="Description", placeholder="Enter application description")
            
            with gr.Row():
                add_btn = gr.Button("➕ Add Application", variant="primary")
                clear_btn = gr.Button("🗑️ Clear Form", variant="secondary")
        
        with gr.Column(scale=1):
            gr.Markdown("### Configuration")
            save_btn = gr.Button("💾 Save Configuration", variant="primary")
            status = gr.Label("Ready", label="Status")
    
    # Delete functionality
    delete_index = gr.Number(value=-1, visible=False, label="Delete Index")
    delete_trigger = gr.Button("Delete Trigger", visible=False)
    
    # Launch functionality
    launch_filename = gr.Textbox(value="", visible=False, label="Launch Filename")
    launch_trigger = gr.Button("Launch Trigger", visible=False)
    
    # Event handlers
    def add_application(apps, name, desc, filename):
        apps, message = add_app(apps, name, desc, filename)
        return apps, get_app_ui(apps), message, "", "", ""
    
    def handle_delete(apps, index):
        logger.info(f"handle_delete called with index: {index}")
        if index >= 0:
            apps, message = delete_app(apps, int(index))
            return apps, get_app_ui(apps), message, -1
        logger.warning("No application selected for deletion")
        return apps, get_app_ui(apps), "No application selected", -1
    
    def handle_launch(filename):
        logger.info(f"handle_launch called with filename: {filename}")
        return launch_app(filename), ""
    
    add_btn.click(
        add_application,
        inputs=[app_data_state, app_name, app_desc, app_file],
        outputs=[app_data_state, apps_display, status, app_name, app_desc, app_file]
    )
    
    clear_btn.click(
        lambda: ["", "", ""],
        outputs=[app_name, app_desc, app_file]
    )
    
    save_btn.click(
        save_config,
        inputs=[app_data_state],
        outputs=[status]
    )
    
    delete_trigger.click(
        handle_delete,
        inputs=[app_data_state, delete_index],
        outputs=[app_data_state, apps_display, status, delete_index]
    )
    
    launch_trigger.click(
        handle_launch,
        inputs=[launch_filename],
        outputs=[status, launch_filename]
    )
    
    # FIXED: JavaScript for interactive buttons
    demo.load(
        fn=None,
        inputs=None,
        outputs=None,
        js="""
        console.log('JavaScript loaded for AI Hub Dashboard');
        
        function handleDelete(index) {
            console.log('handleDelete called with index:', index);
            if (confirm('Are you sure you want to delete this application?')) {
                try {
                    const deleteIndexInput = document.querySelector('input[aria-label="Delete Index"]');
                    const deleteTriggerButton = document.querySelector('button[aria-label="Delete Trigger"]');
                    
                    if (!deleteIndexInput || !deleteTriggerButton) {
                        console.error('Delete components not found:', {
                            deleteIndexInput: !!deleteIndexInput,
                            deleteTriggerButton: !!deleteTriggerButton
                        });
                        alert('Error: Delete functionality is unavailable. Please refresh the page and try again.');
                        return;
                    }
                    
                    console.log('Setting delete index to:', index);
                    deleteIndexInput.value = index;
                    deleteIndexInput.dispatchEvent(new Event('input', { bubbles: true }));
                    deleteIndexInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('Triggering delete button click');
                    deleteTriggerButton.click();
                } catch (error) {
                    console.error('Error in handleDelete:', error);
                    alert('Error during deletion: ' + error.message);
                }
            }
        }

        function handleLaunch(index) {
            console.log('handleLaunch called with index:', index);
            try {
                // Find the state component containing app data
                const stateComponents = document.querySelectorAll('[data-testid="state-json"]');
                let appsData = null;
                
                for (const component of stateComponents) {
                    try {
                        const data = JSON.parse(component.value);
                        if (Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('app_name')) {
                            appsData = data;
                            break;
                        }
                    } catch (e) {
                        console.warn('Failed to parse state component:', e);
                        continue;
                    }
                }
                
                if (!appsData) {
                    console.error('No valid app data found in state components');
                    alert('Error: Application data not found. Please refresh the page.');
                    return;
                }
                
                if (index < 0 || index >= appsData.length) {
                    console.error('Invalid index:', index, 'Apps length:', appsData.length);
                    alert('Error: Application not found.');
                    return;
                }
                
                const filename = appsData[index].filename;
                if (!filename) {
                    console.error('No filename specified for app at index:', index);
                    alert('Error: No filename specified for this application.');
                    return;
                }
                
                const launchInput = document.querySelector('input[aria-label="Launch Filename"]');
                const launchButton = document.querySelector('button[aria-label="Launch Trigger"]');
                
                if (!launchInput || !launchButton) {
                    console.error('Launch components not found:', {
                        launchInput: !!launchInput,
                        launchButton: !!launchButton
                    });
                    alert('Error: Launch functionality is unavailable. Please refresh the page and try again.');
                    return;
                }
                
                console.log('Setting launch filename to:', filename);
                launchInput.value = filename;
                launchInput.dispatchEvent(new Event('input', { bubbles: true }));
                launchInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('Triggering launch button click');
                launchButton.click();
            } catch (error) {
                console.error('Error in handleLaunch:', error);
                alert('Error during launch: ' + error.message);
            }
        }
        """
    )

demo.launch(server_name="127.0.0.1", server_port=7860, inbrowser=True)