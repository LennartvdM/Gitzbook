// Gitzbook client-side search with FlexSearch
(function () {
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var searchIndex = null;
  var flexIndex = null;
  var rawData = null;

  // Determine base path from current page
  function getBasePath() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src && src.indexOf('assets/search.js') !== -1) {
        return src.replace('assets/search.js', '');
      }
    }
    return './';
  }

  var basePath = getBasePath();

  // Load search index and build FlexSearch index
  function loadIndex() {
    if (flexIndex) return Promise.resolve(flexIndex);

    return fetch(basePath + 'assets/search-index.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        rawData = data;

        // Check if FlexSearch is available (loaded from CDN or bundled)
        // Fall back to built-in search if not
        if (typeof FlexSearch !== 'undefined') {
          flexIndex = new FlexSearch.Document({
            document: {
              id: 'id',
              index: ['title', 'body'],
              store: ['title', 'path', 'body'],
            },
            tokenize: 'forward',
            resolution: 9,
          });

          for (var i = 0; i < data.length; i++) {
            flexIndex.add({
              id: i,
              title: data[i].title,
              path: data[i].path,
              body: data[i].body,
            });
          }
        } else {
          // Fallback: use built-in search
          searchIndex = data;
        }

        return data;
      })
      .catch(function () {
        console.warn('Could not load search index.');
        return [];
      });
  }

  function search(query) {
    if (!query.trim()) return [];

    // Use FlexSearch if available
    if (flexIndex) {
      return searchFlexSearch(query);
    }

    // Fallback: basic term matching
    return searchBasic(query);
  }

  function searchFlexSearch(query) {
    var results = flexIndex.search(query, { limit: 10, enrich: true });
    var seen = {};
    var merged = [];

    for (var field = 0; field < results.length; field++) {
      var fieldResults = results[field].result;
      for (var i = 0; i < fieldResults.length; i++) {
        var doc = fieldResults[i].doc;
        var id = fieldResults[i].id;
        if (!seen[id]) {
          seen[id] = true;
          merged.push({
            page: { title: doc.title, path: doc.path, body: doc.body },
            score: results[field].field === 'title' ? 10 : 1,
          });
        }
      }
    }

    // Sort by score (title matches first)
    merged.sort(function (a, b) { return b.score - a.score; });
    return merged.slice(0, 10);
  }

  function searchBasic(query) {
    if (!searchIndex) return [];

    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    var results = [];

    for (var i = 0; i < searchIndex.length; i++) {
      var page = searchIndex[i];
      var titleLower = page.title.toLowerCase();
      var bodyLower = page.body.toLowerCase();

      var score = 0;
      var matched = true;

      for (var t = 0; t < terms.length; t++) {
        var term = terms[t];
        var titleIdx = titleLower.indexOf(term);
        var bodyIdx = bodyLower.indexOf(term);

        if (titleIdx === -1 && bodyIdx === -1) {
          matched = false;
          break;
        }

        if (titleIdx !== -1) score += 10;
        if (bodyIdx !== -1) score += 1;
      }

      if (matched && score > 0) {
        results.push({ page: page, score: score });
      }
    }

    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, 10);
  }

  function getSnippet(body, query) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    var lower = body.toLowerCase();
    var idx = -1;

    for (var t = 0; t < terms.length; t++) {
      idx = lower.indexOf(terms[t]);
      if (idx !== -1) break;
    }

    if (idx === -1) return body.substring(0, 120) + '...';

    var start = Math.max(0, idx - 50);
    var end = Math.min(body.length, idx + 80);
    var snippet = (start > 0 ? '...' : '') + body.substring(start, end) + (end < body.length ? '...' : '');

    // Highlight matching terms
    for (var t = 0; t < terms.length; t++) {
      var re = new RegExp('(' + terms[t].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      snippet = snippet.replace(re, '<mark>$1</mark>');
    }

    return snippet;
  }

  function renderResults(results, query) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-result"><span class="search-result-title">No results found</span></div>';
      searchResults.style.display = 'block';
      return;
    }

    var html = '';
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var href = basePath + r.page.path;
      var snippet = getSnippet(r.page.body, query);
      html += '<a class="search-result" href="' + href + '">';
      html += '<div class="search-result-title">' + escapeHtml(r.page.title) + '</div>';
      html += '<div class="search-result-snippet">' + snippet + '</div>';
      html += '</a>';
    }

    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  if (!searchInput || !searchResults) return;

  // Load FlexSearch from CDN
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/nicholasgasior/flexsearch@0.7.41/dist/flexsearch.bundle.min.js';
  script.async = true;
  script.onload = function () {
    // Pre-load the index if search input exists
    loadIndex();
  };
  script.onerror = function () {
    // FlexSearch unavailable, fall back to basic search
    console.warn('FlexSearch CDN unavailable, using basic search.');
    loadIndex();
  };
  document.head.appendChild(script);

  // Load index on first focus as fallback
  searchInput.addEventListener('focus', function () {
    loadIndex();
  });

  // Search on input
  var debounceTimer;
  searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    var query = searchInput.value;

    if (!query.trim()) {
      searchResults.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(function () {
      loadIndex().then(function () {
        var results = search(query);
        renderResults(results, query);
      });
    }, 150);
  });

  // Close results on click outside
  document.addEventListener('click', function (e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    // Focus search on '/' or Ctrl+K
    if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }

    // Close on Escape
    if (e.key === 'Escape') {
      searchResults.style.display = 'none';
      searchInput.blur();
    }
  });
})();
