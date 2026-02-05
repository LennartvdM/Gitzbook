const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const chokidar = require('chokidar');
const { build, loadConfig } = require('./build');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
};

function serve(rootDir, options = {}) {
  const port = options.port || 4000;
  const liveReloadPort = options.liveReloadPort || 35729;
  const watchEnabled = options.watch !== false;

  // Initial build
  console.log('Building site...\n');
  build(rootDir, {
    liveReload: watchEnabled,
    liveReloadPort,
    verbose: options.verbose,
  }).then((result) => {
    const outputDir = result.outputDir;

    // Static file server
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);

      // Default to index.html
      if (urlPath === '/') {
        urlPath = '/index.html';
      }

      // Try to serve the file, or add .html extension
      let filePath = path.join(outputDir, urlPath);
      if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        filePath = filePath + '.html';
      }
      if (!fs.existsSync(filePath)) {
        // Try index.html inside directory
        const indexPath = path.join(outputDir, urlPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          filePath = indexPath;
        }
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        // Serve custom 404 page
        const custom404 = path.join(outputDir, '404.html');
        if (fs.existsSync(custom404)) {
          const content = fs.readFileSync(custom404);
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        }
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });

    server.listen(port, () => {
      console.log(`\nServing at http://localhost:${port}`);
      console.log(`Live reload WebSocket on port ${liveReloadPort}`);
      console.log('Press Ctrl+C to stop.\n');
    });

    // WebSocket for live reload
    let wss = null;
    if (watchEnabled) {
      wss = new WebSocketServer({ port: liveReloadPort });

      const config = loadConfig(rootDir);
      const docsDir = path.resolve(rootDir, config.docsDir);
      const pluginsDir = path.resolve(rootDir, config.pluginsDir);

      // Watch docs and plugins for changes
      const watchPaths = [docsDir];
      if (fs.existsSync(pluginsDir)) {
        watchPaths.push(pluginsDir);
      }

      // Also watch themes directory if it exists
      const themesDir = path.resolve(rootDir, 'themes');
      if (fs.existsSync(themesDir)) {
        watchPaths.push(themesDir);
      }

      let rebuildTimeout = null;
      const watcher = chokidar.watch(watchPaths, {
        ignoreInitial: true,
        ignored: /(^|[\/\\])\../,
      });

      watcher.on('all', (event, changedPath) => {
        // Debounce rebuilds
        clearTimeout(rebuildTimeout);
        rebuildTimeout = setTimeout(() => {
          console.log(`\nFile changed: ${path.relative(rootDir, changedPath)}`);
          console.log('Rebuilding...\n');

          build(rootDir, {
            liveReload: true,
            liveReloadPort,
            verbose: options.verbose,
          }).then(() => {
            // Notify all connected clients to reload
            if (wss) {
              wss.clients.forEach((client) => {
                if (client.readyState === 1) {
                  client.send('reload');
                }
              });
            }
          }).catch((err) => {
            console.error('Build failed:', err.message);
          });
        }, 300);
      });

      console.log(`Watching for changes in ${path.relative(rootDir, docsDir)}...`);
    }

    return server;
  }).catch((err) => {
    console.error('Initial build failed:', err.message);
    process.exit(1);
  });
}

module.exports = { serve };
