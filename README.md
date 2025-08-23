# AI-PC-Stack

| **#** | **Project** | **Essence (single-sentence North-Star)** | **Homepage** | **Run on PC (typical)** | **Integration recipe on the same PC** |
|-------|-------------|------------------------------------------|--------------|-------------------------|----------------------------------------|

| 1 | **DeepSeek-R1** | Fully open reasoning LLM rivaling OpenAI-o1 on math & code via MIT weights & OpenAI API. | https://deepseek.com | 7–8 B 8-bit ≈ 8–10 GB VRAM; 70 B ≥ 48 GB VRAM | Expose `http://localhost:8000/v1` via `vllm serve DeepSeek-R1` or `ollama run deepseek-r1`; other tools point here |
| 2 | **Ollama** | “Docker-for-LLMs” – pull, run, chat with any open model in one command. | https://ollama.ai | 7–13 B models in 8–16 GB RAM; CPU fallback | Universal endpoint: `http://localhost:11434/v1/chat/completions` |
| 3 | **OpenManus** | No-code visual workbench chaining LLMs, tools & data into autonomous AI apps. | https://github.com/FoundationAgents/OpenManus | Docker-Compose; 4–8 GB RAM; GPU optional | UI connectors → `localhost:11434` or any `http://localhost:<port>` |
| 4 | **LangChain** | Universal “LEGO kit” for LLM apps via modular prompts, memory, retrieval & agents. | https://langchain.com | Pure Python/JS; 2–4 GB RAM | Import `ChatOllama(base_url="http://localhost:11434")` |
| 5 | **AutoGen (Microsoft)** | Multi-agent conversation framework spinning up LLM “teams” to negotiate tasks. | https://microsoft.github.io/autogen | `pip install pyautogen`; any OpenAI endpoint | `llm_config={"base_url":"http://localhost:11434/v1","api_key":"ollama"}` |
| 6 | **OpenSora** | Open distributed training platform turning any cluster into a generative-model factory. | https://github.com/hpcaitech/Open-Sora | Linux + CUDA; dev 12 GB VRAM | Train → HF checkpoint → `ollama create mymodel -f Modelfile` |
| 7 | **Haystack (deepset)** | End-to-end semantic search & RAG framework for production document workflows. | https://haystack.deepset.ai | CPU baseline; GPU optional | `OpenAIGenerator(api_base="http://localhost:11434/v1")`; share vector DB |
| 8 | **Text-Generation-WebUI** | Browser dashboard to download, chat & serve open LLMs locally or via API. | https://github.com/oobabooga/text-generation-webui | 4 GB VRAM for 7 B; 12 GB for 30 B | Settings → API → `http://localhost:5000/v1` |
| 9 | **Whisper** | Offline SOTA speech-to-text & translation in 99 languages. | https://github.com/openai/whisper | CPU real-time; GPU 10× faster | FastAPI wrapper → `http://localhost:9000/transcribe` |
|10 | **Letta** *(ex-MemGPT)* | Persistent memory layer for LLM agents across sessions & frameworks. | https://letta.ai | 2–4 GB RAM; any local LLM endpoint | `letta server --model-endpoint http://localhost:11434/v1` |
|11 | **Orpheus-TTS** *(new)* | Apache-2.0 multi-speaker, multilingual, zero-shot voice-cloning TTS (150 M→3 B tiers). | https://github.com/canopyai/orpheus-tts | 150 M CPU-only; 1 B ≈ 5 GB VRAM; 3 B ≈ 10 GB VRAM | `python -m orpheus.serve --host 0.0.0.0 --port 8001` → `http://localhost:8001/v1/audio/speech` |
