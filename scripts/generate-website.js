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

// Generate work experience HTML
function generateWorkExperience() {
  const work = (resume.work || []).filter(item => hasVisibility(item));
  
  return work.map(job => `
                <div class="timeline-item">
                    <div class="timeline-header">
                        <div class="timeline-position">${job.position}</div>
                        <div class="timeline-date">${formatDate(job.startDate)} – ${formatDate(job.endDate)}</div>
                    </div>
                    <div class="timeline-company">
                        ${job.url ? `<a href="${job.url}" target="_blank" rel="noopener noreferrer">${job.name}</a>` : job.name}
                    </div>
                    ${job.location ? `<div class="timeline-location">${job.location}</div>` : ''}
                    ${job.summary ? `<p class="timeline-description">${job.summary}</p>` : ''}
                    ${job.highlights && job.highlights.length > 0 ? `
                    <ul class="timeline-highlights">
                        ${job.highlights.map(h => `<li>${h}</li>`).join('\n                        ')}
                    </ul>` : ''}
                    ${job.technologies && job.technologies.length > 0 ? `
                    <div class="timeline-technologies">
                        ${job.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('\n                        ')}
                    </div>` : ''}
                </div>`).join('\n                ');
}

// Generate education HTML
function generateEducation() {
  const education = (resume.education || []).filter(item => hasVisibility(item));
  
  return education.map(edu => `
                <div class="timeline-item">
                    <div class="timeline-header">
                        <div class="timeline-position">${edu.studyType}${edu.area ? `, ${edu.area}` : ''}</div>
                        <div class="timeline-date">${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}</div>
                    </div>
                    <div class="timeline-company">
                        ${edu.url ? `<a href="${edu.url}" target="_blank" rel="noopener noreferrer">${edu.institution}</a>` : edu.institution}
                    </div>
                    ${edu.score ? `<div class="timeline-location">Grade: ${edu.score}</div>` : ''}
                    ${edu.summary ? `<p class="timeline-description">${edu.summary}</p>` : ''}
                    ${edu.highlights && edu.highlights.length > 0 ? `
                    <ul class="timeline-highlights">
                        ${edu.highlights.map(h => `<li>${h}</li>`).join('\n                        ')}
                    </ul>` : ''}
                    ${edu.keywords && edu.keywords.length > 0 ? `
                    <div class="timeline-technologies">
                        ${edu.keywords.map(k => `<span class="tech-tag">${k}</span>`).join('\n                        ')}
                    </div>` : ''}
                </div>`).join('\n                ');
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
  '{{GITHUB_USERNAME}}': githubUsername
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

// Copy profile picture from root
const picturePath = path.join(__dirname, '..', 'picture.jpg');
if (fs.existsSync(picturePath)) {
  fs.copyFileSync(picturePath, path.join(OUTPUT_DIR, 'picture.jpg'));
}

console.log('✅ Website generated successfully!');
console.log(`📁 Output: ${OUTPUT_DIR}`);
console.log(`🌐 Open: ${OUTPUT_HTML}`);
