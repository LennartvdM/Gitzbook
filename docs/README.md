# Gitzbook

A lightweight, customizable static site generator for documentation — inspired by GitBook, built for flexibility.

## Why Gitzbook?

- **Markdown-first** — write your docs in plain Markdown files
- **Simple navigation** — define your sidebar with a `SUMMARY.md` file
- **Full-text search** — client-side search works out of the box
- **Plugin system** — extend and customize with simple JavaScript hooks
- **Live reload** — see your changes instantly during development
- **No lock-in** — it's your code, do what you want with it

## Quick Start

```bash
# Build the documentation
npm run build

# Start the dev server with live reload
npm run serve
```

Your site will be available at `http://localhost:4000`.

## Project Structure

```
your-project/
├── docs/               # Your documentation files
│   ├── SUMMARY.md      # Navigation structure
│   ├── README.md       # Landing page
│   └── ...             # Other markdown files
├── plugins/            # Custom plugins (optional)
├── gitzbook.json       # Configuration
├── _book/              # Built output (generated)
└── package.json
```
