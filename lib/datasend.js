const { latestMarketData, latestPongData } = require('./WS.js');

// Log data after a delay to allow WebSocket to receive data
setTimeout(() => {
  console.log('Latest Market Data:', latestMarketData);
  console.log('Latest Pong Data:', latestPongData);
}, 10000); // 10 seconds delay