const { google } = require('googleapis');

// Function to fetch data from a Google Sheet
// Parameters:
// - spreadsheetId: Google Sheet ID (string)
// - sheetName: Sheet name (string)
// - range: Range (e.g., 'A1:B4')
// - mode: 'normal' (rows as objects with headers) or 'transpose' (columns as objects with first column as headers)
// Returns: Promise resolving to fetched data (array of objects or rows)
async function fetchSheetData({ spreadsheetId, sheetName, range, mode = 'normal' }) {
  try {
    // Validate inputs
    if (!spreadsheetId || !sheetName || !range) {
      throw new Error('Missing required parameters: spreadsheetId, sheetName, or range');
    }
    if (!['normal', 'transpose'].includes(mode)) {
      throw new Error("Invalid mode. Use 'normal' or 'transpose'");
    }

    // Authenticate using Service Account credentials from environment variables
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GMAIL, // Service Account email
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'), // Private key with newlines restored
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Create Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch data from the specified range
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${range}`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the specified range.');
      return [];
    }

    // Process data based on mode
    let data;
    if (mode === 'normal') {
      // Normal mode: First row as headers, subsequent rows as objects
      const headers = rows[0];
      data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || ''; // Handle empty cells
        });
        return obj;
      });
    } else {
      // Transpose mode: First column as headers, subsequent columns as objects
      const headers = rows.map(row => row[0]); // First column
      data = rows[0].slice(1).map((_, colIndex) => {
        const obj = {};
        headers.forEach((header, rowIndex) => {
          obj[header] = rows[rowIndex][colIndex + 1] || ''; // Handle empty cells
        });
        return obj;
      });
    }

    console.log(`Fetched ${data.length} records from ${sheetName}!${range} in ${mode} mode`);
    return data;
  } catch (error) {
    console.error('Error fetching sheet data:', error.message);
    throw error; // Re-throw for caller to handle
  }
}

module.exports = { fetchSheetData };