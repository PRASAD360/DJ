const { getCombinedCredentials } = require('./support/tokens.js');
const fs = require('fs');
const path = require('path');

async function saveInstruments(configs) {
  try {
    const jsonString = await getCombinedCredentials();
    const data = JSON.parse(jsonString);
    // Merge all dataset arrays into a single array
    const mergedArray = Object.values(data).flat();

    // Define path to instruments.json at repository root
    const outputFile = path.join(__dirname, '..', 'instruments.json');

    // Write to instruments.json (creates file if it doesn't exist)
    fs.writeFileSync(outputFile, JSON.stringify(mergedArray, null, 2));
    console.log(`Saved instruments to: ${outputFile}`);

    // Log for debugging
    console.log('Merged Array:', JSON.stringify(mergedArray, null, 2));
  } catch (error) {
    console.error('Error processing instruments:', error.message);
    process.exit(1);
  }
}

saveInstruments();