import gradio as gr
from rag_system import create_rag_system, get_available_pdfs, create_rag_system_for_pdf, extract_comprehensive_metadata
from langchain_community.llms import Ollama
import os
import datetime
import hashlib
import re

print("=" * 50)
print("STARTUP: Checking for PDF files...")
startup_pdfs = get_available_pdfs()
print(f"STARTUP: Found {len(startup_pdfs)} PDF files")
for pdf in startup_pdfs:
    print(f"STARTUP: - {pdf}")
print("=" * 50)

rag_chain = None
general_ai = None

try:
    rag_chain = create_rag_system()
    print("RAG system initialized successfully!")
except Exception as e:
    print(f"RAG initialization failed: {e}")

try:
    general_ai = Ollama(model="llama2")
    print("General AI initialized successfully!")
except Exception as e:
    print(f"General AI initialization failed: {e}")

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

def query_rag_system(query):
    if not rag_chain:
        return "RAG system unavailable."
    try:
        response = rag_chain.invoke(query)
        return response['result']
    except Exception as e:
        return f"RAG Error: {e}"

def query_general_ai(query):
    if not general_ai:
        return "General AI unavailable."
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
    
    if pdf_files:
        return gr.Dropdown(choices=pdf_files, value=pdf_files[0], label=f"Available PDFs ({len(pdf_files)} found)")
    else:
        return gr.Dropdown(choices=[], value=None, label="No PDF files found")

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

css = """
.container { max-width: 1400px !important; margin: 0 auto !important; }
.tab-button { font-size: 16px !important; padding: 12px 24px !important; }
.input-textbox textarea { min-height: 150px !important; font-size: 16px !important; }
.output-textbox textarea { min-height: 400px !important; font-size: 16px !important; }
"""

with gr.Blocks(css=css, title="Local AI Hub") as demo:
    gr.Markdown("# Local AI Hub - Multi AI Systems")
    
    current_pdf_data = gr.State({})
    
    with gr.Tabs():
        with gr.TabItem("AI Podcast Generator"):
            pdf_files = get_available_pdfs()
            
            if not pdf_files:
                gr.Markdown("No PDF files found. Please add PDFs to the pdf folder.")
            else:
                with gr.Tabs() as podcast_stages:
                    with gr.TabItem("Stage 1: Select PDF"):
                        with gr.Row():
                            with gr.Column():
                                gr.Markdown("Select a PDF Document")
                                pdf_dropdown = gr.Dropdown(
                                    label=f"Available PDFs ({len(pdf_files)} found)",
                                    choices=pdf_files,
                                    value=pdf_files[0]
                                )
                                refresh_btn = gr.Button("Refresh List")
                                stage1_btn = gr.Button("Process PDF")
                            
                            with gr.Column():
                                stage1_output = gr.JSON(label="PDF Information")
                                stage1_status = gr.Textbox(label="Status")
                    
                    with gr.TabItem("Stage 2: PDF Analysis"):
                        with gr.Row():
                            with gr.Column():
                                gr.Markdown("Analyze PDF Metadata")
                                stage2_btn = gr.Button("Analyze PDF")
                            
                            with gr.Column():
                                stage2_output = gr.JSON(label="PDF Analysis Results")
                                stage2_status = gr.Textbox(label="Status")
                
                refresh_btn.click(
                    fn=refresh_pdf_list,
                    inputs=[],
                    outputs=pdf_dropdown
                )
                
                stage1_btn.click(
                    fn=stage1_select_pdf,
                    inputs=[pdf_dropdown],
                    outputs=[stage1_output, current_pdf_data, stage1_status]
                )
                
                stage2_btn.click(
                    fn=stage2_analyze_pdf,
                    inputs=[current_pdf_data],
                    outputs=[stage2_output, stage2_status]
                )

if __name__ == "__main__":
    demo.launch(server_name="127.0.0.1", server_port=7860, inbrowser=True)
