#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const RESUME_PATH = path.join(__dirname, '..', 'resume.json');
const TEMPLATE_DIR = path.join(__dirname, '..', 'website', 'template');
const OUTPUT_DIR = path.join(__dirname, '..', 'website', 'output');
const HTML_TEMPLATE = path.join(TEMPLATE_DIR, 'index.html');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'index.html');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read resume.json
const resume = JSON.parse(fs.readFileSync(RESUME_PATH, 'utf8'));

// Filter by visibility
function hasVisibility(item, target = 'website') {
  return item.visibility && item.visibility.includes(target);
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'Present';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// Generate profile links HTML
function generateProfiles() {
  const profiles = resume.basics.profiles || [];
  return profiles.map(profile => 
    `<a href="${profile.url}" target="_blank" rel="noopener noreferrer">${profile.network}</a>`
  ).join('\n                ');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function monogramFor(name) {
  const parts = String(name || '').trim().split(/\s+/);
  const initials = parts.slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || '?';
  return initials.slice(0, 2);
}

function resolveLogo(entry, name) {
  if (entry.logo) return entry.logo;
  const url = entry.url || '';
  const gh = url.match(/^https?:\/\/github\.com\/([^\/\?#]+)/i);
  if (gh) return `https://github.com/${gh[1]}.png?size=120`;
  return null;
}

function logoMarkup(entry, name) {
  const src = resolveLogo(entry, name);
  const mono = monogramFor(name);
  const safeName = escapeHtml(name);
  if (src) {
    return `<span class="entry-logo" data-monogram="${escapeHtml(mono)}">
                                <img src="${escapeHtml(src)}" alt="${safeName} logo" loading="lazy" decoding="async" onerror="this.remove(); this.parentNode.classList.add('is-mono');">
                            </span>`;
  }
  return `<span class="entry-logo is-mono" data-monogram="${escapeHtml(mono)}" aria-label="${safeName}"></span>`;
}

let entryUid = 0;

function renderEntry({ id, position, name, url, dateLine, location, summary, highlights, tags, logoHtml }) {
  const hasDetail = Boolean(dateLine || location || summary || (highlights && highlights.length));
  const chipsHtml = tags && tags.length ? `
                        <span class="entry-chips">
                            ${tags.slice(0, 5).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('\n                            ')}
                            ${tags.length > 5 ? `<span class="tech-tag tech-tag-more">+${tags.length - 5}</span>` : ''}
                        </span>` : '';
  const companyLink = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="entry-company-link" onclick="event.stopPropagation()">${escapeHtml(name)}</a>`
    : escapeHtml(name);
  const detailHighlights = highlights && highlights.length ? `
                            <ul class="entry-highlights">
                                ${highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('\n                                ')}
                            </ul>` : '';
  return `
                <article class="entry${hasDetail ? '' : ' entry-static'}" data-entry>
                    <button type="button" class="entry-summary" aria-expanded="false" aria-controls="entry-${id}-details"${hasDetail ? '' : ' disabled'}>
                        ${logoHtml}
                        <span class="entry-meta">
                            <span class="entry-position">${escapeHtml(position)}</span>
                            <span class="entry-company">${companyLink}</span>
                        </span>${chipsHtml}
                        ${hasDetail ? `<span class="entry-toggle" aria-hidden="true"><svg viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` : ''}
                    </button>
                    ${hasDetail ? `<div id="entry-${id}-details" class="entry-details" hidden>
                        <div class="entry-details-inner">
                            <div class="entry-meta-row">
                                ${dateLine ? `<span class="entry-date">${escapeHtml(dateLine)}</span>` : ''}
                                ${location ? `<span class="entry-location">${escapeHtml(location)}</span>` : ''}
                            </div>
                            ${summary ? `<p class="entry-description">${escapeHtml(summary)}</p>` : ''}${detailHighlights}
                        </div>
                    </div>` : ''}
                </article>`;
}

function generateWorkExperience() {
  const work = (resume.work || []).filter(item => hasVisibility(item));
  return work.map(job => renderEntry({
    id: `w${++entryUid}`,
    position: job.position,
    name: job.name,
    url: job.url,
    dateLine: `${formatDate(job.startDate)} – ${formatDate(job.endDate)}`,
    location: job.location,
    summary: job.summary,
    highlights: job.highlights,
    tags: job.technologies,
    logoHtml: logoMarkup(job, job.name),
  })).join('\n                ');
}

function generateEducation() {
  const education = (resume.education || []).filter(item => hasVisibility(item));
  return education.map(edu => renderEntry({
    id: `e${++entryUid}`,
    position: `${edu.studyType}${edu.area ? `, ${edu.area}` : ''}`,
    name: edu.institution,
    url: edu.url,
    dateLine: `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`,
    location: edu.score ? `Grade: ${edu.score}` : null,
    summary: edu.summary,
    highlights: edu.highlights,
    tags: edu.keywords,
    logoHtml: logoMarkup(edu, edu.institution),
  })).join('\n                ');
}

// Generate skills HTML
function generateSkills() {
  const skills = (resume.skills || []).filter(item => hasVisibility(item));
  
  return skills.map(skill => `
                <div class="skill-category">
                    <div class="skill-category-name">${skill.name}</div>
                    <div class="skill-tags">
                        ${skill.keywords.map(k => `<span class="tech-tag">${k}</span>`).join('\n                        ')}
                    </div>
                </div>`).join('\n                ');
}

// Generate awards HTML
function generateAwards() {
  const awards = (resume.awards || []).filter(item => hasVisibility(item));
  
  if (awards.length === 0) return '';
  
  return `
            <div class="awards-section">
                <h3 class="awards-title">Awards & Recognition</h3>
                <div class="awards-list">
                    ${awards.map(award => `
                    <div class="award-item">
                        <div class="award-title">${award.title}</div>
                        <div class="award-meta">${award.awarder}${award.date ? ` • ${formatDate(award.date)}` : ''}</div>
                        ${award.summary ? `<p class="award-description">${award.summary}</p>` : ''}
                    </div>`).join('\n                    ')}
                </div>
            </div>`;
}

// Generate SEO keywords from skills and work
function generateKeywords() {
  const skills = (resume.skills || [])
    .filter(item => hasVisibility(item))
    .flatMap(skill => skill.keywords || []);
  
  const work = (resume.work || [])
    .filter(item => hasVisibility(item))
    .flatMap(job => job.technologies || []);
  
  const allKeywords = [...new Set([...skills, ...work, resume.basics.label, 'Data Engineer', 'Resume', 'Portfolio'])];
  
  return allKeywords.slice(0, 20).join(', ');
}

// Generate JSON-LD structured data for SEO
function generateStructuredData() {
  const profiles = resume.basics.profiles || [];
  const sameAs = profiles.map(p => p.url);
  
  const workHistory = (resume.work || [])
    .filter(item => hasVisibility(item))
    .map(job => ({
      "@type": "OrganizationRole",
      "roleName": job.position,
      "startDate": job.startDate,
      "endDate": job.endDate || new Date().toISOString().split('T')[0],
      "name": job.name
    }));
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": resume.basics.name,
    "url": "https://cristianabrante.com",
    "image": "https://cristianabrante.com/picture.jpg",
    "jobTitle": resume.basics.label,
    "description": resume.basics.summary,
    "email": resume.basics.email,
    "telephone": resume.basics.phone || "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": resume.basics.location.city,
      "addressRegion": resume.basics.location.region,
      "addressCountry": resume.basics.location.countryCode || "ES"
    },
    "sameAs": sameAs,
    "knowsAbout": (resume.skills || [])
      .filter(item => hasVisibility(item))
      .flatMap(skill => skill.keywords || [])
      .slice(0, 10),
    "alumniOf": (resume.education || [])
      .filter(item => hasVisibility(item))
      .map(edu => ({
        "@type": "EducationalOrganization",
        "name": edu.institution,
        "url": edu.url || ""
      })),
    "worksFor": workHistory.length > 0 ? {
      "@type": "Organization",
      "name": workHistory[0].name
    } : undefined
  };
  
  return JSON.stringify(structuredData, null, 2);
}

// Read HTML template
let html = fs.readFileSync(HTML_TEMPLATE, 'utf8');

// Get GitHub username from profiles
const githubProfile = (resume.basics.profiles || []).find(p => p.network === 'GitHub');
const githubUsername = githubProfile ? githubProfile.username : 'CristianAbrante';

// Replace placeholders
const replacements = {
  '{{NAME}}': resume.basics.name,
  '{{LABEL}}': resume.basics.label,
  '{{SUMMARY}}': resume.basics.summary,
  '{{LOCATION}}': `${resume.basics.location.city}, ${resume.basics.location.region}`,
  '{{EMAIL}}': resume.basics.email,
  '{{PHONE}}': resume.basics.phone ? `<a href="tel:${resume.basics.phone}" class="contact-link">${resume.basics.phone}</a>` : '',
  '{{PROFILES}}': generateProfiles(),
  '{{WORK_EXPERIENCE}}': generateWorkExperience(),
  '{{EDUCATION}}': generateEducation(),
  '{{SKILLS}}': generateSkills(),
  '{{AWARDS}}': generateAwards(),
  '{{GITHUB_USERNAME}}': githubUsername,
  '{{KEYWORDS}}': generateKeywords(),
  '{{STRUCTURED_DATA}}': generateStructuredData()
};

// Apply replacements
Object.entries(replacements).forEach(([placeholder, value]) => {
  html = html.split(placeholder).join(value || '');
});

// Write generated HTML
fs.writeFileSync(OUTPUT_HTML, html);

// Copy CSS and JS files
fs.copyFileSync(
  path.join(TEMPLATE_DIR, 'style.css'),
  path.join(OUTPUT_DIR, 'style.css')
);
fs.copyFileSync(
  path.join(TEMPLATE_DIR, 'script.js'),
  path.join(OUTPUT_DIR, 'script.js')
);
fs.copyFileSync(
  path.join(TEMPLATE_DIR, 'three-scene.js'),
  path.join(OUTPUT_DIR, 'three-scene.js')
);

// Copy profile picture from root
const picturePath = path.join(__dirname, '..', 'picture.jpg');
if (fs.existsSync(picturePath)) {
  fs.copyFileSync(picturePath, path.join(OUTPUT_DIR, 'picture.jpg'));
}

// Copy company/institution logos referenced by resume.json (paths like "logos/foo.png").
const LOGOS_SRC = path.join(__dirname, '..', 'cv', 'logos');
const LOGOS_DST = path.join(OUTPUT_DIR, 'logos');
if (fs.existsSync(LOGOS_SRC)) {
  if (!fs.existsSync(LOGOS_DST)) fs.mkdirSync(LOGOS_DST, { recursive: true });
  for (const f of fs.readdirSync(LOGOS_SRC)) {
    fs.copyFileSync(path.join(LOGOS_SRC, f), path.join(LOGOS_DST, f));
  }
}

// Generate and copy robots.txt
const robotsTxtTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'robots.txt'), 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), robotsTxtTemplate);

// Generate and copy sitemap.xml with current date
const sitemapTemplate = fs.readFileSync(path.join(TEMPLATE_DIR, 'sitemap.xml'), 'utf8');
const lastMod = new Date().toISOString().split('T')[0];
const sitemap = sitemapTemplate.replace('{{LAST_MOD}}', lastMod);
fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);

console.log('✅ Website generated successfully!');
console.log(`📁 Output: ${OUTPUT_DIR}`);
console.log(`🌐 Open: ${OUTPUT_HTML}`);
