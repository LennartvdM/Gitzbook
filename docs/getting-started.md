# Getting Started

## Installation

Gitzbook works as a local project. Clone or initialize a project and install dependencies:

```bash
npm install
```

## Initialize a New Project

If you're starting fresh:

```bash
node src/cli.js init
```

This creates:
- `docs/SUMMARY.md` — your navigation structure
- `docs/README.md` — your landing page
- `gitzbook.json` — project configuration

## Building Your Site

To generate the static HTML:

```bash
npm run build
```

The output goes to the `_book/` directory. You can deploy this anywhere — Netlify, GitHub Pages, S3, or any static hosting.

## Development Server

For local development with live reload:

```bash
npm run serve
```

This starts a local server at `http://localhost:4000` and watches your `docs/` folder for changes. Every time you save a file, the browser reloads automatically.

## Adding Pages

1. Create a new `.md` file in the `docs/` directory
2. Add an entry to `docs/SUMMARY.md`
3. The page appears in the sidebar

For example, to add a FAQ page:

```markdown
<!-- docs/SUMMARY.md -->
# Summary

* [Introduction](README.md)
* [Getting Started](getting-started.md)
* [FAQ](faq.md)
```

Then create `docs/faq.md` with your content.
