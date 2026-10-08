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

/* Brand tokens — the DESIGN.md *day* ramp, because a signature lands on a white
   message body. The rules are warm on white for the same reason the PDF's are:
   both are day-theme surfaces printed on white rather than on the site's cream. */
const COLOR_TEXT = '#1E2232'; //          --text-0  (day)  15.79:1 on white
const COLOR_TEXT_SECONDARY = '#575D79'; // --text-2  (day)   6.47:1 on white
const COLOR_ACCENT = '#175FA8'; //         --accent  (day)   6.48:1 on white
const COLOR_SEPARATOR = '#BFB49A'; //      --border-1 (day)  non-text rule
const COLOR_BORDER = '#D8CEB8'; //         --border-0 (day)  non-text rule

/* Mono, because on the website Mono owns exactly this kind of content — the
   display name and every piece of metadata — while Sans owns running prose,
   of which a signature has none.

   IBM Plex Mono is named first but cannot be *delivered*: mail clients strip
   <style> blocks, so @font-face is impossible and the face only appears for
   recipients who happen to have it installed locally. The fallbacks therefore
   carry the real weight, and they are all monospace: the typographic character
   survives even when the exact face does not. */
const FONT_MONO =
  "'IBM Plex Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

// Avatar served by the personal website (Gmail needs a publicly hosted image)
const AVATAR_URL = 'https://cristianabrante.com/picture.jpg';
const AVATAR_SIZE = 64;

/* The copy page is a normal web page rather than pasted email markup, so unlike
   the signature itself it is built from the system — DESIGN.md's night theme,
   Panel geometry and Control states. Each signature still sits on a white
   .paper card, because that is the surface it has to survive on. */
const PAGE = {
  surface0: '#13151E',
  surface1: '#191C28',
  surface2: '#1F2331',
  surface3: '#272C3D',
  text0: '#E9E4D7',
  text1: '#A3A8BD',
  text2: '#9199AE',
  border0: '#2B3144',
  border1: '#3C435B',
  accent: '#63B3F0',
  accentHover: '#90CCFF',
  cyan: '#6FC6D9',
  rose: '#DE93A8',
  shadow: '#080A11',
  bevel: 'rgba(233, 228, 215, 0.055)',
};

