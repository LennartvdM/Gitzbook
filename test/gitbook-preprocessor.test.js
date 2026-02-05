const assert = require('assert');
const {
  preprocessGitBook,
  processHints,
  processTabs,
  processCodeBlocks,
  processContentRefs,
  processEmbeds,
  processFiles,
} = require('../src/gitbook-preprocessor');

// ─── Test helpers ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assertContains(actual, expected, msg) {
  if (!actual.includes(expected)) {
    throw new Error(
      `${msg || 'Expected string to contain'}:\n` +
      `  expected to contain: ${JSON.stringify(expected)}\n` +
      `  actual: ${JSON.stringify(actual)}`
    );
  }
}

function assertNotContains(actual, unexpected, msg) {
  if (actual.includes(unexpected)) {
    throw new Error(
      `${msg || 'Expected string NOT to contain'}:\n` +
      `  unexpected: ${JSON.stringify(unexpected)}\n` +
      `  actual: ${JSON.stringify(actual)}`
    );
  }
}

// ─── Hint / Admonition tests ────────────────────────────────────────────────

console.log('\nHint / Admonition processing:');

test('converts info hint to admonition blockquote', () => {
  const input = `{% hint style="info" %}
This is an info message.
{% endhint %}`;
  const result = processHints(input);
  assertContains(result, '> [!INFO]');
  assertContains(result, 'This is an info message.');
  assertNotContains(result, '{% hint');
  assertNotContains(result, '{% endhint');
});

test('converts warning hint to admonition blockquote', () => {
  const input = `{% hint style="warning" %}
Be careful with this.
{% endhint %}`;
  const result = processHints(input);
  assertContains(result, '> [!WARNING]');
  assertContains(result, 'Be careful with this.');
});

test('converts danger hint to admonition blockquote', () => {
  const input = `{% hint style="danger" %}
This is dangerous!
{% endhint %}`;
  const result = processHints(input);
  assertContains(result, '> [!DANGER]');
});

test('converts success hint to tip admonition', () => {
  const input = `{% hint style="success" %}
Great job!
{% endhint %}`;
  const result = processHints(input);
  assertContains(result, '> [!TIP]');
});

test('handles multi-line hints', () => {
  const input = `{% hint style="info" %}
Line one.

Line two.

Line three.
{% endhint %}`;
  const result = processHints(input);
  assertContains(result, '> [!INFO] Line one.');
  assertContains(result, '> Line three.');
});

test('handles single-quoted style attribute', () => {
  const input = `{% hint style='warning' %}
Single quoted.
{% endhint %}`;
  const result = processHints(input);
  assertContains(result, '> [!WARNING]');
});

test('handles multiple hints in same document', () => {
  const input = `Some text.

{% hint style="info" %}
First hint.
{% endhint %}

More text.

{% hint style="danger" %}
Second hint.
{% endhint %}`;
  const result = processHints(input);
  assertContains(result, '> [!INFO] First hint.');
  assertContains(result, '> [!DANGER] Second hint.');
  assertContains(result, 'Some text.');
  assertContains(result, 'More text.');
});

// ─── Tab tests ──────────────────────────────────────────────────────────────

console.log('\nTab processing:');

test('converts tabs to HTML tab structure', () => {
  const input = `{% tabs %}
{% tab title="JavaScript" %}
Some JS content.
{% endtab %}
{% tab title="Python" %}
Some Python content.
{% endtab %}
{% endtabs %}`;
  const result = processTabs(input);
  assertContains(result, 'class="code-tabs"');
  assertContains(result, 'class="code-tab-buttons"');
  assertContains(result, 'JavaScript');
  assertContains(result, 'Python');
  assertContains(result, 'Some JS content.');
  assertContains(result, 'Some Python content.');
});

test('first tab is active by default', () => {
  const input = `{% tabs %}
{% tab title="First" %}
First content.
{% endtab %}
{% tab title="Second" %}
Second content.
{% endtab %}
{% endtabs %}`;
  const result = processTabs(input);
  // The first button should have active class
  const buttons = result.match(/<button[^>]*>/g);
  assert.ok(buttons[0].includes('active'), 'First button should be active');
  assert.ok(!buttons[1].includes('active'), 'Second button should not be active');
});

test('handles tabs with code blocks inside', () => {
  const input = `{% tabs %}
{% tab title="JS" %}
\`\`\`javascript
console.log('hello');
\`\`\`
{% endtab %}
{% tab title="Python" %}
\`\`\`python
print('hello')
\`\`\`
{% endtab %}
{% endtabs %}`;
  const result = processTabs(input);
  assertContains(result, 'class="code-tabs"');
  assertContains(result, "console.log('hello');");
  assertContains(result, "print('hello')");
});

