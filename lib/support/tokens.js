const { fetchSheetData } = require('./support/cred.js');

// Async function to fetch credentials from different sheets/ranges
async function getCredentials(config) {
  try {
    const sheetData = await fetchSheetData(config);
    const credentials = sheetData[0]; // First object (adjust if needed)
    return credentials;
  } catch (error) {
    console.error('Error fetching credentials:', error.message);
    throw error;
  }
}

// Main function for debugging multiple sheets/ranges
async function main() {
  try {
    // Example 1: Original sheet and range
    const config1 = {
      spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
      sheetName: 'Credentials',
      range: 'A1:B4',
      mode: 'transpose',
    };
    const credentials1 = await getCredentials(config1);
    console.log('Credentials from config1:', credentials1);

    // Example 2: Different sheet ID and range (replace with your values)
    const config2 = {
      spreadsheetId: 'YOUR_OTHER_SHEET_ID', // Replace with another Sheet ID
      sheetName: 'OtherSheet',
      range: 'A1:C10', // Different range
      mode: 'normal',
    };
    const credentials2 = await getCredentials(config2);
    console.log('Credentials from config2:', credentials2);
  } catch (error) {
    console.error('Error in main:', error.message);
    process.exit(1);
  }
}

main();

module.exports = { getCredentials };