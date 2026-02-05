const fs = require('fs');
const path = require('path');

/**
 * Render a page using the HTML template.
 */
function renderPage(templateStr, data) {
  let html = templateStr;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    html = html.replace(placeholder, value ?? '');
  }
  return html;
}

/**
 * Build the sidebar HTML from the navigation tree.
 */
function buildSidebar(nav, currentPath, basePath) {
  let html = '<nav class="sidebar-nav">\n<ul>\n';
  html += buildSidebarItems(nav, currentPath, basePath, 0);
  html += '</ul>\n</nav>\n';
  return html;
}

function buildSidebarItems(items, currentPath, basePath, depth) {
  let html = '';
  for (const item of items) {
    const isActive = item.path === currentPath;
    const hasChildren = item.children && item.children.length > 0;
    const isParentOfActive = hasChildren && isAncestor(item, currentPath);
    const activeClass = isActive ? ' active' : '';
    const expandedClass = isParentOfActive || isActive ? ' expanded' : '';

    html += `<li class="nav-item depth-${depth}${activeClass}${expandedClass}">\n`;

    if (item.path) {
      const href = basePath + item.path.replace(/\.md$/, '.html');
      html += `  <a href="${href}"${isActive ? ' class="active"' : ''}>${escapeHtml(item.title)}</a>\n`;
    } else {
      html += `  <span class="nav-group-title">${escapeHtml(item.title)}</span>\n`;
    }

    if (hasChildren) {
      html += `  <ul class="nav-children${expandedClass}">\n`;
      html += buildSidebarItems(item.children, currentPath, basePath, depth + 1);
      html += '  </ul>\n';
    }

    html += '</li>\n';
  }
  return html;
}

function isAncestor(item, targetPath) {
  if (item.path === targetPath) return true;
  if (item.children) {
    return item.children.some((child) => isAncestor(child, targetPath));
  }
  return false;
}

/**
 * Build prev/next navigation HTML.
 */
function buildPrevNext(prev, next, basePath) {
  let html = '<div class="page-nav">\n';
  if (prev) {
    const href = basePath + prev.path.replace(/\.md$/, '.html');
    html += `  <a class="prev" href="${href}">\n`;
    html += `    <span class="arrow">&larr;</span>\n`;
    html += `    <span class="label">${escapeHtml(prev.title)}</span>\n`;
    html += '  </a>\n';
  } else {
    html += '  <span class="prev"></span>\n';
  }
  if (next) {
    const href = basePath + next.path.replace(/\.md$/, '.html');
    html += `  <a class="next" href="${href}">\n`;
    html += `    <span class="label">${escapeHtml(next.title)}</span>\n`;
    html += `    <span class="arrow">&rarr;</span>\n`;
    html += '  </a>\n';
  } else {
    html += '  <span class="next"></span>\n';
  }
  html += '</div>\n';
  return html;
}

/**
 * Build breadcrumb navigation HTML from the navigation tree.
 */
function buildBreadcrumbs(nav, currentPath, basePath) {
  const trail = findBreadcrumbTrail(nav, currentPath);
  if (!trail || trail.length === 0) return '';

  let html = '<nav class="breadcrumbs" aria-label="Breadcrumb">\n<ol>\n';
  html += `  <li><a href="${basePath}index.html">Home</a></li>\n`;
  for (let i = 0; i < trail.length; i++) {
    const item = trail[i];
    const isLast = i === trail.length - 1;
    if (isLast) {
      html += `  <li class="current" aria-current="page">${escapeHtml(item.title)}</li>\n`;
    } else if (item.path) {
      const href = basePath + item.path.replace(/\.md$/, '.html');
      html += `  <li><a href="${href}">${escapeHtml(item.title)}</a></li>\n`;
    } else {
      html += `  <li>${escapeHtml(item.title)}</li>\n`;
    }
  }
  html += '</ol>\n</nav>\n';
  return html;
}

function findBreadcrumbTrail(nav, targetPath, trail = []) {
  for (const item of nav) {
    if (item.path === targetPath) {
      return [...trail, item];
    }
    if (item.children && item.children.length > 0) {
      const found = findBreadcrumbTrail(item.children, targetPath, [...trail, item]);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Build a "table of contents" (right sidebar) from extracted headings.
 */
function buildTableOfContents(headings) {
  if (!headings || headings.length === 0) return '';

  let html = '<nav class="toc" aria-label="On this page">\n';
  html += '<h3 class="toc-title">On this page</h3>\n';
  html += '<ul class="toc-list">\n';

  for (const heading of headings) {
    const indent = heading.level - 2; // h2 = 0, h3 = 1, h4 = 2
    html += `<li class="toc-item toc-level-${indent}"><a href="#${heading.slug}">${escapeHtml(heading.text)}</a></li>\n`;
  }

  html += '</ul>\n</nav>\n';
  return html;
}

/**
 * Build Open Graph and SEO meta tags from frontmatter.
 */
function buildMetaTags(pageData, config) {
  const tags = [];
  const description = pageData.description || '';
  const title = pageData.title || config.title;

  if (description) {
    tags.push(`<meta name="description" content="${escapeHtml(description)}">`);
    tags.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
  }

  tags.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
  tags.push(`<meta property="og:type" content="article">`);

  if (config.url) {
    const pagePath = pageData.path ? pageData.path.replace(/\.md$/, '.html') : '';
    const canonical = config.url.replace(/\/$/, '') + '/' + pagePath;
    tags.push(`<link rel="canonical" href="${canonical}">`);
    tags.push(`<meta property="og:url" content="${canonical}">`);
  }

  if (config.title) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(config.title)}">`);
  }

  if (pageData.frontmatter && pageData.frontmatter.image) {
    tags.push(`<meta property="og:image" content="${escapeHtml(pageData.frontmatter.image)}">`);
  }

  return tags.join('\n');
}

/**
 * Calculate the relative base path from a given page to the root.
 * e.g., "chapter1/section1.md" -> "../"
 */
function getBasePath(pagePath) {
  const depth = pagePath.split('/').length - 1;
  if (depth === 0) return './';
  return '../'.repeat(depth);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  renderPage,
  buildSidebar,
  buildPrevNext,
  buildBreadcrumbs,
  buildTableOfContents,
  buildMetaTags,
  getBasePath,
  escapeHtml,
};