const FONT_FILES = [
  'ibm-plex-mono-latin-400-normal.woff2',
  'ibm-plex-mono-latin-500-normal.woff2',
  'ibm-plex-mono-latin-600-normal.woff2',
  'ibm-plex-sans-latin-400-normal.woff2',
];
const TEMPLATE_DIR = path.join(__dirname, '..', 'website', 'template');
const FONT_SOURCE_DIR = path.join(TEMPLATE_DIR, 'fonts');

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
    `<tr><td style="font-family:${FONT_MONO};font-size:16px;font-weight:700;color:${COLOR_TEXT};line-height:22px;white-space:nowrap;">${escapeHtml(data.name)}</td></tr>`,
    `<tr><td style="font-family:${FONT_MONO};font-size:13px;color:${COLOR_TEXT_SECONDARY};line-height:20px;">${escapeHtml(data.label)}</td></tr>`,
    includeSummaryLine ? spacerRow(10) : '',
    includeSummaryLine
      ? `<tr><td style="font-family:${FONT_MONO};font-size:13px;color:${COLOR_TEXT_SECONDARY};line-height:20px;">${contactParts.join(separator())}</td></tr>`
      : '',
    spacerRow(2),
    `<tr><td style="font-family:${FONT_MONO};font-size:13px;color:${COLOR_TEXT_SECONDARY};line-height:20px;">${linkParts.join(separator())}</td></tr>`,
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
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${FONT_MONO};">`,
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
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${FONT_MONO};">`,
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
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${FONT_MONO};">`,
    `<tbody>`,
    `<tr><td style="font-family:${FONT_MONO};font-size:14px;color:${COLOR_TEXT};line-height:20px;">`,
    `<span style="font-weight:700;">${escapeHtml(data.name)}</span>`,
    `<span style="color:${COLOR_TEXT_SECONDARY};"> — ${escapeHtml(data.label)}</span>`,
    `</td></tr>`,
    `<tr><td style="font-family:${FONT_MONO};font-size:13px;color:${COLOR_TEXT_SECONDARY};line-height:20px;">`,
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
        <div class="paper" id="${variant.id}">${variant.html}</div>
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
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<title>${escapeHtml(data.name)} — email signature templates</title>
<style>
  /* Tokens and geometry per DESIGN.md. Fonts are copied in beside this file so
     the page works opened straight from signature/output/, not just from the
     preview bundle. */
  @font-face { font-family: 'IBM Plex Mono'; src: url('fonts/ibm-plex-mono-latin-400-normal.woff2') format('woff2'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'IBM Plex Mono'; src: url('fonts/ibm-plex-mono-latin-500-normal.woff2') format('woff2'); font-weight: 500; font-display: swap; }
  @font-face { font-family: 'IBM Plex Mono'; src: url('fonts/ibm-plex-mono-latin-600-normal.woff2') format('woff2'); font-weight: 600; font-display: swap; }
  @font-face { font-family: 'IBM Plex Sans'; src: url('fonts/ibm-plex-sans-latin-400-normal.woff2') format('woff2'); font-weight: 400; font-display: swap; }

  :root {
    color-scheme: dark;
    --surface-0: ${PAGE.surface0};
    --surface-1: ${PAGE.surface1};
    --surface-2: ${PAGE.surface2};
    --surface-3: ${PAGE.surface3};
    --text-0: ${PAGE.text0};
    --text-1: ${PAGE.text1};
    --text-2: ${PAGE.text2};
    --border-0: ${PAGE.border0};
    --border-1: ${PAGE.border1};
    --accent: ${PAGE.accent};
    --accent-hover: ${PAGE.accentHover};
    --cyan: ${PAGE.cyan};
    --rose: ${PAGE.rose};
    --shadow: ${PAGE.shadow};
    --bevel: ${PAGE.bevel};
    --mono: 'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    --sans: 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --raised: inset 1px 1px 0 var(--bevel), 3px 3px 0 var(--shadow);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 3.5rem 1.5rem 5rem;
    font-family: var(--sans);
    font-size: 1rem;
    color: var(--text-1);
    background: var(--surface-0);
    line-height: 1.7;
  }
  main { max-width: 820px; margin: 0 auto; }

  .eyebrow {
    display: block;
    font-family: var(--mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-2);
    margin-bottom: 0.6rem;
  }
  h1 {
    font-family: var(--mono);
    font-size: clamp(1.5rem, 3.2vw, 1.875rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--text-0);
    margin: 0 0 0.6rem;
  }
  .lede { margin: 0 0 2.5rem; max-width: 65ch; }
  code { font-family: var(--mono); font-size: 0.875em; color: var(--text-0); }

  .steps {
    background: var(--surface-2);
    border: 1px solid var(--border-0);
    box-shadow: var(--raised);
    padding: 1.4rem 1.5rem 1.4rem 2.75rem;
    margin: 0 0 2.5rem;
    font-size: 0.9375rem;
  }
  .steps li + li { margin-top: 0.4rem; }
  .steps li::marker { font-family: var(--mono); color: var(--accent); }
  .steps strong { color: var(--text-0); font-weight: 500; }

  .card {
    background: var(--surface-2);
    border: 1px solid var(--border-0);
    box-shadow: var(--raised);
    margin-bottom: 1.75rem;
  }
  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.125rem 1.5rem;
    border-bottom: 1px solid var(--border-0);
  }
  .card-header h2 { font-family: var(--mono); font-size: 1.0625rem; font-weight: 500; color: var(--text-0); margin: 0; }
  .card-note { margin: 0.2rem 0 0; font-size: 0.8125rem; color: var(--text-2); }

  /* Control: the lift/press ladder from DESIGN.md §5. */
  .copy {
    flex: none;
    font-family: var(--mono);
    font-size: 0.8125rem;
    min-height: 40px;
    color: var(--accent);
    background: var(--surface-3);
    border: 1px solid var(--border-1);
    border-radius: 0;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
    box-shadow: var(--raised);
    transition: transform 140ms var(--ease, ease-out), box-shadow 140ms ease-out, color 140ms ease-out;
  }
  .copy:hover { color: var(--accent-hover); transform: translate(-2px, -2px); box-shadow: inset 1px 1px 0 var(--bevel), 5px 5px 0 var(--shadow); }
  .copy:active { transform: translate(1px, 1px); box-shadow: inset 1px 1px 0 var(--bevel), 1px 1px 0 var(--shadow); }
  .copy:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  /* Transient states tint the label only, so the button keeps its width and the
     header row never reflows mid-interaction. */
  .copy[data-state='done'] { color: var(--cyan); }
  .copy[data-state='error'] { color: var(--rose); }

  /* The signature is designed against a white message body, so it is judged on
     white here even though the page around it is in the night theme. */
  .paper {
    margin: 1.5rem;
    padding: 1.75rem 1.5rem;
    background: #ffffff;
    border: 1px solid var(--border-1);
    box-shadow: 3px 3px 0 var(--shadow);
  }

  details { border-top: 1px solid var(--border-0); }
  summary {
    cursor: pointer;
    padding: 0.8rem 1.5rem;
    font-family: var(--mono);
    font-size: 0.8125rem;
    color: var(--text-2);
  }
  summary:hover { color: var(--accent); }
  summary:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  pre {
    margin: 0;
    padding: 0 1.5rem 1.5rem;
    overflow-x: auto;
    font-family: var(--mono);
    font-size: 0.75rem;
    line-height: 1.7;
    color: var(--text-2);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .footnote {
    color: var(--text-2);
    font-size: 0.8125rem;
    margin-top: 2.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border-0);
    max-width: 65ch;
  }
  @media (prefers-reduced-motion: reduce) {
    .copy { transition: none; }
    .copy:hover, .copy:active { transform: none; }
  }
</style>
</head>
<body>
<main>
  <span class="eyebrow">generated from resume.json</span>
  <h1>Email signature templates</h1>
  <p class="lede">Pick a variant, copy it, and paste it into Gmail. Each one is shown on white because that is the surface it has to survive on — the page around it is dark, the signature is not.</p>

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

  const fontDir = path.join(OUTPUT_DIR, 'fonts');
  fs.mkdirSync(fontDir, { recursive: true });
  for (const file of FONT_FILES) {
    const source = path.join(FONT_SOURCE_DIR, file);
    if (!fs.existsSync(source)) {
      console.error(`Missing font: ${path.relative(process.cwd(), source)}`);
      process.exit(1);
    }
    fs.copyFileSync(source, path.join(fontDir, file));
  }

  fs.copyFileSync(path.join(TEMPLATE_DIR, 'favicon.svg'), path.join(OUTPUT_DIR, 'favicon.svg'));

  console.log('Email signatures generated in signature/output/');
  variants.forEach(variant => console.log(`  - ${variant.file} (${variant.title})`));
  console.log('  - signature.txt (plain-text fallback)');
  console.log('  - index.html (preview + copy buttons)');
  console.log(`  - fonts/ (${FONT_FILES.length} woff2 for the preview page)`);
}

main();
