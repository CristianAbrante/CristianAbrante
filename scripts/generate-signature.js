#!/usr/bin/env node

/**
 * Generate email signature templates from resume.json
 *
 * Produces Gmail-safe HTML signatures (table layout, fully inline styles, no
 * <style> blocks, no external assets except an optional hosted avatar) plus a
 * plain-text fallback, and a preview page with copy-to-clipboard buttons.
 */

const fs = require('fs');
const path = require('path');

// File paths
const RESUME_PATH = path.join(__dirname, '..', 'resume.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'signature', 'output');

// Brand tokens — mirrored from website/template/style.css
const COLOR_TEXT = '#1a1a1a';
const COLOR_TEXT_SECONDARY = '#666666';
const COLOR_ACCENT = '#2563eb';
const COLOR_SEPARATOR = '#cbd5e1';
const COLOR_BORDER = '#e5e5e5';
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Avatar served by the personal website (Gmail needs a publicly hosted image)
const AVATAR_URL = 'https://cristianabrante.com/picture.jpg';
const AVATAR_SIZE = 64;

/**
 * Load and parse the resume JSON file
 */
function loadResume() {
  try {
    return JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));
  } catch (error) {
    console.error('Error reading resume.json:', error.message);
    process.exit(1);
  }
}

/**
 * Escape text for safe interpolation into HTML
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Strip the scheme and trailing slash so URLs read as labels (cristianabrante.com)
 */
function urlLabel(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Collapse the resume location object into "City, Region"
 */
function formatLocation(location = {}) {
  return [location.city, location.region].filter(Boolean).join(', ');
}

/**
 * Flatten resume.json into the fields a signature needs
 */
function extractSignatureData(resume) {
  const { basics } = resume;
  const profiles = basics.profiles || [];

  return {
    name: basics.name,
    label: basics.label,
    email: basics.email,
    website: basics.url,
    location: formatLocation(basics.location),
    links: [
      { label: urlLabel(basics.url), url: basics.url },
      ...profiles.map(profile => ({ label: profile.network, url: profile.url })),
    ],
  };
}

/**
 * Inline anchor with an explicit color — Gmail drops inherited link styling
 */
function link(href, text, color, { bold = false } = {}) {
  const weight = bold ? 'font-weight:600;' : '';
  return `<a href="${escapeHtml(href)}" style="color:${color};${weight}text-decoration:none;">${escapeHtml(text)}</a>`;
}

/**
 * Middle-dot separator between inline items
 */
function separator() {
  return `<span style="color:${COLOR_SEPARATOR};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`;
}

/**
 * Empty row used for vertical rhythm (margins are unreliable in email clients)
 */
function spacerRow(height) {
  return `<tr><td style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</td></tr>`;
}

/**
 * Nested table holding the signature text lines
 */
function detailsTable(data, { includeSummaryLine = true } = {}) {
  const contactParts = [link(`mailto:${data.email}`, data.email, COLOR_ACCENT)];
  if (data.location) {
    contactParts.push(`<span style="color:${COLOR_TEXT_SECONDARY};">${escapeHtml(data.location)}</span>`);
  }

  const linkParts = data.links.map(item => link(item.url, item.label, COLOR_ACCENT));

  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">`,
    `<tbody>`,
    `<tr><td style="font-family:${FONT_STACK};font-size:16px;font-weight:700;color:${COLOR_TEXT};line-height:22px;white-space:nowrap;">${escapeHtml(data.name)}</td></tr>`,
    `<tr><td style="font-family:${FONT_STACK};font-size:13px;color:${COLOR_TEXT_SECONDARY};line-height:20px;">${escapeHtml(data.label)}</td></tr>`,
    includeSummaryLine ? spacerRow(10) : '',
    includeSummaryLine
      ? `<tr><td style="font-family:${FONT_STACK};font-size:13px;color:${COLOR_TEXT_SECONDARY};line-height:20px;">${contactParts.join(separator())}</td></tr>`
      : '',
    spacerRow(2),
    `<tr><td style="font-family:${FONT_STACK};font-size:13px;color:${COLOR_TEXT_SECONDARY};line-height:20px;">${linkParts.join(separator())}</td></tr>`,
    `</tbody>`,
    `</table>`,
  ]
    .filter(Boolean)
    .join('');
}

/**
 * Variant 1 — accent bar on the left, no images (safest default)
 */
