# Add this function to rag_system.py
def create_rag_system_for_pdf(pdf_path):
    """
    Sets up a RAG system for a specific PDF file.
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

# Also add this function to get available PDFs
def get_available_pdfs():
    """
    Returns a list of available PDF files in the data directory.
    """
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
