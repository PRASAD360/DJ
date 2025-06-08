const { getCombinedCredentials } = require('./support/credon.js');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const jsonString = await getCombinedCredentials();
    console.log('JSON String:', jsonString);
    const data = JSON.parse(jsonString);
    const credentials = data['Credentials_A1-B4'][0];
    console.log('Credentials:', credentials);

    // Write outputs to $GITHUB_OUTPUT
    const outputFile = process.env.GITHUB_OUTPUT;
    if (!outputFile) {
      throw new Error('GITHUB_OUTPUT environment variable is not set');
    }

    for (const [key, value] of Object.entries(credentials)) {
      fs.appendFileSync(outputFile, `${key}=${value}\n`);
      console.log(`Set output: ${key}=${value}`);
    }
  } catch (error) {
    console.error('Error processing credentials:', error.message);
    process.exit(1);
  }
})();