import gradio as gr
import os
import threading
import time
from show_progress import show_progress

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
rag_system_ready = False

def background_pdf_processing():
    """Process PDFs in the background while UI is running"""
    global pdf_processing_complete, pdf_count, rag_system_ready
    
    show_progress("Starting background PDF processing")
    
    # Check PDF directory and count files
    pdf_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    if os.path.exists(pdf_path):
        for root, dirs, files in os.walk(pdf_path):
            for filename in files:
                if filename.lower().endswith('.pdf'):
                    pdf_count += 1
                    # Simulate processing each PDF
                    time.sleep(0.5)  # Simulate work
    
    pdf_processing_complete = True
    show_progress(f"Background processing complete. Found {pdf_count} PDFs")
    
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

# Custom CSS for better layout
css = """
.gate-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}
.app-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 15px;
    padding: 30px;
    margin: 15px;
    text-align: center;
    color: white;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    cursor: pointer;
}
.app-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}
.app-icon {
    font-size: 48px;
    margin-bottom: 15px;
}
.app-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
}
.app-description {
    font-size: 16px;
    opacity: 0.9;
}
.app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 30px;
}
.status-bar {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 10px;
    margin-top: 30px;
}
.tab-button {
    font-size: 16px;
    padding: 12px 24px;
}
.disabled-card {
    opacity: 0.6;
    background: linear-gradient(135deg, #cccccc 0%, #999999 100%);
}
.processing-indicator {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 5px;
    padding: 10px;
    margin: 10px 0;
}
"""

def create_gateway_tab():
    """Create the gateway/home tab"""
    with gr.Column(elem_classes=["gate-container"]):
        gr.Markdown("""
        # 🚀 AI Hub - Application Gateway
        ### Choose from our suite of AI-powered applications
        """)
        
        # Processing status indicator
        with gr.Column(visible=not pdf_processing_complete, elem_classes=["processing-indicator"]):
            gr.Markdown("""
            ⏳ **Background Processing**
            PDF files are being processed in the background. 
            You can continue using the interface while this completes.
            """)
        
        # Application Grid
        with gr.Row():
            with gr.Column(elem_classes=["app-grid"]):
                # Podcast App Card
                with gr.Column(elem_classes=["app-card"] if podcast_available else ["app-card", "disabled-card"]):
                    gr.Markdown("<div class='app-icon'>🎙️</div>")
                    gr.Markdown("<div class='app-title'>Podcast Generator</div>")
                    gr.Markdown("<div class='app-description'>Create professional podcasts from PDF documents with AI voices and music</div>")
                    if not podcast_available:
                        gr.Markdown("<div style='color: #ff6b6b; margin-top: 10px;'>⚠️ Not available</div>")
                
                # RAG App Card
                rag_status = "RAG Q&A System" if rag_system_ready else "RAG Q&A (Processing...)"
                with gr.Column(elem_classes=["app-card"] if rag_available and rag_system_ready else ["app-card", "disabled-card"]):
                    gr.Markdown("<div class='app-icon'>📚</div>")
                    gr.Markdown(f"<div class='app-title'>{rag_status}</div>")
                    gr.Markdown("<div class='app-description'>Ask questions about your PDF documents using Retrieval-Augmented Generation</div>")
                    if not rag_available:
                        gr.Markdown("<div style='color: #ff6b6b; margin-top: 10px;'>⚠️ Not available</div>")
                    elif not rag_system_ready:
                        gr.Markdown("<div style='color: #ffc107; margin-top: 10px;'>⏳ Processing PDFs...</div>")
                
                # General AI Card
                with gr.Column(elem_classes=["app-card"] if general_ai_available else ["app-card", "disabled-card"]):
                    gr.Markdown("<div class='app-icon'>🌟</div>")
                    gr.Markdown("<div class='app-title'>General AI Assistant</div>")
                    gr.Markdown("<div class='app-description'>Chat with our general AI model for broad knowledge and creative tasks</div>")
                    if not general_ai_available:
                        gr.Markdown("<div style='color: #ff6b6b; margin-top: 10px;'>⚠️ Not available</div>")
                
                # Combined AI Card
                combined_status = "Combined AI Systems" if rag_system_ready else "Combined AI (Processing...)"
                with gr.Column(elem_classes=["app-card"] if combined_available and rag_system_ready else ["app-card", "disabled-card"]):
                    gr.Markdown("<div class='app-icon'>🤖</div>")
                    gr.Markdown(f"<div class='app-title'>{combined_status}</div>")
                    gr.Markdown("<div class='app-description'>Get answers from both RAG and General AI systems simultaneously</div>")
                    if not combined_available:
                        gr.Markdown("<div style='color: #ff6b6b; margin-top: 10px;'>⚠️ Not available</div>")
                    elif not rag_system_ready:
                        gr.Markdown("<div style='color: #ffc107; margin-top: 10px;'>⏳ Waiting for RAG...</div>")
                
                # Multi-Agent App Card
                with gr.Column(elem_classes=["app-card"] if multi_agent_available else ["app-card", "disabled-card"]):
                    gr.Markdown("<div class='app-icon'>🤖</div>")
                    gr.Markdown("<div class='app-title'>Multi-Agent System</div>")
                    gr.Markdown("<div class='app-description'>Consult specialized AI agents for different types of tasks</div>")
                    if not multi_agent_available:
                        gr.Markdown("<div style='color: #ff6b6b; margin-top: 10px;'>⚠️ Not available</div>")
        
        # Status and Info Section
        with gr.Column(elem_classes=["status-bar"]):
            gr.Markdown("### 📊 System Status")
            with gr.Row():
                with gr.Column():
                    available_apps = sum([rag_available and rag_system_ready, general_ai_available, combined_available and rag_system_ready, podcast_available, multi_agent_available])
                    gr.Markdown(f"**Available Applications:** {available_apps}/5")
                    
                    # PDF count with real-time updates
                    gr.Markdown(f"**PDF Files Found:** {pdf_count} {'(processing...)' if not pdf_processing_complete else ''}")
                    
                    gr.Markdown("**AI Models Loaded:** Llama2, Qwen:0.5b")
                with gr.Column():
                    gr.Markdown("**System Version:** 1.0.0")
                    gr.Markdown("**Last Updated:** 2025-09-15")
                    status = "✅ Operational" if any([rag_available, general_ai_available, combined_available, podcast_available, multi_agent_available]) else "❌ No applications available"
                    gr.Markdown(f"**Status:** {status}")
        
        gr.Markdown("""
        ### 📋 How to use:
        1. **Click on any tab above** to switch between applications
        2. Each application works independently
        3. You can have multiple applications open in different tabs
        4. PDF processing continues in the background
        """)

# Create the main demo with tabs
with gr.Blocks(css=css, title="AI Hub - Application Gateway") as demo:
    with gr.Tabs(elem_classes=["tab-button"]):
        with gr.TabItem("🏠 Gateway", id="gateway"):
            create_gateway_tab()
        
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

if __name__ == "__main__":
    print("🚀 Launching AI Hub Gateway...")
    print("🌐 UI will be available at: http://localhost:7860")
    print("⏳ PDF processing will continue in the background")
    
    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        inbrowser=True,
        share=False
    )
    