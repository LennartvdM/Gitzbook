# Configuration

Gitzbook is configured via a `gitzbook.json` or `gitzbook.config.js` file in your project root.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `title` | `"Gitzbook"` | The title shown in the sidebar header |
| `docsDir` | `"docs"` | Directory containing your Markdown files |
| `outputDir` | `"_book"` | Directory for the built static site |
| `pluginsDir` | `"plugins"` | Directory to scan for local plugins |
| `plugins` | `[]` | Array of plugin names or paths to load |

## JSON Configuration

```json
{
  "title": "My Project Docs",
  "docsDir": "docs",
  "outputDir": "_book",
  "plugins": []
}
```

## JavaScript Configuration

For dynamic configuration, use `gitzbook.config.js`:

```javascript
module.exports = {
  title: process.env.DOCS_TITLE || 'My Project',
  docsDir: 'docs',
  outputDir: '_book',
  plugins: [
    './plugins/my-custom-plugin.js',
  ],
};
```

## SUMMARY.md

The `docs/SUMMARY.md` file defines your sidebar navigation. It uses a nested Markdown list:

```markdown
# Summary

* [Introduction](README.md)
* [Guide](guide/README.md)
  * [Installation](guide/installation.md)
  * [Usage](guide/usage.md)
* [API Reference](api.md)
```

- Top-level items appear as main sections
- Indented items appear as sub-sections
- Each link points to a `.md` file relative to the `docs/` directory

If no `SUMMARY.md` exists, Gitzbook auto-generates navigation by scanning the directory structure.
