const { WebSocketV2 } = require('smartapi-javascript');

const web_socket = new WebSocketV2({
  jwttoken: process.env.AUTHORIZATION,
  apikey: process.env.X_API_KEY,
  clientcode: process.env.X_CLIENT_CODE,
  feedtype: process.env.X_FEED_TOKEN,
});

web_socket.connect().then(() => {
  const json_req = {
    correlationID: 'sbi_sub',
    action: 1, // Subscribe
    mode: 1, // LTP
    exchangeType: 1, // NSE CM
    tokens: ['3495'], // SBI
  };

  web_socket.fetchData(json_req);

  web_socket.on('tick', (data) => {
    console.log('receiveTick:::::', JSON.stringify(data));
  });

  web_socket.on('error', (err) => {
    console.error('Error:', err.message);
  });

  // Safe exit after 30 seconds
  setTimeout(() => {
    const unsub_req = {
      correlationID: 'sbi_unsub',
      action: 0, // Unsubscribe
      mode: 1, // LTP
      exchangeType: 1, // NSE CM
      tokens: ['3495'],
    };
    web_socket.fetchData(unsub_req);
    setTimeout(() => {
      web_socket.close();
      process.exit(0);
    }, 1000);
  }, 30000);
}).catch((err) => {
  console.error('Custom error:', err.message);
  process.exit(1);
});