import gradio as gr
from rag_system import create_rag_system
from langchain_community.llms import Ollama
import os

# Initialize AI systems
rag_chain = None
general_ai = None

try:
    rag_chain = create_rag_system()
    print("✓ RAG system initialized successfully!")
except Exception as e:
    print(f"✗ RAG initialization failed: {e}")

try:
    # Use a different model for general AI to distinguish from RAG
    general_ai = Ollama(model="llama2")  # or "mistral", "qwen:7b", etc.
    print("✓ General AI (Llama2) initialized successfully!")
except Exception as e:
    print(f"✗ General AI initialization failed: {e}")

def query_rag_system(query):
    """Query the RAG system (your PDFs)"""
    if not rag_chain:
        return "RAG system unavailable. Please check your PDF files and Ollama setup."
    try:
        response = rag_chain.invoke(query)
        return response['result']
    except Exception as e:
        return f"RAG Error: {e}"

def query_general_ai(query):
    """Query the general AI model"""
    if not general_ai:
        return "General AI unavailable. Please check Ollama setup."
    try:
        response = general_ai.invoke(query)
        return response
    except Exception as e:
        return f"General AI Error: {e}"

def query_both_ai_systems(query):
    """Query both AI systems and return combined results"""
    rag_response = query_rag_system(query)
    general_response = query_general_ai(query)
    
    return f"""📚 **RAG Response (From Your PDFs - using qwen:0.5b):**
{rag_response}

---

🤖 **General AI Response (Llama2 - Broad Knowledge):**
{general_response}
"""

# Custom CSS for better layout
css = """
.container {
    max-width: 1400px !important;
    margin: 0 auto !important;
}
.tab-button {
    font-size: 16px !important;
    padding: 12px 24px !important;
}
.input-textbox textarea {
    min-height: 150px !important;
    font-size: 16px !important;
}
.output-textbox textarea {
    min-height: 400px !important;
    font-size: 16px !important;
    line-height: 1.6 !important;
}
"""

with gr.Blocks(css=css, title="Local AI Hub - Multi AI Systems") as demo:
    gr.Markdown("# 🚀 Local AI Hub - Multi AI Systems")
    gr.Markdown("### Choose between RAG (your PDFs) or General AI (broad knowledge)")
    
    with gr.Tabs():
        with gr.TabItem("🤖 RAG + General AI Combined", elem_classes="tab-button"):
            with gr.Row():
                with gr.Column():
                    combined_input = gr.Textbox(
                        label="Your Question",
                        placeholder="Ask anything... will query both AI systems",
                        lines=6,
                        elem_classes=["input-textbox"]
                    )
                    combined_btn = gr.Button("Ask Both AIs", variant="primary", size="lg")
                
                with gr.Column():
                    combined_output = gr.Textbox(
                        label="Combined AI Responses",
                        lines=20,
                        interactive=False,
                        elem_classes=["output-textbox"]
                    )
            
            combined_btn.click(
                fn=query_both_ai_systems,
                inputs=combined_input,
                outputs=combined_output
            )
        
        with gr.TabItem("📚 RAG Only (Your PDFs)", elem_classes="tab-button"):
            with gr.Row():
                with gr.Column():
                    rag_input = gr.Textbox(
                        label="Question about your PDFs",
                        placeholder="Ask about your documents...",
                        lines=6,
                        elem_classes=["input-textbox"]
                    )
                    rag_btn = gr.Button("Ask RAG", variant="secondary", size="lg")
                
                with gr.Column():
                    rag_output = gr.Textbox(
                        label="RAG Response",
                        lines=20,
                        interactive=False,
                        elem_classes=["output-textbox"]
                    )
            
            rag_btn.click(
                fn=query_rag_system,
                inputs=rag_input,
                outputs=rag_output
            )
        
        with gr.TabItem("🌟 General AI Only", elem_classes="tab-button"):
            with gr.Row():
                with gr.Column():
                    general_input = gr.Textbox(
                        label="General Question",
                        placeholder="Ask anything...",
                        lines=6,
                        elem_classes=["input-textbox"]
                    )
                    general_btn = gr.Button("Ask General AI", variant="secondary", size="lg")
                
                with gr.Column():
                    general_output = gr.Textbox(
                        label="General AI Response",
                        lines=20,
                        interactive=False,
                        elem_classes=["output-textbox"]
                    )
            
            general_btn.click(
                fn=query_general_ai,
                inputs=general_input,
                outputs=general_output
            )
    
    gr.Markdown("---")
    gr.Markdown("**Systems Status:**")
    gr.Markdown(f"- 📚 RAG System: {'✅ Connected' if rag_chain else '❌ Disconnected'}")
    gr.Markdown(f"- 🤖 General AI: {'✅ Connected' if general_ai else '❌ Disconnected'}")
    gr.Markdown("**Models:**")
    gr.Markdown("- RAG: qwen:0.5b (PDF knowledge)")
    gr.Markdown("- General AI: llama2 (broad knowledge)")

if __name__ == "__main__":
    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        inbrowser=True,
        share=False
    )
