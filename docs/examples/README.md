# Examples

A collection of example configurations and templates to help you get started.

## Starter Templates

### Minimal

The simplest possible Gitzbook setup:

```
docs/
  .gitzbook/
    config.yml
  index.md
```

```yaml
# config.yml
site:
  title: "My Docs"
```

### Full-featured

A complete setup with search, i18n, and plugins:

```
docs/
  .gitzbook/
    config.yml
    theme/
      styles.css
      components/
        Header.vue
  en/
    index.md
    guides/
      getting-started.md
      configuration.md
    api/
      index.md
  nl/
    index.md
    guides/
      aan-de-slag.md
  public/
    images/
    assets/
```

---

## Example: Open Source Project Docs

A real-world example of how to structure docs for an open source library.

```yaml
# .gitzbook/config.yml
site:
  title: "SuperLib"
  description: "A fast, modern utility library"
  url: "https://superlib.dev"
  logo: "/assets/logo.svg"

theme:
  primaryColor: "#6366F1"
  mode: "auto"

nav:
  - title: Guide
    children:
      - title: Introduction
        path: /guide/introduction
      - title: Installation
        path: /guide/installation
      - title: Quick Start
        path: /guide/quick-start
  - title: API
    path: /api
  - title: Examples
    path: /examples
  - title: Changelog
    path: /changelog

social:
  - icon: github
    url: "https://github.com/example/superlib"
  - icon: discord
    url: "https://discord.gg/superlib"

plugins:
  - name: mermaid
  - name: katex
```

---

## Example: Internal Team Wiki

Gitzbook works as a team knowledge base too:

```yaml
# .gitzbook/config.yml
site:
  title: "Engineering Wiki"
  description: "Internal engineering documentation"

theme:
  primaryColor: "#0EA5E9"
  sidebar:
    collapsible: true
    defaultOpen: 1

nav:
  - title: Onboarding
    children:
      - title: Welcome
        path: /onboarding/welcome
      - title: Dev Environment Setup
        path: /onboarding/dev-setup
      - title: Architecture Overview
        path: /onboarding/architecture
  - title: Runbooks
    children:
      - title: Incident Response
        path: /runbooks/incident-response
      - title: Deploy Procedures
        path: /runbooks/deploy
      - title: Database Migrations
        path: /runbooks/migrations
  - title: ADRs
    path: /adrs
  - title: Style Guide
    path: /style-guide

git:
  editLink: true
  editLinkPattern: "https://github.com/your-org/wiki/edit/main/docs/:path"
  lastUpdated: true
  contributors: true
```

---

## Example: Plugin -- Reading Time

A simple plugin that adds estimated reading time to each page:

```typescript
// plugins/reading-time.ts
import { definePlugin } from "gitzbook/plugins";

function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export default definePlugin({
  name: "reading-time",
  version: "1.0.0",

  hooks: {
    "page:transform": (page) => {
      const minutes = estimateReadingTime(page.content);
      page.frontmatter.readingTime = minutes;
      page.content = `<p class="reading-time">${minutes} min read</p>\n\n${page.content}`;
      return page;
    },
  },
});
```

Register it in your config:

```yaml
plugins:
  - name: "./plugins/reading-time"
```
