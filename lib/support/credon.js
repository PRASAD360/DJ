const { fetchSheetData } = require('./cred.js');

// Async function to fetch credentials
async function getCredentials() {
  try {
    const sheetData = await fetchSheetData({
      spreadsheetId: '1VvpNl9slSdVefp7eyktWZJWUwbjcQF2VTt9WQuEWFms',
      sheetName: 'Credentials',
      range: 'A1:B4',
      mode: 'transpose',
    });

    const credentials = sheetData[0]; // First object (adjust if needed)
    return credentials;
  } catch (error) {
    console.error('Error fetching credentials:', error.message);
    throw error; // Re-throw for error handling in importing file
  }
}

// Keep main() for debugging in workflow
async function main() {
  try {
    const credentials = await getCredentials();
    console.log('Credentials:', credentials);
  } catch (error) {
    console.error('Error in main:', error.message);
    process.exit(1); // Exit with error code for GitHub Actions
  }
}

main();

// Export the function
module.exports = { getCredentials };