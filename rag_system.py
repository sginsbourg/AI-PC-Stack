import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA

# Try to import from the new package, fall back to old if not available
try:
    from langchain_ollama import OllamaEmbeddings
except ImportError:
    from langchain_community.embeddings import OllamaEmbeddings
    print("Warning: Using deprecated OllamaEmbeddings. Install langchain-ollama for the updated version.")

def create_rag_system():
    """
    Sets up a RAG system using local documents, skipping any files with errors.
    """
    data_path = r"C:\Users\sgins\AI_STACK\Local-AI\pdf"
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
