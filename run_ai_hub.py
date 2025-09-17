import time
import threading
import socket
from multi_ai_app import demo, stop_textgen_webui, stop_status_server, start_textgen_webui, TEXTGEN_PORT

def find_available_port(start_port=7860, end_port=7870):
    """Find an available port in the given range"""
    for port in range(start_port, end_port + 1):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return None

def run_gradio():
    """Run Gradio application with port handling"""
    # Find available port
    port = find_available_port(7860, 7870)
    if port is None:
        print("❌ ERROR: No available ports found in range 7860-7870")
        return
    
    print(f"🌐 Launching AI Hub on port {port}...")
    
    try:
        demo.launch(
            server_name="127.0.0.1",
            server_port=port,
            inbrowser=True,
            share=False,
            prevent_thread_lock=False  # This keeps the application running
        )
    except Exception as e:
        print(f"❌ Failed to launch Gradio: {e}")

def main():
    print("=" * 60)
    print("🚀 AI Hub Gateway - Starting All Services")
    print("=" * 60)
    
    # Start TextGen WebUI
    print("🗣️ Starting TextGen WebUI...")
    start_textgen_webui()
    
    # Start Gradio in a separate thread
    print("🌐 Starting AI Hub Interface...")
    gradio_thread = threading.Thread(target=run_gradio, daemon=True)
    gradio_thread.start()
    
    # Keep main thread alive and provide user feedback
    try:
        print("\n✅ AI Hub is now running!")
        print("📋 Available Services:")
        print(f"   • AI Hub Interface: http://localhost:7860 (or next available port)")
        print(f"   • Status API: http://localhost:5000")
        print(f"   • TextGen WebUI: http://127.0.0.1:{TEXTGEN_PORT}")
        print("\n🛑 Press Ctrl+C to stop all services")
        print("=" * 60)
        
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down AI Hub Gateway...")
        stop_textgen_webui()
        stop_status_server()
        print("✅ Clean shutdown completed")
        print("=" * 60)

if __name__ == "__main__":
    main()