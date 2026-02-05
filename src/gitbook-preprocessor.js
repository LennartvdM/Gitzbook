/**
 * GitBook Syntax Preprocessor
 *
 * Transforms GitBook-specific template syntax ({% ... %}) into standard
 * markdown or HTML before the content reaches markdown-it.
 *
 * This runs as a single preprocessing step in the pipeline:
 *   read file → strip frontmatter → **GitBook preprocessor** → markdown-it → page hooks
 *
 * Supported GitBook syntax:
 *   - {% hint style="type" %} ... {% endhint %}         → admonition blocks
 *   - {% tabs %} {% tab title="..." %} ... {% endtab %} {% endtabs %} → tab groups
 *   - {% code title="..." lineNumbers="true" %} ... {% endcode %}     → code blocks with metadata
 *   - {% content-ref url="..." %} ... {% endcontent-ref %}            → content reference links
 *   - {% embed url="..." %}                              → embedded content
 *   - {% file src="..." %} or {% file src="..." caption="..." %}      → file download links
 */

// Map GitBook hint styles to Gitzbook admonition types
const HINT_STYLE_MAP = {
  info: 'info',
  success: 'tip',
  warning: 'warning',
  danger: 'danger',
};

/**
 * Run all GitBook syntax transformations on raw markdown content.
 * @param {string} content - Markdown content (frontmatter already stripped)
 * @returns {string} Transformed content with GitBook syntax replaced
 */
function preprocessGitBook(content) {
  let result = content;

  // Order matters: process block-level constructs first (outermost to innermost),
  // then inline constructs.
  result = processHints(result);
  result = processTabs(result);
  result = processCodeBlocks(result);
  result = processContentRefs(result);
  result = processEmbeds(result);
  result = processFiles(result);

  return result;
}

/**
 * Transform {% hint style="type" %} ... {% endhint %} into admonition blockquotes.
 *
 * GitBook:
 *   {% hint style="info" %}
 *   This is an info hint.
 *   {% endhint %}
 *
 * Output (Gitzbook admonition syntax):
 *   > [!INFO] This is an info hint.
 */
