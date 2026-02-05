const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  createMarkdownRenderer,
  parseSummary,
  flattenNav,
  parseMarkdownFile,
} = require('./parser');
const {
  renderPage,
  buildSidebar,
  buildPrevNext,
  buildBreadcrumbs,
  buildTableOfContents,
  buildMetaTags,
  getBasePath,
  escapeHtml,
} = require('./renderer');
const { PluginManager } = require('./plugins');

const DEFAULT_CONFIG = {
  title: 'Gitzbook',
  docsDir: 'docs',
  outputDir: '_book',
  pluginsDir: 'plugins',
  plugins: [],
  theme: null,
  url: '',
  versions: null,
  i18n: null,
  minify: false,
  verbose: false,
};

/** Simple logger with verbose support */
class Logger {
  constructor(verbose) {
    this.verbose = verbose;
  }
  info(msg) { console.log(msg); }
  debug(msg) { if (this.verbose) console.log(`  [debug] ${msg}`); }
  warn(msg) { console.warn(`  Warning: ${msg}`); }
  error(msg) { console.error(`  Error: ${msg}`); }
}

/**
 * Load the gitzbook.config.js or gitzbook.json configuration.
 */
function loadConfig(rootDir) {
  const jsConfig = path.join(rootDir, 'gitzbook.config.js');
  const jsonConfig = path.join(rootDir, 'gitzbook.json');

  let userConfig = {};
  if (fs.existsSync(jsConfig)) {
    userConfig = require(jsConfig);
  } else if (fs.existsSync(jsonConfig)) {
    userConfig = JSON.parse(fs.readFileSync(jsonConfig, 'utf-8'));
  }

  return { ...DEFAULT_CONFIG, ...userConfig };
}

/**
 * Generate a short content hash for cache-busting asset filenames.
 */
