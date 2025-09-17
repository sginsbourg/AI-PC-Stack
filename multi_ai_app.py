import gradio as gr
import os
import threading
import time
import subprocess
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

# Add multi-agent import
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
    status_app.run(port=5000, host='127.0.0.1', debug=False, use_reloader=False)

# Start status server
status_thread = threading.Thread(target=start_status_server, daemon=True)
status_thread.start()

def start_textgen_webui():
    """Start the text-generation-webui server in background on a different port"""
    global textgen_process
    if textgen_process and textgen_process.poll() is None:
        print("TextGen WebUI is already running.")
        return
    
    try:
        # Change to textgen directory and start server
        os.chdir(TEXTGEN_PATH)
        # Run server.py with listen and custom port; assumes requirements are installed in its env
        cmd = [
            'python', 'server.py',
            '--listen',
            f'--port={TEXTGEN_PORT}',
            '--api'  # Enable API if needed
        ]
        textgen_process = subprocess.Popen(cmd, cwd=TEXTGEN_PATH, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"Started TextGen WebUI on http://127.0.0.1:{TEXTGEN_PORT}")
        time.sleep(5)  # Give it time to start
    except Exception as e:
        print(f"Error starting TextGen WebUI: {e}")

def background_pdf_processing():
    """Process PDFs in the background while UI is running with progress tracking"""
    global pdf_processing_complete, pdf_count, processed_count, rag_system_ready
    
    show_progress("Starting background PDF processing")
    
    # Check PDF directory and count files
    pdf_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    pdf_files = []
    
    if os.path.exists(pdf_path):
        for root, dirs, files in os.walk(pdf_path):
            for filename in files:
                if filename.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, filename))
    
    pdf_count = len(pdf_files)
    processed_count = 0
    
    # Process each PDF with progress tracking
    for pdf_file in pdf_files:
        try:
            # Simulate processing each PDF
            time.sleep(0.5)  # Simulate work
            processed_count += 1
            
        except Exception as e:
            print(f"Error processing {pdf_file}: {e}")
    
    pdf_processing_complete = True
    show_progress(f"Background processing complete. Processed {pdf_count} PDFs")
    
    # After PDFs are processed, initialize RAG system if needed
    if rag_available and pdf_count > 0:
        show_progress("Initializing RAG system in background")
        try:
            from rag_system import create_rag_system
            rag_chain = create_rag_system()
            rag_system_ready = rag_chain is not None
            if rag_system_ready:
                show_progress("RAG system initialized successfully")
            else:
                show_progress("RAG system initialization failed")
        except Exception as e:
            show_progress(f"RAG system error: {str(e)}")

# Start background processing thread
processing_thread = threading.Thread(target=background_pdf_processing, daemon=True)
processing_thread.start()

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
    with gr.Column(elem_classes=["gate-container"]):
        gr.Markdown(
            """
            # 🚀 AI Hub Gateway
            ### Your Central Hub for Advanced AI Applications
            Welcome to the AI Hub! Monitor system performance and access specialized AI tools.
            """,
            elem_classes=["card"]
        )
        
        # System status section
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
        
        # Action buttons
        with gr.Row(elem_classes=["button-group"]):
            refresh_btn = gr.Button("🔄 Refresh", variant="primary")
            settings_btn = gr.Button("⚙️ Settings", variant="secondary")
            help_btn = gr.Button("❓ Help", variant="secondary")
        
        # Tutorial section
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
        
        # Add JavaScript for real-time updates
        gr.HTML("""
        <script>
        // Function to update progress bar
        function updateProgress() {
            fetch('http://localhost:5000/progress')
                .then(response => response.json())
                .then(data => {
                    // Update progress bar if it exists
                    const progressBar = document.querySelector('input[type="range"]');
                    if (progressBar && data.progress) {
                        progressBar.value = data.progress;
                        progressBar.previousElementSibling.innerText = `PDF Processing Progress: ${Math.round(data.progress)}%`;
                    }
                    
                    // Update system stats
                    fetch('http://localhost:5000/system')
                        .then(response => response.json())
                        .then(systemData => {
                            // Update CPU and memory usage
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
        
        // Start progress updates when page loads
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(updateProgress, 1000);
        });
        </script>
        """)
    
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

        # New tab for Text Generation WebUI
        with gr.TabItem("🗣️ Text Generation UI", id="textgen"):
            gr.Markdown("# 🗣️ Oobabooga Text Generation WebUI")
            gr.Markdown("### Advanced LLM Interface for Text Generation")
            gr.HTML(f"""
            <iframe src="http://127.0.0.1:{TEXTGEN_PORT}" class="textgen-iframe"></iframe>
            <p style="text-align: center; margin-top: 10px;">
                <small>Embedded Text Generation WebUI (Port {TEXTGEN_PORT})</small>
            </p>
            """)

if __name__ == "__main__":
    print("🚀 Launching AI Hub Gateway...")
    print("🌐 UI will be available at: http://localhost:7860")
    print("📊 Status API available at: http://localhost:5000")
    print("⏳ PDF processing will continue in the background")
    print(f"🗣️ TextGen WebUI will launch on: http://127.0.0.1:{TEXTGEN_PORT}")
    
    # Start TextGen WebUI in background
    start_textgen_webui()
    
    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        inbrowser=True,
        share=False
    )
    
    # Cleanup on exit
    if textgen_process:
        textgen_process.terminate()
        