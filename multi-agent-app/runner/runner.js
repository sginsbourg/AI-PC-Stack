const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

async function runTest(type = 'k6') {
  let command;
  switch (type) {
    case 'k6':
      command = 'k6 run scripts/test-script.js';
      break;
    case 'locust':
      command = 'locust -f scripts/locustfile.py --headless --users 100 --spawn-rate 10 --run-time 1m';
      break;
    case 'jmeter':
      command = 'jmeter -n -t scripts/test-plan.jmx -l results/jmeter/jmeter-results.jtl';
      break;
    default:
      throw new Error('Unsupported test type');
  }

  try {
    const { stdout, stderr } = await execPromise(command);
    return { status: 'Completed', output: stdout, error: stderr };
  } catch (error) {
    return { status: 'Failed', error: error.message };
  }
}

module.exports = { runTest };

// Example usage
if (require.main === module) {
  runTest('k6').then(console.log).catch(console.error);
}