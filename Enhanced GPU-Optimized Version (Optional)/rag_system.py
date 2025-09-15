def get_optimal_model():
    """
    Select the best model based on available hardware
    """
    try:
        # Check if GPU is available (simplified check)
        # In a real implementation, you'd use torch.cuda.is_available()
        # For now, we'll use a simple approach
        import subprocess
        result = subprocess.run(['nvidia-smi'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode == 0:
            print("✓ NVIDIA GPU detected - using larger model")
            return "llama2:13b"  # Larger model for GPU
        else:
            print("✓ Using standard model (CPU only)")
            return "qwen:0.5b"  # Smaller model for CPU
    except:
        print("✓ Using standard model (qwen:0.5b)")
        return "qwen:0.5b"

# Then use it in your functions:
def create_rag_system():
    # ... existing code ...
    model_name = get_optimal_model()
    embeddings = OllamaEmbeddings(model=model_name)
    llm = Ollama(model=model_name)
    # ... rest of the code ...