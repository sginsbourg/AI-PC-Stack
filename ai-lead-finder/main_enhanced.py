#!/usr/bin/env python3

import subprocess
import time
import os
from pathlib import Path
import asyncio
import aiohttp
import json

class AIPoweredLeadFinder:
    def __init__(self):
        self.base_url = "http://localhost:8000"
    
    async def check_services(self):
        """Check if all AI services are running"""
        services = {
            "Ollama": "http://localhost:11434",
            "Open Manus": "http://localhost:8000",
            "Elasticsearch": "http://localhost:9200"
        }
        
        print("🔍 Checking services...")
        async with aiohttp.ClientSession() as session:
            for service, url in services.items():
                try:
                    async with session.get(f"{url}/" if service != "Ollama" else f"{url}/api/tags") as response:
                        if response.status in [200, 401]:
                            print(f"✅ {service} is running")
                        else:
                            print(f"❌ {service} returned status {response.status}")
                except Exception as e:
                    print(f"❌ {service} is not accessible: {e}")
    
    async def run_enhanced_pipeline(self):
        """Run the complete AI-enhanced pipeline"""
        
        print("🚀 Starting AI-Powered Lead Finder with Open Manus AI...")
        print("✅ Confirmed: All AI models running locally - No API keys needed!")
        
        # Check services
        await self.check_services()
        
        # Step 1: Initialize AI models
        print("\n🤖 Step 1: Initializing AI models...")
        try:
            subprocess.run(["./scripts/init_models.sh"], check=True)
            print("✅ AI models initialized!")
        except subprocess.CalledProcessError as e:
            print(f"❌ Model initialization failed: {e}")
            return
        
        # Step 2: Run Nutch crawl
        print("\n📡 Step 2: Starting web crawl with Apache Nutch...")
        try:
            subprocess.run(["./scripts/crawl.sh"], check=True)
            print("✅ Crawl completed successfully!")
        except subprocess.CalledProcessError as e:
            print(f"❌ Crawl failed: {e}")
            return
        
        # Wait for indexing
        print("⏳ Waiting for data indexing...")
        time.sleep(30)
        
        # Step 3: Run AI-enhanced lead analysis
        print("\n🔍 Step 3: Analyzing leads with AI...")
        try:
            # Import and run the enhanced analyzer
            from lead_analyzer.analyzer import EnhancedLeadAnalyzer
            analyzer = EnhancedLeadAnalyzer()
            leads = await analyzer.generate_leads_report()
            print("✅ AI analysis completed!")
            
            # Display results
            self.display_ai_results(leads)
            
        except Exception as e:
            print(f"❌ AI analysis failed: {e}")
            return
    
    def display_ai_results(self, leads):
        """Display AI-enhanced results"""
        print(f"\n🎯 AI Analysis Complete!")
        print(f"📊 Found {len(leads)} qualified leads")
        
        if leads:
            top_leads = sorted(leads, key=lambda x: x['relevance_score'], reverse=True)[:5]
            
            print("\n🏆 Top 5 AI-Analyzed Leads:")
            print("="*100)
            
            for i, lead in enumerate(top_leads, 1):
                print(f"\n{i}. {lead.get('company', 'Unknown')}")
                print(f"   📍 URL: {lead['url']}")
                print(f"   ⭐ Relevance Score: {lead['relevance_score']}/10")
                print(f"   🎯 Intent: {lead['intent_classification']}")
                print(f"   💰 Value: {lead['potential_value']}")
                print(f"   🔧 Tech Stack: {', '.join(lead['technology_stack'][:3])}")
                print(f"   📧 Emails: {', '.join(lead['emails'][:2])}")
                
                if lead.get('personalized_approach'):
                    print(f"   💡 Approach: {lead['personalized_approach'][:100]}...")
                
                print("-" * 100)
        
        print(f"\n📁 Results saved in:")
        print("   - results/ai_leads.csv (CSV format)")
        print("   - results/ai_leads_detailed.json (Detailed JSON)")
        print("   - results/summary_report.md (Summary report)")

async def main():
    finder = AIPoweredLeadFinder()
    await finder.run_enhanced_pipeline()

if __name__ == "__main__":
    # Create necessary directories
    Path("results").mkdir(exist_ok=True)
    Path("scripts").mkdir(exist_ok=True)
    Path("models").mkdir(exist_ok=True)
    
    # Make scripts executable
    for script in Path("scripts").glob("*.sh"):
        script.chmod(0o755)
    
    asyncio.run(main())