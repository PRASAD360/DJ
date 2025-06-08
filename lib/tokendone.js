const { getCombinedCredentials } = require('./support/tokens.js');

async function getCredentials(configs) {
    const jsonString = await getCombinedCredentials();
    console.log(jsonString);
  }

getCredentials()
