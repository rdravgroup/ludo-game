// scripts/run-test.mjs
//
// Wrapper that registers the extensionless-import resolver loader (see
// resolve-extensionless-loader.mjs) using the modern, non-deprecated
// node:module register() API, then runs the requested test script.
//
// Usage: node scripts/run-test.mjs scripts/test_game_logic.mjs
//        node scripts/run-test.mjs scripts/test_ai_difficulty.mjs

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./resolve-extensionless-loader.mjs', import.meta.url);

const targetScript = process.argv[2];
if (!targetScript) {
  console.error('Usage: node scripts/run-test.mjs <path-to-test-script>');
  process.exit(1);
}

await import(pathToFileURL(targetScript).href);
