#!/usr/bin/env node

const path = require('path');
const { build } = require('./build');
const { serve } = require('./server');

const args = process.argv.slice(2);
const command = args[0];

const rootDir = process.cwd();

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

const flags = parseFlags(args);

switch (command) {
  case 'build':
    console.log('Gitzbook: Building site...\n');
    build(rootDir);
    break;

  case 'serve':
    console.log('Gitzbook: Starting dev server...\n');
    serve(rootDir, {
      port: parseInt(flags.port, 10) || 4000,
      watch: flags.watch !== 'false',
    });
    break;

  case 'init':
    init(rootDir);
    break;

  default:
    console.log(`
Gitzbook — a lightweight GitBook-like static site generator

Usage:
  gitzbook build            Build the static site
  gitzbook serve            Start dev server with live reload
  gitzbook serve --port N   Start on a specific port (default: 4000)
  gitzbook init             Initialize a new Gitzbook project

Options:
  --port <number>           Port for dev server (default: 4000)
  --watch false             Disable file watching
`);
}

function init(dir) {
  const fs = require('fs');

  // Create docs directory
  const docsDir = path.join(dir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Create SUMMARY.md
  const summaryPath = path.join(docsDir, 'SUMMARY.md');
  if (!fs.existsSync(summaryPath)) {
    fs.writeFileSync(
      summaryPath,
      `# Summary\n\n* [Introduction](README.md)\n`
    );
  }

  // Create README.md
  const readmePath = path.join(docsDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(
      readmePath,
      `# Welcome\n\nThis is your Gitzbook documentation. Edit the files in the \`docs/\` folder to get started.\n`
    );
  }

  // Create config
  const configPath = path.join(dir, 'gitzbook.json');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          title: 'My Documentation',
          docsDir: 'docs',
          outputDir: '_book',
        },
        null,
        2
      ) + '\n'
    );
  }

  console.log('Gitzbook project initialized!');
  console.log('');
  console.log('  Edit docs/SUMMARY.md to define your navigation');
  console.log('  Edit docs/README.md for your landing page');
  console.log('');
  console.log('  Run: npm run serve');
}
