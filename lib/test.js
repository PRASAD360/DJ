const { WebSocketV2 } = require('smartapi-javascript');
const { getCredentials } = require('./support/credon.js');

async function runWebSocket() {
  
    const credentials = await getCredentials();
    // console.log('Using credentials:', credentials);

    }

runWebSocket();