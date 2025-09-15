import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
import PyPDF2
from datetime import datetime
import re
import sys
import time

def show_progress(message, duration=0.5):
    """
    Display a progress message with animated dots
    """
    sys.stdout.write(message)
    sys.stdout.flush()
    
    for i in range(3):
        time.sleep(duration / 3)
        sys.stdout.write('.')
        sys.stdout.flush()
    
    sys.stdout.write(' Done!\n')
    sys.stdout.flush()

# Try to import from the new package, fall back to old if not available
try:
    from langchain_ollama import OllamaEmbeddings
except ImportError:
    from langchain_community.embeddings import OllamaEmbeddings
    print("Warning: Using deprecated OllamaEmbeddings. Install langchain-ollama for the updated version.")

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

def extract_comprehensive_metadata(pdf_path):
    """
    Extract comprehensive metadata from PDF, scanning multiple pages for missing information.
    """
    try:
        show_progress(f"Extracting metadata from {os.path.basename(pdf_path)}")
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            info = pdf_reader.metadata
            
            # Extract basic metadata
            metadata = {
                "title": info.get('/Title', 'Unknown'),
                "author": info.get('/Author', 'Unknown'),
                "creator": info.get('/Creator', 'Unknown'),
                "producer": info.get('/Producer', 'Unknown'),
                "creation_date": info.get('/CreationDate', 'Unknown'),
                "modification_date": info.get('/ModDate', 'Unknown'),
                "page_count": len(pdf_reader.pages),
                "extraction_date": datetime.now().isoformat(),
                "author_found_in_metadata": True,
                "publisher_found_in_metadata": False,
                "authors_found": [],
                "publishers_found": []
            }
            
            # Extract text from multiple pages for comprehensive analysis
            text_for_analysis = ""
            pages_to_check = min(5, len(pdf_reader.pages))  # Check first 5 pages
            
            show_progress(f"Analyzing first {pages_to_check} pages")
            for i in range(pages_to_check):
                try:
                    page_text = pdf_reader.pages[i].extract_text()
                    text_for_analysis += page_text + "\n\n"
                except Exception as e:
                    continue
            
            metadata["pages_analyzed"] = pages_to_check
            metadata["text_sample"] = text_for_analysis[:2000]  # Store sample for reference
            
            # Comprehensive author and publisher extraction
            author_from_text, publisher_from_text, all_authors, all_publishers = extract_author_publisher_from_text(text_for_analysis)
            
            # Update author information if not found in metadata
            if metadata["author"] in ['Unknown', ''] and author_from_text:
                metadata["author"] = author_from_text
                metadata["author_found_in_metadata"] = False
                metadata["author_source"] = "extracted_from_text"
            
            # Always try to find publisher in text
            if publisher_from_text:
                metadata["publisher"] = publisher_from_text
                metadata["publisher_found_in_metadata"] = False
                metadata["publisher_source"] = "extracted_from_text"
            else:
                metadata["publisher"] = "Unknown"
            
            # Store all found authors and publishers for reference
            metadata["authors_found"] = all_authors
            metadata["publishers_found"] = all_publishers
            
            # Additional metadata extraction
            metadata.update(extract_additional_metadata(text_for_analysis))
            
            show_progress("Metadata extraction completed")
            return metadata
            
    except Exception as e:
        return {"error": f"Metadata extraction failed: {str(e)}"}

def extract_additional_metadata(text):
    """
    Extract additional metadata from text content.
    """
    additional_metadata = {}
    
    # Extract publication year
    year_match = re.search(r'(?:©|copyright|\(c\))\s*(\d{4})', text, re.IGNORECASE)
    if year_match:
        additional_metadata["publication_year"] = year_match.group(1)
    
    # Extract ISBN
    isbn_match = re.search(r'ISBN[-]?(1[03])?[:]?[ ]?([0-9\- ]{10,17})', text, re.IGNORECASE)
    if isbn_match:
        additional_metadata["isbn"] = isbn_match.group(0).strip()
    
    # Extract DOI
    doi_match = re.search(r'10\.\d{4,9}/[-._;()/:A-Z0-9]+', text, re.IGNORECASE)
    if doi_match:
        additional_metadata["doi"] = doi_match.group(0).strip()
    
    # Extract keywords (from common keyword sections)
    keywords_match = re.search(r'(?:keywords|key words)[:\s]+([^.]+?)(?:\n|\.|;)', text, re.IGNORECASE)
    if keywords_match:
        keywords = [k.strip() for k in keywords_match.group(1).split(',') if k.strip()]
        additional_metadata["keywords"] = keywords
    
    # Extract abstract
    abstract_match = re.search(r'(?:abstract|summary)[:\s]+([^.]+?)(?:\n|\.|Introduction|§)', text, re.IGNORECASE | re.DOTALL)
    if abstract_match:
        abstract = abstract_match.group(1).strip()
        if len(abstract) > 50 and len(abstract) < 500:  # Reasonable abstract length
            additional_metadata["abstract"] = abstract
    
    return additional_metadata

