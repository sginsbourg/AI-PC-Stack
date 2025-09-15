import gradio as gr
from langchain_community.llms import Ollama

# Initialize General AI
general_ai = Ollama(model="llama2")

def query_general_ai(query):
    try:
        response = general_ai.invoke(query)
        return response
    except Exception as e:
        return f"General AI Error: {e}"

# Create the General AI demo
with gr.Blocks(title="General AI Assistant") as general_ai_demo:
    gr.Markdown("# 🌟 General AI Assistant")
    gr.Markdown("### Chat with our general AI model")
    
    with gr.Row():
        with gr.Column():
            general_input = gr.Textbox(
                label="Your Question",
                placeholder="Ask anything...",
                lines=4
            )
            general_btn = gr.Button("Ask AI", variant="primary")
        
        with gr.Column():
            general_output = gr.Textbox(
                label="AI Response",
                lines=8,
                interactive=False
            )
    
    general_btn.click(
        fn=query_general_ai,
        inputs=general_input,
        outputs=general_output
    )
