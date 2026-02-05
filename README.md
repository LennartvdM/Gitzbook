# Gitzbook

A lightweight, customizable GitBook-like static site generator for documentation.

## Features

- **Markdown-first** — write docs in plain `.md` files
- **SUMMARY.md navigation** — define your sidebar structure in one file
- **Syntax highlighting** — via highlight.js
- **Full-text search** — client-side, no server needed
- **Plugin system** — simple JS hooks to customize everything
- **Live reload** — dev server watches files and auto-refreshes
- **Responsive** — mobile-friendly with collapsible sidebar
- **Prev/Next navigation** — automatic page-to-page links

## Quick Start

```bash
npm install
npm run build    # Build static site to _book/
npm run serve    # Dev server at http://localhost:4000
```

## Project Structure

```
docs/           # Your markdown content
  SUMMARY.md    # Sidebar navigation definition
  README.md     # Landing page
plugins/        # Custom JS plugins (auto-loaded)
src/            # Gitzbook engine
gitzbook.json   # Configuration
_book/          # Generated output
```

## Configuration

Edit `gitzbook.json`:

```json
{
  "title": "My Docs",
  "docsDir": "docs",
  "outputDir": "_book"
}
```

## Plugins

Drop a `.js` file in `plugins/` to extend Gitzbook:

```javascript
module.exports = function(gitzbook) {
  gitzbook.hook('page', (page) => {
    page.content += '<footer>Custom footer</footer>';
    return page;
  });
};
```

Available hooks: `markdown`, `page`, `summary`, `template`, `head`, `body:start`, `body:end`, `assets`.
