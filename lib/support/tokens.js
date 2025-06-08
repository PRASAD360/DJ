const { fetchSheetData } = require('./cred.js');

// Async function to fetch combined credentials
async function getCredentials(configs) {
  try {
    if (!Array.isArray(configs) || configs.length === 0) {
      throw new Error('Configs must be a non-empty array');
    }
  //  console.log('Fetching data for configs:', configs); // Debug
    const combinedData = await fetchSheetData(configs);
  //  console.log('Fetched data:', combinedData); // Debug
    return JSON.stringify(combinedData, null, 2);
  } catch (error) {
    console.error('Error fetching credentials:', error.message);
    throw error;
  }
}

// Define configurations
const configs = [
  {
    spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
    sheetName: 'nifty',
    range: 'A:L',
    mode: 'normal',
  },
{
    spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
    sheetName: 'banknifty',
    range: 'A:L',
    mode: 'normal',
  },
{
    spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
    sheetName: 'finnifty',
    range: 'A:L',
    mode: 'normal',
  },
{
    spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
    sheetName: 'midcapnifty',
    range: 'A:L',
    mode: 'normal',
  }
];

// Export function to get JSON string
async function getCombinedCredentials() {
  return await getCredentials(configs);
}

module.exports = { getCombinedCredentials };