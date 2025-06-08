const { latestMarketData, latestPongData } = require('./WS.js');

setTimeout(() => {
  console.log('Latest Market Data:', latestMarketData);
  console.log('Latest Pong Data:', latestPongData);
}, 10000); // Wait 10 seconds for WebSocket data