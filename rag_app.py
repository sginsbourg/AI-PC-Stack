import gradio as gr
from rag_system import create_rag_system

# Initialize RAG system
rag_chain = create_rag_system()

def query_rag_system(query):
    if not rag_chain:
        return "RAG system unavailable. Please check your PDF files."
    try:
        response = rag_chain.invoke(query)
        return response['result']
    except Exception as e:
        return f"RAG Error: {e}"

def create_rag_demo():
    """Create the RAG Q&A application"""
    with gr.Blocks(title="RAG Q&A System") as rag_demo:
        gr.Markdown("# 📚 RAG Q&A System")
        gr.Markdown("### Ask questions about your PDF documents")
        
        with gr.Row():
            with gr.Column():
                rag_input = gr.Textbox(
                    label="Your Question",
                    placeholder="Ask anything about your PDF documents...",
                    lines=4
                )
                rag_btn = gr.Button("Ask RAG", variant="primary")
            
            with gr.Column():
                rag_output = gr.Textbox(
                    label="RAG Response",
                    lines=8,
                    interactive=False
                )
        
        rag_btn.click(
            fn=query_rag_system,
            inputs=rag_input,
            outputs=rag_output
        )
    
    return rag_demo
