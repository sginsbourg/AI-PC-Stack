import gradio as gr
try:
    from langchain_ollama import OllamaLLM
except ImportError:
    from langchain_community.llms import Ollama
    print("Warning: Using deprecated OllamaLLM. Install/upgrade langchain-ollama.")
from langchain.agents import Tool, AgentExecutor, LLMSingleActionAgent, AgentOutputParser
from langchain.prompts import StringPromptTemplate
from langchain.schema import AgentAction, AgentFinish
from langchain.chains import LLMChain
from typing import List, Union
import re
from datetime import datetime
import os

# Define specialized agents FIRST
class ResearchAgent:
    def __init__(self):
        self.name = "Research Specialist"
        self.role = "Expert in research, analysis, and information synthesis"
        self.llm = OllamaLLM(model="llama2")
    
    def analyze(self, query):
        prompt = f"""As a Research Specialist, analyze and provide comprehensive information about:
        
        QUERY: {query}
        
        Please provide:
        1. Key facts and information
        2. Context and background
        3. Different perspectives if applicable
        4. Summary of important points
        
        Response:"""
        
        return self.llm.invoke(prompt)

class CreativeAgent:
    def __init__(self):
        self.name = "Creative Writer"
        self.role = "Expert in creative writing, storytelling, and content creation"
        self.llm = OllamaLLM(model="llama2")
    
    def create(self, query):
        prompt = f"""As a Creative Writer, create engaging content based on:
        
        TOPIC: {query}
        
        Please provide:
        1. Creative interpretation
        2. Engaging narrative or explanation
        3. Examples or analogies
        4. Inspiring conclusion
        
        Response:"""
        
        return self.llm.invoke(prompt)

class TechnicalAgent:
    def __init__(self):
        self.name = "Technical Expert"
        self.role = "Expert in technical explanations, code, and detailed analysis"
        self.llm = OllamaLLM(model="llama2")
    
    def explain(self, query):
        prompt = f"""As a Technical Expert, provide detailed technical explanation for:
        
        TOPIC: {query}
        
        Please provide:
        1. Technical breakdown
        2. Step-by-step explanation
        3. Code examples if applicable
        4. Best practices
        
        Response:"""
        
        return self.llm.invoke(prompt)

class BusinessAgent:
    def __init__(self):
        self.name = "Business Analyst"
        self.role = "Expert in business strategy, analysis, and decision-making"
        self.llm = OllamaLLM(model="llama2")
    
    def analyze_business(self, query):
        prompt = f"""As a Business Analyst, provide business insights for:
        
        TOPIC: {query}
        
        Please provide:
        1. Business perspective
        2. Strategic implications
        3. Risk assessment
        4. Recommendations
        
        Response:"""
        
        return self.llm.invoke(prompt)

# Multi-Agent Coordinator - DEFINED BEFORE EnhancedMultiAgentSystem
class MultiAgentSystem:
    def __init__(self):
        self.agents = {
            "research": ResearchAgent(),
            "creative": CreativeAgent(),
            "technical": TechnicalAgent(),
            "business": BusinessAgent()
        }
        self.coordinator_llm = OllamaLLM(model="llama2")
    
    def route_query(self, query):
        """Determine which agent(s) should handle the query"""
        routing_prompt = f"""Analyze the following query and determine which specialized agents should handle it:
        
        QUERY: {query}
        
        Available agents:
        - research: For factual information, analysis, research
        - creative: For creative writing, storytelling, content
        - technical: For technical explanations, code, details
        - business: For business strategy, analysis, decisions
        
        Return the most appropriate agent names separated by commas. If multiple are needed, list them in order of priority.
        
        Response:"""
        
        routing_response = self.coordinator_llm.invoke(routing_prompt)
        return routing_response.strip().lower()
    
    def process_query(self, query, selected_agents=None):
        """Process query using selected agents or auto-route"""
        responses = {}
        
        if selected_agents:
            # Use manually selected agents
            agents_to_use = selected_agents
        else:
            # Auto-route to appropriate agents
            routed_agents = self.route_query(query)
            agents_to_use = [agent.strip() for agent in routed_agents.split(',')]
        
        # Execute each selected agent
        for agent_name in agents_to_use:
            if agent_name in self.agents:
                agent = self.agents[agent_name]
                try:
                    if agent_name == "research":
                        response = agent.analyze(query)
                    elif agent_name == "creative":
                        response = agent.create(query)
                    elif agent_name == "technical":
                        response = agent.explain(query)
                    elif agent_name == "business":
                        response = agent.analyze_business(query)
                    responses[agent_name] = response
                except Exception as e:
                    responses[agent_name] = f"Error in {agent_name}: {str(e)}"
        
        return responses

