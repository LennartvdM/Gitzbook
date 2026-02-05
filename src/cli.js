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
    build(rootDir, {
      verbose: flags.verbose === true,
      forceFullBuild: flags.clean === true,
    }).catch((err) => {
      console.error('Build failed:', err.message);
      process.exit(1);
    });
    break;

  case 'serve':
    console.log('Gitzbook: Starting dev server...\n');
    serve(rootDir, {
      port: parseInt(flags.port, 10) || 4000,
      watch: flags.watch !== 'false',
      verbose: flags.verbose === true,
    });
    break;

  case 'init':
    init(rootDir);
    break;

  default:
    console.log(`
Gitzbook — a lightweight GitBook-like static site generator

Usage:
  gitzbook build              Build the static site
  gitzbook build --verbose    Build with debug logging
  gitzbook build --clean      Force full rebuild (skip incremental)
  gitzbook serve              Start dev server with live reload
  gitzbook serve --port N     Start on a specific port (default: 4000)
  gitzbook serve --verbose    Serve with debug logging
  gitzbook init               Initialize a new Gitzbook project

Options:
  --port <number>             Port for dev server (default: 4000)
  --watch false               Disable file watching
  --verbose                   Enable debug logging
  --clean                     Force full rebuild (ignore cache)
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
      `# Summary

* [Introduction](README.md)
* [Getting Started](getting-started.md)
`
    );
  }

  // Create README.md with frontmatter example
  const readmePath = path.join(docsDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(
      readmePath,
      `---
title: Welcome
description: Welcome to your Gitzbook documentation site.
---

# Welcome

This is your Gitzbook documentation. Edit the files in the \`docs/\` folder to get started.

## Features

- **Frontmatter support** — Add YAML frontmatter for title, description, tags, and more
- **Dark mode** — Toggle between light and dark themes
- **Callout blocks** — Use \`> [!TIP]\`, \`> [!WARNING]\`, \`> [!NOTE]\`, etc.
- **Tabbed code blocks** — Consecutive fenced code blocks become tabs
- **Table of contents** — Auto-generated "On this page" sidebar
- **Breadcrumbs** — Know where you are in the navigation
- **Search** — Client-side full-text search with Flexsearch
- **Plugins** — Extend with custom hooks and commands
`
    );
  }

  // Create getting-started.md
  const gsPath = path.join(docsDir, 'getting-started.md');
  if (!fs.existsSync(gsPath)) {
    fs.writeFileSync(
      gsPath,
      `---
title: Getting Started
description: How to set up and use Gitzbook.
---

# Getting Started

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Callout Examples

> [!TIP] Use callouts to highlight important information.

> [!WARNING] This is a warning callout.

> [!NOTE] This is a note callout.
`
    );
  }

  // Create plugins directory
  const pluginsDir = path.join(dir, 'plugins');
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  // Create example plugin
  const examplePlugin = path.join(pluginsDir, 'example-plugin.js');
  if (!fs.existsSync(examplePlugin)) {
    fs.writeFileSync(
      examplePlugin,
      `// Example Gitzbook plugin
module.exports = function(gitzbook) {
  // Add a custom footer to every page
  gitzbook.hook('page', (page) => {
    page.content += '<hr><p class="page-footer"><em>Built with Gitzbook</em></p>';
    return page;
  });
};
`
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
          url: '',
          minify: false,
          verbose: false,
        },
        null,
        2
      ) + '\n'
    );
  }

  // Create .gitignore
  const gitignorePath = path.join(dir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(
      gitignorePath,
      `node_modules/
_book/
.DS_Store
*.log
`
    );
  }

  console.log('Gitzbook project initialized!');
  console.log('');
  console.log('  Project structure:');
  console.log('    docs/README.md        Landing page');
  console.log('    docs/SUMMARY.md       Navigation structure');
  console.log('    docs/getting-started.md  Example page with callouts');
  console.log('    plugins/              Plugin directory');
  console.log('    gitzbook.json         Configuration');
  console.log('');
  console.log('  Next steps:');
  console.log('    npm run dev           Start dev server');
  console.log('    npm run build         Build static site');
  console.log('');
}