test('handles multiple tab groups in one document', () => {
  const input = `{% tabs %}
{% tab title="A" %}
Content A.
{% endtab %}
{% endtabs %}

Some text between.

{% tabs %}
{% tab title="B" %}
Content B.
{% endtab %}
{% endtabs %}`;
  const result = processTabs(input);
  assertContains(result, 'Content A.');
  assertContains(result, 'Content B.');
  assertContains(result, 'Some text between.');
  // Should have two different tab groups
  const groups = result.match(/data-group="[^"]+"/g);
  assert.ok(groups.length >= 2, 'Should have at least 2 tab groups');
  assert.notStrictEqual(groups[0], groups[1], 'Tab groups should have different IDs');
});

// ─── Code block tests ───────────────────────────────────────────────────────

console.log('\nCode block processing:');

test('adds title wrapper to code blocks', () => {
  const input = `{% code title="app.js" %}
\`\`\`javascript
const x = 1;
\`\`\`
{% endcode %}`;
  const result = processCodeBlocks(input);
  assertContains(result, 'class="code-block-titled"');
  assertContains(result, 'class="code-block-title"');
  assertContains(result, 'app.js');
  assertContains(result, 'const x = 1;');
});

test('passes through code blocks without title or lineNumbers', () => {
  const input = `{% code %}
\`\`\`javascript
const x = 1;
\`\`\`
{% endcode %}`;
  const result = processCodeBlocks(input);
  assertNotContains(result, 'code-block-titled');
  assertContains(result, 'const x = 1;');
});

test('handles code block with lineNumbers attribute', () => {
  const input = `{% code lineNumbers="true" %}
\`\`\`javascript
const x = 1;
\`\`\`
{% endcode %}`;
  const result = processCodeBlocks(input);
  // lineNumbers doesn't add a title but still wraps (for future line number support)
  assertContains(result, 'const x = 1;');
});

test('handles code block with title and lineNumbers', () => {
  const input = `{% code title="example.ts" lineNumbers="true" %}
\`\`\`typescript
const x: number = 1;
\`\`\`
{% endcode %}`;
  const result = processCodeBlocks(input);
  assertContains(result, 'example.ts');
  assertContains(result, 'const x: number = 1;');
});

// ─── Content-ref tests ──────────────────────────────────────────────────────

console.log('\nContent-ref processing:');

test('wraps content-ref with inner link in a styled div', () => {
  const input = `{% content-ref url="getting-started.md" %}
[Getting Started](getting-started.md)
{% endcontent-ref %}`;
  const result = processContentRefs(input);
  assertContains(result, 'class="content-ref"');
  assertContains(result, '[Getting Started](getting-started.md)');
  assertNotContains(result, '{% content-ref');
});

test('generates a fallback link when body is empty', () => {
  const input = `{% content-ref url="advanced-config.md" %}
{% endcontent-ref %}`;
  const result = processContentRefs(input);
  assertContains(result, 'class="content-ref"');
  assertContains(result, 'Advanced Config');
  assertContains(result, 'advanced-config.md');
});

test('handles content-ref with subdirectory path', () => {
  const input = `{% content-ref url="guides/setup.md" %}
[Setup Guide](guides/setup.md)
{% endcontent-ref %}`;
  const result = processContentRefs(input);
  assertContains(result, 'class="content-ref"');
  assertContains(result, '[Setup Guide](guides/setup.md)');
});

// ─── Embed tests ────────────────────────────────────────────────────────────

console.log('\nEmbed processing:');

test('converts YouTube URL to iframe', () => {
  const input = `{% embed url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" %}`;
  const result = processEmbeds(input);
  assertContains(result, 'class="embed-container"');
  assertContains(result, '<iframe');
  assertContains(result, 'youtube.com/embed/dQw4w9WgXcQ');
  assertNotContains(result, '{% embed');
});

test('converts YouTube short URL to iframe', () => {
  const input = `{% embed url="https://youtu.be/dQw4w9WgXcQ" %}`;
  const result = processEmbeds(input);
  assertContains(result, 'youtube.com/embed/dQw4w9WgXcQ');
});

test('converts Vimeo URL to iframe', () => {
  const input = `{% embed url="https://vimeo.com/123456789" %}`;
  const result = processEmbeds(input);
  assertContains(result, 'player.vimeo.com/video/123456789');
});

test('converts CodePen URL to iframe', () => {
  const input = `{% embed url="https://codepen.io/user/pen/abcdef" %}`;
  const result = processEmbeds(input);
  assertContains(result, 'codepen.io/user/embed/abcdef');
});

test('converts CodeSandbox URL to iframe', () => {
  const input = `{% embed url="https://codesandbox.io/s/my-project-abc123" %}`;
  const result = processEmbeds(input);
  assertContains(result, 'codesandbox.io/embed/my-project-abc123');
});

