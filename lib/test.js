const { getCombinedCredentials } = require('./support/credon.js');

async function getCredentials(configs) {
    const jsonString = await getCombinedCredentials();
    console.log(jsonString);
  }

getCredentials()