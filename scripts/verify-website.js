#!/usr/bin/env node

/**
 * Structural verification for the generated website.
 *
 * The website is generated from resume.json by scripts/generate-website.js.
 * This script asserts that the generation actually produced a coherent page:
 * every website-visible field survived into the HTML, every referenced local
 * asset exists, no template placeholder was left unreplaced, and no asset path
 * is root-absolute (which would break when served from a subfolder, e.g. a PR
 * preview).
 *
 * Hard failures (exit 1): missing resume field, missing/root-absolute asset,
 * unreplaced placeholder, invalid JSON-LD, dangling in-page anchor.
 *
 * Usage: node scripts/verify-website.js [--dir website/output]
 * Requires: website/output to exist (run "npm run generate:website" first)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RESUME_PATH = path.join(ROOT, 'resume.json');
const DEFAULT_DIR = path.join(ROOT, 'website', 'output');

function parseArgs() {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf('--dir');
  return {
    outputDir: dirIndex !== -1 ? path.resolve(args[dirIndex + 1]) : DEFAULT_DIR,
  };
}

function visibleFor(items, target = 'website') {
  if (!Array.isArray(items)) return [];
  return items.filter(
    item => Array.isArray(item.visibility) && item.visibility.includes(target)
  );
}

/** Collapse whitespace and lowercase so matching ignores template indentation. */
function normalize(text) {
  return text.replace(/\s+/g, ' ').toLowerCase();
}

/** Extract every src="..." / href="..." value from the markup. */
function extractRefs(html) {
  const refs = [];
  const pattern = /(?:src|href)="([^"]*)"/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

function isExternalRef(ref) {
  return (
    ref === '' ||
    ref.startsWith('http://') ||
    ref.startsWith('https://') ||
    ref.startsWith('mailto:') ||
    ref.startsWith('tel:') ||
    ref.startsWith('data:') ||
    ref.startsWith('//')
  );
}

function main() {
  const { outputDir } = parseArgs();
  const htmlPath = path.join(outputDir, 'index.html');

  console.log(`🔎 Website verification: ${path.relative(ROOT, htmlPath)}\n`);

  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ Not found: ${htmlPath}. Run "npm run generate:website" first.`);
    process.exit(2);
  }

  const resume = JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');
  const html = normalize(rawHtml);

  const failures = [];
  const checks = [];

  const check = (group, label, passed) => {
    checks.push({ group, label, passed });
    if (!passed) failures.push(`${group}: "${label}" missing from generated HTML`);
  };
  const contains = needle => html.includes(normalize(String(needle)));

  // --- Unreplaced template placeholders --------------------------------------
  const leftover = [...new Set(rawHtml.match(/\{\{[A-Z_]+\}\}/g) || [])];
  for (const placeholder of leftover) {
    failures.push(`Template: placeholder ${placeholder} was never replaced`);
  }

  // --- Basics ----------------------------------------------------------------
  const { basics } = resume;
  check('Basics', basics.name, contains(basics.name));
  check('Basics', basics.label, contains(basics.label));
  check('Basics', basics.email, contains(basics.email));
  check('Basics', 'summary', contains(basics.summary));
  if (basics.location) {
    check('Basics', basics.location.city, contains(basics.location.city));
  }
  for (const profile of basics.profiles || []) {
    check('Profiles', profile.network, contains(profile.network));
    check('Profiles', profile.url, contains(profile.url));
  }

  // --- Work experience -------------------------------------------------------
  // cv/cv.typ omits highlights, so this is the only gate protecting them.
  for (const job of visibleFor(resume.work)) {
    check('Work', job.position, contains(job.position));
    check('Work', job.name, contains(job.name));
    if (job.summary) check('Work', `${job.name} / summary`, contains(job.summary));
    (job.highlights || []).forEach((highlight, index) => {
      check('Work', `${job.name} / highlight ${index + 1}`, contains(highlight));
    });
    for (const tech of job.technologies || []) {
      check('Work', `${job.name} / ${tech}`, contains(tech));
    }
  }

  // --- Education -------------------------------------------------------------
  for (const edu of visibleFor(resume.education)) {
    check('Education', edu.institution, contains(edu.institution));
    check('Education', edu.studyType, contains(edu.studyType));
    if (edu.area) check('Education', edu.area, contains(edu.area));
    if (edu.summary) check('Education', `${edu.institution} / summary`, contains(edu.summary));
    (edu.highlights || []).forEach((highlight, index) => {
      check('Education', `${edu.institution} / highlight ${index + 1}`, contains(highlight));
    });
    for (const keyword of edu.keywords || []) {
      check('Education', `${edu.institution} / ${keyword}`, contains(keyword));
    }
  }

  // --- Skills ----------------------------------------------------------------
  for (const skill of visibleFor(resume.skills)) {
    check('Skills', skill.name, contains(skill.name));
    for (const keyword of skill.keywords || []) {
      check('Skills', `${skill.name} / ${keyword}`, contains(keyword));
    }
  }

  // --- Awards ----------------------------------------------------------------
  for (const award of visibleFor(resume.awards)) {
    check('Awards', award.title, contains(award.title));
    if (award.awarder) check('Awards', award.awarder, contains(award.awarder));
  }

  // --- Local assets resolve, and none are root-absolute ----------------------
  const refs = [...new Set(extractRefs(rawHtml))];
  for (const ref of refs) {
    if (isExternalRef(ref) || ref.startsWith('#')) continue;

    if (ref.startsWith('/')) {
      failures.push(
        `Assets: "${ref}" is root-absolute — breaks when served from a subfolder (use a relative path)`
      );
      checks.push({ group: 'Assets', label: ref, passed: false });
      continue;
    }

    const assetPath = path.join(outputDir, ref.split(/[?#]/)[0]);
    const exists = fs.existsSync(assetPath);
    checks.push({ group: 'Assets', label: ref, passed: exists });
    if (!exists) {
      failures.push(`Assets: "${ref}" is referenced but not present in ${path.relative(ROOT, outputDir)}`);
    }
  }

  // --- In-page anchors have targets ------------------------------------------
  const anchors = [...new Set(refs.filter(ref => ref.startsWith('#') && ref.length > 1))];
  for (const anchor of anchors) {
    const id = anchor.slice(1);
    const hasTarget = new RegExp(`id="${id}"`).test(rawHtml);
    check('Anchors', anchor, hasTarget);
  }

  // --- JSON-LD is parseable --------------------------------------------------
  const ldMatch = rawHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ldMatch) {
    failures.push('SEO: JSON-LD structured data block not found');
  } else {
    try {
      JSON.parse(ldMatch[1]);
      checks.push({ group: 'SEO', label: 'JSON-LD parseable', passed: true });
    } catch (error) {
      failures.push(`SEO: JSON-LD is not valid JSON — ${error.message}`);
      checks.push({ group: 'SEO', label: 'JSON-LD parseable', passed: false });
    }
  }

  // --- Report ----------------------------------------------------------------
  const passed = checks.filter(c => c.passed).length;
  console.log(`Checks: ${passed}/${checks.length} passed`);
  for (const failure of failures) console.log(`  ❌ ${failure}`);

  if (failures.length > 0) {
    console.log(`\n❌ Website verification failed (${failures.length} issue(s))`);
    process.exit(1);
  }
  console.log('\n✅ Website verification passed');
}

main();
