import time
import threading
from multi_ai_app import demo, stop_textgen_webui, stop_status_server

def keep_alive():
    """Keep the application running"""
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down AI Hub...")
        stop_textgen_webui()
        stop_status_server()

if __name__ == "__main__":
    # Start the keep-alive thread
    keep_alive_thread = threading.Thread(target=keep_alive, daemon=True)
    keep_alive_thread.start()
    
    # Launch the application
    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        inbrowser=True,
        share=False
    )