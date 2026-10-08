#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RESUME_PATH = path.join(__dirname, '..', 'resume.json');
const TEMPLATE_DIR = path.join(__dirname, '..', 'website', 'template');
const OUTPUT_DIR = path.join(__dirname, '..', 'website', 'output');
const HTML_TEMPLATE = path.join(TEMPLATE_DIR, 'index.html');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'index.html');

const LOGO_DIR = path.join(__dirname, '..', 'cv', 'logos');
/* Must match the output filename in package.json's generate:pdf script. The
   site publishes it under the shorter CV_PUBLIC_NAME; the saved filename comes
   from the link's download attribute, so the build name stays an internal
   detail. */
const CV_PDF = path.join(__dirname, '..', 'cv', 'output', 'cv-cristian-abrante.pdf');
const CV_PUBLIC_NAME = 'cv.pdf';

const SITE_URL = 'https://cristianabrante.com';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STAGGER_MS = 60;
const STAGGER_CAP_MS = 240;

// How many of the most recent entries stay in the main list; the rest collapse
// behind a "show earlier" disclosure. Education keeps 4 so the list reaches the
// bachelor's degree before cutting off.
const FEATURED_WORK = 3;
const FEATURED_EDUCATION = 4;

const MONOGRAM_STOPWORDS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'of', 'the', 'and', 'y', '-', '&']);

const resume = JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

function visible(item, target = 'website') {
  return Array.isArray(item.visibility) && item.visibility.includes(target);
}

function pick(collection) {
  return (resume[collection] || []).filter((item) => visible(item));
}

/* Dates are parsed from the YYYY-MM-DD string rather than via `new Date()` so
   the output is identical in Europe/Madrid and in the UTC CI runner. */
function parseYearMonth(dateStr) {
  const [year, month] = dateStr.split('-');
  return { year: Number(year), month: Number(month) };
}

function formatDate(dateStr) {
  if (!dateStr) return 'Present';
  const { year, month } = parseYearMonth(dateStr);
  return `${MONTHS[month - 1]} ${year}`;
}

function formatDuration(startDate, endDate) {
  if (!startDate) return '';
  const start = parseYearMonth(startDate);
  const now = new Date();
  const end = endDate
    ? parseYearMonth(endDate)
    : { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };

  const totalMonths = (end.year - start.year) * 12 + (end.month - start.month) + 1;
  if (totalMonths < 1) return '';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  if (months) parts.push(`${months} mo`);
  return parts.join(' ');
}

function stagger(index) {
  return Math.min(index * STAGGER_MS, STAGGER_CAP_MS);
}

function revealAttrs(index) {
  const delay = stagger(index);
  return delay ? ` style="--reveal-delay:${delay}ms"` : '';
}

