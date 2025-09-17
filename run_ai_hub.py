import time
import threading
from multi_ai_app import demo, stop_textgen_webui, stop_status_server, start_textgen_webui, TEXTGEN_PORT

def main():
    print("🚀 Launching AI Hub Gateway...")
    print("🌐 UI will be available at: http://localhost:7860")
    print("📊 Status API available at: http://localhost:5000")
    print(f"🗣️ TextGen WebUI will launch on: http://127.0.0.1:{TEXTGEN_PORT}")
    
    # Start TextGen WebUI
    start_textgen_webui()
    
    # Launch Gradio
    def run_gradio():
        demo.launch(
            server_name="127.0.0.1",
            server_port=7860,
            inbrowser=True,
            share=False
        )
    
    # Run in thread
    gradio_thread = threading.Thread(target=run_gradio, daemon=True)
    gradio_thread.start()
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down AI Hub...")
        stop_textgen_webui()
        stop_status_server()
        print("✓ Clean shutdown completed")

if __name__ == "__main__":
    main()