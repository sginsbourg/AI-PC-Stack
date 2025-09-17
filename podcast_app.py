import gradio as gr
from rag_system import get_available_pdfs, extract_comprehensive_metadata
from langchain_community.llms import Ollama
import os
import datetime
import hashlib
import re
import PyPDF2

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
                    # Clean and validate publisher name
                    potential_publisher = re.sub(r'[^a-zA-Z\s&]', '', potential_publisher).strip()
                    if (len(potential_publisher) > 3 and
                        potential_publisher.lower() not in ['unknown', 'unknown publisher'] and
                        not any(word in potential_publisher.lower() for word in ['author', 'page', 'chapter', 'section'])):
                        publishers.append(potential_publisher)
    
    # Remove duplicates and select the most likely candidates
    authors = list(dict.fromkeys(authors))  # Preserve order while removing duplicates
    publishers = list(dict.fromkeys(publishers))
    
    # Select the most prominent author (first found or most mentioned)
    if authors:
        author = authors[0]  # Take the first found author
    
    # Select the most prominent publisher
    if publishers:
        publisher = publishers[0]  # Take the first found publisher
    
    return author, publisher, authors, publishers

def extract_text_from_pdf(pdf_path, max_pages=5):
    """
    Extract text from the first few pages of a PDF for metadata analysis.
    """
    try:
        text_content = ""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            pages_to_read = min(max_pages, len(pdf_reader.pages))
            
            for i in range(pages_to_read):
                try:
                    page_text = pdf_reader.pages[i].extract_text()
                    if page_text:
                        text_content += page_text + "\n\n"
                except Exception as e:
                    continue
        
        return text_content
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def enhance_metadata_with_text_analysis(pdf_data):
    """
    Enhance PDF metadata by analyzing text content for missing author/publisher info.
    """
    if "error" in pdf_data or not pdf_data.get("pdf_path"):
        return pdf_data
    
    pdf_path = pdf_data["pdf_path"]
    
    # Check if we need to extract author/publisher from text
    needs_author_extraction = (
        "author" not in pdf_data or 
        pdf_data.get("author") in ['Unknown', ''] or
        pdf_data.get("author_found_in_metadata", False) == False
    )
    
    needs_publisher_extraction = (
        "publisher" not in pdf_data or 
        pdf_data.get("publisher") in ['Unknown', ''] or
        pdf_data.get("publisher_found_in_metadata", False) == False
    )
    
    if needs_author_extraction or needs_publisher_extraction:
        # Extract text from first few pages
        text_content = extract_text_from_pdf(pdf_path, max_pages=5)
        
        if text_content:
            author_from_text, publisher_from_text, all_authors, all_publishers = extract_author_publisher_from_text(text_content)
            
            # Update author information if needed
            if needs_author_extraction and author_from_text:
                pdf_data["author"] = author_from_text
                pdf_data["author_found_in_metadata"] = False
                pdf_data["author_source"] = "extracted_from_text"
                pdf_data["authors_found"] = all_authors
            
            # Update publisher information if needed
            if needs_publisher_extraction and publisher_from_text:
                pdf_data["publisher"] = publisher_from_text
                pdf_data["publisher_found_in_metadata"] = False
                pdf_data["publisher_source"] = "extracted_from_text"
                pdf_data["publishers_found"] = all_publishers
            
            # Add text analysis metadata
            pdf_data["text_analysis_performed"] = True
            pdf_data["text_analysis_date"] = datetime.datetime.now().isoformat()
            pdf_data["pages_analyzed_for_text"] = min(5, len(PyPDF2.PdfReader(open(pdf_path, 'rb')).pages))
    
    return pdf_data

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
    