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
      title: 'Website',
      body: 'The full generated site. Check layout, responsiveness and content.',
    },
    {
      href: 'signature/',
      title: 'Email signature',
      body: 'All three variants with copy-to-clipboard buttons, ready to paste into Gmail.',
    },
    {
      href: 'cv.pdf',
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
<title>Preview — ${escapeHtml(name)}</title>
<style>
  :root {
    --bg: #ffffff;
    --text: #1a1a1a;
    --text-secondary: #666666;
    --border: #e5e5e5;
    --accent: #2563eb;
    --surface: #f9fafb;
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--font-sans);
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 2rem 1.25rem 3rem;
  }
  main { max-width: 34rem; margin: 0 auto; }
  .badge {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
    margin-bottom: 1rem;
  }
  h1 { font-size: 1.5rem; line-height: 1.3; margin-bottom: 0.4rem; }
  .context { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 2rem; }
  .context code { font-family: var(--font-mono); font-size: 0.8125rem; }
  ul { list-style: none; display: grid; gap: 0.75rem; }
  a.card {
    display: block;
    padding: 1.1rem 1.25rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  a.card:hover, a.card:focus-visible {
    border-color: var(--accent);
    transform: translateY(-1px);
    outline: none;
  }
  .card-title {
    display: block;
    font-weight: 600;
    font-size: 1.0625rem;
    color: var(--accent);
    margin-bottom: 0.2rem;
  }
  .card-title::after { content: " \\2192"; }
  .card-body {
    display: block;
    color: var(--text-secondary);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  footer {
    margin-top: 2.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
    color: var(--text-secondary);
    font-size: 0.8125rem;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #111111;
      --text: #f2f2f2;
      --text-secondary: #9b9b9b;
      --border: #2a2a2a;
      --accent: #7ea6ff;
      --surface: #1a1a1a;
    }
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