function buildStandardSignature(data) {
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${FONT_STACK};">`,
    `<tbody>`,
    `<tr>`,
    `<td width="3" style="width:3px;background-color:${COLOR_ACCENT};line-height:1px;font-size:1px;">&nbsp;</td>`,
    `<td width="14" style="width:14px;line-height:1px;font-size:1px;">&nbsp;</td>`,
    `<td style="vertical-align:top;">${detailsTable(data)}</td>`,
    `</tr>`,
    `</tbody>`,
    `</table>`,
  ].join('');
}

/**
 * Variant 2 — avatar on the left, divider, then the same detail block
 */
function buildPhotoSignature(data) {
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${FONT_STACK};">`,
    `<tbody>`,
    `<tr>`,
    `<td width="${AVATAR_SIZE}" style="width:${AVATAR_SIZE}px;vertical-align:top;">`,
    `<img src="${AVATAR_URL}" alt="${escapeHtml(data.name)}" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" style="display:block;width:${AVATAR_SIZE}px;height:${AVATAR_SIZE}px;border-radius:50%;border:0;outline:none;text-decoration:none;" />`,
    `</td>`,
    `<td width="16" style="width:16px;line-height:1px;font-size:1px;">&nbsp;</td>`,
    `<td width="1" style="width:1px;background-color:${COLOR_BORDER};line-height:1px;font-size:1px;">&nbsp;</td>`,
    `<td width="16" style="width:16px;line-height:1px;font-size:1px;">&nbsp;</td>`,
    `<td style="vertical-align:top;">${detailsTable(data)}</td>`,
    `</tr>`,
    `</tbody>`,
    `</table>`,
  ].join('');
}

/**
 * Variant 3 — two compact lines, for threads and replies
 */
function buildMinimalSignature(data) {
  const linkParts = data.links.map(item => link(item.url, item.label, COLOR_ACCENT));

  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${FONT_STACK};">`,
    `<tbody>`,
    `<tr><td style="font-family:${FONT_STACK};font-size:14px;color:${COLOR_TEXT};line-height:20px;">`,
    `<span style="font-weight:700;">${escapeHtml(data.name)}</span>`,
    `<span style="color:${COLOR_TEXT_SECONDARY};"> — ${escapeHtml(data.label)}</span>`,
    `</td></tr>`,
    `<tr><td style="font-family:${FONT_STACK};font-size:13px;color:${COLOR_TEXT_SECONDARY};line-height:20px;">`,
    [link(`mailto:${data.email}`, data.email, COLOR_ACCENT), ...linkParts].join(separator()),
    `</td></tr>`,
    `</tbody>`,
    `</table>`,
  ].join('');
}

/**
 * Plain-text fallback for clients that strip HTML
 */
function buildPlainTextSignature(data) {
  const lines = ['--', data.name, data.label, '', data.email];

  if (data.location) {
    lines.push(data.location);
  }

  lines.push('', ...data.links.map(item => `${item.label}: ${item.url}`));

  return `${lines.join('\n')}\n`;
}

/**
 * Standalone HTML document wrapping a single signature snippet
 */
