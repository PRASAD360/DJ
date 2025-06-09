const { WebSocketV2 } = require('smartapi-javascript');

async function main() {
  // Load authentication keys from environment
  const authKeys = {
    jwttoken: process.env.AUTHORIZATION,
    apikey: process.env.X_API_KEY,
    clientcode: process.env.X_CLIENT_CODE,
    feedtype: process.env.X_FEED_TOKEN,
  };

  // Initialize WebSocket
  const ws = new WebSocketV2(authKeys);

  // Handle market data ticks
  ws.on('tick', (data) => {
    console.log('Tick:', JSON.stringify(data));
  });

  ws.on('error', (e) => console.error('Error:', e.message));
  ws.on('close', () => console.log('Closed'));

  // Connect to WebSocket
  await ws.connect();

  // Subscribe to SBI (token: 3495, exchangeType: 1)
  setTimeout(() => {
    ws.fetchData({
      correlationID: 'sub_sbi',
      action: 1, // Subscribe
      mode: 1, // LTP
      exchangeType: 1, // NSE CM
      tokens: ['3495'],
    });
  }, 1000);

  // Safe exit after 30 seconds
  setTimeout(async () => {
    ws.fetchData({
      correlationID: 'unsub_sbi',
      action: 0, // Unsubscribe
      mode: 1, // LTP
      exchangeType: 1, // NSE CM
      tokens: ['3495'],
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ws.close();
    process.exit(0);
  }, 20000);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});