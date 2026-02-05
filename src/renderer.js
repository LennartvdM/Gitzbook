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
  getBasePath,
  escapeHtml,
};
