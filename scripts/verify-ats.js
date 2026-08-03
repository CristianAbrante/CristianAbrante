#!/usr/bin/env node

/**
 * ATS verification for the generated CV PDF.
 *
 * Simulates what an Applicant Tracking System does: extracts the text layer
 * from cv/output/cv.pdf (via poppler's pdftotext) and verifies that every
 * pdf-visible field from resume.json survives extraction.
 *
 * Hard failures (exit 1): missing contact info, positions, companies,
 * institutions, skills, section headers, or corrupted extraction.
 * Warnings: ligature/private-use-area glyphs that may confuse ATS parsers.
 *
 * Usage: node scripts/verify-ats.js [--pdf cv/output/cv.pdf]
 * Requires: pdftotext (macOS: `brew install poppler`, Ubuntu: `apt-get install poppler-utils`)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const RESUME_PATH = path.join(ROOT, 'resume.json');
const OUTPUT_DIR = path.join(ROOT, 'cv', 'output');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Section headers rendered by cv/cv.typ — an ATS relies on recognizing these.
const EXPECTED_SECTIONS = ['Profile', 'Work Experience', 'Education', 'Awards', 'Skills'];

function parseArgs() {
  const args = process.argv.slice(2);
  const pdfIndex = args.indexOf('--pdf');
  return {
    pdfPath: pdfIndex !== -1 ? args[pdfIndex + 1] : path.join(OUTPUT_DIR, 'cv.pdf'),
  };
}

function extractText(pdfPath) {
  try {
    return execFileSync('pdftotext', ['-enc', 'UTF-8', '-layout', pdfPath, '-'], {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ pdftotext not found. Install poppler:');
      console.error('   macOS:  brew install poppler');
      console.error('   Ubuntu: sudo apt-get install -y poppler-utils');
      process.exit(2);
    }
    console.error(`❌ Failed to extract text from ${pdfPath}:`, error.message);
    process.exit(2);
  }
}

function visibleFor(items, target = 'pdf') {
  if (!Array.isArray(items)) return [];
  return items.filter(
    item => Array.isArray(item.visibility) && item.visibility.includes(target)
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Normalize extracted text for robust matching:
 * - undo end-of-line hyphenation ("plat-\nform" -> "platform")
 * - strip private-use-area glyphs (Font Awesome icons)
 * - collapse all whitespace to single spaces
 */
function normalize(text) {
  return text
    .replace(/-\s*\n\s*/g, '')
    .replace(/[\uE000-\uF8FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function main() {
  const { pdfPath } = parseArgs();
  console.log(`🔎 ATS verification: ${pdfPath}\n`);

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF not found: ${pdfPath}. Run "npm run generate:pdf" first.`);
    process.exit(2);
  }

  const resume = JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));
  const rawText = extractText(pdfPath);
  const text = normalize(rawText);
  const digitsOnly = rawText.replace(/\D/g, '');

  const failures = [];
  const warnings = [];
  const checks = [];

  const check = (group, label, passed) => {
    checks.push({ group, label, passed });
    if (!passed) failures.push(`${group}: "${label}" not found in extracted text`);
  };

  const contains = needle => text.includes(normalize(needle));

  // --- Extraction sanity -----------------------------------------------------
  if (rawText.trim().length < 200) {
    failures.push('Extraction: text layer is empty or near-empty (image-only PDF?)');
  }
  if (rawText.includes('\uFFFD')) {
    failures.push('Extraction: replacement characters (U+FFFD) found — broken glyph-to-unicode mapping');
  }

  // --- Contact info ----------------------------------------------------------
  const { basics } = resume;
  check('Contact', basics.name, contains(basics.name));
  check('Contact', basics.email, contains(basics.email));
  check('Contact', `phone ${basics.phone}`, digitsOnly.includes(basics.phone.replace(/\D/g, '')));

  // --- Section headers -------------------------------------------------------
  for (const section of EXPECTED_SECTIONS) {
    check('Sections', section, contains(section));
  }

  // --- Work experience -------------------------------------------------------
  for (const job of visibleFor(resume.work)) {
    check('Work', job.position, contains(job.position));
    check('Work', job.name, contains(job.name));
    check('Work', formatDate(job.startDate), contains(formatDate(job.startDate)));
    for (const tech of job.technologies || []) {
      check('Work', tech, contains(tech));
    }
  }

  // --- Education -------------------------------------------------------------
  for (const edu of visibleFor(resume.education)) {
    check('Education', edu.institution, contains(edu.institution));
    check('Education', `${edu.studyType} in ${edu.area}`, contains(`${edu.studyType} in ${edu.area}`));
  }

  // --- Awards ----------------------------------------------------------------
  for (const award of visibleFor(resume.awards)) {
    check('Awards', award.title, contains(award.title));
  }

  // --- Skills & languages ----------------------------------------------------
  for (const skill of visibleFor(resume.skills)) {
    for (const keyword of skill.keywords || []) {
      check('Skills', keyword, contains(keyword));
    }
  }
  for (const lang of visibleFor(resume.languages)) {
    check('Languages', lang.language, contains(lang.language));
  }

  // --- Warnings (non-blocking) ----------------------------------------------
  const ligatures = rawText.match(/[\uFB00-\uFB06]/g);
  if (ligatures) {
    warnings.push(`${ligatures.length} ligature glyph(s) (fi/fl/ffi) in text layer — may break keyword search in some ATS`);
  }
  const puaChars = rawText.match(/[\uE000-\uF8FF]/g);
  if (puaChars) {
    warnings.push(`${puaChars.length} icon glyph(s) (private-use-area, Font Awesome) in text layer — ignored by most parsers but adds noise`);
  }

  // --- Report ----------------------------------------------------------------
  const passed = checks.filter(c => c.passed).length;
  const score = checks.length > 0 ? passed / checks.length : 0;
  const report = {
    pdf: path.relative(ROOT, pdfPath),
    score: Math.round(score * 1000) / 1000,
    checksPassed: passed,
    checksTotal: checks.length,
    failures,
    warnings,
    checks,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ats-report.json'), JSON.stringify(report, null, 2));

  const md = [
    `**Score: ${passed}/${checks.length} checks passed (${(score * 100).toFixed(1)}%)**`,
    '',
    ...(failures.length > 0
      ? ['### ❌ Failures', '', ...failures.map(f => `- ${f}`), '']
      : ['✅ All resume.json pdf-visible fields survive ATS text extraction.', '']),
    ...(warnings.length > 0 ? ['### ⚠️ Warnings', '', ...warnings.map(w => `- ${w}`), ''] : []),
  ].join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ats-report.md'), md);

  console.log(`Score: ${passed}/${checks.length} (${(score * 100).toFixed(1)}%)`);
  for (const failure of failures) console.log(`  ❌ ${failure}`);
  for (const warning of warnings) console.log(`  ⚠️  ${warning}`);
  console.log(`\n📍 Report: cv/output/ats-report.json`);

  if (failures.length > 0) {
    console.log('\n❌ ATS verification failed');
    process.exit(1);
  }
  console.log('\n✅ ATS verification passed');
}

main();
