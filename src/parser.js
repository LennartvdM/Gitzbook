const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const hljs = require('highlight.js');
const matter = require('gray-matter');

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
          return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
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

  // Admonition/callout block support
  // Syntax: > [!TIP] or > [!WARNING] or > [!NOTE] or > [!INFO] or > [!DANGER]
  addAdmonitionSupport(md);

  // Tabbed code block support
  addTabbedCodeBlocks(md);

  if (pluginManager) {
    pluginManager.run('markdown', md);
  }

  return md;
}

/**
 * Add admonition/callout support to markdown-it.
 * Transforms blockquotes starting with [!TYPE] into styled callout blocks.
 */
function addAdmonitionSupport(md) {
  const defaultBlockquoteOpen = md.renderer.rules.blockquote_open;
  const defaultBlockquoteClose = md.renderer.rules.blockquote_close;

  md.core.ruler.after('block', 'admonition', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'blockquote_open') continue;

      // Find the first inline token inside this blockquote
      let j = i + 1;
      while (j < tokens.length && tokens[j].type !== 'blockquote_close') {
        if (tokens[j].type === 'inline') {
          const match = tokens[j].content.match(/^\[!(TIP|WARNING|NOTE|INFO|DANGER|CAUTION)\]\s*(.*)/i);
          if (match) {
            const type = match[1].toLowerCase();
            const rest = match[2];
            tokens[i].attrSet('class', `admonition admonition-${type}`);
            tokens[i].meta = { admonitionType: type };
            // Replace the content, removing the [!TYPE] prefix
            // Add a title element
            const titleLabel = type.charAt(0).toUpperCase() + type.slice(1);
            tokens[j].content = rest;
            // Insert title as part of the blockquote
            tokens[i].attrSet('data-admonition', titleLabel);
          }
          break;
        }
        j++;
      }
    }
  });

  md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const admonitionTitle = token.attrGet('data-admonition');
    if (admonitionTitle) {
      const cls = token.attrGet('class');
      return `<div class="${cls}">\n<p class="admonition-title">${admonitionTitle}</p>\n`;
    }
    if (defaultBlockquoteOpen) {
      return defaultBlockquoteOpen(tokens, idx, options, env, self);
    }
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.blockquote_close = (tokens, idx, options, env, self) => {
    // Check if matching open was an admonition
    let depth = 0;
    for (let i = idx; i >= 0; i--) {
      if (tokens[i].type === 'blockquote_close') depth++;
      if (tokens[i].type === 'blockquote_open') {
        depth--;
        if (depth === 0) {
          if (tokens[i].meta && tokens[i].meta.admonitionType) {
            return '</div>\n';
          }
          break;
        }
      }
    }
    if (defaultBlockquoteClose) {
      return defaultBlockquoteClose(tokens, idx, options, env, self);
    }
    return self.renderToken(tokens, idx, options);
  };
}

/**
 * Add tabbed code block support.
 * When consecutive fenced code blocks appear, they get grouped into tabs.
 * Uses the language label as the tab name.
 */
function addTabbedCodeBlocks(md) {
  let tabGroupId = 0;

  md.core.ruler.after('block', 'tabbed-code', (state) => {
    const tokens = state.tokens;
    let i = 0;

    while (i < tokens.length) {
      // Find consecutive fence tokens
      if (tokens[i].type === 'fence' && tokens[i].info) {
        let end = i + 1;
        while (end < tokens.length && tokens[end].type === 'fence' && tokens[end].info) {
          end++;
        }

        // Only create tabs if there are 2+ consecutive fenced blocks
        if (end - i >= 2) {
          const groupId = `tab-group-${tabGroupId++}`;
          const fences = tokens.slice(i, end);

          // Create opening wrapper token
          const openToken = new state.Token('html_block', '', 0);
          let tabHeaders = `<div class="code-tabs" data-group="${groupId}">\n<div class="code-tab-buttons">\n`;
          fences.forEach((fence, idx) => {
            const label = fence.info.trim().split(/\s+/)[0];
            const activeClass = idx === 0 ? ' active' : '';
            tabHeaders += `<button class="code-tab-btn${activeClass}" data-tab="${groupId}-${idx}">${label}</button>\n`;
          });
          tabHeaders += `</div>\n`;
          openToken.content = tabHeaders;

          // Create tab content tokens
          const contentTokens = fences.map((fence, idx) => {
            const tok = new state.Token('html_block', '', 0);
            const activeClass = idx === 0 ? ' active' : '';
            const lang = fence.info.trim().split(/\s+/)[0];
            let highlighted;
            if (lang && hljs.getLanguage(lang)) {
              try {
                highlighted = hljs.highlight(fence.content, { language: lang }).value;
              } catch (_) {
                highlighted = md.utils.escapeHtml(fence.content);
              }
            } else {
              highlighted = md.utils.escapeHtml(fence.content);
            }
            tok.content = `<div class="code-tab-panel${activeClass}" data-panel="${groupId}-${idx}">\n<pre class="hljs"><code class="language-${lang}">${highlighted}</code></pre>\n</div>\n`;
            return tok;
          });

          // Closing wrapper
          const closeToken = new state.Token('html_block', '', 0);
          closeToken.content = `</div>\n`;

          // Replace the original fence tokens
          tokens.splice(i, end - i, openToken, ...contentTokens, closeToken);
          i += contentTokens.length + 2; // skip past the group
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
  });
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
 * Supports YAML frontmatter for title, description, tags, draft status, etc.
 */
function parseMarkdownFile(filePath, md) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);
  const html = md.render(content);

  // Extract first h1 as title fallback
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = frontmatter.title || (titleMatch ? titleMatch[1] : path.basename(filePath, '.md'));

  // Extract headings for table of contents
  const headings = extractHeadings(content);

  return {
    html,
    title,
    raw: content,
    frontmatter,
    headings,
    description: frontmatter.description || '',
    draft: frontmatter.draft === true,
    tags: frontmatter.tags || [],
    order: frontmatter.order,
  };
}

/**
 * Extract headings from markdown content for table of contents generation.
 */
function extractHeadings(content) {
  const headings = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const slug = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ level, text, slug });
    }
  }
  return headings;
}

module.exports = {
  createMarkdownRenderer,
  parseSummary,
  parseSummaryContent,
  flattenNav,
  parseMarkdownFile,
  titleFromFilename,
  extractHeadings,
};
