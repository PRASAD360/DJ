const { latestMarketData, latestPongData } = require('./lib/WS.js');
console.log('Latest Market Data:', latestMarketData); // Latest tick per token
console.log('Latest Pong Data:', latestPongData); // Latest pong message