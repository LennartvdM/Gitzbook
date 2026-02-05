# Creating a Plugin

## Basic Structure

Create a `.js` file in the `plugins/` directory:

```javascript
// plugins/my-plugin.js
module.exports = function(gitzbook) {
  // Register hooks here
};
```

That's it. The file is automatically loaded when you build.

## Example: Custom Alerts

This plugin transforms `> [!NOTE]` blockquotes into styled alert boxes:

```javascript
// plugins/alerts.js
module.exports = function(gitzbook) {
  gitzbook.hook('page', (page) => {
    page.content = page.content
      .replace(
        /<blockquote>\s*<p>\[!NOTE\]\s*/g,
        '<div class="alert alert-note"><p>'
      )
      .replace(
        /<blockquote>\s*<p>\[!WARNING\]\s*/g,
        '<div class="alert alert-warning"><p>'
      );

    // Close the divs (replace the closing blockquote)
    page.content = page.content.replace(
      /<\/blockquote>/g,
      '</div>'
    );

    return page;
  });

  gitzbook.hook('head', (tags) => {
    tags.push(`<style>
      .alert { padding: 12px 20px; border-radius: 4px; margin: 16px 0; }
      .alert-note { background: #e8f4fd; border-left: 4px solid #0088cc; }
      .alert-warning { background: #fff3cd; border-left: 4px solid #ff9900; }
    </style>`);
  });
};
```

## Example: Adding Analytics

```javascript
// plugins/analytics.js
module.exports = function(gitzbook) {
  gitzbook.hook('body:end', (tags) => {
    tags.push(`
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXX');
      </script>
    `);
  });
};
```

## Example: Adding a markdown-it Plugin

```javascript
// plugins/emoji.js
module.exports = function(gitzbook) {
  gitzbook.hook('markdown', (md) => {
    // Add any markdown-it plugin
    md.use(require('markdown-it-emoji'));
  });
};
```

## Plugin Tips

- Plugins run in the order they're loaded (alphabetical for directory plugins)
- The `page` hook runs for every page — keep transformations fast
- Use `head` to inject CSS, `body:end` to inject scripts
- The `markdown` hook runs once during initialization
- Return modified data from hooks, or mutate in place
