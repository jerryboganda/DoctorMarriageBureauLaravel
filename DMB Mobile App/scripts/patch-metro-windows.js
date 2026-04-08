/**
 * Post-install script to patch Metro config loader for Windows ESM URL scheme fix
 * This fixes the ERR_UNSUPPORTED_ESM_URL_SCHEME error on Windows
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'metro-config', 'src', 'loadConfig.js');

if (!fs.existsSync(filePath)) {
  console.log('⚠️  metro-config not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

// Check if already patched
if (content.includes('pathToFileURL')) {
  console.log('✅ Metro config already patched for Windows');
  process.exit(0);
}

// Add url import after yaml import
content = content.replace(
  'var _yaml = require("yaml");',
  'var _yaml = require("yaml");\nvar _url = require("url");'
);

// Fix the dynamic import to use file:// URL on Windows
content = content.replace(
  'const configModule = await import(absolutePath);',
  "const importPath = process.platform === 'win32' ? _url.pathToFileURL(absolutePath).href : absolutePath;\n        const configModule = await import(importPath);"
);

fs.writeFileSync(filePath, content);
console.log('✅ Patched Metro config for Windows ESM URL scheme fix');
