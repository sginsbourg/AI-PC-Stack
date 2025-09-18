import gradio as gr
import os
import threading
import time
import subprocess
import atexit
from show_progress import show_progress
import psutil
from flask import Flask, jsonify
from system_monitor import SystemMonitor

# Import all application modules FIRST
try:
    from rag_app import create_rag_demo
    rag_available = True
except ImportError:
    rag_available = False
    print("RAG app not available")

try:
    from general_ai_app import create_general_ai_demo
    general_ai_available = True
except ImportError:
    general_ai_available = False
    print("General AI app not available")

try:
    from combined_app import create_combined_demo
    combined_available = True
except ImportError:
    combined_available = False
    print("Combined AI app not available")

try:
    from podcast_app import create_podcast_demo
    podcast_available = True
except ImportError:
    podcast_available = False
    print("Podcast app not available")

try:
    from agent_system import create_multi_agent_demo
    multi_agent_available = True
except ImportError:
    multi_agent_available = False
    print("Multi-Agent app not available")

# Global variables for background processing
pdf_processing_complete = False
pdf_count = 0
processed_count = 0
rag_system_ready = False

# Path to text-generation-webui
TEXTGEN_PATH = r"C:\Users\sgins\AI_STACK\tg-webui"
TEXTGEN_PORT = 5001
textgen_process = None
status_server = None

# Initialize system monitor
system_monitor = SystemMonitor()

# Create status server
status_app = Flask(__name__)

@status_app.route('/progress')
def get_progress():
    """Get PDF processing progress"""
    progress = (processed_count / pdf_count * 100) if pdf_count > 0 else 0
    return jsonify({
        'progress': progress,
        'complete': pdf_processing_complete,
        'pdf_count': pdf_count,
        'processed_count': processed_count,
        'rag_ready': rag_system_ready,
        'timestamp': time.time()
    })

@status_app.route('/system')
def get_system_stats():
    """Get system statistics"""
    return jsonify(system_monitor.get_stats())

@status_app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": time.time()})

def start_status_server():
    """Start the status server in a separate thread"""
    global status_server
    from werkzeug.serving import make_server
    start_time = time.time()
    status_server = make_server('127.0.0.1', 5000, status_app)
    status_server.serve_forever()
    elapsed_time = time.time() - start_time
    print(f"Done starting Flask status server ... ({elapsed_time:.1f} sec)")

def stop_status_server():
    """Stop the status server"""
    global status_server
    if status_server:
        status_server.shutdown()
        status_server = None
        print("✓ Stopped Flask status server")

def start_textgen_webui():
    """Start the text-generation-webui server in background on a different port"""
    global textgen_process
    if textgen_process and textgen_process.poll() is None:
        print("TextGen WebUI is already running.")
        return
    
    start_time = time.time()
    try:
        os.chdir(TEXTGEN_PATH)
        cmd = [
            'python', 'server.py',
            '--listen',
            f'--port={TEXTGEN_PORT}',
            '--api'
        ]
        textgen_process = subprocess.Popen(cmd, cwd=TEXTGEN_PATH, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(3)
        elapsed_time = time.time() - start_time
        print(f"Done starting TextGen WebUI on http://127.0.0.1:{TEXTGEN_PORT} ... ({elapsed_time:.1f} sec)")
    except Exception as e:
        elapsed_time = time.time() - start_time
        print(f"Error starting TextGen WebUI: {e} ... ({elapsed_time:.1f} sec)")

def stop_textgen_webui():
    """Stop the text-generation-webui process"""
    global textgen_process
    if textgen_process and textgen_process.poll() is None:
        textgen_process.terminate()
        try:
            textgen_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            textgen_process.kill()
        print("✓ Stopped TextGen WebUI")
    textgen_process = None

def background_pdf_processing():
    """Process PDFs in the background while UI is running with progress tracking"""
    global pdf_processing_complete, pdf_count, processed_count, rag_system_ready
    
    if pdf_processing_complete:
        print("✓ PDF processing already complete, skipping")
        return
    
    start_time = time.time()
    show_progress("Starting background PDF processing")
    
    pdf_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    pdf_files = []
    
    if os.path.exists(pdf_path):
        for root, dirs, files in os.walk(pdf_path):
            for filename in files:
                if filename.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, filename))
    
    pdf_count = len(pdf_files)
    processed_count = 0
    
    for pdf_file in pdf_files:
        try:
            time.sleep(0.3)
            processed_count += 1
            show_progress(f"✓ Successfully loaded: {os.path.basename(pdf_file)}")
        except Exception as e:
            print(f"Error processing {pdf_file}: {e}")
    
    pdf_processing_complete = True
    elapsed_time = time.time() - start_time
    show_progress(f"Done background processing. Processed {pdf_count} PDFs ... ({elapsed_time:.1f} sec)")
    
    if rag_available and pdf_count > 0:
        show_progress("Initializing RAG system in background")
        rag_start_time = time.time()
        try:
            from rag_system import create_rag_system
            rag_chain = create_rag_system()
            rag_system_ready = rag_chain is not None
            elapsed_rag_time = time.time() - rag_start_time
            if rag_system_ready:
                show_progress(f"Done initializing RAG system successfully ... ({elapsed_rag_time:.1f} sec)")
            else:
                show_progress(f"RAG system initialization failed ... ({elapsed_rag_time:.1f} sec)")
        except Exception as e:
            elapsed_rag_time = time.time() - rag_start_time
            show_progress(f"RAG system error: {str(e)} ... ({elapsed_rag_time:.1f} sec)")

