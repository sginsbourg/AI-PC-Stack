import json
import re
import asyncio
import aiohttp
from elasticsearch import Elasticsearch
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any

class EnhancedLeadAnalyzer:
    def __init__(self):
        self.es = Elasticsearch(['http://elasticsearch:9200'])
        self.open_manus_url = "http://open-manus:8000"
        self.ollama_url = "http://ollama:11434"
        
    async def analyze_with_ai(self, content: str, url: str, title: str) -> Dict[str, Any]:
        """Analyze content using Open Manus AI"""
        async with aiohttp.ClientSession() as session:
            payload = {
                "content": content[:5000],  # Limit content size
                "url": url,
                "title": title
            }
            
            async with session.post(
                f"{self.open_manus_url}/analyze-lead",
                json=payload
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return await self.fallback_analysis(content, url)
    
    async def fallback_analysis(self, content: str, url: str) -> Dict[str, Any]:
        """Fallback analysis if AI service is unavailable"""
        content_lower = content.lower()
        
        # Basic keyword analysis
        ai_keywords = ['ai', 'artificial intelligence', 'machine learning', 'neural network']
        perf_keywords = ['performance testing', 'load testing', 'stress testing', 'jmeter', 'gatling']
        
        ai_score = sum(1 for keyword in ai_keywords if keyword in content_lower)
        perf_score = sum(1 for keyword in perf_keywords if keyword in content_lower)
        
        return {
            "relevance_score": min(10, (ai_score + perf_score) * 2),
            "intent_classification": "unknown",
            "potential_value": "medium" if (ai_score + perf_score) > 2 else "low",
            "key_insights": ["Basic analysis - AI service unavailable"],
            "competitor_mentions": [],
            "technology_stack": []
        }
    
    def extract_advanced_contact_info(self, content: str, url: str) -> Dict[str, Any]:
        """Enhanced contact information extraction"""
        # Email patterns
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content)
        
        # Phone patterns (international)
        phones = re.findall(r'(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{2,4}[-.\s]?\d{3,4}', content)
        
        # Social media handles
        linkedin = re.findall(r'linkedin\.com/(?:in|company)/[^\s\)]+', content)
        twitter = re.findall(r'twitter\.com/([^\s\)]+)', content)
        
        # Company info from URL and content
        company_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
        company = company_match.group(1) if company_match else None
        
        return {
            'emails': list(set(emails)),
            'phones': list(set(phones)),
            'linkedin_profiles': linkedin,
            'twitter_handles': twitter,
            'company': company,
            'domain': company
        }
    
    async def generate_leads_report(self):
        """Generate comprehensive AI-enhanced leads report"""
        print("🔍 Searching for potential leads with AI analysis...")
        
        # Search Elasticsearch for relevant content
        query = {
            "query": {
                "bool": {
                    "should": [
                        {"match": {"content": "performance testing"}},
                        {"match": {"content": "load testing"}},
                        {"match": {"content": "AI"}},
                        {"match": {"content": "artificial intelligence"}},
                        {"match": {"content": "JMeter"}},
                        {"match": {"content": "Gatling"}}
                    ],
                    "minimum_should_match": 1
                }
            },
            "size": 100
        }
        
        response = self.es.search(index="nutch", body=query)
        results = response['hits']['hits']
        
        leads = []
        
        # Process leads with AI analysis
        for hit in results:
            source = hit['_source']
            url = source.get('url', '')
            title = source.get('title', '')
            content = source.get('content', '')
            
            # Extract contact info
            contact_info = self.extract_advanced_contact_info(content, url)
            
            # AI analysis
            ai_analysis = await self.analyze_with_ai(content, url, title)
            
            # Only include leads with sufficient relevance
            if ai_analysis.get('relevance_score', 0) >= 5:
                lead = {
                    'url': url,
                    'title': title,
                    'company': contact_info['company'],
                    'emails': contact_info['emails'],
                    'phones': contact_info['phones'],
                    'linkedin_profiles': contact_info['linkedin_profiles'],
                    'twitter_handles': contact_info['twitter_handles'],
                    'ai_analysis': ai_analysis,
                    'relevance_score': ai_analysis.get('relevance_score', 0),
                    'potential_value': ai_analysis.get('potential_value', 'low'),
                    'intent_classification': ai_analysis.get('intent_classification', 'unknown'),
                    'key_insights': ai_analysis.get('key_insights', []),
                    'technology_stack': ai_analysis.get('technology_stack', []),
                    'timestamp': datetime.now().isoformat()
                }
                leads.append(lead)
        
        # Sort by relevance score
        leads.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        # Generate personalized approaches for top leads
        top_leads = leads[:10]  # Top 10 leads
        await self.generate_personalized_approaches(top_leads)
        
        # Save results
        self.save_results(leads)
        
        print(f"✅ Found {len(leads)} AI-analyzed leads")
        print(f"🏆 High-quality leads (score >= 7): {len([l for l in leads if l['relevance_score'] >= 7])}")
        
        return leads
    
    async def generate_personalized_approaches(self, leads: List[Dict]):
        """Generate personalized outreach approaches for top leads"""
        async with aiohttp.ClientSession() as session:
            for lead in leads:
                try:
                    payload = {
                        "leads": [{
                            "url": lead['url'],
                            "content": lead.get('content', ''),
                            "title": lead['title'],
                            "contact_info": {
                                "emails": lead['emails'],
                                "company": lead['company']
                            }
                        }]
                    }
                    
                    async with session.post(
                        f"{self.open_manus_url}/analyze-batch",
                        json=payload
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            if result.get('results'):
                                lead['personalized_approach'] = result['results'][0].get('personalized_approach', '')
                
                except Exception as e:
                    print(f"Error generating approach for {lead['url']}: {e}")
                    lead['personalized_approach'] = "Approach generation failed."
    
    def save_results(self, leads: List[Dict]):
        """Save leads to various formats"""
        # CSV format
        csv_data = []
        for lead in leads:
            csv_data.append({
                'url': lead['url'],
                'title': lead['title'],
                'company': lead['company'],
                'emails': '; '.join(lead['emails']),
                'phones': '; '.join(lead['phones']),
                'relevance_score': lead['relevance_score'],
                'potential_value': lead['potential_value'],
                'intent_classification': lead['intent_classification'],
                'key_insights': ' | '.join(lead['key_insights']),
                'technology_stack': ' | '.join(lead['technology_stack'])
            })
        
        df = pd.DataFrame(csv_data)
        df.to_csv('/results/ai_leads.csv', index=False)
        
        # Detailed JSON report
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_leads': len(leads),
            'high_quality_leads': len([l for l in leads if l['relevance_score'] >= 7]),
            'leads_by_intent': {},
            'leads': leads
        }
        
        # Count leads by intent
        for lead in leads:
            intent = lead['intent_classification']
            report['leads_by_intent'][intent] = report['leads_by_intent'].get(intent, 0) + 1
        
        with open('/results/ai_leads_detailed.json', 'w') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # Generate summary report
        self.generate_summary_report(leads)
    
    def generate_summary_report(self, leads: List[Dict]):
        """Generate a human-readable summary report"""
        summary = f"""
# AI-Powered Lead Generation Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary
- Total Leads Found: {len(leads)}
- High-Quality Leads (Score >= 7): {len([l for l in leads if l['relevance_score'] >= 7])}
- Average Relevance Score: {sum(l['relevance_score'] for l in leads) / len(leads) if leads else 0:.2f}

## Top Lead Categories
"""
        
        # Add intent breakdown
        intent_counts = {}
        for lead in leads:
            intent = lead['intent_classification']
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        
        for intent, count in sorted(intent_counts.items(), key=lambda x: x[1], reverse=True):
            summary += f"- {intent}: {count} leads\n"
        
        # Top 5 leads
        summary += "\n## Top 5 Leads\n"
        for i, lead in enumerate(leads[:5], 1):
            summary += f"""
{i}. **{lead['company']}** (Score: {lead['relevance_score']}/10)
   - URL: {lead['url']}
   - Intent: {lead['intent_classification']}
   - Value: {lead['potential_value']}
   - Key Insights: {', '.join(lead['key_insights'][:3])}
   - Emails: {', '.join(lead['emails'][:2])}
"""
        
        with open('/results/summary_report.md', 'w') as f:
            f.write(summary)

async def main():
    analyzer = EnhancedLeadAnalyzer()
    await analyzer.generate_leads_report()

if __name__ == "__main__":
    asyncio.run(main())