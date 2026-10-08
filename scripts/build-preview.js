#!/usr/bin/env node

/**
 * Assembles the per-PR preview bundle served by Cloudflare Pages.
 *
 * website/output/ and signature/output/ both contain an index.html, so they are
 * nested under distinct subfolders and a small landing page links to all three
 * deliverables. Every HTML file in the bundle gets a noindex robots meta tag:
 * Cloudflare already sends `X-Robots-Tag: noindex` on preview deployments, this
 * is a second line of defence so draft resume content stays out of search
 * results regardless of where the bundle is served from.
 *
 *   preview/
 *     index.html      landing page (this script)
 *     website/        <- website/output/
 *     signature/      <- signature/output/
 *     cv.pdf          <- cv/output/cv-cristian-abrante.pdf
 *
 * Usage: node scripts/build-preview.js [--pr 48] [--sha abc1234] [--out preview]
 * Requires: npm run generate:website && generate:signature && generate:pdf
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RESUME_PATH = path.join(ROOT, 'resume.json');
const WEBSITE_DIR = path.join(ROOT, 'website', 'output');
const SIGNATURE_DIR = path.join(ROOT, 'signature', 'output');
const CV_PDF = path.join(ROOT, 'cv', 'output', 'cv-cristian-abrante.pdf');

const ROBOTS_META = '<meta name="robots" content="noindex, nofollow">';

function parseArgs() {
  const args = process.argv.slice(2);
  const value = (flag, fallback) => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
  };
  return {
    pr: value('--pr', process.env.PR_NUMBER || ''),
    sha: value('--sha', process.env.GITHUB_SHA || '').slice(0, 7),
    outDir: path.resolve(ROOT, value('--out', 'preview')),
  };
}

/** Force noindex on an HTML file, replacing any existing robots directive. */
function applyNoindex(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  let patched;

  if (/<meta\s+name="robots"[^>]*>/i.test(html)) {
    patched = html.replace(/<meta\s+name="robots"[^>]*>/i, ROBOTS_META);
  } else if (/<head[^>]*>/i.test(html)) {
    patched = html.replace(/(<head[^>]*>)/i, `$1\n${ROBOTS_META}`);
  } else {
    // No <head> to anchor to (bare fragment) — leave it alone rather than
    // producing invalid markup; the X-Robots-Tag header still covers it.
    return false;
  }

  fs.writeFileSync(filePath, patched);
  return true;
}