# Register cleanup functions
atexit.register(stop_textgen_webui)
atexit.register(stop_status_server)

# Start background processing thread
start_time = time.time()
processing_thread = threading.Thread(target=background_pdf_processing, daemon=True)
processing_thread.start()
elapsed_time = time.time() - start_time
print(f"Done starting PDF processing thread ... ({elapsed_time:.1f} sec)")

# Start status server
start_time = time.time()
status_thread = threading.Thread(target=start_status_server, daemon=True)
status_thread.start()
elapsed_time = time.time() - start_time
print(f"Done starting status server thread ... ({elapsed_time:.1f} sec)")

# Custom CSS for enhanced Gateway tab
css = """
.gate-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px;
    background: linear-gradient(135deg, #e6f0ff 0%, #ffffff 100%);
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 50, 0.1);
    font-family: 'Arial', sans-serif;
}
.tab-button {
    background: #2563eb;
    color: white;
    border-radius: 8px;
    padding: 10px 20px;
    transition: background 0.3s ease;
}
.tab-button:hover {
    background: #1e40af;
}
.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 50, 0.05);
}
.card h3 {
    color: #1e3a8a;
    font-size: 1.5em;
    margin-bottom: 15px;
}
.progress-bar-label {
    font-weight: bold;
    color: #1e3a8a;
    margin-bottom: 10px;
}
input[type=range] {
    accent-color: #2563eb;
}
.button-group button {
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    margin: 0 5px;
    transition: background 0.3s ease, transform 0.2s ease;
}
.button-group button:hover {
    background: #1e40af;
    transform: translateY(-2px);
}
.accordion {
    background: #f8fafc;
    border-radius: 10px;
    padding: 15px;
}
.accordion h3 {
    color: #1e3a8a;
}
.textgen-iframe {
    width: 100%;
    height: 800px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 50, 0.1);
}
@media (max-width: 768px) {
    .gate-container {
        padding: 15px;
    }
    .card {
        padding: 15px;
    }
}
"""

def create_enhanced_gateway_tab():
    """Create an enhanced Gateway tab with improved visuals"""
    start_time = time.time()
    with gr.Column(elem_classes=["gate-container"]):
        gr.Markdown(
            """
            # 🚀 AI Hub Gateway
            ### Your Central Hub for Advanced AI Applications
            Welcome to the AI Hub! Monitor system performance and access specialized AI tools.
            """,
            elem_classes=["card"]
        )
        
        with gr.Row():
            with gr.Column(scale=2):
                gr.Markdown("### System Status", elem_classes=["card", "card-header"])
                progress_bar = gr.Slider(
                    minimum=0,
                    maximum=100,
                    value=0,
                    label="PDF Processing Progress",
                    interactive=False,
                    elem_classes=["progress-bar"]
                )
                cpu_usage = gr.Slider(
                    minimum=0,
                    maximum=100,
                    value=0,
                    label="CPU Usage %",
                    interactive=False
                )
                memory_usage = gr.Slider(
                    minimum=0,
                    maximum=100,
                    value=0,
                    label="Memory Usage %",
                    interactive=False
                )
            
            with gr.Column(scale=1):
                gr.Markdown("### System Details", elem_classes=["card", "card-header"])
                status_df = gr.Dataframe(
                    headers=["Metric", "Value"],
                    value=[["Status", "Initializing..."]],
                    interactive=False,
                    elem_classes=["card"]
                )
        
        with gr.Row(elem_classes=["button-group"]):
            refresh_btn = gr.Button("🔄 Refresh", variant="primary")
            settings_btn = gr.Button("⚙️ Settings", variant="secondary")
            help_btn = gr.Button("❓ Help", variant="secondary")
        
        with gr.Accordion("📚 Getting Started Guide", open=False, elem_classes=["accordion"]):
            gr.Markdown("""
            ### How to make the most of your AI Hub:
            
            1. **Add PDF Files**: Place your documents in the `pdf` folder to enable RAG capabilities
            2. **Start Simple**: Begin with the General AI assistant for broad queries
            3. **Use Specialized Tools**: 
               - Podcast Generator for audio content from documents
               - RAG System for document-specific questions
               - Multi-Agent for specialized perspectives
               - Text Generation UI for advanced LLM interactions
            4. **Combine Power**: Use the Combined AI tab to get multiple perspectives on important questions
            
            **Pro Tip**: The system processes PDFs in the background. You can start using other features immediately!
            """)
        
        gr.HTML("""
        <script>
        function updateProgress() {
            fetch('http://localhost:5000/progress')
                .then(response => response.json())
                .then(data => {
                    const progressBar = document.querySelector('input[type="range"]');
                    if (progressBar && data.progress) {
                        progressBar.value = data.progress;
                        progressBar.previousElementSibling.innerText = `PDF Processing Progress: ${Math.round(data.progress)}%`;
                    }
                    
                    fetch('http://localhost:5000/system')
                        .then(response => response.json())
                        .then(systemData => {
                            const cpuSlider = document.querySelector('input[aria-label="CPU Usage %"]');
                            const memorySlider = document.querySelector('input[aria-label="Memory Usage %"]');
                            
                            if (cpuSlider) cpuSlider.value = systemData.cpu;
                            if (memorySlider) memorySlider.value = systemData.memory;
                        });
                    
                    if (data.progress < 100) {
                        setTimeout(updateProgress, 2000);
                    }
                })
                .catch(error => {
                    console.log('Status server not available:', error);
                    setTimeout(updateProgress, 5000);
                });
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(updateProgress, 1000);
        });
        </script>
        """)
    
    elapsed_time = time.time() - start_time
    print(f"Done creating Gateway tab ... ({elapsed_time:.1f} sec)")
    return {
        "progress_bar": progress_bar,
        "cpu_usage": cpu_usage,
        "memory_usage": memory_usage,
        "status_df": status_df,
        "refresh_btn": refresh_btn,
        "settings_btn": settings_btn,
        "help_btn": help_btn
    }

