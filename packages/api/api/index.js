// Vercel bridge for packages/api
// This file exports the Express app. Prefer the compiled JS at ../dist/index.js
// for production. If dist is missing, we attempt to load the TS source via ts-node
// (not recommended for production). Keep this file tiny so Vercel uses the
// unified implementation from `packages/api/src`.

const fs = require('fs');
const path = require('path');

const distPath = path.resolve(__dirname, '../dist/index.js');

if (fs.existsSync(distPath)) {
  // Use compiled production bundle
  module.exports = require(distPath);
} else {
  // Development fallback: try to load TS source (requires ts-node)
  try {
    require('ts-node/register');
    module.exports = require('../src/index.ts');
  } catch (err) {
    console.error('Failed to load API. Build using `npm run build` in packages/api or install ts-node.');
    throw err;
  }
}
