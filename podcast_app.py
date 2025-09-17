import gradio as gr
from rag_system import get_available_pdfs, extract_comprehensive_metadata
from langchain_community.llms import Ollama
import os
import datetime
import hashlib
import re

# Initialize AI systems
general_ai = Ollama(model="llama2")

# Cache system
podcast_cache = {}

def get_cache_key(stage, pdf_path=None):
    if pdf_path:
        pdf_hash = hashlib.md5(pdf_path.encode()).hexdigest()
        return f"{stage}_{pdf_hash}"
    return stage

def save_to_cache(key, data):
    podcast_cache[key] = {
        "data": data,
        "timestamp": datetime.datetime.now().isoformat()
    }

def load_from_cache(key):
    if key in podcast_cache:
        cache_time = datetime.datetime.fromisoformat(podcast_cache[key]["timestamp"])
        if (datetime.datetime.now() - cache_time).total_seconds() < 3600:
            return podcast_cache[key]["data"]
    return None

def query_general_ai(query):
    try:
        response = general_ai.invoke(query)
        return response
    except Exception as e:
        return f"General AI Error: {e}"

def manual_check_pdfs():
    data_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    pdf_files = []
    
    try:
        if os.path.exists(data_path):
            for root, dirs, files in os.walk(data_path):
                for filename in files:
                    if filename.lower().endswith('.pdf'):
                        file_path = os.path.join(root, filename)
                        pdf_files.append(file_path)
    except Exception as e:
        print(f"Manual check error: {e}")
    
    return pdf_files

def get_pdf_list():
    pdf_files = get_available_pdfs()
    if not pdf_files:
        pdf_files = manual_check_pdfs()
    
    return pdf_files

def refresh_pdf_list():
    pdf_files = get_available_pdfs()
    if not pdf_files:
        pdf_files = manual_check_pdfs()
    
    if pdf_files:
        return gr.Dropdown(choices=pdf_files, value=pdf_files[0], label=f"Available PDFs ({len(pdf_files)} found)")
    else:
        return gr.Dropdown(choices=[], value=None, label="No PDF files found")

def stage1_select_pdf(pdf_path):
    if not pdf_path:
        return {"error": "Please select a PDF file."}, None, None
    
    cache_key = get_cache_key("stage1", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result:
        return cached_result, pdf_path, "PDF loaded from cache"
    
    try:
        if not os.path.exists(pdf_path):
            return {"error": f"PDF file not found: {pdf_path}"}, None, "PDF not found"
        
        pdf_name = os.path.basename(pdf_path)
        file_size = os.path.getsize(pdf_path)
        
        result = {
            "pdf_path": pdf_path,
            "pdf_name": pdf_name,
            "file_size": file_size,
            "status": "selected"
        }
        
        save_to_cache(cache_key, result)
        return result, pdf_path, "PDF selected successfully"
        
    except Exception as e:
        return {"error": f"Error selecting PDF: {str(e)}"}, None, f"Error: {str(e)}"

def stage2_analyze_pdf(pdf_data):
    if isinstance(pdf_data, str):
        return {"error": pdf_data}, "Invalid PDF data"
    
    if not pdf_data or "error" in pdf_data:
        return {"error": "No valid PDF data provided"}, "No PDF data"
    
    pdf_path = pdf_data["pdf_path"]
    cache_key = get_cache_key("stage2", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result:
        return cached_result, "PDF analysis loaded from cache"
    
    try:
        metadata = extract_comprehensive_metadata(pdf_path)
        result = {**pdf_data, **metadata}
        result["analysis_date"] = datetime.datetime.now().isoformat()
        
        save_to_cache(cache_key, result)
        return result, "PDF analysis completed successfully"
        
    except Exception as e:
        return {"error": f"PDF analysis failed: {str(e)}"}, f"Analysis error: {str(e)}"

# Podcast-specific CSS
podcast_css = """
.podcast-stage {
    background: #f0f8ff;
    padding: 20px;
    border-radius: 15px;
    margin: 15px 0;
}
.stage-header {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #2c5282;
}
"""

def create_podcast_demo():
    """Create the podcast generation application"""
    with gr.Blocks(css=podcast_css, title="AI Podcast Generator") as podcast_demo:
        gr.Markdown("# 🎙️ AI Podcast Generator")
        gr.Markdown("### Create professional podcasts from your PDF documents")
        
        current_pdf_data = gr.State({})
        
        with gr.Tabs() as podcast_stages:
            with gr.TabItem("Stage 1: Select PDF"):
                with gr.Row():
                    with gr.Column():
                        gr.Markdown("#### Select a PDF Document")
                        pdf_files = get_pdf_list()
                        pdf_dropdown = gr.Dropdown(
                            label=f"Available PDFs ({len(pdf_files)} found)" if pdf_files else "No PDF files found",
                            choices=pdf_files,
                            value=pdf_files[0] if pdf_files else None
                        )
                        refresh_btn = gr.Button("🔄 Refresh List")
                        stage1_btn = gr.Button("Process PDF", variant="primary")
                    
                    with gr.Column():
                        stage1_output = gr.JSON(label="PDF Information")
                        stage1_status = gr.Textbox(label="Status")
            
            with gr.TabItem("Stage 2: PDF Analysis"):
                with gr.Row():
                    with gr.Column():
                        gr.Markdown("#### Analyze PDF Metadata")
                        stage2_btn = gr.Button("Analyze PDF", variant="primary")
                    
                    with gr.Column():
                        stage2_output = gr.JSON(label="PDF Analysis Results")
                        stage2_status = gr.Textbox(label="Status")
        
        # Connect the buttons - FIXED THE TYPO HERE
        refresh_btn.click(
            fn=refresh_pdf_list,
            inputs=[],
            outputs=pdf_dropdown
        )
        
        stage1_btn.click(
            fn=stage1_select_pdf,
            inputs=[pdf_dropdown],  # FIXED: Changed 极dropdown to pdf_dropdown
            outputs=[stage1_output, current_pdf_data, stage1_status]
        )
        
        stage2_btn.click(
            fn=stage2_analyze_pdf,
            inputs=[current_pdf_data],
            outputs=[stage2_output, stage2_status]
        )
    
    return podcast_demo
    