function hashContent(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

/**
 * Load a theme template and CSS. Themes can be:
 * - null (use built-in)
 * - a name matching a directory in themes/
 */
function loadTheme(config, rootDir) {
  const builtinTemplate = path.join(__dirname, 'templates', 'page.html');
  const builtinCss = path.join(__dirname, 'styles', 'theme.css');

  if (config.theme) {
    const themeDir = path.resolve(rootDir, 'themes', config.theme);
    const themeTemplate = path.join(themeDir, 'page.html');
    const themeCss = path.join(themeDir, 'theme.css');

    return {
      template: fs.existsSync(themeTemplate)
        ? fs.readFileSync(themeTemplate, 'utf-8')
        : fs.readFileSync(builtinTemplate, 'utf-8'),
      css: fs.existsSync(themeCss)
        ? fs.readFileSync(themeCss, 'utf-8')
        : fs.readFileSync(builtinCss, 'utf-8'),
    };
  }

  return {
    template: fs.readFileSync(builtinTemplate, 'utf-8'),
    css: fs.readFileSync(builtinCss, 'utf-8'),
  };
}

/**
 * Read the build manifest for incremental builds.
 */
function readManifest(outputDir) {
  const manifestPath = path.join(outputDir, '.gitzbook-manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Write the build manifest.
 */
function writeManifest(outputDir, manifest) {
  const manifestPath = path.join(outputDir, '.gitzbook-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * Build the entire site.
 */
async function build(rootDir, options = {}) {
  let config = loadConfig(rootDir);
  const log = new Logger(config.verbose || options.verbose);
  const docsDir = path.resolve(rootDir, config.docsDir);
  const outputDir = path.resolve(rootDir, config.outputDir);
  const pluginsDir = path.resolve(rootDir, config.pluginsDir);

  // Initialize plugin system
  const pluginManager = new PluginManager();
  pluginManager.loadPlugins(pluginsDir, config);

  // Run config hook
  config = pluginManager.run('config', config) || config;

  // Run beforeBuild hook
  pluginManager.run('beforeBuild', { config, docsDir, outputDir });

  // Create markdown renderer
  const md = createMarkdownRenderer(pluginManager);

  // Load theme
  const theme = loadTheme(config, rootDir);

  // Determine if we can do incremental build
  const forceFullBuild = options.forceFullBuild || false;
  const oldManifest = forceFullBuild ? {} : readManifest(outputDir);
  const newManifest = {};

  // Parse navigation from SUMMARY.md
  let nav = parseSummary(docsDir);
  nav = pluginManager.run('summary', nav) || nav;

  const pages = flattenNav(nav);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Copy assets with cache-busting hashes
  const assetsDir = path.join(outputDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // Write theme CSS with hash
  const cssHash = hashContent(theme.css);
  const cssFilename = `theme.${cssHash}.css`;
  fs.writeFileSync(path.join(assetsDir, cssFilename), theme.css);
  fs.writeFileSync(path.join(assetsDir, 'theme.css'), theme.css);
  log.debug(`Theme CSS: ${cssFilename}`);

  // Copy highlight.js CSS with hash
  const hljsCss = fs.readFileSync(
    require.resolve('highlight.js/styles/github.css'),
    'utf-8'
  );
  const hljsHash = hashContent(hljsCss);
  const hljsFilename = `highlight.${hljsHash}.css`;
  fs.writeFileSync(path.join(assetsDir, hljsFilename), hljsCss);
  fs.writeFileSync(path.join(assetsDir, 'highlight.css'), hljsCss);

  // Copy highlight.js dark theme for dark mode
  const hljsDarkCss = fs.readFileSync(
    require.resolve('highlight.js/styles/github-dark.css'),
    'utf-8'
  );
  fs.writeFileSync(path.join(assetsDir, 'highlight-dark.css'), hljsDarkCss);

  // Build search index
  const searchIndex = [];

  // Build version switcher HTML if versions configured
  let versionSwitcher = '';
  if (config.versions) {
    versionSwitcher = buildVersionSwitcher(config.versions);
  }

  // Build i18n locale switcher if configured
  let localeSwitcher = '';
  if (config.i18n) {
    localeSwitcher = buildLocaleSwitcher(config.i18n);
  }

  // Track built pages for incremental
  let builtCount = 0;
  let skippedCount = 0;

  // Build each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const mdFilePath = path.join(docsDir, page.path);

    if (!fs.existsSync(mdFilePath)) {
      log.warn(`${page.path} not found, skipping.`);
      continue;
    }

    // Incremental build check
    const stat = fs.statSync(mdFilePath);
    const fileKey = page.path;
    const mtime = stat.mtimeMs;

    if (
      !forceFullBuild &&
      oldManifest[fileKey] &&
      oldManifest[fileKey].mtime === mtime
    ) {
      newManifest[fileKey] = oldManifest[fileKey];
      skippedCount++;
      const raw = fs.readFileSync(mdFilePath, 'utf-8');
      searchIndex.push({
        title: oldManifest[fileKey].title || page.title,
        path: page.path.replace(/\.md$/, '.html'),
        body: raw.replace(/^---[\s\S]*?---\s*/, '').replace(/^#+\s+.*$/gm, '').replace(/[#*_`\[\]()]/g, '').trim(),
      });
      continue;
    }

    const parsed = parseMarkdownFile(mdFilePath, md);

    // Skip draft pages in production builds
    if (parsed.draft && !options.liveReload) {
      log.debug(`Skipping draft: ${page.path}`);
      continue;
    }

    // Run page hook
    let pageData = {
      title: parsed.title,
      content: parsed.html,
      path: page.path,
      raw: parsed.raw,
      frontmatter: parsed.frontmatter,
      headings: parsed.headings,
      description: parsed.description,
      tags: parsed.tags,
    };
    pageData = pluginManager.run('page', pageData) || pageData;

    // Collect extra head/body tags
    const headTags = [];
    const bodyStartTags = [];
    const bodyEndTags = [];
    pluginManager.run('head', headTags);
    pluginManager.run('body:start', bodyStartTags);
    pluginManager.run('body:end', bodyEndTags);

    // Build SEO meta tags
    const metaTags = buildMetaTags(pageData, config);
    headTags.push(metaTags);

    const basePath = getBasePath(page.path);
    const sidebar = buildSidebar(nav, page.path, basePath);
    const breadcrumbs = buildBreadcrumbs(nav, page.path, basePath);
    const toc = buildTableOfContents(pageData.headings || parsed.headings);

    const prev = i > 0 ? pages[i - 1] : null;
    const next = i < pages.length - 1 ? pages[i + 1] : null;
    const prevNext = buildPrevNext(prev, next, basePath);

    // Live reload script placeholder
    const liveReloadScript = options.liveReload
      ? `<script>
      (function() {
        var ws = new WebSocket('ws://localhost:${options.liveReloadPort || 35729}');
        ws.onmessage = function(e) {
          if (e.data === 'reload') {
            document.getElementById('reload-indicator').style.display = 'block';
            setTimeout(function() { location.reload(); }, 200);
          }
        };
        ws.onclose = function() {
          setTimeout(function() { location.reload(); }, 1000);
        };
      })();
    </script>`
      : '';

    // Template data
    let templateData = {
      bookTitle: config.title,
      pageTitle: pageData.title,
      content: pageData.content,
      sidebar,
      breadcrumbs,
      toc,
      prevNext,
      basePath,
      extraHead: headTags.join('\n'),
      extraBodyStart: bodyStartTags.join('\n'),
      extraBodyEnd: bodyEndTags.join('\n'),
      liveReloadScript,
      versionSwitcher,
      localeSwitcher,
    };

    templateData = pluginManager.run('template', templateData) || templateData;

    let html = renderPage(theme.template, templateData);

    // HTML minification
    if (config.minify) {
      try {
        const { minify } = require('html-minifier-terser');
        html = await minify(html, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
        });
      } catch (err) {
        log.debug(`Minification failed for ${page.path}: ${err.message}`);
      }
    }

    // Write output file
    const outputPath = path.join(
      outputDir,
      page.path.replace(/\.md$/, '.html')
    );
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);

    // Update manifest
    newManifest[fileKey] = { mtime, title: pageData.title };

    // Add to search index
    searchIndex.push({
      title: pageData.title,
      path: page.path.replace(/\.md$/, '.html'),
      body: parsed.raw.replace(/^#+\s+.*$/gm, '').replace(/[#*_`\[\]()]/g, '').trim(),
    });

    builtCount++;
    log.debug(`Built: ${page.path} -> ${page.path.replace(/\.md$/, '.html')}`);
  }

  // Write search index
  fs.writeFileSync(
    path.join(assetsDir, 'search-index.json'),
    JSON.stringify(searchIndex)
  );

  // Write search JS
  const searchJs = fs.readFileSync(
    path.join(__dirname, 'templates', 'search.js'),
    'utf-8'
  );
  fs.writeFileSync(path.join(assetsDir, 'search.js'), searchJs);

  // Copy any static assets from docs
  copyStaticAssets(docsDir, outputDir);

  // Run assets hook for plugins to copy their own assets
  pluginManager.run('assets', outputDir);

  // Create index.html redirect if README exists
  const indexHtml = path.join(outputDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    const readmeHtml = path.join(outputDir, 'README.html');
    if (fs.existsSync(readmeHtml)) {
      fs.copyFileSync(readmeHtml, indexHtml);
    }
  }

  // Generate 404 page
  generate404Page(outputDir, theme.template, config);

  // Generate sitemap.xml
  if (config.url) {
    generateSitemap(outputDir, pages, config);
  }

  // Generate RSS feed
  if (config.url && config.rss !== false) {
    generateRSS(outputDir, pages, searchIndex, config);
  }

  // Generate _redirects file for Netlify
  generateRedirects(outputDir, config);

  // Write build manifest
  writeManifest(outputDir, newManifest);

  // Run afterBuild hook
  pluginManager.run('afterBuild', { config, outputDir, pages });

  if (skippedCount > 0) {
    log.info(`\nBuild complete! ${builtCount} pages built, ${skippedCount} unchanged (incremental) -> ${config.outputDir}/`);
  } else {
    log.info(`\nBuild complete! ${builtCount} pages written to ${config.outputDir}/`);
  }

  return { config, nav, pages, outputDir, pluginManager };
}

/**
 * Generate a styled 404 page.
 */
function generate404Page(outputDir, template, config) {
  const content = `
    <div class="error-page">
      <h1>404</h1>
      <p>Page not found</p>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <a href="./index.html" class="error-home-link">Go to homepage</a>
    </div>
  `;

  const data = {
    bookTitle: config.title,
    pageTitle: '404 — Not Found',
    content,
    sidebar: '',
    breadcrumbs: '',
    toc: '',
    prevNext: '',
    basePath: './',
    extraHead: '',
    extraBodyStart: '',
    extraBodyEnd: '',
    liveReloadScript: '',
    versionSwitcher: '',
    localeSwitcher: '',
  };

  const html = renderPage(template, data);
  fs.writeFileSync(path.join(outputDir, '404.html'), html);
}

/**
 * Generate sitemap.xml for SEO.
 */
function generateSitemap(outputDir, pages, config) {
  const baseUrl = config.url.replace(/\/$/, '');
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of pages) {
    const loc = `${baseUrl}/${page.path.replace(/\.md$/, '.html')}`;
    xml += `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  }

  xml += '</urlset>\n';
  fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), xml);
}

/**
 * Generate a simple RSS/Atom feed from pages.
 */
function generateRSS(outputDir, pages, searchIndex, config) {
  const baseUrl = config.url.replace(/\/$/, '');
  const now = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<feed xmlns="http://www.w3.org/2005/Atom">\n';
  xml += `  <title>${escapeXml(config.title)}</title>\n`;
  xml += `  <link href="${baseUrl}" />\n`;
  xml += `  <link href="${baseUrl}/feed.xml" rel="self" />\n`;
  xml += `  <updated>${now}</updated>\n`;
  xml += `  <id>${baseUrl}/</id>\n`;

  for (const page of pages.slice(0, 20)) {
    const pagePath = page.path.replace(/\.md$/, '.html');
    const searchEntry = searchIndex.find((s) => s.path === pagePath);
    const summary = searchEntry ? searchEntry.body.slice(0, 300) : '';
    xml += `  <entry>\n`;
    xml += `    <title>${escapeXml(page.title)}</title>\n`;
    xml += `    <link href="${baseUrl}/${pagePath}" />\n`;
    xml += `    <id>${baseUrl}/${pagePath}</id>\n`;
    xml += `    <updated>${now}</updated>\n`;
    xml += `    <summary>${escapeXml(summary)}</summary>\n`;
    xml += `  </entry>\n`;
  }

  xml += '</feed>\n';
  fs.writeFileSync(path.join(outputDir, 'feed.xml'), xml);
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate _redirects file for Netlify.
 */
function generateRedirects(outputDir, config) {
  let redirects = '';

  // Always add a README -> index redirect
  redirects += '/README.html  /index.html  301\n';

  // Custom redirects from config
  if (config.redirects) {
    for (const [from, to] of Object.entries(config.redirects)) {
      redirects += `${from}  ${to}  301\n`;
    }
  }

  // 404 fallback
  redirects += '/*  /404.html  404\n';

  fs.writeFileSync(path.join(outputDir, '_redirects'), redirects);
}

/**
 * Build a version switcher dropdown HTML.
 */
function buildVersionSwitcher(versions) {
  if (!versions || !versions.list || versions.list.length === 0) return '';

  const current = versions.current || versions.list[0].name;
  let html = '<div class="version-switcher">\n';
  html += `<select class="version-select" onchange="window.location.href=this.value">\n`;

  for (const ver of versions.list) {
    const selected = ver.name === current ? ' selected' : '';
    html += `  <option value="${escapeHtml(ver.url)}"${selected}>${escapeHtml(ver.name)}</option>\n`;
  }

  html += '</select>\n</div>\n';
  return html;
}

/**
 * Build a locale switcher for i18n.
 */
function buildLocaleSwitcher(i18n) {
  if (!i18n || !i18n.locales || i18n.locales.length === 0) return '';

  const current = i18n.current || i18n.default || i18n.locales[0].code;
  let html = '<div class="locale-switcher">\n';
  html += `<select class="locale-select" onchange="window.location.href=this.value">\n`;

  for (const locale of i18n.locales) {
    const selected = locale.code === current ? ' selected' : '';
    const url = locale.url || `/${locale.code}/`;
    html += `  <option value="${escapeHtml(url)}"${selected}>${escapeHtml(locale.name)}</option>\n`;
  }

  html += '</select>\n</div>\n';
  return html;
}

/**
 * Copy non-markdown static assets (images, etc.) from docs to output.
 */
function copyStaticAssets(docsDir, outputDir) {
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(dir, entry.name);
      const relPath = path.relative(docsDir, srcPath);
      const destPath = path.join(outputDir, relPath);

      if (entry.isDirectory()) {
        walk(srcPath);
      } else if (
        !entry.name.endsWith('.md') &&
        !entry.name.startsWith('.')
      ) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  walk(docsDir);
}

module.exports = { build, loadConfig };