function processHints(content) {
  // Match {% hint style="type" %} ... {% endhint %} blocks
  // The style attribute can use single or double quotes
  const hintRegex = /\{%\s*hint\s+style=["'](\w+)["']\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/gi;

  return content.replace(hintRegex, (_, style, body) => {
    const type = HINT_STYLE_MAP[style.toLowerCase()] || style.toLowerCase();
    const admonitionType = type.toUpperCase();

    // Convert body lines into blockquote format
    const trimmedBody = body.trim();
    const lines = trimmedBody.split('\n');
    const quoted = lines.map((line) => `> ${line}`).join('\n');

    // First line gets the [!TYPE] prefix
    return quoted.replace(/^> /, `> [!${admonitionType}] `);
  });
}

/**
 * Transform {% tabs %} / {% tab title="..." %} / {% endtab %} / {% endtabs %}
 * into HTML tab groups matching Gitzbook's existing tab styling.
 *
 * GitBook:
 *   {% tabs %}
 *   {% tab title="JavaScript" %}
 *   ```js
 *   console.log('hello');
 *   ```
 *   {% endtab %}
 *   {% tab title="Python" %}
 *   ```python
 *   print('hello')
 *   ```
 *   {% endtab %}
 *   {% endtabs %}
 */
let tabGroupCounter = 0;

function processTabs(content) {
  // Reset counter for each document
  tabGroupCounter = 0;

  const tabsRegex = /\{%\s*tabs\s*%\}([\s\S]*?)\{%\s*endtabs\s*%\}/gi;

  return content.replace(tabsRegex, (_, tabsBody) => {
    const groupId = `tab-group-gb-${tabGroupCounter++}`;

    // Extract individual tabs
    const tabRegex = /\{%\s*tab\s+title=["']([^"']+)["']\s*%\}([\s\S]*?)(?=\{%\s*(?:tab\s+title=|endtab))/gi;
    const tabs = [];
    let match;

    // We need a slightly different approach — split on {% tab %} and {% endtab %}
    const tabParts = tabsBody.split(/\{%\s*endtab\s*%\}/gi);

    for (const part of tabParts) {
      const tabMatch = part.match(/\{%\s*tab\s+title="([^"]*)"\s*%\}([\s\S]*)/i)
        || part.match(/\{%\s*tab\s+title='([^']*)'\s*%\}([\s\S]*)/i);
      if (tabMatch) {
        tabs.push({
          title: tabMatch[1],
          content: tabMatch[2].trim(),
        });
      }
    }

    if (tabs.length === 0) return '';

    // Build tab buttons
    let html = `<div class="code-tabs" data-group="${groupId}">\n`;
    html += `<div class="code-tab-buttons">\n`;
    tabs.forEach((tab, idx) => {
      const activeClass = idx === 0 ? ' active' : '';
      html += `<button class="code-tab-btn${activeClass}" data-tab="${groupId}-${idx}">${escapeHtml(tab.title)}</button>\n`;
    });
    html += `</div>\n`;

    // Build tab panels — content is left as markdown for markdown-it to process,
    // so we use a special marker that we'll handle post-render, or we render
    // the content as-is inside the panel divs. Since markdown-it has html:true,
    // we can wrap the markdown in divs and it will still be processed.
    tabs.forEach((tab, idx) => {
      const activeClass = idx === 0 ? ' active' : '';
      html += `<div class="code-tab-panel${activeClass}" data-panel="${groupId}-${idx}">\n\n`;
      html += tab.content + '\n\n';
      html += `</div>\n`;
    });

    html += `</div>\n`;
    return html;
  });
}

/**
 * Transform {% code title="..." lineNumbers="true" %} ... {% endcode %}
 * into fenced code blocks with a title wrapper.
 *
 * GitBook:
 *   {% code title="app.js" lineNumbers="true" %}
 *   ```javascript
 *   const x = 1;
 *   ```
 *   {% endcode %}
 *
 * Output: The inner fenced code block is preserved for markdown-it,
 * wrapped in a div with the title displayed above it.
 */
function processCodeBlocks(content) {
  const codeRegex = /\{%\s*code\s+([\s\S]*?)\s*%\}([\s\S]*?)\{%\s*endcode\s*%\}/gi;

  return content.replace(codeRegex, (_, attrsStr, body) => {
    const attrs = parseAttributes(attrsStr);
    const title = attrs.title || '';
    const lineNumbers = attrs.linenumbers === 'true';
    const overflow = attrs.overflow || 'auto';

    const trimmedBody = body.trim();

    if (!title && !lineNumbers) {
      // No metadata to add, just return the body as-is
      return trimmedBody;
    }

    let html = '';
    if (title) {
      html += `<div class="code-block-titled">\n`;
      html += `<div class="code-block-title">${escapeHtml(title)}</div>\n\n`;
    }

    html += trimmedBody + '\n\n';

    if (title) {
      html += `</div>\n`;
    }

    return html;
  });
}

/**
 * Transform {% content-ref url="..." %} ... {% endcontent-ref %}
 * into a styled content reference link card.
 *
 * GitBook:
 *   {% content-ref url="getting-started.md" %}
 *   [Getting Started](getting-started.md)
 *   {% endcontent-ref %}
 *
 * Output: A styled link card div wrapping the inner markdown link.
 */
function processContentRefs(content) {
  const refRegex = /\{%\s*content-ref\s+url=["']([^"']+)["']\s*%\}([\s\S]*?)\{%\s*endcontent-ref\s*%\}/gi;

  return content.replace(refRegex, (_, url, body) => {
    const trimmedBody = body.trim();

    // If the body contains a markdown link, use it directly inside a styled wrapper
    if (trimmedBody) {
      return `<div class="content-ref">\n\n${trimmedBody}\n\n</div>\n`;
    }

    // Fallback: create a link from the URL
    const label = url.replace(/\.md$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return `<div class="content-ref">\n\n[${label}](${url})\n\n</div>\n`;
  });
}

/**
 * Transform {% embed url="..." %} into an embedded element.
 *
 * GitBook:
 *   {% embed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" %}
 *
 * Output: An iframe for supported providers (YouTube, Vimeo, CodePen, etc.)
 * or a styled link for other URLs.
 */
function processEmbeds(content) {
  const embedRegex = /\{%\s*embed\s+url=["']([^"']+)["']\s*%\}/gi;

  return content.replace(embedRegex, (_, url) => {
    const iframeSrc = getEmbedUrl(url);

    if (iframeSrc) {
      return `<div class="embed-container">\n<iframe src="${escapeHtml(iframeSrc)}" frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;"></iframe>\n</div>\n`;
    }

    // Fallback: render as a styled external link
    return `<div class="embed-link">\n<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>\n</div>\n`;
  });
}

/**
 * Transform {% file src="..." %} into a download link.
 *
 * GitBook:
 *   {% file src=".gitbook/assets/report.pdf" caption="Download Report" %}
 *
 * Output: A styled download link.
 */
function processFiles(content) {
  const fileRegex = /\{%\s*file\s+([\s\S]*?)\s*%\}/gi;

  return content.replace(fileRegex, (_, attrsStr) => {
    const attrs = parseAttributes(attrsStr);
    const src = attrs.src || '';
    const caption = attrs.caption || src.split('/').pop() || 'Download file';

    if (!src) return '';

    return `<div class="file-download">\n<a href="${escapeHtml(src)}" download>${escapeHtml(caption)}</a>\n</div>\n`;
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse key="value" attribute pairs from a GitBook tag.
 * Handles both single and double quotes.
 * @param {string} str - Attribute string like: title="foo" lineNumbers="true"
 * @returns {Object} Parsed attributes as key-value pairs (keys lowercased)
 */
function parseAttributes(str) {
  const attrs = {};
  const attrRegex = /(\w+)=["']([^"']*?)["']/gi;
  let match;
  while ((match = attrRegex.exec(str)) !== null) {
    attrs[match[1].toLowerCase()] = match[2];
  }
  return attrs;
}

/**
 * Convert a URL to an embeddable iframe source URL for known providers.
 * @param {string} url - Original URL
 * @returns {string|null} Embed URL, or null if not a known embed provider
 */
function getEmbedUrl(url) {
  // YouTube
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  // Vimeo
  match = url.match(/vimeo\.com\/(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }

  // CodePen
  match = url.match(/codepen\.io\/([^/]+)\/pen\/([^/?]+)/);
  if (match) {
    return `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`;
  }

  // CodeSandbox
  match = url.match(/codesandbox\.io\/s\/([^/?]+)/);
  if (match) {
    return `https://codesandbox.io/embed/${match[1]}`;
  }

  return null;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  preprocessGitBook,
  // Exported for testing individual transforms
  processHints,
  processTabs,
  processCodeBlocks,
  processContentRefs,
  processEmbeds,
  processFiles,
};
