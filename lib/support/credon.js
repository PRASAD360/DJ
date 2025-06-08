const { fetchSheetData } = require('./cred.js');

// Async function to fetch combined credentials from multiple sheets/ranges
async function getCredentials(configs) {
  try {
    if (!Array.isArray(configs) || configs.length === 0) {
      throw new Error('Configs must be a non-empty array');
    }
    const combinedData = await fetchSheetData(configs);
    return combinedData;
  } catch (error) {
    console.error('Error fetching credentials:', error.message);
    throw error;
  }
}

// Define configurations
const configs = [
  {
    spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
    sheetName: 'Credentials',
    range: 'A1:B4',
    mode: 'transpose',
  },
  {
    spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
    sheetName: 'nifty',
    range: 'A1:C10',
    mode: 'normal',
  },
];

// Fetch and store combined credentials as JSON string
let combinedCredentials = null;
(async () => {
  try {
    const data = await getCredentials(configs);
    combinedCredentials = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error initializing credentials in credon.js:', error.message);
    process.exit(1);
  }
})();

module.exports = { combinedCredentials };