const { getCombinedCredentials } = require('./support/credon.js');

(async () => {
  try {
    const jsonString = await getCombinedCredentials();
    console.log('JSON String:', jsonString);
    const data = JSON.parse(jsonString);
    const credentials = data['Credentials_A1-B4'][0]; // First object
    console.log('Credentials:', credentials);

    // Output key-value pairs for GitHub Actions to set as secrets
    for (const [key, value] of Object.entries(credentials)) {
      console.log(`::set-output name=${key}::${value}`);
    }
  } catch (error) {
    console.error('Error processing credentials:', error.message);
    process.exit(1);
  }
})();