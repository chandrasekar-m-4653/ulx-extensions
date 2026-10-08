#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'vite';
import { validateExtension } from './validate-extension.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const widgetOutDir = resolve(root, 'app', 'widget');

async function main() {
  validateExtension();

  mkdirSync(widgetOutDir, { recursive: true });

  await build({
    configFile: resolve(root, 'vite.config.js'),
    build: {
      outDir: widgetOutDir,
      emptyOutDir: true,
      assetsDir: 'assets',
    },
  });

  const publicKeep = join(widgetOutDir, '.gitkeep');
  if (existsSync(publicKeep)) {
    rmSync(publicKeep);
  }

  validateExtension({ packaged: true });

  console.log('\n✓ Widget compiled for ZET packing');
  console.log('  plugin-manifest.json');
  console.log('  app/widget/index.html');
  console.log('Run npm run pack to create dist/*.zip with zet pack.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
