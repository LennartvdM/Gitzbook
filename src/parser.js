const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const hljs = require('highlight.js');

/**
 * Create a configured markdown-it instance.
 * Plugins can modify the instance via the 'markdown' hook.
 */
function createMarkdownRenderer(pluginManager) {
  const md = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch (_) { /* fall through */ }
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  md.use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.headerLink(),
    slugify: (s) =>
      s.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, ''),
  });

  if (pluginManager) {
    pluginManager.run('markdown', md);
  }

  return md;
}

/**
 * Parse a SUMMARY.md file and return a navigation tree.
 *
 * Expected format:
 *   # Summary
 *
 *   * [Introduction](README.md)
 *   * [Chapter 1](chapter1/README.md)
 *     * [Section 1.1](chapter1/section1.md)
 *     * [Section 1.2](chapter1/section2.md)
 *   * [Chapter 2](chapter2.md)
 *
 * Returns an array of { title, path, children[] } objects.
 */
function parseSummary(docsDir) {
  const summaryPath = path.join(docsDir, 'SUMMARY.md');
  if (!fs.existsSync(summaryPath)) {
    // Auto-generate summary from directory structure
    return autoGenerateSummary(docsDir);
  }

  const content = fs.readFileSync(summaryPath, 'utf-8');
  return parseSummaryContent(content);
}

function parseSummaryContent(content) {
  const lines = content.split('\n');
  const nav = [];
  const stack = [{ children: nav, indent: -1 }];

  for (const line of lines) {
    // Match lines like "* [Title](path.md)" or "  * [Title](path.md)"
    const match = line.match(/^(\s*)\*\s+\[([^\]]+)\]\(([^)]+)\)/);
    if (!match) continue;

    const indent = match[1].length;
    const title = match[2];
    const filePath = match[3];

    const entry = { title, path: filePath, children: [] };

    // Pop stack until we find the right parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(entry);
    stack.push({ children: entry.children, indent });
  }

  return nav;
}

/**
 * Auto-generate a summary by scanning the docs directory for .md files.
 */
function autoGenerateSummary(docsDir) {
  const nav = [];

  function scan(dir, relativeTo) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    const dirs = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'SUMMARY.md') continue;
      if (entry.isDirectory()) dirs.push(entry);
      else if (entry.name.endsWith('.md')) files.push(entry);
    }

    // Sort: README first, then alphabetical
    files.sort((a, b) => {
      if (a.name === 'README.md') return -1;
      if (b.name === 'README.md') return 1;
      return a.name.localeCompare(b.name);
    });

    const result = [];
    for (const file of files) {
      const rel = path.relative(relativeTo, path.join(dir, file.name));
      const title = titleFromFilename(file.name);
      result.push({ title, path: rel, children: [] });
    }

    for (const d of dirs) {
      const dirPath = path.join(dir, d.name);
      const children = scan(dirPath, relativeTo);
      if (children.length > 0) {
        const title = titleFromFilename(d.name);
        // If the directory has a README, use it as the entry point
        const readmeIndex = children.findIndex(
          (c) => c.path.endsWith('README.md')
        );
        if (readmeIndex >= 0) {
          const readme = children.splice(readmeIndex, 1)[0];
          result.push({ title, path: readme.path, children });
        } else {
          result.push({ title, path: null, children });
        }
      }
    }

    return result;
  }

  return scan(docsDir, docsDir);
}

function titleFromFilename(name) {
  return name
    .replace(/\.md$/, '')
    .replace(/README/i, 'Introduction')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Flatten the navigation tree into an ordered list of pages
 * for prev/next navigation.
 */
function flattenNav(nav) {
  const pages = [];
  function walk(items) {
    for (const item of items) {
      if (item.path) {
        pages.push(item);
      }
      if (item.children && item.children.length > 0) {
        walk(item.children);
      }
    }
  }
  walk(nav);
  return pages;
}

/**
 * Read a markdown file and return its parsed HTML and metadata.
 */
function parseMarkdownFile(filePath, md) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const html = md.render(content);

  // Extract first h1 as title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');

  return { html, title, raw: content };
}

module.exports = {
  createMarkdownRenderer,
  parseSummary,
  parseSummaryContent,
  flattenNav,
  parseMarkdownFile,
  titleFromFilename,
};
