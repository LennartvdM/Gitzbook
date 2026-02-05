# Frequently Asked Questions

## General

### What is Gitzbook?

Gitzbook is a static documentation generator that turns your Markdown files into a beautiful, searchable documentation website. It's designed to be Git-native, meaning your docs live alongside your code and follow the same workflow.

### How is Gitzbook different from other doc tools?

Unlike traditional doc platforms, Gitzbook:
- Lives entirely in your repository (no external database)
- Uses standard Markdown with minimal custom syntax
- Builds in under 3 seconds for most projects
- Has zero-config defaults that work out of the box
- Provides a plugin system that doesn't require forking

### Is Gitzbook free?

Yes. Gitzbook is open source and free to use under the MIT license. We also offer **Gitzbook Cloud**, a hosted service with team collaboration features, starting at $12/month per team.

---

## Setup & Configuration

### What Node.js version do I need?

Node.js 18.0 or higher. We recommend using the latest LTS version.

### Can I use Gitzbook with a monorepo?

Yes. Point the `root` option to your docs directory:

```yaml
# .gitzbook/config.yml
site:
  title: "Monorepo Docs"
```

And run:

```bash
gitzbook dev --root packages/docs
```

### How do I change the default port?

```bash
gitzbook dev --port 3000
```

Or set it in your config:

```yaml
dev:
  port: 3000
```

---

## Content

### What Markdown features are supported?

Gitzbook supports all standard CommonMark Markdown plus:
- GitHub Flavored Markdown (tables, strikethrough, task lists)
- Syntax highlighting for 190+ languages
- Custom containers/callouts (`:::info`, `:::warning`, `:::danger`)
- Frontmatter (YAML)
- Table of contents generation (`[[toc]]`)
- Emoji shortcodes (`:rocket:` becomes :rocket:)
- Footnotes
- Math equations (with KaTeX plugin)
- Diagrams (with Mermaid plugin)

### Can I use MDX or JSX?

Gitzbook uses standard Markdown with a directive syntax for custom components. We intentionally chose this approach over MDX to keep docs portable and tool-agnostic. If you need dynamic components, use the plugin API's custom directives.

### How do I add images?

Place images in a `public/` directory at your docs root:

```markdown
![Architecture diagram](/images/architecture.png)
```

Images are automatically optimized during build (resized, compressed, converted to WebP).

### Can I include code from external files?

Yes, use the code import syntax:

```markdown
<<< @/examples/hello.py
<<< @/examples/config.yaml{2-5}
```

The second example imports only lines 2-5 of the file.

---

## Build & Performance

### How fast is the build?

Typical build times:
- 50 pages: ~0.8 seconds
- 200 pages: ~2.1 seconds
- 1,000 pages: ~8 seconds
- 5,000 pages: ~35 seconds

Builds are parallelized across CPU cores and use incremental compilation when possible.

### My build is slow. How can I speed it up?

1. Enable incremental builds: `gitzbook build --incremental`
2. Exclude unnecessary files in config
3. Reduce image sizes before build
4. Use the `--parallel` flag for multi-core builds

### Does Gitzbook support incremental builds?

Yes. Run `gitzbook build --incremental` to only rebuild changed pages. This uses file checksums to detect changes and can reduce build times by 80-90% for large sites.

---

## Deployment

### Where can I host my Gitzbook site?

Anywhere that serves static files: Vercel, Netlify, GitHub Pages, Cloudflare Pages, AWS S3 + CloudFront, Azure Static Web Apps, Firebase Hosting, or your own server. See the [Deployment Guide](guides/deployment.md).

### Can I deploy to a subdirectory?

Yes. Set the `base` option:

```yaml
build:
  base: "/docs/"
```

---

## Troubleshooting

### I'm getting a "config not found" error

Make sure your config file is at `docs/.gitzbook/config.yml` (or `.json`/`.toml`/`.js`). The `.gitzbook/` directory must be inside your docs root.

### Search isn't working in development

Local search requires a build step to generate the search index. In development mode, the index is generated on-the-fly but may take a moment on first load. If search still doesn't work, check that `search.enabled` is not set to `false` in your config.

### My custom theme styles aren't applying

1. Verify the file is at `.gitzbook/theme/styles.css`
2. Check that your CSS custom properties use the `--gb-` prefix
3. Clear the build cache: `gitzbook build --clean`
4. Restart the dev server

### Hot reload stopped working

Try restarting the dev server. If the issue persists, delete the `.gitzbook/.cache` directory:

```bash
rm -rf docs/.gitzbook/.cache
gitzbook dev
```
