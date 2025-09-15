import gradio as gr
from rag_system import create_rag_system, get_available_pdfs, create_rag_system_for_pdf, extract_pdf_metadata
from langchain_community.llms import Ollama
import os
import json
import tempfile
import datetime
from typing import Dict, Any, List
import hashlib
import re

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

# Cache system for storing intermediate results
podcast_cache = {}

def get_cache_key(stage: str, pdf_path: str = None) -> str:
    """Generate a unique cache key for a stage and PDF"""
    if pdf_path:
        pdf_hash = hashlib.md5(pdf_path.encode()).hexdigest()
        return f"{stage}_{pdf_hash}"
    return stage

def save_to_cache(key: str, data: Any):
    """Save data to cache"""
    podcast_cache[key] = {
        "data": data,
        "timestamp": datetime.datetime.now().isoformat()
    }

def load_from_cache(key: str) -> Any:
    """Load data from cache if exists and is recent"""
    if key in podcast_cache:
        # Check if cache is recent (within 1 hour)
        cache_time = datetime.datetime.fromisoformat(podcast_cache[key]["timestamp"])
        if (datetime.datetime.now() - cache_time).total_seconds() < 3600:
            return podcast_cache[key]["data"]
    return None

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

def format_metadata_display(metadata):
    """Format metadata for better display in the UI"""
    if not metadata or "error" in metadata:
        return metadata
    
    formatted = metadata.copy()
    
    # Add source indicators
    if formatted.get("author") != "Unknown":
        source = "metadata" if formatted.get("author_found_in_metadata", True) else "extracted from text"
        formatted["author"] = f"{formatted['author']} ({source})"
    
    if formatted.get("publisher") != "Unknown":
        source = "metadata" if formatted.get("publisher_found_in_metadata", False) else "extracted from text"
        formatted["publisher"] = f"{formatted['publisher']} ({source})"
    
    # Clean up the text preview
    if "first_pages_text" in formatted:
        preview = formatted["first_pages_text"]
        # Remove excessive whitespace
        preview = re.sub(r'\s+', ' ', preview)
        formatted["text_preview"] = preview[:500] + "..." if len(preview) > 500 else preview
        del formatted["first_pages_text"]
    
    return formatted