function externalLink(url, label, className = '') {
  const cls = className ? ` class="${className}"` : '';
  return `<a${cls} href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}

function chips(keywords) {
  return keywords
    .map((keyword, index) => `<span class="chip${index === 0 ? ' chip--key' : ''}">${esc(keyword)}</span>`)
    .join('');
}

function displayUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function monogram(name) {
  // Collapse dotted acronyms ("I.E.S." -> "IES") before tokenising, otherwise
  // they split into single letters and every such name yields the same initials.
  const words = name
    .replace(/\b(?:[A-Za-z]\.)+/g, (acronym) => acronym.replace(/\./g, ''))
    .replace(/[.,'"()]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !MONOGRAM_STOPWORDS.has(word.toLowerCase()));

  if (!words.length) return '??';

  const [first, second] = words;
  // An acronym-led name ("I.E.S. San Marcos") pairs the acronym's initial with
  // the next word's, so sibling institutions do not collapse to the same tile.
  const isAcronym = first.length >= 2 && first === first.toUpperCase();
  if (isAcronym) return ((second ? first[0] + second[0] : first.slice(0, 2))).toUpperCase();

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function tile(name, logo) {
  const inner = logo
    ? `<img src="${esc(logo)}" alt="" width="40" height="40" loading="lazy">`
    : `<span class="tile__mono">${esc(monogram(name))}</span>`;
  return `<span class="tile" aria-hidden="true">${inner}</span>`;
}

function chevron() {
  return `<svg class="disclose__chev" viewBox="0 0 7 4" aria-hidden="true" focusable="false"><path d="M0 0h1v1H0zM6 0h1v1H6zM1 1h1v1H1zM5 1h1v1H5zM2 2h1v1H2zM4 2h1v1H4zM3 3h1v1H3z"/></svg>`;
}

function logEntry({ index, range, duration, role, org, orgUrl, logo, meta, summary, points, tags }) {
  const detail = [
    summary ? `<p class="entry__summary">${esc(summary)}</p>` : '',
    points.length ? `<ul class="entry__points">${points.map((point) => `<li>${esc(point)}</li>`).join('')}</ul>` : '',
    orgUrl ? `<p class="entry__out">${externalLink(orgUrl, displayUrl(orgUrl))}</p>` : '',
  ].join('');

  return `
                <article class="entry reveal"${revealAttrs(index)}>
                    <div class="entry__when">
                        <span class="entry__range">${esc(range.from)} <span class="entry__dash">&#8212;</span> ${esc(range.to)}</span>
                        ${duration ? `<span class="entry__dur">${esc(duration)}</span>` : ''}
                    </div>
                    <div class="panel entry__body">
                        <details class="disclose">
                            <summary class="disclose__head">
                                ${tile(org, logo)}
                                <span class="disclose__id">
                                    <span class="entry__role">${esc(role)}</span>
                                    <span class="entry__org">${esc(org)}</span>
                                </span>
                                ${meta ? `<span class="entry__meta">${esc(meta)}</span>` : ''}
                                <span class="disclose__hint">${chevron()}</span>
                            </summary>
                            <div class="disclose__body">${detail}</div>
                        </details>
                        ${tags.length ? `<div class="chips entry__tags">${chips(tags)}</div>` : ''}
                    </div>
                </article>`;
}

function workEntry(job, index) {
  return logEntry({
    index,
    range: { from: formatDate(job.startDate), to: formatDate(job.endDate) },
    duration: formatDuration(job.startDate, job.endDate),
    role: job.position,
    org: job.name,
    orgUrl: job.url,
    logo: job.logo,
    meta: job.location,
    summary: job.summary,
    points: job.highlights || [],
    tags: job.technologies || [],
  });
}

function educationEntry(edu, index) {
  return logEntry({
    index,
    range: { from: formatDate(edu.startDate), to: formatDate(edu.endDate) },
    duration: formatDuration(edu.startDate, edu.endDate),
    role: edu.area ? `${edu.studyType}, ${edu.area}` : edu.studyType,
    org: edu.institution,
    orgUrl: edu.url,
    logo: edu.logo,
    meta: edu.score ? `Grade ${edu.score}` : '',
    summary: edu.summary,
    points: edu.highlights || [],
    tags: edu.keywords || [],
  });
}

function earlierGroup(entries, renderEntry, noun) {
  if (!entries.length) return '';

  const rendered = entries.map((entry, index) => renderEntry(entry, index)).join('');
  const label = `${entries.length} earlier ${entries.length === 1 ? noun.one : noun.many}`;

  return `
                <details class="more">
                    <summary class="more__toggle">
                        <span class="more__sigil" aria-hidden="true">${chevron()}</span>
                        <span class="more__label more__label--closed">show ${label}</span>
                        <span class="more__label more__label--open">hide ${label}</span>
                    </summary>
                    <div class="log more__log">${rendered}
                    </div>
                </details>`;
}

function generateAwards() {
  const awards = pick('awards');
  if (!awards.length) return '';

  const items = awards
    .map(
      (award, index) => `
                        <li class="panel award reveal"${revealAttrs(index)}>
                            <svg class="award__mark" viewBox="0 0 9 9" aria-hidden="true" focusable="false">
                                <rect x="4" y="0" width="1" height="9"/>
                                <rect x="0" y="4" width="9" height="1"/>
                                <rect x="3" y="3" width="3" height="3"/>
                            </svg>
                            <div>
                                <p class="award__title">${esc(award.title)}</p>
                                <p class="award__meta">${esc(award.awarder)}${award.date ? ` &#183; ${esc(formatDate(award.date))}` : ''}</p>
                                ${award.summary ? `<p class="award__desc">${esc(award.summary)}</p>` : ''}
                            </div>
                        </li>`
    )
    .join('');

  return `
                <div class="awards">
                    <h3 class="subhead"><span class="subhead__index">03.1</span> awards</h3>
                    <ul class="awards__list">${items}
                    </ul>
                </div>`;
}

function generateSkills() {
  return pick('skills')
    .map(
      (skill, index) => `
                    <div class="panel cart reveal"${revealAttrs(index)}>
                        <div class="cart__label">
                            <span class="cart__name">${esc(skill.name)}</span>
                            ${skill.level ? `<span class="cart__level">${esc(skill.level)}</span>` : ''}
                        </div>
                        <div class="cart__body">
                            <div class="chips">${chips(skill.keywords || [])}</div>
                        </div>
                    </div>`
    )
    .join('');
}

function cvDownloadName() {
  return `${resume.basics.name.replace(/\s+/g, '-')}-CV.pdf`;
}

function cvSizeLabel() {
  if (!fs.existsSync(CV_PDF)) return '';
  return `${Math.round(fs.statSync(CV_PDF).size / 1024)} KB`;
}

function generateCvAction() {
  const size = cvSizeLabel();
  return `<a class="action action--primary" href="${CV_PUBLIC_NAME}" download="${esc(cvDownloadName())}"><span class="action__sigil" aria-hidden="true">&#8595;</span>Download CV${size ? ` <span class="action__note">${esc(size)}</span>` : ''}</a>`;
}

