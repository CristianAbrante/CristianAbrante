#!/usr/bin/env node

/**
 * Generate README.md from resume.json
 * 
 * This script reads the resume.json file and generates a README.md
 * that includes entries marked with visibility: "readme"
 */

const fs = require('fs');
const path = require('path');

// File paths
const RESUME_PATH = path.join(__dirname, '..', 'resume.json');
const README_PATH = path.join(__dirname, '..', 'README.md');

/**
 * Load and parse the resume JSON file
 */
function loadResume() {
  try {
    const resumeData = fs.readFileSync(RESUME_PATH, 'utf8');
    return JSON.parse(resumeData);
  } catch (error) {
    console.error('Error reading resume.json:', error.message);
    process.exit(1);
  }
}

/**
 * Filter items that should be visible in README
 */
function filterByVisibility(items, target = 'readme') {
  if (!Array.isArray(items)) return [];
  return items.filter(item => 
    item.visibility && Array.isArray(item.visibility) && item.visibility.includes(target)
  );
}

/**
 * Format date range for work experience
 */
function formatDateRange(startDate, endDate) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Present';
  
  return `${start} - ${end}`;
}

/**
 * Generate work experience section
 */
function generateWorkExperience(resume) {
  const readmeWork = filterByVisibility(resume.work, 'readme');
  
  if (readmeWork.length === 0) {
    return '';
  }
  
  let markdown = '## 💼 Work Experience\n\n';
  
  readmeWork.forEach(work => {
    const location = work.location ? work.location.split(',')[0] : '';
    const country = work.location ? work.location.split(',').slice(-1)[0].trim() : '';
    const dateRange = formatDateRange(work.startDate, work.endDate);
    
    // Determine if it's a GitHub organization or regular URL
    const isGithubOrg = work.url && work.url.includes('github.com');
    const displayName = isGithubOrg 
      ? `[\`@${work.url.split('/').pop()}\`](${work.url})`
      : `[\`${work.name.toLowerCase().replace(/\s+/g, '')}.com\`](${work.url})`;
    
    markdown += `- 👨🏻‍💻 ${work.position} - ${displayName}  \n`;
    markdown += `*${location}, ${country} | ${dateRange}*  \n`;
    
    // Add technologies if available in the technologies field
    if (work.technologies && Array.isArray(work.technologies) && work.technologies.length > 0) {
      markdown += `🛠 **Technologies**: ${work.technologies.join(' · ')}`;
    }
    
    markdown += '\n\n';
  });
  
  return markdown;
}

/**
 * Generate links section
 */
function generateLinks(resume) {
  const { basics } = resume;
  
  let markdown = '## 🔗 Links  \n\n';
  
  // Add profile links
  if (basics.profiles && basics.profiles.length > 0) {
    basics.profiles.forEach(profile => {
      let icon = '🔗';
      if (profile.network === 'LinkedIn') icon = '💼';
      if (profile.network === 'GitHub') icon = '💻';
      
      markdown += `- ${icon} [${profile.network}](${profile.url})  \n`;
    });
  }
  
  // Add personal website
  if (basics.url) {
    markdown += `- 🖥️ [Personal Website](${basics.url})  \n`;
  }
  
  // Add email
  if (basics.email) {
    markdown += `- 📧 [Email](mailto:${basics.email})  \n`;
  }
  
  return markdown;
}

/**
 * Generate the complete README
 */
function generateReadme(resume) {
  const { basics } = resume;
  
  let readme = '';
  
  // Add generated file notice (as HTML comment)
  readme += '<!-- This file is auto-generated from resume.json. Do not edit manually. -->\n';
  readme += '<!-- Run "npm run generate:readme" to regenerate this file. -->\n\n';
  
  // Header with greeting
  readme += '<h1 align="center">\n';
  readme += `  Hi, I am ${basics.name.split(' ')[0]} \n`;
  readme += '  <img src="https://github.com/TheDudeThatCode/TheDudeThatCode/blob/master/Assets/Hi.gif" width="29px">\n';
  readme += '</h1>\n\n';
  
  // About section with summary
  readme += '## 👨🏻‍💻 About me\n\n';
  readme += `${basics.summary}\n\n`;
  
  // Work experience
  readme += generateWorkExperience(resume);
  
  // Links
  readme += generateLinks(resume);
  
  return readme;
}

/**
 * Main function
 */
function main() {
  console.log('📄 Generating README.md from resume.json...');
  
  const resume = loadResume();
  const readmeContent = generateReadme(resume);
  
  try {
    fs.writeFileSync(README_PATH, readmeContent, 'utf8');
    console.log('✅ README.md generated successfully!');
    console.log(`📍 Output: ${README_PATH}`);
  } catch (error) {
    console.error('❌ Error writing README.md:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { generateReadme, loadResume };
