# Configuration

Gitzbook is configured through the `.gitzbook/config.yml` file in your docs directory. All options are optional and have sensible defaults.

## Full configuration reference

```yaml
# .gitzbook/config.yml

# Site metadata
site:
  title: "My Documentation"
  description: "Documentation for my project"
  url: "https://docs.example.com"
  logo: "/assets/logo.svg"
  favicon: "/assets/favicon.ico"

# Build settings
build:
  outDir: "dist"
  base: "/"
  sourcemap: false
  minify: true
  cleanUrls: true

# Theme configuration
theme:
  mode: "auto"           # "light", "dark", or "auto"
  primaryColor: "#3B82F6"
  fontFamily: "Inter, system-ui, sans-serif"
  codeFont: "JetBrains Mono, monospace"
  radius: "8px"
  sidebar:
    collapsible: true
    defaultOpen: 2       # levels deep

# Search
search:
  enabled: true
  provider: "local"      # "local" or "algolia"
  placeholder: "Search docs..."
  hotkey: "/"
  # For Algolia:
  # algolia:
  #   appId: "YOUR_APP_ID"
  #   apiKey: "YOUR_SEARCH_KEY"
  #   indexName: "your_index"

# Navigation
nav:
  - title: Home
    path: /
  - title: Guides
    children:
      - title: Getting Started
        path: /guides/getting-started
      - title: Configuration
        path: /guides/configuration

# Internationalization
i18n:
  defaultLocale: "en"
  locales:
    - code: "en"
      name: "English"
      dir: "ltr"
    - code: "nl"
      name: "Nederlands"
      dir: "ltr"
    - code: "ja"
      name: "Japanese"
      dir: "ltr"

# Plugins
plugins:
  - name: "mermaid"
    options:
      theme: "default"
  - name: "katex"
  - name: "openapi"
    options:
      specPath: "./openapi.yaml"

# Social links (shown in header/footer)
social:
  - icon: "github"
    url: "https://github.com/your-org/your-repo"
  - icon: "discord"
    url: "https://discord.gg/your-invite"

# Git integration
git:
  editLink: true
  editLinkPattern: "https://github.com/your-org/your-repo/edit/main/docs/:path"
  lastUpdated: true
  contributors: true
```

## Environment variables

You can override any config value with environment variables prefixed with `GITZBOOK_`:

```bash
GITZBOOK_SITE_TITLE="Staging Docs" gitzbook build
GITZBOOK_BUILD_BASE="/docs/" gitzbook build
```

## Config file formats

Besides YAML, Gitzbook also supports:

- `config.json` -- JSON format
- `config.toml` -- TOML format
- `config.js` -- JavaScript (for computed values)

Example with JavaScript:

```javascript
// .gitzbook/config.js
export default {
  site: {
    title: process.env.SITE_TITLE || "My Docs",
    description: "Generated on " + new Date().toISOString(),
  },
  build: {
    base: process.env.NODE_ENV === "production" ? "/docs/" : "/",
  },
};
```

## Theme customization

### Custom CSS

Create a `theme/styles.css` file in your `.gitzbook/` directory:

```css
:root {
  --gb-color-primary: #8b5cf6;
  --gb-color-bg: #ffffff;
  --gb-color-text: #1e293b;
  --gb-color-sidebar-bg: #f8fafc;
  --gb-font-size-base: 16px;
  --gb-content-max-width: 780px;
}

[data-theme="dark"] {
  --gb-color-bg: #0f172a;
  --gb-color-text: #e2e8f0;
  --gb-color-sidebar-bg: #1e293b;
}
```

### Custom components

Override built-in components by placing files in `.gitzbook/theme/components/`:

```
.gitzbook/
  theme/
    components/
      Header.vue
      Footer.vue
      Sidebar.vue
      SearchBar.vue
```

## Per-page configuration

You can set per-page options using YAML frontmatter:

```markdown
---
title: "Custom Page Title"
description: "Override the meta description"
sidebar: false
outline: [2, 3]
editLink: false
lastUpdated: false
layout: "full-width"
---

# Your page content here
```

## Validation

Check your configuration for errors:

```bash
gitzbook config check
```

This validates your YAML syntax, checks for unknown keys, and warns about deprecated options.
