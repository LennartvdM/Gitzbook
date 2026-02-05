const fs = require('fs');
const path = require('path');

/**
 * Simple plugin/hook system for Gitzbook.
 *
 * Plugins are JS files that export a function receiving the Gitzbook API.
 * They can register hooks to modify behavior at various points.
 *
 * Hook points:
 *   'config'       - receives config object, can modify before build starts
 *   'beforeBuild'  - called before build starts, receives { config, docsDir, outputDir }
 *   'markdown'     - receives the markdown-it instance, can add plugins/rules
 *   'page'         - receives { title, content, path, frontmatter }, can modify page HTML
 *   'summary'      - receives the nav tree, can modify navigation
 *   'template'     - receives template data before rendering, can add variables
 *   'assets'       - receives the output dir, can copy extra assets
 *   'head'         - receives an array, push strings to add to <head>
 *   'body:start'   - receives an array, push strings to add after <body>
 *   'body:end'     - receives an array, push strings to add before </body>
 *   'afterBuild'   - called after build completes, receives { config, outputDir, pages }
 *
 * Example plugin (plugins/my-plugin.js):
 *
 *   module.exports = function(gitzbook) {
 *     gitzbook.hook('config', (config) => {
 *       config.customOption = true;
 *       return config;
 *     });
 *
 *     gitzbook.hook('beforeBuild', ({ config, docsDir }) => {
 *       console.log('Building from', docsDir);
 *     });
 *
 *     gitzbook.hook('markdown', (md) => {
 *       md.use(require('markdown-it-emoji'));
 *     });
 *
 *     gitzbook.hook('page', (page) => {
 *       page.content = page.content.replace(/TODO/g, '<span class="todo">TODO</span>');
 *       return page;
 *     });
 *
 *     gitzbook.hook('afterBuild', ({ outputDir, pages }) => {
 *       console.log(`Built ${pages.length} pages to ${outputDir}`);
 *     });
 *   };
 */
class PluginManager {
  constructor() {
    this.hooks = {};
    this.commands = {};
  }

  /**
   * Register a hook handler.
   */
  hook(name, fn) {
    if (!this.hooks[name]) {
      this.hooks[name] = [];
    }
    this.hooks[name].push(fn);
  }

  /**
   * Register a custom CLI command from a plugin.
   */
  command(name, description, handler) {
    this.commands[name] = { description, handler };
  }

  /**
   * Run all handlers for a hook, passing data through each.
   * Returns the (possibly modified) data.
   */
  run(name, data) {
    const handlers = this.hooks[name] || [];
    let result = data;
    for (const fn of handlers) {
      const returned = fn(result);
      if (returned !== undefined) {
        result = returned;
      }
    }
    return result;
  }

  /**
   * Run a custom plugin CLI command.
   */
  runCommand(name, args) {
    const cmd = this.commands[name];
    if (cmd) {
      cmd.handler(args);
      return true;
    }
    return false;
  }

  /**
   * Get all registered plugin commands for help display.
   */
  getCommands() {
    return this.commands;
  }

  /**
   * Load plugins from a directory or from config.
   */
  loadPlugins(pluginsDir, config) {
    // Load from plugins directory
    if (pluginsDir && fs.existsSync(pluginsDir)) {
      const files = fs.readdirSync(pluginsDir).filter((f) => f.endsWith('.js'));
      for (const file of files) {
        const pluginPath = path.resolve(pluginsDir, file);
        this._loadPlugin(pluginPath);
      }
    }

    // Load from config
    if (config && config.plugins) {
      for (const pluginEntry of config.plugins) {
        const pluginName =
          typeof pluginEntry === 'string' ? pluginEntry : pluginEntry.name;
        // Try to resolve as a local path or node_modules
        let pluginPath;
        try {
          pluginPath = require.resolve(pluginName);
        } catch {
          pluginPath = path.resolve(pluginName);
        }
        this._loadPlugin(pluginPath);
      }
    }
  }

  _loadPlugin(pluginPath) {
    try {
      const plugin = require(pluginPath);
      if (typeof plugin === 'function') {
        plugin(this);
      } else if (typeof plugin.default === 'function') {
        plugin.default(this);
      }
    } catch (err) {
      console.error(`Failed to load plugin: ${pluginPath}`);
      console.error(err.message);
    }
  }
}

module.exports = { PluginManager };
