const { getCombinedCredentials } = require('./support/credon.js');

(async () => {
  try {
    const jsonString = await getCombinedCredentials();
    console.log(jsonString);
  } catch (error) {
    console.error('Error logging credentials:', error.message);
    process.exit(1);
  }
})();