const fs = require('fs');
const path = require('path');
const {
  createMarkdownRenderer,
  parseSummary,
  flattenNav,
  parseMarkdownFile,
} = require('./parser');
const { renderPage, buildSidebar, buildPrevNext, getBasePath } = require('./renderer');
const { PluginManager } = require('./plugins');

const DEFAULT_CONFIG = {
  title: 'Gitzbook',
  docsDir: 'docs',
  outputDir: '_book',
  pluginsDir: 'plugins',
  plugins: [],
};

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
 * Build the entire site.
 */
function build(rootDir, options = {}) {
  const config = loadConfig(rootDir);
  const docsDir = path.resolve(rootDir, config.docsDir);
  const outputDir = path.resolve(rootDir, config.outputDir);
  const pluginsDir = path.resolve(rootDir, config.pluginsDir);

  // Initialize plugin system
  const pluginManager = new PluginManager();
  pluginManager.loadPlugins(pluginsDir, config);

  // Create markdown renderer
  const md = createMarkdownRenderer(pluginManager);

  // Parse navigation from SUMMARY.md
  let nav = parseSummary(docsDir);
  nav = pluginManager.run('summary', nav) || nav;

  const pages = flattenNav(nav);

  // Load template
  const templatePath = path.join(__dirname, 'templates', 'page.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Clean output directory
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // Copy assets
  const assetsDir = path.join(outputDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // Copy theme CSS
  const themeCss = fs.readFileSync(
    path.join(__dirname, 'styles', 'theme.css'),
    'utf-8'
  );
  fs.writeFileSync(path.join(assetsDir, 'theme.css'), themeCss);

  // Copy highlight.js CSS
  const hljsCss = fs.readFileSync(
    require.resolve('highlight.js/styles/github.css'),
    'utf-8'
  );
  fs.writeFileSync(path.join(assetsDir, 'highlight.css'), hljsCss);

  // Build search index
  const searchIndex = [];

  // Build each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const mdFilePath = path.join(docsDir, page.path);

    if (!fs.existsSync(mdFilePath)) {
      console.warn(`Warning: ${page.path} not found, skipping.`);
      continue;
    }

    const { html: pageHtml, title, raw } = parseMarkdownFile(mdFilePath, md);

    // Run page hook
    let pageData = { title, content: pageHtml, path: page.path, raw };
    pageData = pluginManager.run('page', pageData) || pageData;

    // Collect extra head/body tags
    const headTags = [];
    const bodyStartTags = [];
    const bodyEndTags = [];
    pluginManager.run('head', headTags);
    pluginManager.run('body:start', bodyStartTags);
    pluginManager.run('body:end', bodyEndTags);

    const basePath = getBasePath(page.path);
    const sidebar = buildSidebar(nav, page.path, basePath);

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
      prevNext,
      basePath,
      extraHead: headTags.join('\n'),
      extraBodyStart: bodyStartTags.join('\n'),
      extraBodyEnd: bodyEndTags.join('\n'),
      liveReloadScript,
    };

    templateData = pluginManager.run('template', templateData) || templateData;

    const html = renderPage(template, templateData);

    // Write output file
    const outputPath = path.join(
      outputDir,
      page.path.replace(/\.md$/, '.html')
    );
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);

    // Add to search index
    searchIndex.push({
      title: pageData.title,
      path: page.path.replace(/\.md$/, '.html'),
      body: raw.replace(/^#+\s+.*$/gm, '').replace(/[#*_`\[\]()]/g, '').trim(),
    });

    console.log(`  Built: ${page.path} -> ${page.path.replace(/\.md$/, '.html')}`);
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

  console.log(`\nBuild complete! ${pages.length} pages written to ${config.outputDir}/`);

  return { config, nav, pages, outputDir };
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
