#!/usr/bin/env node

/**
 * Generate a Typst CV from resume.json using the basic-resume package.
 *
 * Reads entries with visibility: ["pdf"] and produces cv/typst/cv.typ.
 * Compile with:  typst compile cv/typst/cv.typ cv/typst/cv.pdf
 *
 * The design intentionally mirrors the editorial single-column look
 * popularised by Jake Gutierrez's resume (see sunnypatel.net/resume):
 * serif Computer Modern, small-caps section headings, subtle accent.
 */

const fs = require('fs');
const path = require('path');

const RESUME_PATH = path.join(__dirname, '..', 'resume.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'cv', 'typst');
const OUTPUT_TYP = path.join(OUTPUT_DIR, 'cv.typ');

/** Escape a JS string so it can sit inside a Typst "..." string literal. */
function q(text) {
  if (text === undefined || text === null) return '""';
  return `"${String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Escape text destined for Typst content mode (bullets, paragraphs).
 * Only escapes markup characters that would otherwise be interpreted.
 */
function esc(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/@/g, '\\@')
    .replace(/\$/g, '\\$')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>');
}

function loadResume() {
  return JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));
}

function pdfOnly(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(i => Array.isArray(i.visibility) && i.visibility.includes('pdf'));
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${month} ${d.getFullYear()}`;
}

function findProfile(profiles, network) {
  return (profiles || []).find(p => p.network.toLowerCase() === network.toLowerCase());
}

function stripScheme(url) {
  return (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function header(resume) {
  const { basics } = resume;
  const location = [basics.location?.city, basics.location?.region]
    .filter(Boolean).join(', ');
  const github = findProfile(basics.profiles, 'GitHub');
  const linkedin = findProfile(basics.profiles, 'LinkedIn');

  const lines = [
    '#show: resume.with(',
    `  author: ${q(basics.name)},`,
    `  location: ${q(location)},`,
    `  email: ${q(basics.email)},`,
  ];
  if (github)   lines.push(`  github: ${q(stripScheme(github.url))},`);
  if (linkedin) lines.push(`  linkedin: ${q(stripScheme(linkedin.url))},`);
  if (basics.phone) lines.push(`  phone: ${q(basics.phone)},`);
  if (basics.url)   lines.push(`  personal-site: ${q(stripScheme(basics.url))},`);
  lines.push(
    '  accent-color: "#025159",',
    '  font: "New Computer Modern",',
    '  paper: "a4",',
    '  author-position: left,',
    '  personal-info-position: left,',
    ')',
    ''
  );
  return lines.join('\n');
}

function summary(resume) {
  const s = resume.basics?.summary;
  if (!s) return '';
  return `${esc(s)}\n\n`;
}

function education(resume) {
  const items = pdfOnly(resume.education);
  if (!items.length) return '';
  let out = '== Education\n\n';
  for (const e of items) {
    const degree = [e.studyType, e.area].filter(Boolean).join(', ');
    const loc = e.url ? stripScheme(e.url) : '';
    out += '#edu(\n';
    out += `  institution: ${q(e.institution)},\n`;
    out += `  location: ${q(loc)},\n`;
    out += `  dates: dates-helper(start-date: ${q(fmtDate(e.startDate))}, end-date: ${q(e.endDate ? fmtDate(e.endDate) : 'Present')}),\n`;
    out += `  degree: ${q(degree)},\n`;
    out += ')\n';
    if (e.score)   out += `- Grade: ${esc(e.score)}\n`;
    if (e.summary) out += `- ${esc(e.summary)}\n`;
    if (Array.isArray(e.courses) && e.courses.length) {
      const courses = e.courses.slice(0, 4).map(esc).join(', ');
      out += `- *Relevant Coursework:* ${courses}\n`;
    }
    out += '\n';
  }
  return out;
}

function experience(resume) {
  const items = pdfOnly(resume.work);
  if (!items.length) return '';
  let out = '== Experience\n\n';
  for (const w of items) {
    out += '#work(\n';
    out += `  title: ${q(w.position)},\n`;
    out += `  location: ${q(w.location || '')},\n`;
    out += `  company: ${q(w.name)},\n`;
    out += `  dates: dates-helper(start-date: ${q(fmtDate(w.startDate))}, end-date: ${q(w.endDate ? fmtDate(w.endDate) : 'Present')}),\n`;
    out += ')\n';
    if (Array.isArray(w.highlights) && w.highlights.length) {
      for (const h of w.highlights) out += `- ${esc(h)}\n`;
    } else if (w.summary) {
      out += `- ${esc(w.summary)}\n`;
    }
    if (Array.isArray(w.technologies) && w.technologies.length) {
      const techs = w.technologies.map(esc).join(', ');
      out += `- *Tech:* ${techs}\n`;
    }
    out += '\n';
  }
  return out;
}

function skills(resume) {
  const items = pdfOnly(resume.skills);
  const langs = pdfOnly(resume.languages);
  if (!items.length && !langs.length) return '';
  let out = '== Skills\n';
  for (const s of items) {
    const kw = (s.keywords || []).map(esc).join(', ');
    out += `- *${esc(s.name)}:* ${kw}\n`;
  }
  if (langs.length) {
    const line = langs.map(l => `${esc(l.language)} (${esc(l.fluency)})`).join(', ');
    out += `- *Spoken languages:* ${line}\n`;
  }
  out += '\n';
  return out;
}

function awards(resume) {
  const items = pdfOnly(resume.awards);
  if (!items.length) return '';
  let out = '== Awards\n';
  for (const a of items) {
    out += `- *${esc(a.title)}* --- ${esc(a.awarder)}${a.date ? ` (${fmtDate(a.date)})` : ''}\n`;
  }
  out += '\n';
  return out;
}



function build(resume) {
  const preamble = [
    '// AUTO-GENERATED from resume.json. Do not edit.',
    '// Regenerate with: npm run generate:cv-typst',
    '',
    '#import "@preview/basic-resume:0.2.9": *',
    '',
  ].join('\n');

  return [
    preamble,
    header(resume),
    summary(resume),
    experience(resume),
    education(resume),
    skills(resume),
    awards(resume),
  ].join('');
}

function main() {
  console.log('📄 Generating Typst CV from resume.json...');
  const resume = loadResume();
  const source = build(resume);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_TYP, source, 'utf8');

  console.log('✅ Typst CV generated');
  console.log(`📍 ${OUTPUT_TYP}`);
  console.log('\n🔨 Compile with:');
  console.log(`   typst compile ${path.relative(process.cwd(), OUTPUT_TYP)}`);
}

if (require.main === module) main();

module.exports = { build, loadResume };
