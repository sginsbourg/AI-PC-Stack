import gradio as gr
from rag_system import create_rag_system
try:
    from langchain_ollama import OllamaLLM
except ImportError:
    from langchain_community.llms import Ollama
    print("Warning: Using deprecated OllamaLLM. Install/upgrade langchain-ollama.")

# Initialize both systems
rag_chain = create_rag_system()
general_ai = OllamaLLM(model="llama2")

def query_rag_system(query):
    if not rag_chain:
        return "RAG system unavailable."
    try:
        response = rag_chain.invoke(query)
        return response['result']
    except Exception as e:
        return f"RAG Error: {e}"

def query_general_ai(query):
    try:
        response = general_ai.invoke(query)
        return response
    except Exception as e:
        return f"General AI Error: {e}"

def query_both_ai_systems(query):
    rag_response = query_rag_system(query)
    general_response = query_general_ai(query)
    
    return f"""📚 **RAG Response (From Your PDFs):**
{rag_response}

---

🤖 **General AI Response:**
{general_response}
"""

def create_combined_demo():
    """Create the Combined AI application"""
    with gr.Blocks(title="Combined AI Systems") as combined_demo:
        gr.Markdown("# 🤖 Combined AI Systems")
        gr.Markdown("### Get answers from both RAG and General AI")
        
        with gr.Row():
            with gr.Column():
                combined_input = gr.Textbox(
                    label="Your Question",
                    placeholder="Ask anything...",
                    lines=4
                )
                combined_btn = gr.Button("Ask Both AIs", variant="primary")
            
            with gr.Column():
                combined_output = gr.Textbox(
                    label="Combined AI Responses",
                    lines=12,
                    interactive=False
                )
        
        combined_btn.click(
            fn=query_both_ai_systems,
            inputs=combined_input,
            outputs=combined_output
        )
    
    return combined_demo
    