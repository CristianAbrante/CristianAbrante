#!/usr/bin/env node

/**
 * ATS validator for the generated PDF CV.
 *
 * Extracts the text layer with `pdftotext` (poppler-utils) and asserts
 * that the standard section headings ATS parsers look for are present
 * and appear in the expected reading order.
 *
 * Exits 0 on success, 1 on failure. Wire into CI to catch layout
 * regressions that would confuse Workday/Taleo/iCIMS parsers.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PDF_PATH = path.join(__dirname, '..', 'cv', 'typst', 'cv.pdf');

const REQUIRED_SECTIONS = ['Experience', 'Education', 'Skills'];

function extractText(pdfPath) {
  const res = spawnSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });
  if (res.error && res.error.code === 'ENOENT') {
    console.error('❌ `pdftotext` not found. Install poppler:');
    console.error('   macOS:  brew install poppler');
    console.error('   Ubuntu: sudo apt-get install poppler-utils');
    process.exit(2);
  }
  if (res.status !== 0) {
    console.error('❌ pdftotext failed:', res.stderr);
    process.exit(2);
  }
  return res.stdout;
}

function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`❌ PDF not found: ${PDF_PATH}`);
    console.error('   Run `npm run generate:pdf` first.');
    process.exit(1);
  }

  const text = extractText(PDF_PATH);
  const failures = [];

  const resume = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'resume.json'), 'utf8'));
  const name = resume.basics.name;
  if (!text.includes(name)) failures.push(`Name "${name}" missing from text layer`);

  const positions = REQUIRED_SECTIONS.map(s => ({ s, i: text.indexOf(s) }));
  for (const { s, i } of positions) {
    if (i === -1) failures.push(`Missing section heading: "${s}"`);
  }
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const cur = positions[i];
    if (prev.i !== -1 && cur.i !== -1 && cur.i < prev.i) {
      failures.push(`Reading order wrong: "${cur.s}" appears before "${prev.s}"`);
    }
  }

  if (text.trim().length < 500) {
    failures.push(`Text layer suspiciously short (${text.trim().length} chars) — PDF may be image-based`);
  }

  if (failures.length) {
    console.error('❌ ATS validation FAILED:');
    for (const f of failures) console.error(`   - ${f}`);
    process.exit(1);
  }

  console.log('✅ ATS validation passed');
  console.log(`   PDF: ${path.relative(process.cwd(), PDF_PATH)}`);
  console.log(`   Text length: ${text.trim().length} chars`);
  console.log(`   Sections found: ${REQUIRED_SECTIONS.join(', ')}`);
}

if (require.main === module) main();