# Update MultiAgentSystem to include RAG agent - NOW DEFINED AFTER MultiAgentSystem
class EnhancedMultiAgentSystem(MultiAgentSystem):
    def __init__(self, rag_chain=None):
        super().__init__()
        if rag_chain:
            self.agents["rag_enhanced"] = RAGEnhancedAgent(rag_chain)

# Initialize the multi-agent system
multi_agent_system = MultiAgentSystem()

def query_multi_agent_system(query, agent_selection):
    """Main function to query the multi-agent system"""
    try:
        # Parse agent selection
        selected_agents = []
        if "research" in agent_selection: selected_agents.append("research")
        if "creative" in agent_selection: selected_agents.append("creative")
        if "technical" in agent_selection: selected_agents.append("technical")
        if "business" in agent_selection: selected_agents.append("business")
        
        # If no agents selected, use auto-routing
        if not selected_agents:
            responses = multi_agent_system.process_query(query)
        else:
            responses = multi_agent_system.process_query(query, selected_agents)
        
        # Format the response
        formatted_response = f"# 🤖 Multi-Agent Response\n\n"
        formatted_response += f"**Query:** {query}\n\n"
        formatted_response += f"**Processed by:** {', '.join(responses.keys())}\n\n"
        
        for agent_name, response in responses.items():
            formatted_response += f"## 🎯 {agent_name}\n"
            formatted_response += f"{response}\n\n"
            formatted_response += "---\n\n"
        
        return formatted_response
        
    except Exception as e:
        return f"Multi-Agent System Error: {str(e)}"

def create_multi_agent_demo():
    """Create the Multi-Agent application"""
    with gr.Blocks(title="Multi-Agent System") as multi_agent_demo:
        gr.Markdown("# 🤖 Multi-Agent AI System")
        gr.Markdown("### Get specialized responses from different AI agents")
        
        with gr.Row():
            with gr.Column():
                agent_input = gr.Textbox(
                    label="Your Question or Task",
                    placeholder="Ask anything and let specialized agents handle it...",
                    lines=4
                )
                
                gr.Markdown("### Select Specialized Agents (or leave blank for auto-routing)")
                
                with gr.Row():
                    research_check = gr.Checkbox(label="🔍 Research Agent", value=False)
                    creative_check = gr.Checkbox(label="🎨 Creative Agent", value=False)
                    technical_check = gr.Checkbox(label="⚙️ Technical Agent", value=False)
                    business_check = gr.Checkbox(label="💼 Business Agent", value=False)
                
                agent_btn = gr.Button("Consult Agents", variant="primary")
            
            with gr.Column():
                agent_output = gr.Markdown(
                    label="Multi-Agent Response",
                    show_label=False
                )
        
        # Agent descriptions
        with gr.Accordion("🤖 Meet the AI Agents", open=False):
            gr.Markdown("""
            ### Specialized AI Agents
            
            **🔍 Research Agent** - Expert in research, analysis, and information synthesis
            - Factual information and data analysis
            - Comprehensive research summaries
            - Objective perspective on topics
            
            **🎨 Creative Agent** - Expert in creative writing and storytelling
            - Creative content generation
            - Engaging narratives and stories
            - Inspiring and imaginative responses
            
            **⚙️ Technical Agent** - Expert in technical explanations
            - Detailed technical breakdowns
            - Code examples and explanations
            - Step-by-step technical guidance
            
            **💼 Business Agent** - Expert in business strategy
            - Business analysis and insights
            - Strategic recommendations
            - Risk assessment and planning
            """)
        
        agent_btn.click(
            fn=query_multi_agent_system,
            inputs=[
                agent_input,
                gr.CheckboxGroup(choices=["research", "creative", "technical", "business"], 
                               value=[], label="Selected Agents", show_label=False)
            ],
            outputs=agent_output
        )
    
    return multi_agent_demo

# Quick test function
def test_agents():
    """Test the multi-agent system"""
    test_queries = [
        "Explain quantum computing",
        "Write a short story about AI",
        "Analyze market trends for electric vehicles",
        "How to implement a neural network in Python?"
    ]
    
    for query in test_queries:
        print(f"\n=== Testing: {query} ===")
        response = multi_agent_system.process_query(query)
        for agent, answer in response.items():
            print(f"\n{agent}: {answer[:200]}...")

if __name__ == "__main__":
    # Test the system
    test_agents()
    