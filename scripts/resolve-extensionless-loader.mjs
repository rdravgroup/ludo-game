// scripts/resolve-extensionless-loader.mjs
//
// React Native's bundler (Metro) resolves extensionless relative imports
// (e.g. `from './BoardConfig'`) automatically, but plain Node's ESM loader
// does not. Rather than rewrite the real source files to add `.js`
// extensions everywhere (which would be Metro-idiomatic-incorrect and a
// pointless diff against the actual app code), this loader hook teaches
// Node to do the same resolution Metro does, just for running these test
// scripts directly with `node --experimental-loader`.
//
// Usage: node --experimental-loader ./scripts/resolve-extensionless-loader.mjs scripts/test_game_logic.mjs

import { existsSync } from 'fs';
import path from 'path';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !path.extname(specifier)) {
    const parentPath = new URL(context.parentURL).pathname;
    const parentDir = path.dirname(parentPath);
    const candidate = path.join(parentDir, specifier + '.js');
    if (existsSync(candidate)) {
      return nextResolve(specifier + '.js', context);
    }
  }
  return nextResolve(specifier, context);
}
