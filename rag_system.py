import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
import PyPDF2
from datetime import datetime
import re

# Try to import from the new package, fall back to old if not available
try:
    from langchain_ollama import OllamaEmbeddings
except ImportError:
    from langchain_community.embeddings import OllamaEmbeddings
    print("Warning: Using deprecated OllamaEmbeddings. Install langchain-ollama for the updated version.")

def extract_author_publisher_from_text(text):
    """
    Attempt to extract author and publisher information from PDF text content.
    
    Args:
        text (str): Text extracted from PDF pages
    
    Returns:
        tuple: (author, publisher) if found, otherwise (None, None)
    """
    author = None
    publisher = None
    
    # Common patterns for author information
    author_patterns = [
        r'(?:author|by|written by|created by)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)',
        r'©.*?([A-Z][a-z]+ [A-Z][a-z]+)',
        r'copyright.*?([A-Z][a-z]+ [A-Z][a-z]+)',
        r'([A-Z][a-z]+ [A-Z][a-z]+)(?:\s+and\s+[A-Z][a-z]+ [A-Z][a-z]+)*\s*(?:\.|,|\s+)\d{4}'
    ]
    
    # Common patterns for publisher information
    publisher_patterns = [
        r'(?:published by|publisher|©|copyright).*?([A-Z][a-zA-Z\s&]+(?:Inc|Ltd|LLC|Corp|Press|Books|Publications)?)',
        r'([A-Z][a-zA-Z\s&]+(?:Inc|Ltd|LLC|Corp|Press|Books|Publications)?)\s*(?:\.|,|\s+)\d{4}',
        r'ISBN.*?([A-Z][a-zA-Z\s&]+)'
    ]
    
    # Search for author
    for pattern in author_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            author = match.group(1).strip()
            # Validate it looks like a name (at least two words)
            if len(author.split()) >= 2:
                break
    
    # Search for publisher
    for pattern in publisher_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            publisher = match.group(1).strip()
            # Clean up publisher name
            publisher = re.sub(r'[^a-zA-Z\s&]', '', publisher).strip()
            if len(publisher) > 3:  # Reasonable minimum length
                break
    
    return author, publisher

def extract_pdf_metadata(pdf_path):
    """
    Extract metadata from a PDF file, including searching text content for author/publisher.
    
    Args:
        pdf_path (str): Path to the PDF file
    
    Returns:
        dict: Extracted metadata
    """
    try:
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
                "publisher_found_in_metadata": False
            }
            
            # Try to extract text from first few pages for additional analysis
            text_for_analysis = ""
            pages_to_check = min(3, len(pdf_reader.pages))  # Check first 3 pages or all if fewer
            
            for i in range(pages_to_check):
                try:
                    page_text = pdf_reader.pages[i].extract_text()
                    text_for_analysis += page_text + "\n"
                except:
                    continue
            
            metadata["first_pages_text"] = text_for_analysis[:1000]  # Store first 1000 chars for reference
            
            # If author is not found in metadata, search in text
            if metadata["author"] in ['Unknown', '']:
                author_from_text, publisher_from_text = extract_author_publisher_from_text(text_for_analysis)
                if author_from_text:
                    metadata["author"] = author_from_text
                    metadata["author_found_in_metadata"] = False
                    metadata["author_source"] = "extracted_from_text"
            
            # Always try to find publisher in text
            if publisher_from_text := extract_author_publisher_from_text(text_for_analysis)[1]:
                metadata["publisher"] = publisher_from_text
                metadata["publisher_found_in_metadata"] = False
                metadata["publisher_source"] = "extracted_from_text"
            else:
                metadata["publisher"] = "Unknown"
                
            return metadata
            
    except Exception as e:
        return {"error": f"Metadata extraction failed: {str(e)}"}

def create_rag_system():
    """
    Sets up a RAG system using local documents, skipping any files with errors.
    """
    # Updated path to the new location
    data_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    documents = []
    
    if not os.path.exists(data_path):
        print(f"ERROR: The specified directory {data_path} does not exist.")
        return None
    
    # Walk through the directory and its sub-folders
    for root, dirs, files in os.walk(data_path):
        for filename in files:
            if filename.endswith(".pdf"):
                file_path = os.path.join(root, filename)
                try:
                    loader = PyPDFLoader(file_path)
                    documents.extend(loader.load())
                    print(f"Successfully loaded: {file_path}")
                except Exception as e:
                    print(f"Skipping file due to error: {file_path} - {e}")
    
    if not documents:
        print("No valid documents found. Please check your PDF files.")
        return None

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)
    embeddings = OllamaEmbeddings(model="qwen:0.5b")
    vector_store = Chroma.from_documents(texts, embeddings, collection_name="local_rag_collection")

    llm = Ollama(model="qwen:0.5b")
    retriever = vector_store.as_retriever()
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever, chain_type="stuff")

    return qa_chain

def create_rag_system_for_pdf(pdf_path):
    """
    Sets up a RAG system for a specific PDF file.
    
    Args:
        pdf_path (str): Path to the PDF file
    
    Returns:
        RetrievalQA: A RAG chain for the specific PDF
    """
    if not os.path.exists(pdf_path):
        print(f"ERROR: The specified file {pdf_path} does not exist.")
        return None
    
    try:
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        print(f"Successfully loaded: {pdf_path}")
    except Exception as e:
        print(f"Error loading file: {pdf_path} - {e}")
        return None

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)
    embeddings = OllamaEmbeddings(model="qwen:0.5b")
    vector_store = Chroma.from_documents(texts, embeddings, collection_name="single_pdf_collection")

    llm = Ollama(model="qwen:0.5b")
    retriever = vector_store.as_retriever()
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever, chain_type="stuff")

    return qa_chain

def get_available_pdfs():
    """
    Returns a list of available PDF files in the data directory.
    
    Returns:
        list: List of paths to PDF files
    """
    # Updated path to the new location
    data_path = r"C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\pdf"
    pdf_files = []
    
    if not os.path.exists(data_path):
        print(f"ERROR: The specified directory {data_path} does not exist.")
        return pdf_files
    
    for root, dirs, files in os.walk(data_path):
        for filename in files:
            if filename.endswith(".pdf"):
                file_path = os.path.join(root, filename)
                pdf_files.append(file_path)
    
    return pdf_files
