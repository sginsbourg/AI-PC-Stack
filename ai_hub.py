import gradio as gr
import subprocess
import sys
import time
import os
import json
import logging

# Set up logging to diagnose rendering issues
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CONFIG_FILE = "config.json"

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    raise ValueError("config.json must contain a list")
                logger.info("Loaded config: %s", data)
                return data
        except Exception as e:
            logger.error("Failed to parse config.json: %s", e)
    default_config = [
        {"app_name": "Application 1", "description": "Description 1", "filename": "script1.py"},
        {"app_name": "Application 2", "description": "Description 2", "filename": "script2.bat"},
        {"app_name": "Application 3", "description": "Description 3", "filename": "script3.py"},
    ]
    logger.info("Using default config: %s", default_config)
    return default_config

def save_config(data):
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(data, f, indent=2)
        logger.info("Configuration saved successfully")
    except Exception as e:
        logger.error("Failed to save config: %s", e)

def launch_target(file_name, status_box):
    start = time.perf_counter()
    full_path = os.path.abspath(file_name)

    if not os.path.isfile(full_path):
        logger.error("File not found: %s", full_path)
        return {status_box: {"value": f"Error: File '{full_path}' not found.", "elem_classes": "status-error"}}

    try:
        if file_name.lower().endswith(".py"):
            subprocess.Popen([sys.executable, full_path])
        elif file_name.lower().endswith(".bat"):
            subprocess.Popen(full_path, shell=True)
        else:
            logger.error("Unsupported file type: %s", file_name)
            return {status_box: {"value": "Error: Unsupported file type. Use .py or .bat", "elem_classes": "status-error"}}

        duration = time.perf_counter() - start
        logger.info("Launched %s in %.2f sec", file_name, duration)
        return {status_box: {"value": f"Launched '{file_name}' in {duration:.2f} sec.", "elem_classes": "status-success"}}
    except Exception as e:
        duration = time.perf_counter() - start
        logger.error("Failed to launch %s: %s", file_name, e)
        return {status_box: {"value": f"Failed to launch '{file_name}': {e} (after {duration:.2f} sec)", "elem_classes": "status-error"}}

def render_cards(apps):
    logger.info("Rendering cards for %d apps", len(apps))
    components = []
    # Clear existing content in cards-column
    with gr.Column(elem_id="cards-column"):
        if not apps:
            logger.warning("No apps to render")
            gr.Markdown("No applications available. Click 'Add New Application' to create one.")
            return apps

        for i, app in enumerate(apps):
            with gr.Row():
                app_name_tb = gr.Textbox(
                    value=app["app_name"],
                    label="Application Name",
                    interactive=True,
                    key=f"app_name_{i}"
                )
                desc_tb = gr.Textbox(
                    value=app["description"],
                    label="Description",
                    interactive=True,
                    lines=2,
                    max_lines=3,
                    key=f"desc_{i}"
                )
                file_tb = gr.Textbox(
                    value=app["filename"],
                    label="Filename (.py or .bat)",
                    interactive=True,
                    key=f"file_{i}"
                )
                launch_btn = gr.Button("Launch", variant="primary", key=f"launch_{i}")
                status_box = gr.Label(value="", visible=True, key=f"status_{i}")

                components.append({
                    "app_name_tb": app_name_tb,
                    "desc_tb": desc_tb,
                    "file_tb": file_tb,
                    "launch_btn": launch_btn,
                    "status_box": status_box,
                    "index": i
                })

                # Update data_state on textbox changes
                for tb in [app_name_tb, desc_tb, file_tb]:
                    tb.change(
                        fn=lambda apps, idx=i, name=app_name_tb.value, desc=desc_tb.value, fname=file_tb.value: [
                            {
                                "app_name": name if j == idx else a["app_name"],
                                "description": desc if j == idx else a["description"],
                                "filename": fname if j == idx else a["filename"]
                            }
                            for j, a in enumerate(apps)
                        ],
                        inputs=[gr.State(value=apps)],
                        outputs=[gr.State()]
                    )

    # Bind launch button events
    for comp in components:
        comp["launch_btn"].click(
            fn=launch_target,
            inputs=[comp["file_tb"], comp["status_box"]],
            outputs=[comp["status_box"]]
        )

    return apps

with gr.Blocks(css="style.css") as demo:
    with gr.Column(elem_classes="container"):
        gr.Markdown("<h1>AI Hub Dashboard - Manage & Launch Applications</h1>", elem_id="header")

        data_state = gr.State(load_config())
        save_status = gr.Label(value="", visible=False, elem_id="save-status")
        cards_column = gr.Column(elem_id="cards-column")

        add_btn = gr.Button("Add New Application", elem_id="btn-add")
        add_btn.click(
            fn=lambda apps: apps + [{"app_name": f"Application {len(apps)+1}", "description": "", "filename": ""}],
            inputs=[data_state],
            outputs=[data_state]
        ).then(
            fn=render_cards,
            inputs=[data_state],
            outputs=[cards_column]
        )

        def save_all(apps):
            save_config(apps)
            logger.info("Save configuration triggered")
            return {"value": "Configuration saved.", "visible": True}

        save_btn = gr.Button("Save Configuration", elem_id="btn-save")
        save_btn.click(
            fn=save_all,
            inputs=[data_state],
            outputs=[save_status]
        )

        # Initial render
        demo.load(
            fn=render_cards,
            inputs=[data_state],
            outputs=[cards_column]
        )

demo.launch(server_name="127.0.0.1", server_port=7860, inbrowser=True)