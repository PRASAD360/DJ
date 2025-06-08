


const { getCombinedCredentials } = require('./support/tokens.js');

async function getCredentials() {
  try {
    const jsonString = await getCombinedCredentials();
    const data = JSON.parse(jsonString);
    // Merge all dataset arrays into a single array
    const mergedArray = Object.values(data).flat();
    console.log(JSON.stringify(mergedArray, null, 2));
  } catch (error) {
    console.error('Error processing credentials:', error.message);
  }
}

getCredentials();