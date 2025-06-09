// Step 1: Define configuration at start
const SHOW_PONG = process.env.SHOW_PONG === 'true' || false; // Toggle pong logging (default: false)
const RUN_DURATION_MS = parseInt(process.env.RUN_DURATION_MS) || 30000; // Runtime in ms (default: 30s)

// Step 2: Import modules
const { WebSocketV2 } = require('smartapi-javascript');
const fs = require('fs');

// Step 3: Initialize data storage
const flattenedMarketData = {}; // Store flattened market data: {token: {...}}
const pongData = []; // Store pong messages

// Step 4: Load instruments from instruments.json
function loadInstruments() {
  try {
    const data = fs.readFileSync('instruments.json', 'utf8');
    return JSON.parse(data); // [{token: "99926000", exchangeType: "1"}, ...]
  } catch (e) {
    console.error('Error reading instruments.json:', e.message);
    process.exit(1);
  }
}

// Step 5: Load credentials from environment
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

// Step 6: Initialize WebSocket
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

// Step 7: Set up event handlers
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
      flattenedMarketData[tickData.token] = tickData; // Flatten by token
      console.log('Market data:', JSON.stringify(tickData));
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

// Step 8: Connect and subscribe
async function connectAndSubscribe(ws, instruments) {
  console.log('Connecting...');
  await ws.connect();
  console.log('Connected');

  // Group tokens by exchangeType
  const tokensByExchange = instruments.reduce((acc, { token, exchangeType }) => {
    acc[exchangeType] = acc[exchangeType] || [];
    acc[exchangeType].push(token);
    return acc;
  }, {});

  setTimeout(() => {
    // Subscribe to each exchangeType
    Object.entries(tokensByExchange).forEach(([exchangeType, tokens]) => {
      console.log(`Subscribing to exchangeType: ${exchangeType}, tokens: ${tokens}`);
      ws.fetchData({
        correlationID: `sub_${exchangeType}`,
        action: 1, // Subscribe
        mode: 1, // LTP
        exchangeType: parseInt(exchangeType),
        tokens,
      });
    });
    console.log('Subscribed to all tokens');
  }, 1000);

  return tokensByExchange;
}

// Step 9: Unsubscribe tokens
async function unsubscribeTokens(ws, tokensByExchange) {
  console.log('Unsubscribing tokens...');
  Object.entries(tokensByExchange).forEach(([exchangeType, tokens]) => {
    console.log(`Unsubscribing exchangeType: ${exchangeType}, tokens: ${tokens}`);
    ws.fetchData({
      correlationID: `unsub_${exchangeType}`,
      action: 0, // Unsubscribe
      mode: 1, // LTP
      exchangeType: parseInt(exchangeType),
      tokens,
    });
  });
  console.log('Unsubscribe requests sent');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  ws.close();
  console.log('WebSocket closed');
}

// Step 10: Main function
async function main() {
  console.log(`Running for ${RUN_DURATION_MS / 1000} seconds`);

  const instruments = loadInstruments();
  const authKeys = loadAuthKeys();
  const ws = createWebSocket(authKeys);
  attachEvents(ws);
  const tokensByExchange = await connectAndSubscribe(ws, instruments);

  // SIGINT for local testing (minimal for GitHub Actions)
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    await unsubscribeTokens(ws, tokensByExchange);
    console.log('Shutdown complete');
    process.exit(0);
  });

  // Auto-exit
  setTimeout(async () => {
    console.log('Auto-shutting down...');
    await unsubscribeTokens(ws, tokensByExchange);
    console.log('Shutdown complete');
    process.exit(0);
  }, RUN_DURATION_MS);
}

main();

// Step 11: Export data for other JS files
module.exports = { flattenedMarketData, pongData };