function generateCvContactLine() {
  return `<p class="term__line"><span class="term__sigil" aria-hidden="true">$</span><span class="term__cmd">get</span><a href="${CV_PUBLIC_NAME}" download="${esc(cvDownloadName())}">${CV_PUBLIC_NAME}</a></p>`;
}

function generateHeroLinks() {
  const actions = (resume.basics.profiles || []).map((profile) => ({
    url: profile.url,
    label: profile.network,
  }));
  actions.push({ url: `mailto:${resume.basics.email}`, label: 'Email', internal: true });

  return actions
    .map(({ url, label, internal }) => {
      const target = internal ? '' : ' target="_blank" rel="noopener noreferrer"';
      return `<a class="action" href="${esc(url)}"${target}><span class="action__sigil" aria-hidden="true">&#8599;</span>${esc(label)}</a>`;
    })
    .join('\n                        ');
}

/* basics.phone is deliberately not published on the website — it stays in
   resume.json for the PDF and other targets only. Do not re-add it here. */
function generateContactLines() {
  const lines = [{ cmd: 'mail', url: `mailto:${resume.basics.email}`, label: resume.basics.email }];

  (resume.basics.profiles || []).forEach((profile) => {
    lines.push({ cmd: 'open', url: profile.url, label: displayUrl(profile.url), external: true });
  });

  return lines
    .map(({ cmd, url, label, external }) => {
      const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<p class="term__line"><span class="term__sigil" aria-hidden="true">$</span><span class="term__cmd">${cmd}</span><a href="${esc(url)}"${target}>${esc(label)}</a></p>`;
    })
    .join('\n                            ');
}

function currentRole() {
  const ongoing = pick('work').find((job) => !job.endDate);
  if (!ongoing) return resume.basics.label;
  return `${ongoing.position} @ ${ongoing.name}`;
}

function languageList() {
  const languages = pick('languages').map((entry) => entry.language);
  return languages.length ? languages.join(' \u00b7 ') : '';
}

function handle() {
  return resume.basics.name.toLowerCase().split(/\s+/).join('.');
}

function generateKeywords() {
  const skills = pick('skills').flatMap((skill) => skill.keywords || []);
  const technologies = pick('work').flatMap((job) => job.technologies || []);
  const all = [...new Set([...skills, ...technologies, resume.basics.label, 'Data Engineer', 'Portfolio'])];
  return all.slice(0, 20).join(', ');
}

function generateStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: resume.basics.name,
    url: SITE_URL,
    image: `${SITE_URL}/picture.jpg`,
    jobTitle: resume.basics.label,
    description: resume.basics.summary,
    email: resume.basics.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: resume.basics.location.city,
      addressRegion: resume.basics.location.region,
      addressCountry: resume.basics.location.countryCode || 'ES',
    },
    sameAs: (resume.basics.profiles || []).map((profile) => profile.url),
    knowsAbout: pick('skills').flatMap((skill) => skill.keywords || []).slice(0, 10),
    knowsLanguage: pick('languages').map((entry) => entry.language),
    alumniOf: pick('education').map((edu) => ({
      '@type': 'EducationalOrganization',
      name: edu.institution,
      url: edu.url || '',
    })),
  };

  const ongoing = pick('work').find((job) => !job.endDate);
  if (ongoing) {
    structuredData.worksFor = { '@type': 'Organization', name: ongoing.name };
  }

  /* `<` is escaped so a value in resume.json can never terminate the
     surrounding <script> block. */
  return JSON.stringify(structuredData, null, 2).replace(/</g, '\\u003c');
}

function copyDirectory(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const destination = path.join(to, entry.name);
    if (entry.isDirectory()) copyDirectory(source, destination);
    else fs.copyFileSync(source, destination);
  }
}

const githubProfile = (resume.basics.profiles || []).find((profile) => profile.network === 'GitHub');

const work = pick('work');
const education = pick('education');

const replacements = {
  '{{NAME}}': esc(resume.basics.name),
  '{{HANDLE}}': esc(handle()),
  '{{LABEL}}': esc(resume.basics.label),
  '{{SUMMARY}}': esc(resume.basics.summary),
  '{{LOCATION}}': esc(`${resume.basics.location.city}, ${resume.basics.location.region}`),
  '{{CURRENT_ROLE}}': esc(currentRole()),
  '{{LANGUAGES}}': esc(languageList()),
  '{{CV_ACTION}}': generateCvAction(),
  '{{CV_CONTACT_LINE}}': generateCvContactLine(),
  '{{HERO_LINKS}}': generateHeroLinks(),
  '{{WORK_ENTRIES}}': work.slice(0, FEATURED_WORK).map(workEntry).join(''),
  '{{WORK_EARLIER}}': earlierGroup(work.slice(FEATURED_WORK), workEntry, { one: 'role', many: 'roles' }),
  '{{EDUCATION_ENTRIES}}': education.slice(0, FEATURED_EDUCATION).map(educationEntry).join(''),
  '{{EDUCATION_EARLIER}}': earlierGroup(education.slice(FEATURED_EDUCATION), educationEntry, {
    one: 'entry',
    many: 'entries',
  }),
  '{{AWARDS}}': generateAwards(),
  '{{SKILLS}}': generateSkills(),
  '{{CONTACT_LINES}}': generateContactLines(),
  '{{GITHUB_USERNAME}}': esc(githubProfile ? githubProfile.username : 'CristianAbrante'),
  '{{KEYWORDS}}': esc(generateKeywords()),
  '{{YEAR}}': String(new Date().getUTCFullYear()),
  '{{STRUCTURED_DATA}}': generateStructuredData(),
};

let html = fs.readFileSync(HTML_TEMPLATE, 'utf8');
Object.entries(replacements).forEach(([placeholder, value]) => {
  html = html.split(placeholder).join(value || '');
});

const unresolved = [...new Set(html.match(/\{\{[A-Z_]+\}\}/g) || [])];
if (unresolved.length) {
  console.error(`Unresolved template placeholders: ${unresolved.join(', ')}`);
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_HTML, html);

['style.css', 'script.js', 'favicon.svg', 'robots.txt', 'profile-pixel.png'].forEach((file) => {
  fs.copyFileSync(path.join(TEMPLATE_DIR, file), path.join(OUTPUT_DIR, file));
});

copyDirectory(path.join(TEMPLATE_DIR, 'fonts'), path.join(OUTPUT_DIR, 'fonts'));
copyDirectory(LOGO_DIR, path.join(OUTPUT_DIR, 'logos'));

const picturePath = path.join(__dirname, '..', 'picture.jpg');
if (fs.existsSync(picturePath)) {
  fs.copyFileSync(picturePath, path.join(OUTPUT_DIR, 'picture.jpg'));
}

/* The site always links cv.pdf, so a missing PDF is a broken download rather
   than a missing button. Warn loudly instead of silently shipping a 404;
   verify:website turns the same condition into a hard failure in CI. */
if (fs.existsSync(CV_PDF)) {
  fs.copyFileSync(CV_PDF, path.join(OUTPUT_DIR, CV_PUBLIC_NAME));
} else {
  console.warn(`WARNING: ${path.relative(process.cwd(), CV_PDF)} not found — ${CV_PUBLIC_NAME} will 404.`);
  console.warn('         Run "npm run generate:pdf" first (or use "npm run preview:website").');
}

const sitemap = fs
  .readFileSync(path.join(TEMPLATE_DIR, 'sitemap.xml'), 'utf8')
  .replace('{{LAST_MOD}}', new Date().toISOString().split('T')[0]);
fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);

console.log('Website generated.');
console.log(`Output: ${OUTPUT_DIR}`);
console.log(`Open:   ${OUTPUT_HTML}`);
