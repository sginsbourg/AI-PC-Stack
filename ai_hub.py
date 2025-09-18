import gradio as gr
import subprocess
import time
import sys

# List of default script file names for the cards
py_files = ["script1.py", "script2.py", "script3.py"]

# Store durations
stage_times = {}

def launch_script(py_file):
    start = time.perf_counter()
    try:
        result = subprocess.run(
            [sys.executable, py_file],
            capture_output=True,
            text=True,
            timeout=60
        )
        output = result.stdout if result.stdout else "(No output)"
        error = result.stderr if result.stderr else "(No error)"
        msg = f"Output:\n{output}\nError:\n{error}"
        status = "Success" if result.returncode == 0 else "Failed"
    except Exception as e:
        msg = f"Exception occurred:\n{str(e)}"
        status = "Error"
    end = time.perf_counter()
    duration = end - start
    msg += f"\n[Stage: Launch - {duration:.2f} sec, Status: {status}]"
    return msg

def quit_sure():
    # Returns a confirmation card; handling done in UI
    return gr.update(visible=True)

with gr.Blocks() as demo:
    gr.Markdown("# AI Hub Dashboard\nSelect a Python script, edit file name, and Launch. Quit option asks for confirmation.")

    result_boxes = []
    for default_py_file in py_files:
        with gr.Row():
            txt = gr.Textbox(value=default_py_file, label="Python File")
            btn = gr.Button("Launch")
            out = gr.Textbox(label="Result", lines=8)
            result_boxes.append(out)
            btn.click(launch_script, inputs=txt, outputs=out)

    quit_btn = gr.Button("Quit")
    confirm_card = gr.Row(visible=False)
    with confirm_card:
        gr.Markdown("**Are you sure you want to quit?**")
        yes_quit = gr.Button("Yes, Quit")
        no_quit = gr.Button("No")

    def ask_quit():
        return gr.Row.update(visible=True), ""

    def quit_program():
        sys.exit(0)

    quit_btn.click(ask_quit, outputs=[confirm_card, result_boxes[0]])  # Show confirmation
    yes_quit.click(quit_program)
    no_quit.click(lambda: gr.Row.update(visible=False), outputs=confirm_card)

demo.launch(server_name="127.0.0.1", server_port=7860, inbrowser=True)
