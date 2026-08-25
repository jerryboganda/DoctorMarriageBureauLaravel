import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compDir = path.resolve(__dirname, '../src/components');
const utilsDir = path.resolve(__dirname, '../src/utils');
const compUtilsDir = path.join(compDir, 'utils');
const compStoresDir = path.join(compDir, 'src/stores');

// Create folders
fs.mkdirSync(compUtilsDir, { recursive: true });
fs.mkdirSync(compStoresDir, { recursive: true });

// Copy / forward all utils into src/components/utils/
const utilFiles = fs.readdirSync(utilsDir);
for (const file of utilFiles) {
  const baseName = file.replace(/\.(ts|js|json)$/, '');
  const destFile = path.join(compUtilsDir, file);
  if (file.endsWith('.json')) {
    fs.copyFileSync(path.join(utilsDir, file), destFile);
  } else if (file.endsWith('.ts') || file.endsWith('.js')) {
    // Only forward default export for api, echo, i18n
    if (['api', 'echo', 'i18n'].includes(baseName)) {
      const content = `export * from '../../utils/${baseName}';\nexport { default } from '../../utils/${baseName}';\n`;
      fs.writeFileSync(destFile, content, 'utf8');
    } else {
      const content = `export * from '../../utils/${baseName}';\n`;
      fs.writeFileSync(destFile, content, 'utf8');
    }
  }
}

// Forward authStore into src/components/src/stores/authStore.ts
fs.writeFileSync(
  path.join(compStoresDir, 'authStore.ts'),
  `export * from '../../../stores/authStore';\nexport { default } from '../../../stores/authStore';\n`,
  'utf8'
);

// Forward types and constants in src/components/
fs.writeFileSync(
  path.join(compDir, 'types.ts'),
  `export * from '../types';\n`,
  'utf8'
);

fs.writeFileSync(
  path.join(compDir, 'constants.ts'),
  `export * from '../constants';\n`,
  'utf8'
);

console.log('Successfully updated all component forwarding bridges.');