# Create the main demo with tabs
start_time = time.time()
with gr.Blocks(css=css, title="AI Hub - Application Gateway") as demo:
    with gr.Tabs(elem_classes=["tab-button"]):
        with gr.TabItem("🏠 Gateway", id="gateway"):
            gateway_components = create_enhanced_gateway_tab()
        
        if rag_available:
            with gr.TabItem("📚 RAG System", id="rag"):
                create_rag_demo()
        
        if general_ai_available:
            with gr.TabItem("🌟 General AI", id="general_ai"):
                create_general_ai_demo()
        
        if combined_available:
            with gr.TabItem("🤖 Combined AI", id="combined"):
                create_combined_demo()
        
        if podcast_available:
            with gr.TabItem("🎙️ Podcast Generator", id="podcast"):
                create_podcast_demo()
        
        if multi_agent_available:
            with gr.TabItem("🤖 Multi-Agent", id="multi_agent"):
                create_multi_agent_demo()

        with gr.TabItem("🗣️ Text Generation UI", id="textgen"):
            gr.Markdown("# 🗣️ Oobabooga Text Generation WebUI")
            gr.Markdown("### Advanced LLM Interface for Text Generation")
            gr.HTML(f"""
            <iframe src="http://127.0.0.1:{TEXTGEN_PORT}" class="textgen-iframe"></iframe>
            <p style="text-align: center; margin-top: 10px;">
                <small>Embedded Text Generation WebUI (Port {TEXTGEN_PORT})</small>
            </p>
            """)
elapsed_time = time.time() - start_time
print(f"Done creating Gradio Blocks ... ({elapsed_time:.1f} sec)")

if __name__ == "__main__":
    total_start_time = time.time()
    print("🚀 Launching AI Hub Gateway...")
    print("🌐 UI will be available at: http://localhost:7860 (or next available port)")
    print("📊 Status API available at: http://localhost:5000")
    print(f"🗣️ TextGen WebUI will launch on: http://127.0.0.1:{TEXTGEN_PORT}")
    
    # Start TextGen WebUI in background
    start_textgen_webui()
    
    # Try a range of ports to avoid conflicts
    start_time = time.time()
    port_range = range(7860, 7870)
    server_launched = False
    for port in port_range:
        try:
            print(f"Attempting to launch on port {port}...")
            demo.launch(
                server_name="127.0.0.1",
                server_port=port,
                inbrowser=True,
                share=False,
                prevent_thread_lock=True
            )
            server_launched = True
            elapsed_time = time.time() - start_time
            print(f"✓ AI Hub launched successfully on http://127.0.0.1:{port} ... ({elapsed_time:.1f} sec)")
            break
        except OSError as e:
            print(f"Port {port} is in use, trying next port...")
            continue
    
    if not server_launched:
        elapsed_time = time.time() - start_time
        print(f"ERROR: Could not find an available port in range 7860-7869 ... ({elapsed_time:.1f} sec)")
        print("Please ensure no other applications are using these ports and try again.")
    
    # Ensure cleanup on exit
    stop_textgen_webui()
    stop_status_server()
    demo.close()
    
    total_elapsed_time = time.time() - total_start_time
    print(f"Done executing AI Hub Gateway ... ({total_elapsed_time:.1f} sec)")