function walkHtml(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walkHtml(full));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLanding({ name, pr, sha, builtAt }) {
  const context = [
    pr ? `Pull request #${escapeHtml(pr)}` : 'Local build',
    sha ? `commit <code>${escapeHtml(sha)}</code>` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const cards = [
    {
      href: 'website/',
      index: '01',
      title: 'Website',
      body: 'The full generated site. Check layout, responsiveness and content.',
    },
    {
      href: 'signature/',
      index: '02',
      title: 'Email signature',
      body: 'All three variants with copy-to-clipboard buttons, ready to paste into Gmail.',
    },
    {
      href: 'cv.pdf',
      index: '03',
      title: 'CV (PDF)',
      body: 'Opens inline in the browser. Compiled with Typst from resume.json.',
    },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${ROBOTS_META}
<link rel="icon" href="website/favicon.svg" type="image/svg+xml">
<title>Preview — ${escapeHtml(name)}</title>
<style>
  /* Tokens and geometry per DESIGN.md (night theme). Fonts are borrowed from
     website/ rather than duplicated: the bundle always contains that folder,
     because main() exits non-zero when the website build output is missing. */
  @font-face { font-family: 'IBM Plex Mono'; src: url('website/fonts/ibm-plex-mono-latin-400-normal.woff2') format('woff2'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'IBM Plex Mono'; src: url('website/fonts/ibm-plex-mono-latin-500-normal.woff2') format('woff2'); font-weight: 500; font-display: swap; }
  @font-face { font-family: 'IBM Plex Mono'; src: url('website/fonts/ibm-plex-mono-latin-600-normal.woff2') format('woff2'); font-weight: 600; font-display: swap; }
  @font-face { font-family: 'IBM Plex Sans'; src: url('website/fonts/ibm-plex-sans-latin-400-normal.woff2') format('woff2'); font-weight: 400; font-display: swap; }

  :root {
    color-scheme: dark;
    --surface-0: #13151e;
    --surface-2: #1f2331;
    --surface-3: #272c3d;
    --text-0: #e9e4d7;
    --text-1: #a3a8bd;
    --text-2: #9199ae;
    --border-0: #2b3144;
    --border-1: #3c435b;
    --accent: #63b3f0;
    --accent-hover: #90ccff;
    --cyan: #6fc6d9;
    --shadow: #080a11;
    --bevel: rgba(233, 228, 215, 0.055);
    --glow: rgba(99, 179, 240, 0.2);
    --font-sans: 'IBM Plex Sans', system-ui, -apple-system, "Segoe UI", sans-serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --raised: inset 1px 1px 0 var(--bevel), 3px 3px 0 var(--shadow);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--font-sans);
    background: var(--surface-0);
    color: var(--text-1);
    line-height: 1.7;
    padding: 3rem 1.25rem 4rem;
    /* The one light source, same idea as the site's hero. */
    background-image: radial-gradient(60% 40% at 78% 0%, var(--glow), transparent 70%);
    background-repeat: no-repeat;
  }
  main { max-width: 36rem; margin: 0 auto; }
  .badge {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--surface-3);
    border: 1px solid var(--border-1);
    padding: 0.2rem 0.6rem;
    margin-bottom: 1.1rem;
    box-shadow: var(--raised);
  }
  h1 {
    font-family: var(--font-mono);
    font-size: clamp(1.5rem, 3.2vw, 1.875rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: var(--text-0);
    margin-bottom: 0.4rem;
  }
  .context { color: var(--text-2); font-size: 0.875rem; margin-bottom: 2.25rem; font-family: var(--font-mono); }
  .context code { font-size: 0.8125rem; color: var(--text-1); }
  ul { list-style: none; display: grid; gap: 0.85rem; }
  a.card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.2rem 0.85rem;
    padding: 1.15rem 1.3rem;
    background: var(--surface-2);
    border: 1px solid var(--border-0);
    text-decoration: none;
    color: inherit;
    box-shadow: var(--raised);
    transition: transform 140ms ease-out, box-shadow 140ms ease-out, border-color 140ms ease-out;
  }
  a.card:hover, a.card:focus-visible {
    border-color: var(--border-1);
    transform: translate(-2px, -2px);
    box-shadow: inset 1px 1px 0 var(--bevel), 5px 5px 0 var(--shadow);
    outline: none;
  }
  a.card:active { transform: translate(1px, 1px); box-shadow: inset 1px 1px 0 var(--bevel), 1px 1px 0 var(--shadow); }
  a.card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .card-index {
    grid-row: span 2;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    color: var(--text-2);
    padding-top: 0.3rem;
  }
  .card-title {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 1.0625rem;
    color: var(--accent);
  }
  .card-title::after { content: " \\2197"; }
  a.card:hover .card-title { color: var(--accent-hover); }
  .card-body {
    color: var(--text-2);
    font-size: 0.875rem;
    line-height: 1.6;
  }
  footer {
    margin-top: 2.75rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border-0);
    color: var(--text-2);
    font-size: 0.8125rem;
  }
  footer code { font-family: var(--font-mono); color: var(--text-1); }
  @media (prefers-reduced-motion: reduce) {
    a.card { transition: none; }
    a.card:hover, a.card:focus-visible, a.card:active { transform: none; }
  }
</style>
</head>
<body>
<main>
  <span class="badge">Preview build</span>
  <h1>${escapeHtml(name)}</h1>
  <p class="context">${context}</p>
  <ul>
${cards
  .map(
    card => `    <li><a class="card" href="${card.href}">
      <span class="card-index">${card.index}</span>
      <span class="card-title">${card.title}</span>
      <span class="card-body">${card.body}</span>
    </a></li>`
  )
  .join('\n')}
  </ul>
  <footer>
    Generated from <code>resume.json</code> at ${escapeHtml(builtAt)}.
    Not indexed by search engines. This is a preview, not production.
  </footer>
</main>
</body>
</html>
`;
}

function main() {
  const { pr, sha, outDir } = parseArgs();

  const missing = [
    [WEBSITE_DIR, 'npm run generate:website'],
    [SIGNATURE_DIR, 'npm run generate:signature'],
    [CV_PDF, 'npm run generate:pdf'],
  ].filter(([target]) => !fs.existsSync(target));

  if (missing.length > 0) {
    console.error('❌ Cannot assemble preview — missing build output:');
    for (const [target, command] of missing) {
      console.error(`   ${path.relative(ROOT, target)}  → run "${command}"`);
    }
    process.exit(2);
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  fs.cpSync(WEBSITE_DIR, path.join(outDir, 'website'), { recursive: true });
  fs.cpSync(SIGNATURE_DIR, path.join(outDir, 'signature'), { recursive: true });
  fs.copyFileSync(CV_PDF, path.join(outDir, 'cv.pdf'));

  const resume = JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));
  const builtAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  fs.writeFileSync(
    path.join(outDir, 'index.html'),
    renderLanding({ name: resume.basics.name, pr, sha, builtAt })
  );

  // The production robots.txt lands under website/, which crawlers never check.
  fs.writeFileSync(
    path.join(outDir, 'robots.txt'),
    'User-agent: *\nDisallow: /\n'
  );

  const htmlFiles = walkHtml(outDir);
  let patched = 0;
  for (const file of htmlFiles) {
    if (applyNoindex(file)) patched += 1;
  }

  const relOut = path.relative(ROOT, outDir);
  console.log('✅ Preview bundle assembled');
  console.log(`📁 Output: ${relOut}/`);
  console.log(`   ${relOut}/index.html  (landing page)`);
  console.log(`   ${relOut}/website/    (generated site)`);
  console.log(`   ${relOut}/signature/  (email signatures)`);
  console.log(`   ${relOut}/cv.pdf      (compiled CV)`);
  console.log(`🔒 noindex applied to ${patched}/${htmlFiles.length} HTML file(s)`);
}

main();
