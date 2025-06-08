// Step 1: Define configuration for GitHub Actions
const SHOW_PONG = false; // No pong logging in console
const RUN_DURATION_SECONDS = parseInt(process.env.RUN_DURATION_SECONDS) || 0; // Runtime in seconds (0 for indefinite)

// Step 2: Import modules
const { WebSocketV2 } = require('smartapi-javascript');
const fs = require('fs');
const path = require('path');

// Step 3: Initialize data storage
const marketData = []; // Store market data ticks
const pongData = []; // Store pong messages
const instruments = JSON.parse(fs.readFileSync(path.join(__dirname, '../instruments.json'), 'utf8')); // Read instruments.json from repo root

// Step 4: Load credentials from environment variables
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
    if (data['0'] === 'p' && data['1'] === 'o' && data['2'] === 'n' && data['3'] === 'g') {
      const pongMessage = { ...data, timestamp: new Date().toISOString() };
      if (SHOW_PONG) {
        console.log('Pong message:', JSON.stringify(pongMessage));
      }
      pongData.push(pongMessage);
    } else {
      const token = data.token ? data.token.replace(/"/g, '') : data.token;
      const instrument = instruments.find(
        (inst) => inst.token === token && inst.exchangeType === data.exchange_type
      );
      const tickData = {
        ...data,
        token,
        timestamp: new Date().toISOString(),
        ...(instrument || {}), // Merge instrument details
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

  const subscriptions = instruments.reduce((acc, inst) => {
    const exchangeType = parseInt(inst.exchangeType);
    if (!acc[exchangeType]) {
      acc[exchangeType] = [];
    }
    acc[exchangeType].push(inst.token);
    return acc;
  }, {});

  setTimeout(() => {
    Object.entries(subscriptions).forEach(([exchangeType, tokens]) => {
      console.log(`Subscribing to tokens: ${tokens.join(', ')} (exchangeType: ${exchangeType})`);
      ws.fetchData({
        correlationID: `sub_${exchangeType}`,
        action: 1, // Subscribe
        mode: 1, // LTP
        exchangeType: parseInt(exchangeType),
        tokens,
      });
    });
    console.log('Subscribed');
  }, 1000);

  return subscriptions;
}

// Step 8: Unsubscribe tokens
async function unsubscribeToken(ws, subscriptions) {
  console.log('Unsubscribing tokens...');
  Object.entries(subscriptions).forEach(([exchangeType, tokens]) => {
    ws.fetchData({
      correlationID: `unsub_${exchangeType}`,
      action: 0, // Unsubscribe
      mode: 1, // LTP
      exchangeType: parseInt(exchangeType),
      tokens,
    });
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
  const subscriptions = await connectAndSubscribe(ws);

  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    await unsubscribeToken(ws, subscriptions);
    console.log('Shutdown complete');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...');
    await unsubscribeToken(ws, subscriptions);
    console.log('Shutdown complete');
    process.exit(0);
  });

  // Auto-exit if duration is set
  if (RUN_DURATION_SECONDS > 0) {
    setTimeout(async () => {
      console.log('Auto-shutting down...');
      await unsubscribeToken(ws, subscriptions);
      console.log('Shutdown complete');
      process.exit(0);
    }, RUN_DURATION_SECONDS * 1000);
  }
}

main();

// Step 10: Export data for other JS files
module.exports = { marketData, pongData };