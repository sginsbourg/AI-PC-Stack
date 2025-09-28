const { ChatOpenAI } = require('@langchain/openai');
const fs = require('fs').promises;
require('dotenv').config();

async function generateScript(requirements, type = 'k6') {
  const llm = new ChatOpenAI({
    baseUrl: process.env.LOCAL_LLM_URL || 'http://localhost:5000/v1',
    apiKey: 'dummy',
  });

  const prompt = `Generate a ${type} load test script for the following requirements: ${requirements}`;
  const response = await llm.invoke(prompt);
  const scriptContent = response.content;

  // Save to appropriate file
  const filePath = type === 'k6' ? 'scripts/test-script.js' :
                  type === 'locust' ? 'scripts/locustfile.py' :
                  'scripts/test-plan.jmx';
  await fs.writeFile(filePath, scriptContent);
  return { status: 'Generated', file: filePath };
}

module.exports = { generateScript };

// Example usage (can be called via API or orchestrator)
if (require.main === module) {
  generateScript('Test GET /api endpoint with 100 users for 1 minute', 'k6')
    .then(console.log)
    .catch(console.error);
}