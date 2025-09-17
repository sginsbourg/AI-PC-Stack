import gradio as gr
from rag_system import get_available_pdfs, extract_comprehensive_metadata
try:
    from langchain_ollama import OllamaLLM
except ImportError:
    from langchain_community.llms import Ollama
    print("Warning: Using deprecated OllamaLLM. Install/upgrade langchain-ollama.")
import os
import datetime
import hashlib
import re
import PyPDF2

# Initialize AI systems
general_ai = OllamaLLM(model="llama2")

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

def extract_author_publisher_from_text(text):
    """
    Comprehensive extraction of author and publisher information from PDF text content.
    """
    author = None
    publisher = None
    authors = []
    publishers = []
    
    # Enhanced patterns for author information
    author_patterns = [
        # Standard author patterns
        r'(?:author|by|written by|created by|prepared by)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
        r'©.*?(\d{4}).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
        r'copyright.*?(\d{4}).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*(?:\.|,|\s+)\d{4}',
        
        # Academic paper patterns
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*et al\.',
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*and\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
        
        # Email pattern (often indicates author)
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[\(\[]?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        
        # Affiliation patterns
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*(?:University|Institute|College|Laboratory)',
    ]
    
    # Enhanced patterns for publisher information
    publisher_patterns = [
        # Standard publisher patterns
        r'(?:published by|publisher|©|copyright|distributed by).*?([A-Z][a-zA-Z\s&]+(?:Inc|Ltd|LLC|Corp|Press|Books|Publications|Publishing|Verlag|Media|Group)?)',
        r'([A-Z][a-zA-Z\s&]+(?:Inc|Ltd|LLC|Corp|Press|Books|Publications|Publishing|Verlag|Media|Group)?)\s*(?:\.|,|\s+)\d{4}',
        r'ISBN.*?([A-Z][a-zA-Z\s&]+)',
        
        # Website patterns
        r'([a-zA-Z0-9-]+\.[a-zA-Z]{2,})\s*(?:\.|®|™)',
        
        # Address patterns (often indicate publisher)
        r'([A-Z][a-zA-Z\s&]+)\s*(?:Street|Avenue|Boulevard|Road|Drive|Lane)',
        
        # Conference and journal patterns
        r'Proceedings of.*?([A-Z][a-zA-Z\s&]+)',
        r'Journal of.*?([A-Z][a-zA-Z\s&]+)',
        r'Conference on.*?([A-Z][a-zA-Z\s&]+)',
    ]
    
    # Search for authors with multiple patterns
    for pattern in author_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            # Extract the most likely author group
            for i in range(1, len(match.groups()) + 1):
                if match.group(i) and len(match.group(i).split()) >= 2:
                    potential_author = match.group(i).strip()
                    # Clean and validate author name
                    potential_author = re.sub(r'[^a-zA-Z\s]', '', potential_author).strip()
                    if (len(potential_author.split()) >= 2 and 
                        len(potential_author) > 5 and  # Reasonable minimum length
                        potential_author.lower() not in ['unknown', 'anonymous', 'various'] and
                        not any(word in potential_author.lower() for word in ['university', 'institute', 'company', 'corporation'])):
                        authors.append(potential_author)
    
    # Search for publishers with multiple patterns
    for pattern in publisher_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            for i in range(1, len(match.groups()) + 1):
                if match.group(i):
                    potential_publisher = match.group(i).strip()
                    potential_publisher = re.sub(r'[^a-zA-Z\s&.]', '', potential_publisher).strip()
                    if (len(potential_publisher) > 3 and
                        potential_publisher.lower() not in ['unknown', 'anonymous'] and
                        not any(word in potential_publisher.lower() for word in ['author', 'by', 'written'])):
                        publishers.append(potential_publisher)
    
    # Select most likely author
    if authors:
        # Prioritize names with more occurrences or earlier in document
        author_counts = {}
        for a in authors:
            author_counts[a] = author_counts.get(a, 0) + 1
        author = max(author_counts, key=author_counts.get)
    
    # Select most likely publisher
    if publishers:
        publisher_counts = {}
        for p in publishers:
            publisher_counts[p] = publisher_counts.get(p, 0) + 1
        publisher = max(publisher_counts, key=publisher_counts.get)
    
    return author, publisher

def extract_comprehensive_metadata(pdf_path):
    """
    Extract comprehensive metadata from a PDF file.
    """
    metadata = {}
    try:
        with open(pdf_path, 'rb') as file:
            pdf = PyPDF2.PdfReader(file)
            metadata = pdf.metadata or {}
            
            # Convert metadata to a clean dictionary
            clean_metadata = {}
            for key, value in metadata.items():
                clean_key = key.lstrip('/')
                clean_metadata[clean_key] = value
            
            # Extract text for additional analysis
            full_text = ""
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"
            
            # Extract author and publisher from text if not in metadata
            author, publisher = extract_author_publisher_from_text(full_text)
            if author and 'Author' not in clean_metadata:
                clean_metadata['Author'] = author
            if publisher and 'Publisher' not in clean_metadata:
                clean_metadata['Publisher'] = publisher
            
            return clean_metadata
    
    except Exception as e:
        return {"error": f"Metadata extraction failed: {str(e)}"}

def enhance_metadata_with_text_analysis(pdf_data):
    """
    Enhance PDF metadata with text analysis.
    """
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
        # First get standard metadata
        metadata = extract_comprehensive_metadata(pdf_path)
        result = {**pdf_data, **metadata}
        result["analysis_date"] = datetime.datetime.now().isoformat()
        
        # Enhance with text analysis for author/publisher
        result = enhance_metadata_with_text_analysis(result)
        
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
.metadata-info {
    background: #e8f5e8;
    padding: 15px;
    border-radius: 8px;
    margin: 10px 0;
}
.metadata-warning {
    background: #fff3cd;
    padding: 15px;
    border-radius: 8px;
    margin: 10px 0;
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
                        gr.Markdown("""
                        <div class="metadata-info">
                        🔍 <strong>Advanced Metadata Extraction</strong><br>
                        The system will:
                        - Extract standard PDF metadata
                        - Scan document text for author information
                        - Search for publisher details
                        - Analyze content structure
                        </div>
                        """)
                        stage2_btn = gr.Button("Analyze PDF", variant="primary")
                    
                    with gr.Column():
                        stage2_output = gr.JSON(label="PDF Analysis Results")
                        stage2_status = gr.Textbox(label="Status")
        
        # Connect the buttons
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
    
    return podcast_demo
    