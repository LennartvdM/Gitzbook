# Hook Reference

All available hooks and their signatures.

## `markdown`

Called once during initialization with the markdown-it instance. Use it to add markdown-it plugins or custom rules.

```javascript
gitzbook.hook('markdown', (md) => {
  md.use(require('markdown-it-footnote'));
});
```

**Receives:** `md` — the markdown-it instance
**Returns:** ignored (mutate in place)

## `summary`

Called after the navigation tree is parsed from `SUMMARY.md`. Can modify, reorder, or add navigation items.

```javascript
gitzbook.hook('summary', (nav) => {
  // Add a link at the end
  nav.push({ title: 'External', path: null, children: [] });
  return nav;
});
```

**Receives:** `nav` — array of `{ title, path, children[] }`
**Returns:** modified nav array

## `page`

Called for every page before rendering. Can modify the title, content (HTML), or raw Markdown.

```javascript
gitzbook.hook('page', (page) => {
  // page.title    - page title (string)
  // page.content  - rendered HTML (string)
  // page.path     - file path relative to docs dir
  // page.raw      - original Markdown source
  page.content += '<hr><p>Last updated: 2025</p>';
  return page;
});
```

**Receives:** `{ title, content, path, raw }`
**Returns:** modified page object

## `template`

Called with the full template data object before the HTML template is rendered. Can add or modify template variables.

```javascript
gitzbook.hook('template', (data) => {
  data.extraHead += '<meta name="generator" content="Gitzbook">';
  return data;
});
```

**Receives:** template data object with keys: `bookTitle`, `pageTitle`, `content`, `sidebar`, `prevNext`, `basePath`, `extraHead`, `extraBodyStart`, `extraBodyEnd`, `liveReloadScript`
**Returns:** modified data object

## `head`

Called with an array. Push strings to inject into the `<head>` of every page.

```javascript
gitzbook.hook('head', (tags) => {
  tags.push('<link rel="stylesheet" href="custom.css">');
});
```

**Receives:** `tags` — array of strings
**Returns:** ignored (mutate in place)

## `body:start`

Push strings to inject immediately after `<body>`.

```javascript
gitzbook.hook('body:start', (tags) => {
  tags.push('<div class="announcement-bar">Beta</div>');
});
```

## `body:end`

Push strings to inject before `</body>`.

```javascript
gitzbook.hook('body:end', (tags) => {
  tags.push('<script src="analytics.js"></script>');
});
```

## `assets`

Called after the build with the output directory path. Use it to copy extra files.

```javascript
gitzbook.hook('assets', (outputDir) => {
  const fs = require('fs');
  const path = require('path');
  fs.copyFileSync(
    path.join(__dirname, 'custom.css'),
    path.join(outputDir, 'assets', 'custom.css')
  );
});
```

**Receives:** `outputDir` — absolute path to the output directory
**Returns:** ignored
