const { fetchSheetData } = require('./cred.js');

// Async function to fetch combined credentials from multiple sheets/ranges
async function getCredentials(configs) {
  try {
    const combinedData = await fetchSheetData(configs);
    return combinedData;
  } catch (error) {
    console.error('Error fetching credentials:', error.message);
    throw error;
  }
}

// Main function for debugging
async function main() {
  try {
    // Example configurations
    const configs = [
      {
        spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
        sheetName: 'Credentials',
        range: 'A1:B4',
        mode: 'transpose',
      },
      {
        spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms', // Replace with another Sheet ID
        sheetName: 'nifty',
        range: 'A1:C10',
        mode: 'normal',
      },
    ];




// Fetch and store combined credentials
let combinedCredentials = null;
(async () => {
  try {
    combinedCredentials = await getCredentials(configs);
    console.log('Fetched Combined Credentials:', JSON.stringify(combinedCredentials, null, 2));
  } catch (error) {
    console.error('Error initializing credentials:', error.message);
    process.exit(1); // Exit on failure to ensure workflow fails
  }
})();

module.exports = { combinedCredentials };