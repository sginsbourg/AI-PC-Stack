import gradio as gr
import os
import sys
import subprocess

def launch_podcast_app():
    """Launch the podcast generation application"""
    try:
        # Import and launch the podcast app
        from podcast_app import podcast_demo
        return podcast_demo
    except Exception as e:
        print(f"Error launching podcast app: {e}")
        return gr.Markdown(f"# ❌ Error\nCould not launch Podcast App: {e}")

def launch_rag_app():
    """Launch the RAG Q&A application"""
    try:
        # Import and launch the RAG app
        from rag_app import rag_demo
        return rag_demo
    except Exception as e:
        print(f"Error launching RAG app: {e}")
        return gr.Markdown(f"# ❌ Error\nCould not launch RAG App: {e}")

def launch_general_ai_app():
    """Launch the General AI application"""
    try:
        # Import and launch the General AI app
        from general_ai_app import general_ai_demo
        return general_ai_demo
    except Exception as e:
        print(f"Error launching General AI app: {e}")
        return gr.Markdown(f"# ❌ Error\nCould not launch General AI App: {e}")

def launch_combined_app():
    """Launch the Combined AI application"""
    try:
        # Import and launch the Combined AI app
        from combined_app import combined_demo
        return combined_demo
    except Exception as e:
        print(f"Error launching Combined AI app: {e}")
        return gr.Markdown(f"# ❌ Error\nCould not launch Combined AI App: {e}")

# Custom CSS for better layout
css = """
.gate-container {
    max-width: 1000px;
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
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
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
.header {
    text-align: center;
    margin-bottom: 40px;
}
.status-bar {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 10px;
    margin-top: 30px;
}
"""

with gr.Blocks(css=css, title="AI Hub - Application Gateway") as demo:
    gr.Markdown("""
    # 🚀 AI Hub - Application Gateway
    ### Choose from our suite of AI-powered applications
    """)
    
    with gr.Column(elem_classes=["gate-container"]):
        # Application Grid
        with gr.Row():
            with gr.Column(elem_classes=["app-grid"]):
                # Podcast App Card
                with gr.Box(elem_classes=["app-card"]):
                    gr.Markdown("<div class='app-icon'>🎙️</div>", elem_id="podcast-icon")
                    gr.Markdown("<div class='app-title'>Podcast Generator</div>", elem_id="podcast-title")
                    gr.Markdown("<div class='app-description'>Create professional podcasts from PDF documents with AI voices and music</div>", elem_id="podcast-desc")
                    podcast_btn = gr.Button("Launch Podcast Studio", variant="primary", size="lg")
                
                # RAG App Card
                with gr.Box(elem_classes=["app-card"]):
                    gr.Markdown("<div class='app-icon'>📚</div>", elem_id="rag-icon")
                    gr.Markdown("<div class='app-title'>RAG Q&A System</div>", elem_id="rag-title")
                    gr.Markdown("<div class='app-description'>Ask questions about your PDF documents using Retrieval-Augmented Generation</div>", elem_id="rag-desc")
                    rag_btn = gr.Button("Launch RAG System", variant="primary", size="lg")
                
                # General AI Card
                with gr.Box(elem_classes=["app-card"]):
                    gr.Markdown("<div class='app-icon'>🌟</div>", elem_id="general-icon")
                    gr.Markdown("<div class='app-title'>General AI Assistant</div>", elem_id="general-title")
                    gr.Markdown("<div class='app-description'>Chat with our general AI model for broad knowledge and creative tasks</div>", elem_id="general-desc")
                    general_btn = gr.Button("Launch AI Assistant", variant="primary", size="lg")
                
                # Combined AI Card
                with gr.Box(elem_classes=["app-card"]):
                    gr.Markdown("<div class='app-icon'>🤖</div>", elem_id="combined-icon")
                    gr.Markdown("<div class='app-title'>Combined AI Systems</div>", elem_id="combined-title")
                    gr.Markdown("<div class='app-description'>Get answers from both RAG and General AI systems simultaneously</div>", elem_id="combined-desc")
                    combined_btn = gr.Button("Launch Combined AI", variant="primary", size="lg")
        
        # Status and Info Section
        with gr.Box(elem_classes=["status-bar"]):
            gr.Markdown("### 📊 System Status")
            with gr.Row():
                with gr.Column():
                    gr.Markdown("**Available Applications:** 4")
                    gr.Markdown("**PDF Files Found:** Checking...")
                    gr.Markdown("**AI Models Loaded:** Llama2, Qwen:0.5b")
                with gr.Column():
                    gr.Markdown("**System Version:** 1.0.0")
                    gr.Markdown("**Last Updated:** 2025-09-15")
                    gr.Markdown("**Status:** ✅ Operational")
        
        # Output area for the selected application
        app_output = gr.HTML()
    
    # Connect buttons to their respective applications
    podcast_btn.click(
        fn=launch_podcast_app,
        inputs=[],
        outputs=[app_output]
    )
    
    rag_btn.click(
        fn=launch_rag_app,
        inputs=[],
        outputs=[app_output]
    )
    
    general_btn.click(
        fn=launch_general_ai_app,
        inputs=[],
        outputs=[app_output]
    )
    
    combined_btn.click(
        fn=launch_combined_app,
        inputs=[],
        outputs=[app_output]
    )

if __name__ == "__main__":
    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        inbrowser=True,
        share=False
    )