def stage1_select_pdf(pdf_path):
    """
    Stage 1: PDF Selection with caching
    """
    if not pdf_path:
        return {"error": "Please select a PDF file."}, None, None
    
    cache_key = get_cache_key("stage1", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result:
        return cached_result, pdf_path, "✓ PDF loaded from cache"
    
    try:
        # Validate PDF exists
        if not os.path.exists(pdf_path):
            return {"error": f"PDF file not found: {pdf_path}"}, None, "❌ PDF not found"
        
        # Get basic info
        pdf_name = os.path.basename(pdf_path)
        file_size = os.path.getsize(pdf_path)
        file_date = datetime.datetime.fromtimestamp(os.path.getctime(pdf_path)).strftime("%Y-%m-%d %H:%M")
        
        result = {
            "pdf_path": pdf_path,
            "pdf_name": pdf_name,
            "file_size": file_size,
            "file_date": file_date,
            "status": "selected"
        }
        
        save_to_cache(cache_key, result)
        return result, pdf_path, "✓ PDF selected successfully"
        
    except Exception as e:
        return {"error": f"Error selecting PDF: {str(e)}"}, None, f"❌ Error: {str(e)}"

def stage2_analyze_pdf(pdf_data):
    """
    Stage 2: PDF Analysis with metadata extraction
    """
    if not pdf_data or "error" in pdf_data:
        return {"error": "No valid PDF data provided"}, "❌ No PDF data"
    
    pdf_path = pdf_data["pdf_path"]
    cache_key = get_cache_key("stage2", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result:
        return format_metadata_display(cached_result), "✓ PDF analysis loaded from cache"
    
    try:
        # Extract metadata using the enhanced function
        metadata = extract_pdf_metadata(pdf_path)
        
        # Add to our result
        result = {**pdf_data, **metadata}
        result["analysis_date"] = datetime.datetime.now().isoformat()
        result["analysis_status"] = "completed"
        
        save_to_cache(cache_key, result)
        return format_metadata_display(result), "✓ PDF analysis completed successfully"
        
    except Exception as e:
        return {"error": f"PDF analysis failed: {str(e)}"}, f"❌ Analysis error: {str(e)}"

def stage3_web_research(pdf_data, research_instructions):
    """
    Stage 3: Web Research using local AI tools
    """
    if not pdf_data or "error" in pdf_data:
        return {"error": "No valid PDF data provided"}, "❌ No PDF data"
    
    pdf_path = pdf_data["pdf_path"]
    cache_key = get_cache_key("stage3", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result and not research_instructions:
        return cached_result, "✓ Web research loaded from cache"
    
    try:
        pdf_name = pdf_data["pdf_name"]
        
        # Research prompt
        research_prompt = f"""
        Conduct comprehensive web research about the document: {pdf_name}
        
        RESEARCH INSTRUCTIONS:
        {research_instructions if research_instructions else "Perform general research about this document and its topics"}
        
        Please research and provide:
        1. Author information, credentials, and credibility assessment
        2. Publisher reputation and credibility
        3. Amazon reviews and public reception (if available)
        4. Recent news and updates related to the content
        5. Controversies or notable discussions
        6. Industry context and relevance
        7. Similar works and comparative analysis
        
        Format your response as a comprehensive research report with clear sections.
        """
        
        # Use the general AI for research
        research_results = query_general_ai(research_prompt)
        
        result = {
            **pdf_data,
            "research_instructions": research_instructions,
            "research_results": research_results,
            "research_date": datetime.datetime.now().isoformat(),
            "research_status": "completed"
        }
        
        save_to_cache(cache_key, result)
        return result, "✓ Web research completed successfully"
        
    except Exception as e:
        return {"error": f"Web research failed: {str(e)}"}, f"❌ Research error: {str(e)}"

def stage4_script_generation(research_data, script_instructions):
    """
    Stage 4: Script Generation using local AI tools
    """
    if not research_data or "error" in research_data:
        return {"error": "No valid research data provided"}, "❌ No research data"
    
    pdf_path = research_data["pdf_path"]
    cache_key = get_cache_key("stage4", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result and not script_instructions:
        return cached_result, "✓ Script loaded from cache"
    
    try:
        pdf_name = research_data["pdf_name"]
        research_results = research_data.get("research_results", "")
        
        # Script generation prompt
        script_prompt = f"""
        Create a professional podcast script based on:
        Document: {pdf_name}
        Research Findings: {research_results}
        
        SCRIPT INSTRUCTIONS:
        {script_instructions if script_instructions else "Create an engaging, informative podcast script"}
        
        PODCAST FORMAT:
        - Host: Shay Ginsbourg (UK English male voice)
        - Co-host: Omer (AI assistant, UK English male voice)
        - Format: Conversational dialogue between Shay and Omer
        - Duration: 15-20 minutes
        - Include natural pauses, humor, and engaging dialogue
        - Structure: Introduction, main content divided into segments, conclusion
        
        Create a complete script with speaker labels, content, and timing cues.
        """
        
        # Use the general AI for script generation
        script_content = query_general_ai(script_prompt)
        
        result = {
            **research_data,
            "script_instructions": script_instructions,
            "script_content": script_content,
            "script_date": datetime.datetime.now().isoformat(),
            "script_status": "completed"
        }
        
        save_to_cache(cache_key, result)
        return result, "✓ Script generation completed successfully"
        
    except Exception as e:
        return {"error": f"Script generation failed: {str(e)}"}, f"❌ Script error: {str(e)}"

def stage5_recording(script_data, voice_settings):
    """
    Stage 5: Recording the dialog (simulated)
    """
    if not script_data or "error" in script_data:
        return {"error": "No valid script data provided"}, "❌ No script data"
    
    pdf_path = script_data["pdf_path"]
    cache_key = get_cache_key("stage5", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result:
        return cached_result, "✓ Recording data loaded from cache"
    
    try:
        # Simulate recording process
        # In a real implementation, this would use TTS services
        
        script_content = script_data.get("script_content", "")
        recording_notes = "Simulated recording process. In a real implementation, this would generate audio files using TTS services."
        
        result = {
            **script_data,
            "voice_settings": voice_settings,
            "recording_notes": recording_notes,
            "recording_date": datetime.datetime.now().isoformat(),
            "recording_status": "completed"
        }
        
        save_to_cache(cache_key, result)
        return result, "✓ Recording simulation completed successfully"
        
    except Exception as e:
        return {"error": f"Recording failed: {str(e)}"}, f"❌ Recording error: {str(e)}"

def stage6_audio_editing(recording_data, music_settings):
    """
    Stage 6: Audio editing with music (simulated)
    """
    if not recording_data or "error" in recording_data:
        return {"error": "No valid recording data provided"}, "❌ No recording data"
    
    pdf_path = recording_data["pdf_path"]
    cache_key = get_cache_key("stage6", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result:
        return cached_result, "✓ Audio editing data loaded from cache"
    
    try:
        # Simulate audio editing process
        editing_notes = "Simulated audio editing process. In a real implementation, this would add music, sound effects, and mix the audio."
        
        result = {
            **recording_data,
            "music_settings": music_settings,
            "editing_notes": editing_notes,
            "editing_date": datetime.datetime.now().isoformat(),
            "editing_status": "completed"
        }
        
        save_to_cache(cache_key, result)
        return result, "✓ Audio editing simulation completed successfully"
        
    except Exception as e:
        return {"error": f"Audio editing failed: {str(e)}"}, f"❌ Editing error: {str(e)}"

def stage7_finalize_podcast(editing_data, upload_settings):
    """
    Stage 7: Finalize podcast and prepare for distribution
    """
    if not editing_data or "error" in editing_data:
        return {"error": "No valid editing data provided"}, "❌ No editing data"
    
    pdf_path = editing_data["pdf_path"]
    cache_key = get_cache_key("stage7", pdf_path)
    cached_result = load_from_cache(cache_key)
    
    if cached_result:
        return cached_result, "✓ Finalization data loaded from cache"
    
    try:
        # Generate podcast description
        pdf_name = editing_data["pdf_name"]
        description_prompt = f"""
        Create an engaging podcast description for: {pdf_name}
        
        The description should be:
        - Compelling and informative
        - 2-3 paragraphs long
        - Include key topics covered
        - Mention the hosts: Shay Ginsbourg and Omer
        - Include relevant keywords for discoverability
        """
        
        podcast_description = query_general_ai(description_prompt)
        
        # Create final result
        result = {
            **editing_data,
            "upload_settings": upload_settings,
            "podcast_description": podcast_description,
            "finalization_date": datetime.datetime.now().isoformat(),
            "finalization_status": "completed",
            "download_url": "simulated_download_url",  # Would be real in implementation
            "upload_status": "simulated"  # Would track real upload status
        }
        
        save_to_cache(cache_key, result)
        return result, "✓ Podcast finalization completed successfully"
        
    except Exception as e:
        return {"error": f"Finalization failed: {str(e)}"}, f"❌ Finalization error: {str(e)}"

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
.podcast-stage {
    background: #f0f8ff;
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 15px;
}
.stage-status {
    font-weight: bold;
    padding: 5px 10px;
    border-radius: 5px;
    margin-bottom: 10px;
}
"""

with gr.Blocks(css=css, title="Local AI Hub - Multi AI Systems") as demo:
    gr.Markdown("# 🚀 Local AI Hub - Multi AI Systems")
    gr.Markdown("### Choose between RAG (your PDFs) or General AI (broad knowledge)")
    
    # Store intermediate results between stages
    current_pdf_data = gr.State({})
    current_research_data = gr.State({})
    current_script_data = gr.State({})
    current_recording_data = gr.State({})
    current_editing_data = gr.State({})
    
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
            gr.Markdown("### Professional Podcast Generation - 7 Stages")
            
            with gr.Tabs() as podcast_stages:
                # Stage 1: PDF Selection
                with gr.TabItem("Stage 1: Select PDF"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("#### Select a PDF Document")
                            pdf_dropdown = gr.Dropdown(
                                label="Available PDFs",
                                choices=get_available_pdfs(),
                                value=get_available_pdfs()[0] if get_available_pdfs() else None,
                                interactive=True
                            )
                            refresh_btn = gr.Button("🔄 Refresh List", size="sm")
                            stage1_btn = gr.Button("Process PDF", variant="primary")
                        
                        with gr.Column():
                            stage1_output = gr.JSON(label="PDF Information")
                            stage1_status = gr.Textbox(label="Status", interactive=False)
                
                # Stage 2: PDF Analysis
                with gr.TabItem("Stage 2: PDF Analysis"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("#### Analyze PDF Metadata")
                            stage2_btn = gr.Button("Analyze PDF", variant="primary")
                        
                        with gr.Column():
                            stage2_output = gr.JSON(label="PDF Analysis Results")
                            stage2_status = gr.Textbox(label="Status", interactive=False)
                
                # Stage 3: Web Research
                with gr.TabItem("Stage 3: Web Research"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("#### Research PDF Content Online")
                            research_instructions = gr.Textbox(
                                label="Research Instructions (optional)",
                                placeholder="Specify what to research about this PDF...",
                                lines=3
                            )
                            stage3_btn = gr.Button("Conduct Research", variant="primary")
                        
                        with gr.Column():
                            stage3_output = gr.JSON(label="Research Results")
                            stage3_status = gr.Textbox(label="Status", interactive=False)
                
                # Stage 4: Script Generation
                with gr.TabItem("Stage 4: Script Generation"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("#### Generate Podcast Script")
                            script_instructions = gr.Textbox(
                                label="Script Instructions (optional)",
                                placeholder="Specify how the script should be structured...",
                                lines=3
                            )
                            stage4_btn = gr.Button("Generate Script", variant="primary")
                        
                        with gr.Column():
                            stage4_output = gr.Textbox(
                                label="Podcast Script",
                                lines=15,
                                interactive=True
                            )
                            stage4_status = gr.Textbox(label="Status", interactive=False)
                
                # Stage 5: Recording
                with gr.TabItem("Stage 5: Recording"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("#### Record Podcast Dialog")
                            voice_settings = gr.Textbox(
                                label="Voice Settings (simulated)",
                                value="Shay: UK English male, Omer: UK English male",
                                lines=2
                            )
                            stage5_btn = gr.Button("Simulate Recording", variant="primary")
                        
                        with gr.Column():
                            stage5_output = gr.JSON(label="Recording Results")
                            stage5_status = gr.Textbox(label="Status", interactive=False)
                
                # Stage 6: Audio Editing
                with gr.TabItem("Stage 6: Audio Editing"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("#### Edit Audio & Add Music")
                            music_settings = gr.Textbox(
                                label="Music Settings (simulated)",
                                value="Intro: upbeat music, Outro: slower music, Effects: occasional",
                                lines=2
                            )
                            stage6_btn = gr.Button("Simulate Editing", variant="primary")
                        
                        with gr.Column():
                            stage6_output = gr.JSON(label="Editing Results")
                            stage6_status = gr.Textbox(label="Status", interactive=False)
                
                # Stage 7: Finalize & Distribute
                with gr.TabItem("Stage 7: Finalize Podcast"):
                    with gr.Row():
                        with gr.Column():
                            gr.Markdown("#### Finalize & Distribute Podcast")
                            upload_settings = gr.Textbox(
                                label="Upload Settings (simulated)",
                                value="Platforms: Spotify, Apple Podcasts, Google Podcasts",
                                lines=2
                            )
                            stage7_btn = gr.Button("Finalize Podcast", variant="primary")
                            download_btn = gr.Button("Download Podcast", variant="secondary")
                        
                        with gr.Column():
                            stage7_output = gr.JSON(label="Final Podcast Data")
                            podcast_description = gr.Textbox(
                                label="Podcast Description",
                                lines=5,
                                interactive=True
                            )
                            stage7_status = gr.Textbox(label="Status", interactive=False)
            
            # Connect all the stage buttons
            refresh_btn.click(
                fn=get_pdf_list,
                inputs=[],
                outputs=pdf_dropdown
            )
            
            stage1_btn.click(
                fn=stage1_select_pdf,
                inputs=[pdf_dropdown],
                outputs=[stage1_output, current_pdf_data, stage1_status]
            )
            
            stage2_btn.click(
                fn=stage2_analyze_pdf,
                inputs=[current_pdf_data],
                outputs=[stage2_output, stage2_status]
            ).then(
                fn=lambda x: x,
                inputs=[stage2_output],
                outputs=[current_research_data]
            )
            
            stage3_btn.click(
                fn=stage3_web_research,
                inputs=[current_research_data, research_instructions],
                outputs=[stage3_output, stage3_status]
            ).then(
                fn=lambda x: x,
                inputs=[stage3_output],
                outputs=[current_script_data]
            )
            
            stage4_btn.click(
                fn=stage4_script_generation,
                inputs=[current_script_data, script_instructions],
                outputs=[stage4_output, stage4_status]
            ).then(
                fn=lambda x: x,
                inputs=[stage4_output],
                outputs=[current_recording_data]
            )
            
            stage5_btn.click(
                fn=stage5_recording,
                inputs=[current_recording_data, voice_settings],
                outputs=[stage5_output, stage5_status]
            ).then(
                fn=lambda x: x,
                inputs=[stage5_output],
                outputs=[current_editing_data]
            )
            
            stage6_btn.click(
                fn=stage6_audio_editing,
                inputs=[current_editing_data, music_settings],
                outputs=[stage6_output, stage6_status]
            )
            
            stage7_btn.click(
                fn=stage7_finalize_podcast,
                inputs=[current_editing_data, upload_settings],
                outputs=[stage7_output, stage7_status]
            ).then(
                fn=lambda x: x.get("podcast_description", "") if isinstance(x, dict) else "",
                inputs=[stage7_output],
                outputs=[podcast_description]
            )
            
            download_btn.click(
                fn=lambda: "Download functionality would be implemented in a real system",
                inputs=[],
                outputs=[stage7_status]
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
