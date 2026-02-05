# Plugins

Gitzbook has a simple, powerful plugin system that lets you customize every part of the build process without forking the core.

## How Plugins Work

A plugin is a JavaScript file that exports a function. The function receives the Gitzbook API object, which it uses to register hooks:

```javascript
module.exports = function(gitzbook) {
  gitzbook.hook('page', (page) => {
    // Modify every page before it's rendered
    page.content = page.content + '<footer>Custom footer</footer>';
    return page;
  });
};
```

## Loading Plugins

Plugins can be loaded in two ways:

### 1. Local plugins directory

Drop `.js` files in the `plugins/` directory and they're automatically loaded:

```
plugins/
├── add-footer.js
├── custom-alerts.js
└── analytics.js
```

### 2. Configuration

Reference plugins by path in your config:

```json
{
  "plugins": [
    "./my-plugins/special-plugin.js"
  ]
}
```

## What Can Plugins Do?

- Add markdown-it plugins for custom syntax
- Transform page HTML (add footers, modify content, inject widgets)
- Modify the navigation structure
- Inject custom CSS and JavaScript
- Copy additional assets to the build output
- Add meta tags, analytics scripts, etc.

See [Creating a Plugin](creating-a-plugin.md) and the [Hook Reference](hook-reference.md) for details.
