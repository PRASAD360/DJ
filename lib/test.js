
const { combinedCredentials } = require('./support/credon.js');

async function runWebSocket() {
  
    const credentials = combinedCredentials['Credentials_A1-B4'][0]; // First object
    console.log('Using credentials:', credentials);

    
}

runWebSocket();