def format_metadata_display(metadata):
    """
    Format metadata for better display in the UI with comprehensive information.
    """
    if not metadata or "error" in metadata:
        return metadata
    
    formatted = metadata.copy()
    
    # Add source indicators with emojis
    if formatted.get("author") != "Unknown":
        source = "📄 metadata" if formatted.get("author_found_in_metadata", True) else "🔍 extracted from text"
        formatted["author"] = f"{formatted['author']} ({source})"
    
    if formatted.get("publisher") != "Unknown":
        source = "📄 metadata" if formatted.get("publisher_found_in_metadata", False) else "🔍 extracted from text"
        formatted["publisher"] = f"{formatted['publisher']} ({source})"
    
    # Clean up the text preview
    if "text_sample" in formatted:
        preview = formatted["text_sample"]
        # Remove excessive whitespace and clean up
        preview = re.sub(r'\s+', ' ', preview)
        formatted["text_preview"] = preview[:500] + "..." if len(preview) > 500 else preview
        del formatted["text_sample"]
    
    # Format lists for better display
    if "authors_found" in formatted and formatted["authors_found"]:
        formatted["all_authors_found"] = ", ".join(formatted["authors_found"])
        del formatted["authors_found"]
    
    if "publishers_found" in formatted and formatted["publishers_found"]:
        formatted["all_publishers_found"] = ", ".join(formatted["publishers_found"])
        del formatted["publishers_found"]
    
    # Add extraction summary
    if "pages_analyzed" in formatted:
        formatted["extraction_summary"] = f"Analyzed {formatted['pages_analyzed']} pages for metadata"
        del formatted["pages_analyzed"]
    
    return formatted

# [The rest of the functions remain the same as before]
# create_rag_system(), create_rag_system_for_pdf(), get_available_pdfs()

def create_rag_system():
    """
    Sets up a RAG system using local documents, skipping any files with errors.
    """
    show_progress("Initializing RAG system")
    
    # Updated path to the new location
    data_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    documents = []
    
    if not os.path.exists(data_path):
        print(f"ERROR: The specified directory {data_path} does not exist.")
        return None
    
    show_progress(f"Scanning PDF directory: {data_path}")
    
    # Walk through the directory and its sub-folders
    pdf_count = 0
    for root, dirs, files in os.walk(data_path):
        for filename in files:
            if filename.endswith(".pdf"):
                pdf_count += 1
                file_path = os.path.join(root, filename)
                try:
                    show_progress(f"Loading PDF: {filename}", 0.3)
                    loader = PyPDFLoader(file_path)
                    documents.extend(loader.load())
                    print(f"✓ Successfully loaded: {filename}")
                except Exception as e:
                    print(f"✗ Skipping file due to error: {filename} - {e}")
    
    if not documents:
        print("No valid documents found. Please check your PDF files.")
        return None

    show_progress(f"Processed {pdf_count} PDF files, {len(documents)} documents loaded")
    show_progress("Splitting text into chunks")
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)
    
    show_progress("Creating embeddings")
    embeddings = OllamaEmbeddings(model="qwen:0.5b")
    
    show_progress("Building vector store")
    vector_store = Chroma.from_documents(texts, embeddings, collection_name="local_rag_collection")

    show_progress("Initializing AI model")
    llm = Ollama(model="qwen:0.5b")
    retriever = vector_store.as_retriever()
    
    show_progress("Creating retrieval chain")
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever, chain_type="stuff")

    print("✓ RAG system initialized successfully!")
    return qa_chain

def create_rag_system_for_pdf(pdf_path):
    """
    Sets up a RAG system for a specific PDF file.
    """
    show_progress(f"Loading PDF: {os.path.basename(pdf_path)}")
    
    if not os.path.exists(pdf_path):
        print(f"ERROR: The specified file {pdf_path} does not exist.")
        return None
    
    try:
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        print(f"✓ Successfully loaded: {os.path.basename(pdf_path)}")
    except Exception as e:
        print(f"Error loading file: {pdf_path} - {e}")
        return None

    show_progress("Processing text content")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)
    
    show_progress("Creating embeddings")
    embeddings = OllamaEmbeddings(model="qwen:0.5b")
    
    show_progress("Building vector store")
    vector_store = Chroma.from_documents(texts, embeddings, collection_name="single_pdf_collection")

    show_progress("Initializing AI model")
    llm = Ollama(model="qwen:0.5b")
    retriever = vector_store.as_retriever()
    
    show_progress("Creating retrieval chain")
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever, chain_type="stuff")

    return qa_chain

def get_available_pdfs():
    """
    Returns a list of available PDF files in the data directory.
    """
    # Updated path to the new location
    data_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    pdf_files = []
    
    if not os.path.exists(data_path):
        print(f"ERROR: The specified directory {data_path} does not exist.")
        return pdf_files
    
    show_progress("Scanning for PDF files")
    for root, dirs, files in os.walk(data_path):
        for filename in files:
            if filename.endswith(".pdf"):
                file_path = os.path.join(root, filename)
                pdf_files.append(file_path)
    
    print(f"✓ Found {len(pdf_files)} PDF files")
    return pdf_files
