import gradio as gr
from rag_system import create_rag_system, get_available_pdfs, create_rag_system_for_pdf
from langchain_community.llms import Ollama
import os
import requests
from datetime import datetime
import json

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

def research_topic(topic):
    """
    Research a topic online to find recent information, reviews, and news.
    This is a placeholder function that would integrate with search APIs.
    """
    try:
        # In a real implementation, this would call search APIs
        # For now, we'll use the general AI to simulate research
        research_prompt = f"""
        Research the following topic: {topic}
        
        Please provide:
        1. Recent news and updates
        2. Public reception and reviews (if available)
        3. Author information and credibility (if applicable)
        4. Publisher reputation (if applicable)
        5. Any controversies or notable discussions
        
        Format the response as a comprehensive research report.
        """
        
        return query_general_ai(research_prompt)
    except Exception as e:
        return f"Research error: {str(e)}"

def generate_podcast_script(pdf_path, custom_intro, custom_outro, research_level):
    """
    Generate a podcast script based on a specific PDF with research and custom elements.
    
    Args:
        pdf_path (str): Path to the PDF file
        custom_intro (str): Custom introduction text from the user
        custom_outro (str): Custom outro text from the user
        research_level (str): Level of research to conduct ('minimal', 'moderate', 'extensive')
    
    Returns:
        dict: Dictionary containing the script and any metadata
    """
    if not pdf_path:
        return {"error": "Please select a PDF file first."}
    
    try:
        # Create a RAG system for the selected PDF
        pdf_rag = create_rag_system_for_pdf(pdf_path)
        
        if not pdf_rag:
            return {"error": f"Failed to load PDF: {pdf_path}"}
        
        # Extract basic information about the PDF
        pdf_name = os.path.basename(pdf_path)
        
        # Research phase based on the research level
        research_content = ""
        if research_level != "minimal":
            research_prompt = f"""
            Research information about the document: {pdf_name}
            Please find:
            1. Author information and credibility
            2. Publisher reputation (if known)
            3. Public reception and reviews
            4. Recent news related to the content
            5. Any controversies or notable discussions
            
            Provide a comprehensive research report.
            """
            research_content = research_topic(pdf_name)
        
        # Generate podcast content
        podcast_prompt = f"""
        Create a professional podcast script based on the content of the document: {pdf_name}
        
        RESEARCH CONTEXT (use this to enhance the podcast):
        {research_content}
        
        PODCAST FORMAT:
        - Host: Shay Ginsbourg (UK English male voice)
        - Co-host: Omer (AI assistant, UK English male voice)
        - Format: Conversational dialogue between Shay and Omer
        - Include upbeat royalty-free music at the beginning
        - Include slower royalty-free music at the end
        - Add occasional short audio effects for emphasis
        
        CUSTOM INTRODUCTION (provided by user):
        {custom_intro}
        
        CUSTOM OUTRO (provided by user):
        {custom_outro}
        
        Please create an engaging, informative podcast that:
        1. Summarizes the key points of the document
        2. Provides context from the research
        3. Maintains a conversational tone between Shay and Omer
        4. Includes subtle humor and engaging dialogue
        5. Is suitable for a 15-20 minute podcast episode
        
        Format the script with clear speaker labels and audio cues.
        """
        
        response = pdf_rag.invoke(podcast_prompt)
        podcast_script = response['result']
        
        # Format the final script
        formatted_script = f"""
🎙️ PODCAST SCRIPT: {pdf_name.replace('.pdf', '')}
📅 Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}
🔍 Research Level: {research_level}

{'-'*50}
INTRODUCTION
{'-'*50}
[Upbeat royalty-free music fades in, then fades to background]

SHAY: Welcome to AI Insights Podcast! I'm your host, Shay Ginsbourg.

OMER: And I'm Omer, your AI co-host and research assistant.

SHAY: Today we're discussing: {pdf_name.replace('.pdf', '')}

{custom_intro}

[Music fades out]

{'-'*50}
MAIN CONTENT
{'-'*50}
{podcast_script}

{'-'*50}
CONCLUSION
{'-'*50}
{custom_outro}

SHAY: That's all the time we have for today. Thank you for joining us!

OMER: It was a pleasure to assist with the research and discussion.

SHAY: Join us next time for more AI insights and discussions.

[Slower royalty-free music fades in, then fades out]
"""
        
        return {
            "script": formatted_script,
            "pdf_name": pdf_name,
            "research_level": research_level,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {"error": f"Error generating podcast: {str(e)}"}

def generate_audio(script_data, voice_settings):
    """
    Generate audio from the podcast script.
    This is a placeholder function that would integrate with TTS services.
    
    Args:
        script_data (dict): The podcast script data
        voice_settings (dict): Voice preferences
    
    Returns:
        dict: Audio file path or error message
    """
    try:
        # In a real implementation, this would call a TTS API
        # For now, we'll return a placeholder
        return {
            "status": "success",
            "message": "Audio generation would be implemented with a TTS service",
            "script_data": script_data
        }
    except Exception as e:
        return {"error": f"Audio generation error: {str(e)}"}

def upload_to_podcast_platforms(audio_data, platforms):
    """
    Upload the generated audio to podcast platforms.
    This is a placeholder function.
    
    Args:
        audio_data (dict): The audio data to upload
        platforms (list): List of platforms to upload to
    
    Returns:
        dict: Upload status
    """
    try:
        # In a real implementation, this would call platform APIs
        return {
            "status": "success",
            "message": f"Upload would be implemented for platforms: {', '.join(platforms)}",
            "platforms": platforms
        }
    except Exception as e:
        return {"error": f"Upload error: {str(e)}"}

def get_pdf_list():
    """Returns list of available PDFs for dropdown"""
    pdf_files = get_available_pdfs()
    if pdf_files:
        return gr.Dropdown(choices=pdf_files, value=pdf_files[0])
    return gr.Dropdown(choices=[], value=None)

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
.podcast-controls {
    background: #f0f8ff;
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 15px;
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
        
        with gr.TabItem("🎙️ AI Podcast Generator", elem_classes="tab-button"):
            with gr.Row():
                with gr.Column():
                    gr.Markdown("### Generate a Professional Podcast from PDF")
                    
                    with gr.Row():
                        pdf_dropdown = gr.Dropdown(
                            label="Select PDF Document",
                            choices=get_available_pdfs(),
                            value=get_available_pdfs()[0] if get_available_pdfs() else None,
                            interactive=True
                        )
                        refresh_btn = gr.Button("🔄 Refresh List", size="sm")
                    
                    research_level = gr.Radio(
                        choices=["minimal", "moderate", "extensive"],
                        value="moderate",
                        label="Research Level",
                        info="How much online research to include"
                    )
                    
                    custom_intro = gr.Textbox(
                        label="Custom Introduction",
                        placeholder="Add a custom introduction for the podcast...",
                        lines=3,
                        value="Today we have a fascinating document to discuss. Omer has done some research to provide context."
                    )
                    
                    custom_outro = gr.Textbox(
                        label="Custom Outro",
                        placeholder="Add a custom conclusion for the podcast...",
                        lines=3,
                        value="That was an insightful discussion. We hope you learned something new today!"
                    )
                    
                    generate_btn = gr.Button("Generate Podcast Script", variant="primary", size="lg")
                
                with gr.Column():
                    script_output = gr.Textbox(
                        label="Podcast Script",
                        lines=20,
                        interactive=True,
                        elem_classes=["output-textbox"]
                    )
                    
                    with gr.Row():
                        download_script_btn = gr.Button("Download Script", size="sm")
                        generate_audio_btn = gr.Button("Generate Audio", variant="secondary", size="sm")
                        upload_podcast_btn = gr.Button("Upload to Platforms", variant="secondary", size="sm")
                    
                    status_output = gr.Textbox(
                        label="Status",
                        value="Ready to generate podcast",
                        interactive=False
                    )
            
            # Set up the interactions
            refresh_btn.click(
                fn=get_pdf_list,
                inputs=[],
                outputs=pdf_dropdown
            )
            
            generate_btn.click(
                fn=generate_podcast_script,
                inputs=[pdf_dropdown, custom_intro, custom_outro, research_level],
                outputs=script_output
            )
            
            # Placeholder functions for audio generation and upload
            generate_audio_btn.click(
                fn=lambda: {"status": "Audio generation would be implemented with a TTS service"},
                inputs=[],
                outputs=status_output
            )
            
            upload_podcast_btn.click(
                fn=lambda: {"status": "Upload functionality would be implemented with platform APIs"},
                inputs=[],
                outputs=status_output
            )
            
            download_script_btn.click(
                fn=lambda script: {
                    "status": f"Script ready for download ({len(script)} characters)"
                },
                inputs=script_output,
                outputs=status_output
            )
    
    gr.Markdown("---")
    gr.Markdown("**Systems Status:**")
    gr.Markdown(f"- 📚 RAG System: {'✅ Connected' if rag_chain else '❌ Disconnected'}")
    gr.Markdown(f"- 🤖 General AI: {'✅ Connected' if general_ai else '❌ Disconnected'}")
    gr.Markdown(f"- 📄 Available PDFs: {len(get_available_pdfs())} files")
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
