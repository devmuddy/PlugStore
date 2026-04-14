const fs = require('fs');
const path = require('path');

const distEntry = path.join(__dirname, 'dist', 'index.js');

if (fs.existsSync(distEntry)) {
  require(distEntry);
} else {
  // Local development fallback when dist is not built yet.
  require('ts-node/register/transpile-only');
  require('./index.ts');
}