test('falls back to link for unknown embed URL', () => {
  const input = `{% embed url="https://example.com/something" %}`;
  const result = processEmbeds(input);
  assertContains(result, 'class="embed-link"');
  assertContains(result, 'href="https://example.com/something"');
  assertNotContains(result, '<iframe');
});

// ─── File download tests ────────────────────────────────────────────────────

console.log('\nFile download processing:');

test('converts file tag to download link', () => {
  const input = `{% file src="assets/report.pdf" %}`;
  const result = processFiles(input);
  assertContains(result, 'class="file-download"');
  assertContains(result, 'href="assets/report.pdf"');
  assertContains(result, 'download');
  assertContains(result, 'report.pdf');
});

test('uses caption as link text', () => {
  const input = `{% file src="assets/data.csv" caption="Download the data" %}`;
  const result = processFiles(input);
  assertContains(result, 'Download the data');
  assertContains(result, 'href="assets/data.csv"');
});

test('handles file with .gitbook/assets path', () => {
  const input = `{% file src=".gitbook/assets/image.png" caption="Screenshot" %}`;
  const result = processFiles(input);
  assertContains(result, 'href=".gitbook/assets/image.png"');
  assertContains(result, 'Screenshot');
});

// ─── Full pipeline tests ────────────────────────────────────────────────────

console.log('\nFull preprocessGitBook pipeline:');

test('processes a document with mixed GitBook syntax', () => {
  const input = `# Getting Started

{% hint style="info" %}
This guide assumes you have Node.js installed.
{% endhint %}

## Installation

{% tabs %}
{% tab title="npm" %}
\`\`\`bash
npm install gitzbook
\`\`\`
{% endtab %}
{% tab title="yarn" %}
\`\`\`bash
yarn add gitzbook
\`\`\`
{% endtab %}
{% endtabs %}

{% embed url="https://www.youtube.com/watch?v=abc123" %}

{% content-ref url="advanced.md" %}
[Advanced Usage](advanced.md)
{% endcontent-ref %}

{% file src="examples/starter.zip" caption="Download starter template" %}
`;

  const result = preprocessGitBook(input);

  // Headings preserved
  assertContains(result, '# Getting Started');
  assertContains(result, '## Installation');

  // Hint converted
  assertContains(result, '> [!INFO]');
  assertNotContains(result, '{% hint');

  // Tabs converted
  assertContains(result, 'class="code-tabs"');
  assertNotContains(result, '{% tabs');
  assertNotContains(result, '{% tab');

  // Embed converted
  assertContains(result, 'youtube.com/embed/abc123');
  assertNotContains(result, '{% embed');

  // Content-ref converted
  assertContains(result, 'class="content-ref"');
  assertNotContains(result, '{% content-ref');

  // File converted
  assertContains(result, 'class="file-download"');
  assertNotContains(result, '{% file');
});

test('passes through content with no GitBook syntax unchanged', () => {
  const input = `# Hello World

This is regular markdown.

- Item 1
- Item 2

\`\`\`javascript
const x = 1;
\`\`\`
`;
  const result = preprocessGitBook(input);
  assert.strictEqual(result, input, 'Content without GitBook syntax should pass through unchanged');
});

test('handles empty content', () => {
  const result = preprocessGitBook('');
  assert.strictEqual(result, '');
});

test('handles content with only whitespace', () => {
  const result = preprocessGitBook('   \n\n   ');
  assert.strictEqual(result, '   \n\n   ');
});

// ─── Edge case tests ────────────────────────────────────────────────────────

console.log('\nEdge cases:');

test('handles hint with no content', () => {
  const input = `{% hint style="info" %}
{% endhint %}`;
  const result = processHints(input);
  assertContains(result, '[!INFO]');
  assertNotContains(result, '{% hint');
});

test('handles tab with empty content', () => {
  const input = `{% tabs %}
{% tab title="Empty" %}
{% endtab %}
{% endtabs %}`;
  const result = processTabs(input);
  assertContains(result, 'Empty');
});

test('escapes HTML in tab titles', () => {
  const input = `{% tabs %}
{% tab title="<script>alert('xss')</script>" %}
Content.
{% endtab %}
{% endtabs %}`;
  const result = processTabs(input);
  assertNotContains(result, "<script>alert('xss')</script>");
  assertContains(result, '&lt;script&gt;');
});

test('escapes HTML in embed URLs', () => {
  const input = `{% embed url="https://example.com/page?a=1&b=2" %}`;
  const result = processEmbeds(input);
  assertContains(result, '&amp;');
});

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`\n  ${f.name}:`);
    console.log(`    ${f.error.message}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
