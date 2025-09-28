const express = require('express');
const { AgentExecutor, createReactAgent } = require('@langchain/core');
const { ChatOpenAI } = require('@langchain/openai');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize local LLM
const llm = new ChatOpenAI({
  baseUrl: process.env.LOCAL_LLM_URL || 'http://localhost:5000/v1',
  apiKey: 'dummy', // No key needed for local server
});

// Define tools (e.g., functions to call other agents)
const tools = [
  {
    name: 'generateTestScript',
    description: 'Generate a load test script',
    func: async (input) => {
      // Simulate calling generator agent (in production, use HTTP/gRPC)
      return JSON.stringify({ status: 'Generated', script: input });
    },
  },
  {
    name: 'runTest',
    description: 'Run a load test',
    func: async (input) => {
      // Simulate calling runner agent
      return JSON.stringify({ status: 'Running', test: input });
    },
  },
  {
    name: 'analyzeResults',
    description: 'Analyze test results',
    func: async (input) => {
      // Simulate calling analyzer agent
      return JSON.stringify({ status: 'Analyzed', results: input });
    },
  },
];

const agent = createReactAgent({ llm, tools });
const executor = new AgentExecutor({ agent });

// API endpoint for user input
app.post('/orchestrate', async (req, res) => {
  try {
    const { input } = req.body;
    const result = await executor.invoke({ input });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Orchestrator running on port ${PORT}`));