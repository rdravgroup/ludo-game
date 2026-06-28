// scripts/check_syntax.js
// Transpiles every .js file under src/ using the project's real babel
// config to catch syntax errors (bad JSX, mismatched tags, typos in
// imports/exports) without needing a full Metro bundle or device.
// Run with: node scripts/check_syntax.js
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const ROOT_FILES = ['App.js'];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

const files = [
  ...walk(SRC_DIR),
  ...ROOT_FILES.map((f) => path.join(__dirname, '..', f)),
];

let failed = 0;
for (const file of files) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    babel.transform(code, {
      filename: file,
      presets: ['babel-preset-expo'],
      plugins: ['react-native-reanimated/plugin'],
      babelrc: false,
      configFile: false,
    });
    console.log(`✅ ${path.relative(process.cwd(), file)}`);
  } catch (e) {
    failed++;
    console.error(`❌ ${path.relative(process.cwd(), file)}`);
    console.error(`   ${e.message.split('\n')[0]}`);
  }
}

console.log(`\n${files.length - failed}/${files.length} files passed syntax check.`);
process.exit(failed > 0 ? 1 : 0);
