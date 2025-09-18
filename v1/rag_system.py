import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
try:
    from langchain_ollama import OllamaLLM
except ImportError:
    from langchain_community.llms import Ollama
    print("Warning: Using deprecated OllamaLLM. Install/upgrade langchain-ollama.")
from langchain.chains import RetrievalQA
import PyPDF2
from datetime import datetime
import re
import sys
import time

def create_rag_system_async():
    """
    Asynchronously sets up a RAG system using local documents.
    Returns a future-like object that can be checked for completion.
    """
    def _create_rag_async():
        show_progress("Starting async RAG system initialization")
        return create_rag_system()
    
    # Start the RAG creation in a separate thread
    import threading
    from concurrent.futures import Future
    
    future = Future()
    
    def _worker():
        try:
            result = _create_rag_async()
            future.set_result(result)
        except Exception as e:
            future.set_exception(e)
    
    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    
    return future

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

def get_available_pdfs():
    """
    Retrieves a list of available PDF files from the specified directory.
    """
    data_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    pdf_files = []
    
    # Create directory if it doesn't exist
    if not os.path.exists(data_path):
        try:
            os.makedirs(data_path)
            print(f"✓ Created PDF directory: {data_path}")
            print("Please add PDF files to this directory and restart the application.")
        except Exception as e:
            print(f"Error creating directory: {e}")
        return pdf_files
    
    print("Scanning for PDF files...")
    for root, dirs, files in os.walk(data_path):
        for filename in files:
            if filename.endswith(".pdf"):
                file_path = os.path.join(root, filename)
                pdf_files.append(file_path)
                print(f"Found: {filename}")
    
    if pdf_files:
        print(f"✓ Found {len(pdf_files)} PDF files")
    else:
        print("✗ No PDF files found in directory")
        print(f"Please add PDF files to: {data_path}")
    
    return pdf_files

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
    llm = OllamaLLM(model="qwen:0.5b")
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
    llm = OllamaLLM(model="qwen:0.5b")
    retriever = vector_store.as_retriever()
    
    show_progress("Creating retrieval chain")
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever, chain_type="stuff")

    return qa_chain
    