// Step 1: Define configuration
const SHOW_PONG = false; // No pong logging in console
const RUN_DURATION_SECONDS = 30; // Run for 5 minutes
const SUBSCRIPTION_MODES = [1, 3]; // LTP + Snap Quote

// Step 2: Import modules
const { WebSocketV2 } = require('smartapi-javascript');
const fs = require('fs');
const path = require('path');

// Step 3: Initialize data storage
const latestMarketData = {}; // Store latest tick per token and exchangeType
const latestPongData = {}; // Store latest pong message
const instruments = JSON.parse(fs.readFileSync(path.join(__dirname, '../instruments.json'), 'utf8')); // Read instruments.json
const dataBuffer = new Map(); // Buffer to combine multi-mode data

// Step 4: Flatten nested objects with prefixed keys
function flattenObject(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          flattenObject(item, `${newKey}_${index + 1}`, result);
        } else {
          result[`${newKey}_${index + 1}`] = item;
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

// Step 5: Load credentials from environment variables
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
    if (data['0'] === 'p' && data['1'] === 'o' && data['2'] === 'n' && data['3'] === 'g') {
      const pongMessage = { ...data, timestamp: new Date().toISOString() };
      if (Object.keys(pongMessage).length > 1) { // Ensure non-blank
        if (SHOW_PONG) {
          console.log('Pong message:', JSON.stringify(pongMessage));
        }
        Object.assign(latestPongData, pongMessage); // Update latest pong
        console.log('Updated latestPongData:', latestPongData); // Debug
      }
    } else {
      const token = data.token ? data.token.replace(/"/g, '') : data.token;
      const mode = data.subscription_mode;
      const exchangeType = data.exchange_type;
      if (!token || !exchangeType) return; // Skip blank data

      const key = `${token}_${exchangeType}_${mode}`;

      // Buffer flattened data
      const flattenedData = flattenObject({ ...data, timestamp: new Date().toISOString() });
      if (Object.keys(flattenedData).length <= 1) return; // Skip blank data
      dataBuffer.set(key, flattenedData);

      // Check if we have data for all modes
      const modesReceived = SUBSCRIPTION_MODES.map((m) => `${token}_${exchangeType}_${m}`);
      if (modesReceived.every((k) => dataBuffer.has(k))) {
        const combinedData = {};
        SUBSCRIPTION_MODES.forEach((m) => {
          const modeData = dataBuffer.get(`${token}_${exchangeType}_${m}`);
          Object.assign(combinedData, modeData); // Combine flattened data
        });

        const instrument = instruments.find(
          (inst) => inst.token === token && inst.exchangeType === exchangeType
        );
        const tickData = {
          ...combinedData,
          token,
          ...(instrument || {}), // Merge instrument details
        };

        if (Object.keys(tickData).length > 1) { // Ensure non-blank
          console.log('Market data:', JSON.stringify(tickData)); // Debug
          latestMarketData[`${token}_${exchangeType}`] = tickData; // Update latest data
          console.log('Updated latestMarketData:', latestMarketData); // Debug
        }

        // Clear buffer
        modesReceived.forEach((k) => dataBuffer.delete(k));
      }
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
    SUBSCRIPTION_MODES.forEach((mode) => {
      Object.entries(subscriptions).forEach(([exchangeType, tokens]) => {
        console.log(`Subscribing to tokens: ${tokens.join(', ')} (exchangeType: ${exchangeType}, mode: ${mode})`);
        ws.fetchData({
          correlationID: `sub_${exchangeType}_${mode}`,
          action: 1, // Subscribe
          mode,
          exchangeType: parseInt(exchangeType),
          tokens,
        });
      });
    });
    console.log('Subscribed');
  }, 1000);

  return subscriptions;
}

// Step 9: Unsubscribe tokens
async function unsubscribeToken(ws, subscriptions) {
  console.log('Unsubscribing tokens...');
  SUBSCRIPTION_MODES.forEach((mode) => {
    Object.entries(subscriptions).forEach(([exchangeType, tokens]) => {
      ws.fetchData({
        correlationID: `unsub_${exchangeType}_${mode}`,
        action: 0, // Unsubscribe
        mode,
        exchangeType: parseInt(exchangeType),
        tokens,
      });
    });
  });
  console.log('Unsubscribe request sent');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  ws.close();
  console.log('WebSocket closed');
}

// Step 10: Consume data internally
function consumeData() {
  setTimeout(() => {
    console.log('Latest Market Data:', latestMarketData);
    console.log('Latest Pong Data:', latestPongData);

    // Example: Process data
    if (Object.keys(latestMarketData).length > 0) {
      for (const [key, data] of Object.entries(latestMarketData)) {
        console.log(`Processing ${key}: LTP = ${data.last_traded_price}, Symbol = ${data.symbol}`);
      }
    }
  }, 10000); // 10 seconds delay to allow data receipt
}

// Step 11: Main function
async function main() {
  console.log(`Running for ${RUN_DURATION_SECONDS} seconds`);

  const authKeys = loadAuthKeys();
  const ws = createWebSocket(authKeys);
  attachEvents(ws);
  const subscriptions = await connectAndSubscribe(ws);

  // Start consuming data
  consumeData();

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

  // Auto-exit after hardcoded duration
  setTimeout(async () => {
    console.log('Auto-shutting down...');
    await unsubscribeToken(ws, subscriptions);
    console.log('Shutdown complete');
    process.exit(0);
  }, RUN_DURATION_SECONDS * 1000);
}

main();

// Step 12: Export latest data directly
module.exports = { latestMarketData, latestPongData };