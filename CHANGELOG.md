# Changelog

All notable changes to Gitzbook are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.1] - 2026-01-28

### Fixed
- Search index not updating on incremental builds
- CSS custom properties not applying in dark mode when using `auto` theme
- Dev server crash when deleting a file while watching

## [2.4.0] - 2026-01-15

### Added
- **Incremental builds** -- Only rebuild changed pages with `--incremental` flag
- New `audit` CLI command for post-deployment checks
- Support for TOML config files
- Footnotes support in Markdown

### Changed
- Upgraded FlexSearch to v0.8 for better CJK language support
- Build output is now 18% smaller due to improved tree shaking
- Dev server HMR latency reduced from ~120ms to ~45ms

### Deprecated
- `search.engine` config key renamed to `search.provider` (old key still works but will be removed in v3)

## [2.3.2] - 2025-12-03

### Fixed
- Table of contents not rendering for pages with custom frontmatter title
- Broken anchor links when using `cleanUrls: true`
- Memory leak in dev server after 500+ HMR updates

## [2.3.1] - 2025-11-19

### Fixed
- Plugin hooks not firing in correct order during parallel builds
- `--base` CLI flag being ignored when config file also sets base

## [2.3.0] - 2025-11-01

### Added
- **Plugin API v2** with new lifecycle hooks (`page:load`, `build:start`)
- Custom component override system via `.gitzbook/theme/components/`
- `gitzbook config check` command for configuration validation
- Support for importing code snippets from external files (`<<< @/path`)

### Changed
- Minimum Node.js version bumped from 16 to 18
- Switched Markdown parser from markdown-it to mdast for better extensibility

### Removed
- Removed deprecated `theme.accentColor` (use `theme.primaryColor` instead)
- Removed support for `.gitzbook.yml` at project root (must be in docs directory)

## [2.2.0] - 2025-09-14

### Added
- Built-in i18n support with automatic language detection
- OpenAPI plugin for generating API docs from spec files
- `layout: "full-width"` frontmatter option
- Automatic image optimization (WebP conversion, resizing)

### Changed
- Default font changed from System UI to Inter
- Sidebar now shows current section expanded by default

## [2.1.0] - 2025-07-22

### Added
- Algolia DocSearch integration
- KaTeX plugin for math equations
- Mermaid plugin for diagrams
- Git contributors display on pages

### Fixed
- Navigation not highlighting active page on first load
- Build failing silently when Markdown contains invalid frontmatter

## [2.0.0] - 2025-06-01

### Added
- Complete rewrite with Vite-based build system
- Dark mode with `auto`, `light`, and `dark` options
- Full-text local search with typo tolerance
- SSR mode for dynamic content
- New default theme with CSS custom property system

### Changed
- **BREAKING:** Config file moved from project root to `.gitzbook/config.yml`
- **BREAKING:** Plugin API completely redesigned (see migration guide)
- **BREAKING:** Minimum Node.js version is now 16
- Build times improved by 5x compared to v1

### Removed
- Removed legacy template engine (use Markdown directives instead)
- Removed built-in deployment commands (use provider CLIs directly)

### Migration
See the [v1 to v2 Migration Guide](https://gitzbook.dev/migration/v2) for detailed upgrade instructions.

## [1.x]

For v1 changelog, see the [v1 branch](https://github.com/gitzbook/gitzbook/blob/v1/CHANGELOG.md).
