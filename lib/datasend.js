const ws = require('./WS.js');

// Poll for data every second
const checkData = setInterval(() => {
  const { latestMarketData, latestPongData } = ws.getLatestData();
  console.log('Latest Market Data:', latestMarketData);
  console.log('Latest Pong Data:', latestPongData);

  // Stop polling after 30 seconds (adjust as needed)
  if (Object.keys(latestMarketData).length > 0 || Object.keys(latestPongData).length > 0) {
    clearInterval(checkData);
  }
}, 1000);