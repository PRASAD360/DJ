// Step 1: Import SmartAPI WebSocket module
const { WebSocketV2 } = require('smartapi-javascript');

// Step 2: Load credentials from environment secrets
function loadAuthKeys() {
  const authKeys = {
    x_client_code: process.env.X_CLIENT_CODE,
    x_api_key: process.env.X_API_KEY,
    Authorization: process.env.AUTHORIZATION,
    x_feed_token: process.env.X_FEED_TOKEN,
  };
  console.log('Credentials loaded:', {
    x_client_code: authKeys.x_client_code,
    x_api_key: authKeys.x_api_key?.slice(0, 6) + '...',
    Authorization: authKeys.Authorization?.slice(0, 12) + '...',
    x_feed_token: authKeys.x_feed_token?.slice(0, 6) + '...',
  });
  return authKeys;
}

// Step 3: Initialize WebSocket
function createWebSocket(authKeys) {
  const ws = new WebSocketV2({
    jwttoken: authKeys.Authorization,
    apikey: authKeys.x_api_key,
    clientcode: authKeys.x_client_code,
    feedtype: authKeys.x_feed_token,
  });
  console.log('WebSocket initialized');
  return ws;
}

// Step 4: Set up event handlers
function attachEvents(ws) {
  ws.on('tick', (data) => {
    console.log('Tick:', data);
    // TODO: Add trading logic (e.g., RSI)
  });

  ws.on('error', (e) => {
    console.error('WebSocket error:', e.message);
  });

  ws.on('close', () => {
    console.log('Connection closed');
  });

  console.log('Events attached');
}

// Step 5: Connect and subscribe
async function connectAndSubscribe(ws) {
  console.log('Connecting...');
  await ws.connect();
  console.log('Connected');

  setTimeout(() => {
    console.log('Subscribing to token: 99926000');
    ws.fetchData({
      correlationID: 'test123',
      action: 1, // Subscribe
      mode: 1, // LTP
      exchangeType: 1, // NSE CM
      tokens: ['99926000'], // Single hardcoded token
    });
    console.log('Subscribed');
  }, 1000);
  return '99926000'; // Return single token
}

// Step 6: Unsubscribe token before exit
async function unsubscribeToken(ws, token) {
  console.log('Unsubscribing token:', token);
  ws.fetchData({
    correlationID: 'unsub123',
    action: 0, // Unsubscribe
    mode: 1, // LTP
    exchangeType: 1, // NSE CM
    tokens: [token], // Single token
  });
  console.log('Unsubscribe request sent');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  ws.close();
  console.log('WebSocket closed');
}

// Step 7: Main function
async function main() {
  const authKeys = loadAuthKeys(); // Test Step 2
  const ws = createWebSocket(authKeys); // Test Step 3
  attachEvents(ws); // Test Step 4
  const subscribedToken = await connectAndSubscribe(ws); // Test Step 5

  console.log('Running... (Ctrl+C to exit)');

  // Step 6: Handle SIGINT for graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT (Ctrl+C), shutting down...');
    await unsubscribeToken(ws, subscribedToken); // Unsubscribe Step 6
    console.log('Shutdown complete');
    process.exit(0);
  });
}

main();