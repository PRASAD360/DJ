const { getCombinedCredentials } = require('./support/token.js');

async function getCredentials(configs) {
    const jsonString = await getCombinedCredentials();
    console.log(jsonString);
  }

getCredentials()