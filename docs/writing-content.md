# Writing Content

Gitzbook uses standard Markdown with a few extras.

## Basic Markdown

All standard Markdown syntax works: headings, bold, italic, links, images, lists, blockquotes, and code blocks.

## Code Blocks

Fenced code blocks with language hints get syntax highlighting via highlight.js:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

```python
def greet(name):
    return f"Hello, {name}!"
```

## Links Between Pages

Link to other pages using relative paths:

```markdown
See the [Getting Started](getting-started.md) guide.
```

These are automatically converted to `.html` links in the output.

## Images

Place images in the `docs/` directory (or a subdirectory) and reference them with relative paths:

```markdown
![Architecture diagram](images/architecture.png)
```

## Tables

Standard Markdown tables are supported:

| Feature | Status |
|---------|--------|
| Markdown parsing | Done |
| Syntax highlighting | Done |
| Search | Done |
| Plugins | Done |

## Blockquotes

> Blockquotes are styled with a blue left border, suitable for callouts and notes.

## HTML

You can embed raw HTML in your Markdown files when you need more control:

```html
<div class="custom-alert">
  This is a custom alert box.
</div>
```
