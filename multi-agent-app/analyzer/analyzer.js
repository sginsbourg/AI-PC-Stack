const { ChatOpenAI } = require('@langchain/openai');
const fs = require('fs').promises;
require('dotenv').config();

async function analyzeResults(type = 'k6') {
  const llm = new ChatOpenAI({
    baseUrl: process.env.LOCAL_LLM_URL || 'http://localhost:5000/v1',
    apiKey: 'dummy',
  });

  const resultFile = type === 'k6' ? 'results/k6/k6-results.json' :
                    type === 'locust' ? 'results/locust/locust-results.csv' :
                    'results/jmeter/jmeter-results.jtl';
  const results = await fs.readFile(resultFile, 'utf-8');

  const prompt = `Analyze the following load test results and identify bottlenecks: ${results}`;
  const response = await llm.invoke(prompt);
  return { status: 'Analyzed', report: response.content };
}

module.exports = { analyzeResults };

// Example usage
if (require.main === module) {
  analyzeResults('k6').then(console.log).catch(console.error);
}