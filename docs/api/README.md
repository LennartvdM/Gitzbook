# API Reference

Gitzbook exposes a programmatic API for advanced use cases such as custom build pipelines, plugins, and integrations.

## Installation

```bash
npm install gitzbook
```

## Core API

### `createSite(options)`

Creates a new Gitzbook site instance.

```typescript
import { createSite } from "gitzbook";

const site = await createSite({
  root: "./docs",
  config: {
    site: { title: "My Docs" },
    build: { outDir: "dist" },
  },
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `root` | `string` | Yes | Path to docs directory |
| `config` | `SiteConfig` | No | Override config file settings |
| `mode` | `"development" \| "production"` | No | Build mode (default: `"production"`) |

**Returns:** `Promise<Site>`

---

### `site.build()`

Builds the site for production.

```typescript
const result = await site.build();

console.log(result.pages);     // number of pages built
console.log(result.duration);  // build time in ms
console.log(result.outDir);    // output directory path
```

**Returns:** `Promise<BuildResult>`

```typescript
interface BuildResult {
  pages: number;
  assets: number;
  duration: number;
  outDir: string;
  errors: BuildError[];
  warnings: BuildWarning[];
}
```

---

### `site.dev()`

Starts the development server.

```typescript
const server = await site.dev();

console.log(server.url);       // e.g. "http://localhost:4280"
console.log(server.port);      // e.g. 4280

// Shut down gracefully
await server.close();
```

**Returns:** `Promise<DevServer>`

---

### `site.resolve(path)`

Resolves a page path to its source file.

```typescript
const file = site.resolve("/guides/getting-started");
// => "/absolute/path/docs/guides/getting-started.md"
```

---

## Plugin API

### Defining a plugin

```typescript
import { definePlugin } from "gitzbook/plugins";

export default definePlugin({
  name: "my-plugin",
  version: "1.0.0",

  // Hook into the build lifecycle
  hooks: {
    "config:resolved": (config) => {
      // Modify resolved config
      return config;
    },

    "page:transform": (page) => {
      // Transform page content before rendering
      page.content = page.content.replace(/TODO/g, "**TODO**");
      return page;
    },

    "build:done": (result) => {
      console.log(`Built ${result.pages} pages`);
    },
  },

  // Register custom Markdown directives
  markdown: {
    directives: {
      "my-component": (attrs, content) => {
        return `<div class="my-component" data-type="${attrs.type}">${content}</div>`;
      },
    },
  },
});
```

### Plugin hooks

| Hook | Timing | Arguments |
|------|--------|-----------|
| `config:resolved` | After config is loaded | `(config: ResolvedConfig)` |
| `page:load` | When a page file is read | `(page: RawPage)` |
| `page:transform` | Before Markdown rendering | `(page: TransformedPage)` |
| `page:render` | After HTML rendering | `(page: RenderedPage)` |
| `build:start` | Before build begins | `(config: ResolvedConfig)` |
| `build:done` | After build completes | `(result: BuildResult)` |
| `dev:start` | When dev server starts | `(server: DevServer)` |

---

## CLI API

You can also use Gitzbook programmatically via the CLI module:

```typescript
import { cli } from "gitzbook/cli";

await cli.run(["build", "--outDir", "public"]);
```

---

## Types

All TypeScript types are exported from the main package:

```typescript
import type {
  SiteConfig,
  ResolvedConfig,
  Page,
  BuildResult,
  DevServer,
  Plugin,
  ThemeConfig,
  NavItem,
  Sidebar,
} from "gitzbook";
```

Full type definitions are available in the [source repository](https://github.com/gitzbook/gitzbook/tree/main/src/types).
