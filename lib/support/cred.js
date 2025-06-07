const { google } = require('googleapis');

// Function to fetch data from multiple Google Sheets/ranges
// Parameters:
// - configs: Array of objects [{ spreadsheetId, sheetName, range, mode }, ...]
//   - spreadsheetId: Google Sheet ID (string)
//   - sheetName: Sheet name (string)
//   - range: Range (e.g., 'A1:B4')
//   - mode: 'normal' or 'transpose' (default: 'normal')
// Returns: Promise resolving to a JSON object with data for each config
async function fetchSheetData(configs) {
  try {
    // Validate inputs
    if (!Array.isArray(configs) || configs.length === 0) {
      throw new Error('Configs must be a non-empty array');
    }
    for (const config of configs) {
      const { spreadsheetId, sheetName, range, mode = 'normal' } = config;
      if (!spreadsheetId || !sheetName || !range) {
        throw new Error('Missing required parameters: spreadsheetId, sheetName, or range');
      }
      if (!['normal', 'transpose'].includes(mode)) {
        throw new Error("Invalid mode. Use 'normal' or 'transpose'");
      }
    }

    // Authenticate using Service Account credentials from environment variables
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GMAIL,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Create Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // Combined result object
    const combinedData = {};

    // Fetch data for each configuration
    for (const config of configs) {
      const { spreadsheetId, sheetName, range, mode } = config;

      // Fetch data from the specified range
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!${range}`,
      });

      const rows = response.data.values;
      let data = [];
      if (rows && rows.length > 0) {
        if (mode === 'normal') {
          const headers = rows[0];
          data = rows.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
        } else {
          const headers = rows.map(row => row[0]);
          data = rows[0].slice(1).map((_, colIndex) => {
            const obj = {};
            headers.forEach((header, rowIndex) => {
              obj[header] = rows[rowIndex][colIndex + 1] || '';
            });
            return obj;
          });
        }
      } else {
        console.log(`No data found in ${sheetName}!${range}.`);
      }

      // Store in combined object with key as sheetName_range
      combinedData[`${sheetName}_${range.replace(':', '-')}`] = data;
    }

    return combinedData;
  } catch (error) {
    throw error;
  }
}

module.exports = { fetchSheetData };