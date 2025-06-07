
const { getCredentials } = require('./support/credon.js');

async function getcredentials() {
  
    const credentials = await getCredentials();
    // console.log('Using credentials:', credentials);

    }

runWebSocket();