# Getting Started

This guide walks you through installing Gitzbook, creating your first documentation project, and publishing it.

## Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0+ or **yarn** 1.22+ or **pnpm** 8.0+
- **Git** 2.30+

## Installation

### Global installation (recommended)

```bash
npm install -g gitzbook
```

### Project-local installation

```bash
npm install --save-dev gitzbook
```

Then add scripts to your `package.json`:

```json
{
  "scripts": {
    "docs:dev": "gitzbook dev",
    "docs:build": "gitzbook build",
    "docs:preview": "gitzbook preview"
  }
}
```

## Initialize a project

Run the init command in your project root:

```bash
gitzbook init
```

This creates the following structure:

```
docs/
  .gitzbook/
    config.yml
    theme/
      styles.css
  index.md
  guides/
    getting-started.md
```

## Writing your first page

Create a new Markdown file in the `docs/` directory:

```markdown
# Welcome to My Docs

This is your first Gitzbook page. You can use all standard Markdown
features plus some extensions.

## Code blocks with syntax highlighting

    ```python
    def greet(name: str) -> str:
        return f"Hello, {name}!"
    ```

## Callouts

:::info
This is an info callout. Use it for tips and notes.
:::

:::warning
This is a warning. Use it for important caveats.
:::
```

## Navigation

Gitzbook automatically generates navigation from your folder structure. You can customize it in `.gitzbook/config.yml`:

```yaml
nav:
  - title: Home
    path: /
  - title: Guides
    children:
      - title: Getting Started
        path: /guides/getting-started
      - title: Configuration
        path: /guides/configuration
  - title: API Reference
    path: /api
```

## Dev Server

Start the development server with live reload:

```bash
gitzbook dev
```

Options:

| Flag | Description | Default |
|------|-------------|---------|
| `--port` | Port number | `4280` |
| `--host` | Host address | `localhost` |
| `--open` | Open browser on start | `false` |
| `--no-hmr` | Disable hot module reload | `false` |

## Building for production

```bash
gitzbook build
```

This generates a static site in the `dist/` directory. The output is fully static HTML, CSS, and JavaScript that can be hosted anywhere.

## What's next?

- [Configuration Guide](configuration.md) -- Customize your docs site
- [Deployment Guide](deployment.md) -- Publish your docs
- [API Reference](../api/README.md) -- Explore the full API
