// Step 1: Define configuration at start
const SHOW_PONG = process.env.SHOW_PONG === 'true' || false; // Toggle pong logging (default: false)
const RUN_DURATION_SECONDS = parseInt(process.env.RUN_DURATION_SECONDS) || 30; // Runtime in seconds (default: 30s, 0 for indefinite)

// Step 2: Import modules
const { WebSocketV2 } = require('smartapi-javascript');
require('dotenv').config(); // Load .env from same folder

// Step 3: Initialize data storage
const marketData = []; // Store market data ticks
const pongData = []; // Store pong messages

// Step 4: Load credentials from .env
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

// Step 5: Initialize WebSocket
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

// Step 6: Set up event handlers
function attachEvents(ws) {
  ws.on('tick', (data) => {
    // Check for pong message
    if (data['0'] === 'p' && data['1'] === 'o' && data['2'] === 'n' && data['3'] === 'g') {
      const pongMessage = { ...data, timestamp: new Date().toISOString() };
      if (SHOW_PONG) {
        console.log('Pong message:', JSON.stringify(pongMessage));
      }
      pongData.push(pongMessage);
    } else {
      // Handle market data
      const tickData = {
        ...data,
        token: data.token ? data.token.replace(/"/g, '') : data.token,
        timestamp: new Date().toISOString(),
      };
      console.log('Market data:', JSON.stringify(tickData));
      marketData.push(tickData);
    }
  });

  ws.on('error', (e) => {
    console.error('WebSocket error:', e.message);
  });

  ws.on('close', () => {
    console.log('Connection closed');
  });

  console.log('Events attached');
}

// Step 7: Connect and subscribe
async function connectAndSubscribe(ws) {
  console.log('Connecting...');
  await ws.connect();
  console.log('Connected');

  setTimeout(() => {
    console.log('Subscribing to token: 99926000');
    ws.fetchData({
      correlationID: 'test123',
      action: 1, // Subscribe
      mode: 3, // LTP
      exchangeType: 1, // NSE CM
      tokens: ['99926000'],
    });
    console.log('Subscribed');
  }, 1000);
  return '99926000';
}

// Step 8: Unsubscribe token
async function unsubscribeToken(ws, token) {
  console.log('Unsubscribing token:', token);
  ws.fetchData({
    correlationID: 'unsub123',
    action: 0, // Unsubscribe
    mode: 3, // LTP
    exchangeType: 1, // NSE CM
    tokens: [token],
  });
  console.log('Unsubscribe request sent');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  ws.close();
  console.log('WebSocket closed');
}

// Step 9: Main function
async function main() {
  console.log(RUN_DURATION_SECONDS === 0 ? 'Running indefinitely' : `Running for ${RUN_DURATION_SECONDS} seconds`);

  const authKeys = loadAuthKeys();
  const ws = createWebSocket(authKeys);
  attachEvents(ws);
  const subscribedToken = await connectAndSubscribe(ws);

  // SIGINT for Termux (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('Received SIGINT (Ctrl+C), shutting down...');
    await unsubscribeToken(ws, subscribedToken);
    console.log('Shutdown complete');
    process.exit(0);
  });

  // Auto-exit if duration is set
  if (RUN_DURATION_SECONDS > 0) {
    setTimeout(async () => {
      console.log('Auto-shutting down...');
      await unsubscribeToken(ws, subscribedToken);
      console.log('Shutdown complete');
      process.exit(0);
    }, RUN_DURATION_SECONDS * 1000);
  }
}

main();

// Step 10: Export data for other JS files
module.exports = { marketData, pongData };