function wrapSnippet(data, title, html) {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    `<title>${escapeHtml(data.name)} — ${escapeHtml(title)} email signature</title>`,
    '</head>',
    '<body>',
    html,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/**
 * Preview page: renders every variant with copy buttons and paste instructions
 */
function buildPreviewPage(data, variants) {
  const cards = variants
    .map(
      variant => `
      <section class="card">
        <header class="card-header">
          <div>
            <h2>${escapeHtml(variant.title)}</h2>
            <p class="card-note">${escapeHtml(variant.note)}</p>
          </div>
          <button type="button" class="copy" data-target="${variant.id}">Copy signature</button>
        </header>
        <div class="preview" id="${variant.id}">${variant.html}</div>
        <details>
          <summary>Show HTML source</summary>
          <pre><code>${escapeHtml(variant.html)}</code></pre>
        </details>
      </section>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(data.name)} — email signature templates</title>
<style>
  :root {
    --color-text: ${COLOR_TEXT};
    --color-text-secondary: ${COLOR_TEXT_SECONDARY};
    --color-border: ${COLOR_BORDER};
    --color-accent: ${COLOR_ACCENT};
    --color-surface: #f9fafb;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 3rem 1.5rem 5rem;
    font-family: ${FONT_STACK};
    color: var(--color-text);
    background: #ffffff;
    line-height: 1.6;
  }
  main { max-width: 760px; margin: 0 auto; }
  h1 { font-size: 1.75rem; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
  .lede { color: var(--color-text-secondary); margin: 0 0 2.5rem; }
  .steps {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1.25rem 1.5rem 1.25rem 2.5rem;
    margin: 0 0 2.5rem;
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
  }
  .steps li + li { margin-top: 0.35rem; }
  .steps code {
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 0.85em;
    background: #ffffff;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 0.1em 0.35em;
  }
  .card { border: 1px solid var(--color-border); border-radius: 10px; margin-bottom: 1.75rem; overflow: hidden; }
  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.125rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .card-header h2 { font-size: 1rem; margin: 0; }
  .card-note { margin: 0.15rem 0 0; font-size: 0.8125rem; color: var(--color-text-secondary); }
  .copy {
    flex: none;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    background: var(--color-accent);
    border: 0;
    border-radius: 6px;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
  }
  .copy:hover { background: #1d4ed8; }
  .copy[data-state='done'] { background: #15803d; }
  .copy[data-state='error'] { background: #b91c1c; }
  .preview { padding: 1.75rem 1.5rem; }
  details { border-top: 1px solid var(--color-border); }
  summary {
    cursor: pointer;
    padding: 0.75rem 1.5rem;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }
  pre {
    margin: 0;
    padding: 1rem 1.5rem 1.5rem;
    overflow-x: auto;
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 0.75rem;
    line-height: 1.6;
    background: var(--color-surface);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .footnote { color: var(--color-text-secondary); font-size: 0.8125rem; margin-top: 2.5rem; }
</style>
</head>
<body>
<main>
  <h1>Email signature templates</h1>
  <p class="lede">Generated from <code>resume.json</code>. Pick a variant, copy it, and paste it into Gmail.</p>

  <ol class="steps">
    <li>Click <strong>Copy signature</strong> on the variant you want.</li>
    <li>In Gmail, open <strong>Settings → See all settings → General → Signature</strong>.</li>
    <li>Create a signature, click into the editor, and paste with <code>Cmd/Ctrl + V</code>.</li>
    <li>Set it as the default for new emails and replies, then <strong>Save Changes</strong>.</li>
  </ol>

${cards}

  <p class="footnote">
    If the copy button is blocked by your browser, open <strong>Show HTML source</strong> and copy the markup,
    or select the rendered preview directly and copy that. All variants use table layout with inline styles only,
    which is what Gmail, Outlook, and Apple Mail preserve.
  </p>
</main>
<script>
  document.querySelectorAll('.copy').forEach(function (button) {
    button.addEventListener('click', async function () {
      const node = document.getElementById(button.dataset.target);
      if (!node) return;

      const html = node.innerHTML;
      const text = node.innerText;

      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([text], { type: 'text/plain' }),
            }),
          ]);
        } else {
          const range = document.createRange();
          range.selectNodeContents(node);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          if (!document.execCommand('copy')) throw new Error('execCommand copy rejected');
          selection.removeAllRanges();
        }
        setState(button, 'done', 'Copied');
      } catch (error) {
        console.error('Copy failed:', error);
        setState(button, 'error', 'Copy failed');
      }
    });
  });

  function setState(button, state, label) {
    const original = button.dataset.label || button.textContent;
    button.dataset.label = original;
    button.dataset.state = state;
    button.textContent = label;
    setTimeout(function () {
      button.removeAttribute('data-state');
      button.textContent = original;
    }, 2000);
  }
</script>
</body>
</html>
`;
}

function main() {
  const resume = loadResume();
  const data = extractSignatureData(resume);

  const variants = [
    {
      id: 'standard',
      file: 'signature-standard.html',
      title: 'Standard (recommended)',
      note: 'Accent bar, full contact details, no images — renders everywhere.',
      html: buildStandardSignature(data),
    },
    {
      id: 'photo',
      file: 'signature-photo.html',
      title: 'With photo',
      note: 'Same details plus your website avatar. Hidden when a client blocks images.',
      html: buildPhotoSignature(data),
    },
    {
      id: 'minimal',
      file: 'signature-minimal.html',
      title: 'Minimal',
      note: 'Two compact lines, no location — good for replies and internal threads.',
      html: buildMinimalSignature(data),
    },
  ];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  variants.forEach(variant => {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, variant.file),
      wrapSnippet(data, variant.title, variant.html),
      'utf8'
    );
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'signature.txt'), buildPlainTextSignature(data), 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), buildPreviewPage(data, variants), 'utf8');

  console.log('Email signatures generated in signature/output/');
  variants.forEach(variant => console.log(`  - ${variant.file} (${variant.title})`));
  console.log('  - signature.txt (plain-text fallback)');
  console.log('  - index.html (preview + copy buttons)');
}

main();
