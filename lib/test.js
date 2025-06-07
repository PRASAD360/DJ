const { fetchSheetData } = require('./support/cred.js');

async function main() {
  try {
    // Fetch data from Google Sheet
    const sheetData = await fetchSheetData({
      spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
      sheetName: 'Credentials',
      range: 'A1:B4',
      mode: 'transpose', // or 'normal'
    });

    // Store in a variable
    console.log('Sheet data:', sheetData);

    // Example: Use data for WebSocket (assuming sheet contains credentials)
    const credentials = sheetData[0]; // First object (adjust based on data structure)
    console.log('Credentials:', credentials);

    // Use credentials in WebSocket script (placeholder)
    // e.g., pass to smartapi-javascript WebSocketV2
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();