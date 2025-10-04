from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import ollama
import json
from typing import List, Dict, Any
import logging
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI(title="Open Manus AI Lead Analyzer")
logging.basicConfig(level=logging.INFO)

class LeadAnalysisRequest(BaseModel):
    content: str
    url: str
    title: str

class LeadAnalysisResponse(BaseModel):
    relevance_score: float
    intent_classification: str
    potential_value: str
    recommended_approach: str
    key_insights: List[str]
    competitor_mentions: List[str]
    technology_stack: List[str]

class BatchAnalysisRequest(BaseModel):
    leads: List[Dict[str, Any]]

class LLMController:
    def __init__(self):
        self.ollama_client = ollama.Client(host='http://ollama:11434')
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.load_models()
    
    def load_models(self):
        """Load required AI models"""
        try:
            # Pull Qwen model
            self.ollama_client.pull('qwen:7b')
            logging.info("Qwen model loaded")
            
            # Pull DeepSeek model
            self.ollama_client.pull('deepseek-coder:6.7b')
            logging.info("DeepSeek model loaded")
            
        except Exception as e:
            logging.error(f"Error loading models: {e}")
    
    def analyze_lead_intent(self, content: str, url: str, title: str) -> Dict[str, Any]:
        """Analyze lead content using Qwen for intent classification"""
        
        prompt = f"""
        Analyze this web content for business lead generation in AI-powered performance testing services.
        
        URL: {url}
        Title: {title}
        Content: {content[:2000]}...
        
        Please provide:
        1. Relevance score (0-10) for AI/performance testing services
        2. Primary intent (e.g., seeking services, competitor, informational, potential client)
        3. Potential value (high/medium/low)
        4. Key insights about their testing needs
        5. Mentioned competitors or tools
        6. Technology stack indications
        
        Respond in JSON format:
        {{
            "relevance_score": 0,
            "intent_classification": "",
            "potential_value": "",
            "key_insights": [],
            "competitor_mentions": [],
            "technology_stack": []
        }}
        """
        
        try:
            response = self.ollama_client.generate(
                model='qwen:7b',
                prompt=prompt,
                options={'temperature': 0.1}
            )
            
            # Parse JSON response
            analysis = json.loads(response['response'])
            return analysis
            
        except Exception as e:
            logging.error(f"Error in lead analysis: {e}")
            return self.get_fallback_analysis()
    
    def get_fallback_analysis(self):
        """Fallback analysis if AI fails"""
        return {
            "relevance_score": 5,
            "intent_classification": "unknown",
            "potential_value": "medium",
            "key_insights": ["Analysis unavailable"],
            "competitor_mentions": [],
            "technology_stack": []
        }
    
    def generate_personalized_approach(self, analysis: Dict, contact_info: Dict) -> str:
        """Generate personalized outreach approach using DeepSeek"""
        
        prompt = f"""
        Based on this lead analysis:
        {json.dumps(analysis, indent=2)}
        
        Contact info: {contact_info}
        
        Generate a personalized outreach approach focusing on AI-powered performance testing services.
        Include:
        - Opening hook based on their apparent needs
        - Key value propositions to highlight
        - Specific service recommendations
        - Call to action
        
        Keep it professional and tailored to their specific context.
        """
        
        try:
            response = self.ollama_client.generate(
                model='deepseek-coder:6.7b',
                prompt=prompt,
                options={'temperature': 0.3}
            )
            
            return response['response']
            
        except Exception as e:
            logging.error(f"Error generating approach: {e}")
            return "Personalized approach generation failed."

llm_controller = LLMController()

@app.post("/analyze-lead", response_model=LeadAnalysisResponse)
async def analyze_lead(request: LeadAnalysisRequest):
    """Analyze a single lead using AI models"""
    try:
        analysis = llm_controller.analyze_lead_intent(
            request.content, request.url, request.title
        )
        
        return LeadAnalysisResponse(**analysis)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-batch")
async def analyze_batch(request: BatchAnalysisRequest):
    """Analyze multiple leads in batch"""
    results = []
    
    for lead in request.leads:
        try:
            analysis = llm_controller.analyze_lead_intent(
                lead.get('content', ''),
                lead.get('url', ''),
                lead.get('title', '')
            )
            
            results.append({
                'url': lead.get('url'),
                'analysis': analysis,
                'personalized_approach': llm_controller.generate_personalized_approach(
                    analysis, lead.get('contact_info', {})
                )
            })
            
        except Exception as e:
            logging.error(f"Error analyzing lead {lead.get('url')}: {e}")
            results.append({'url': lead.get('url'), 'error': str(e)})
    
    return {'results': results}

@app.get("/models")
async def get_models():
    """Get available AI models"""
    try:
        models = llm_controller.ollama_client.list()
        return {'models': models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Open Manus AI Lead Analyzer - Running Locally"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)