#!/usr/bin/env node

/**
 * Generate LaTeX CV from resume.json
 * 
 * This script reads the resume.json file and generates a LaTeX CV
 * that includes entries marked with visibility: "pdf"
 */

const fs = require('fs');
const path = require('path');

// File paths
const RESUME_PATH = path.join(__dirname, '..', 'resume.json');
const TEMPLATE_DIR = path.join(__dirname, '..', 'cv', 'template');
const OUTPUT_DIR = path.join(__dirname, '..', 'cv', 'output');
const OUTPUT_TEX = path.join(OUTPUT_DIR, 'cv.tex');

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
 * Filter items that should be visible in PDF
 */
function filterByVisibility(items, target = 'pdf') {
  if (!Array.isArray(items)) return [];
  return items.filter(item => 
    item.visibility && Array.isArray(item.visibility) && item.visibility.includes(target)
  );
}

/**
 * Escape LaTeX special characters
 */
function escapeLatex(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Format date for LaTeX (Month Year)
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

/**
 * Format date range for LaTeX
 */
function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Present';
  return `${start} -- ${end}`;
}

/**
 * Generate work experience section
 */
function generateWorkExperience(resume) {
  const pdfWork = filterByVisibility(resume.work, 'pdf');
  
  if (pdfWork.length === 0) {
    return '% No work experience entries for PDF\n';
  }
  
  let latex = '';
  
  pdfWork.forEach((work, index) => {
    const company = escapeLatex(work.name);
    const position = escapeLatex(work.position);
    const location = escapeLatex(work.location);
    const dateRange = formatDateRange(work.startDate, work.endDate);
    const summary = escapeLatex(work.summary);
    
    latex += `\\cvevent{${position}}\n`;
    latex += `{${company}}\n`;
    latex += `{${dateRange}}{${location}}\n\n`;
    latex += `${summary}\n\n`;
    
    // Add technologies if available
    if (work.technologies && Array.isArray(work.technologies) && work.technologies.length > 0) {
      const techs = work.technologies.map(t => `\\textbf{${escapeLatex(t)}}`).join(', ');
      latex += `\\medskip{}\n\n`;
      latex += `Skills: ${techs}\n`;
    }
    
    // Add divider if not last entry
    if (index < pdfWork.length - 1) {
      latex += '\n\\divider\n\n';
    }
  });
  
  return latex;
}

/**
 * Generate education section
 */
function generateEducation(resume) {
  const pdfEducation = filterByVisibility(resume.education, 'pdf');
  
  if (pdfEducation.length === 0) {
    return '% No education entries for PDF\n';
  }
  
  let latex = '';
  
  pdfEducation.forEach((edu, index) => {
    const degree = escapeLatex(`${edu.studyType} (${edu.area})`);
    const institution = escapeLatex(edu.institution);
    const dateRange = formatDateRange(edu.startDate, edu.endDate);
    const location = edu.url ? escapeLatex(edu.url.replace('https://', '').replace('http://', '')) : '';
    const summary = escapeLatex(edu.summary);
    
    latex += `\\cvevent{${degree}}\n`;
    latex += `{${institution}}\n`;
    latex += `{${dateRange}}{${location}}\n\n`;
    latex += `${summary}\n\n`;
    
    // Add key courses if available
    if (edu.courses && edu.courses.length > 0) {
      const courses = edu.courses.slice(0, 4).map(c => `\\textbf{${escapeLatex(c)}}`).join(', ');
      latex += `\\medskip{}\n\n`;
      latex += `Subjects: ${courses}\n`;
    }
    
    // Add divider if not last entry
    if (index < pdfEducation.length - 1) {
      latex += '\n\\divider\n\n';
    }
  });
  
  return latex;
}

/**
 * Generate contact info for \personalinfo{}
 */
function generatePersonalInfo(resume) {
  const { basics } = resume;
  
  let latex = '';
  
  // Contact information
  if (basics.email) {
    latex += `  \\email{${escapeLatex(basics.email)}}\n`;
  }
  
  if (basics.url) {
    latex += `  \\homepage{${escapeLatex(basics.url.replace('https://', '').replace('http://', ''))}}\n`;
  }
  
  // Social profiles
  if (basics.profiles && basics.profiles.length > 0) {
    basics.profiles.forEach(profile => {
      const username = escapeLatex(profile.username);
      if (profile.network === 'LinkedIn') {
        latex += `  \\linkedin{${username}}\n`;
      } else if (profile.network === 'GitHub') {
        latex += `  \\github{${username}}\n`;
      }
    });
  }
  
  return latex;
}

/**
 * Generate sidebar file content (page1sidebar.tex)
 */
function generateSidebarContent(resume) {
  const { basics } = resume;
  const pdfAwards = filterByVisibility(resume.awards, 'pdf');
  const pdfSkills = filterByVisibility(resume.skills, 'pdf');
  const pdfLanguages = filterByVisibility(resume.languages, 'pdf');
  
  let latex = '% AUTO-GENERATED SIDEBAR - DO NOT EDIT\n';
  latex += '% Run "npm run generate:cv" to regenerate\n\n';
  
  // Contact Section
  latex += '\\cvsection{Contact}\n\n';
  
  if (basics.phone) {
    latex += `\\cvachievement{\\faPhone}{Phone}{${escapeLatex(basics.phone)}}\n`;
  }
  if (basics.email) {
    latex += `\\cvachievement{\\faAt}{Mail}{${escapeLatex(basics.email)}}\n`;
  }
  if (basics.location && basics.location.city) {
    const location = basics.location.region 
      ? `${basics.location.city}, ${basics.location.region}`
      : basics.location.city;
    latex += `\\cvachievement{\\faMapPin}{Address}{${escapeLatex(location)}}\n`;
  }
  
  latex += '\n\\divider\n\n';
  
  // Social links
  if (basics.profiles && basics.profiles.length > 0) {
    basics.profiles.forEach(profile => {
      const username = escapeLatex(profile.username);
      const url = escapeLatex(profile.url.replace('https://', '').replace('http://', ''));
      
      if (profile.network === 'GitHub') {
        latex += `\\cvachievement{\\faGithub}{GitHub}{\\url{${url}}}\n`;
      } else if (profile.network === 'LinkedIn') {
        latex += `\\cvachievement{\\faLinkedin}{LinkedIn}{\\url{${url}}}\n`;
      }
    });
  }
  
  if (basics.url) {
    const url = escapeLatex(basics.url.replace('https://', '').replace('http://', ''));
    latex += `\\cvachievement{\\faLink}{Webpage}{\\url{${url}}}\n`;
  }
  
  // Awards Section
  if (pdfAwards.length > 0) {
    latex += '\n\\cvsection{Awards}\n\n';
    
    pdfAwards.forEach((award, index) => {
      const title = escapeLatex(award.title);
      const awarder = escapeLatex(award.awarder);
      
      latex += `\\cvachievement{\\faBook}{${title}}{${awarder}}\n`;
      
      if (index < pdfAwards.length - 1) {
        latex += '\n\\divider\n\n';
      }
    });
  }
  
  // Skills Section (if we have PDF skills)
  if (pdfSkills.length > 0) {
    latex += '\n\\cvsection{Skills}\n\n';
    
    pdfSkills.forEach((skillCategory, catIndex) => {
      latex += `${escapeLatex(skillCategory.name)}:\n\n`;
      latex += '\\medskip{}\n\n';
      
      if (skillCategory.keywords && skillCategory.keywords.length > 0) {
        skillCategory.keywords.forEach(keyword => {
          latex += `\\cvtag{${escapeLatex(keyword)}}\n`;
        });
      }
      
      if (catIndex < pdfSkills.length - 1) {
        latex += '\n\\divider\n\n';
      }
    });
  }
  
  // Languages Section
  if (pdfLanguages.length > 0) {
    latex += '\n\\cvsection{Languages}\n\n';
    
    pdfLanguages.forEach((lang, index) => {
      const language = escapeLatex(lang.language);
      const fluency = escapeLatex(lang.fluency);
      
      // Estimate skill level (1-5) based on fluency
      let level = 3;
      if (lang.fluency.toLowerCase().includes('native')) level = 5;
      else if (lang.fluency.toLowerCase().includes('full professional')) level = 4;
      else if (lang.fluency.toLowerCase().includes('professional')) level = 3;
      
      latex += `\\cvskill{${language}}{${level}}\n`;
      latex += `${fluency}\n`;
      
      if (index < pdfLanguages.length - 1) {
        latex += '\\divider\n\n';
      }
    });
  }
  
  latex += '\n\\clearpage\n';
  
  return latex;
}

/**
 * Generate complete LaTeX CV
 */
function generateLatexCV(resume) {
  const { basics } = resume;
  
  let latex = `%%%%%%%%%%%%%%%%%
% This file is auto-generated from resume.json. Do not edit manually.
% Run "npm run generate:cv" to regenerate this file.
%%%%%%%%%%%%%%%%

%% If you need to pass whatever options to xcolor
\\PassOptionsToPackage{dvipsnames}{xcolor}

\\documentclass[10pt,a4paper]{altacv}

% Change the page layout if you need to
\\geometry{left=1cm,right=9cm,marginparwidth=6.8cm,marginparsep=1.2cm,top=1.25cm,bottom=1.25cm,footskip=2pt}

% If using pdflatex:
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[default]{lato}

% Change the colours if you want to
\\definecolor{links}{HTML}{025159}
\\definecolor{Mulberry}{HTML}{15959F}
\\definecolor{SlateGrey}{HTML}{133046}
\\definecolor{LightGrey}{HTML}{666666}
\\definecolor{titlesColor}{HTML}{133046}
\\colorlet{heading}{titlesColor}
\\colorlet{accent}{Mulberry}
\\colorlet{emphasis}{SlateGrey}
\\colorlet{body}{LightGrey}

% Change the bullets for itemize and rating marker
\\renewcommand{\\itemmarker}{{\\small\\textbullet}}
\\renewcommand{\\ratingmarker}{\\faCircle}

\\usepackage[colorlinks]{hyperref}

\\begin{document}

\\hypersetup{urlcolor=links}

\\name{${escapeLatex(basics.name)}}
\\tagline{${escapeLatex(basics.label)}}
\\photo{2.5cm}{picture}

\\personalinfo{%
${generatePersonalInfo(resume)}
}

%% Make the header extend all the way to the right
\\begin{fullwidth}
\\makecvheader
\\end{fullwidth}

%% Work Experience Section
\\cvsection[page1sidebar]{Work Experience}

${generateWorkExperience(resume)}

%% Education Section
\\cvsection{Education}

${generateEducation(resume)}

\\end{document}
`;
  
  return latex;
}

/**
 * Main function
 */
function main() {
  console.log('📄 Generating LaTeX CV from resume.json...');
  
  const resume = loadResume();
  const latexContent = generateLatexCV(resume);
  const sidebarContent = generateSidebarContent(resume);
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Write LaTeX file
    fs.writeFileSync(OUTPUT_TEX, latexContent, 'utf8');
    console.log('✅ LaTeX CV generated successfully!');
    console.log(`📍 Output: ${OUTPUT_TEX}`);
    
    // Write sidebar file
    const sidebarPath = path.join(OUTPUT_DIR, 'page1sidebar.tex');
    fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
    console.log('✅ Sidebar file generated successfully!');
    console.log(`📍 Output: ${sidebarPath}`);
    
    // Copy necessary files to output directory
    const filesToCopy = ['altacv.cls', 'picture.jpg'];
    filesToCopy.forEach(file => {
      const src = path.join(TEMPLATE_DIR, file);
      const dest = path.join(OUTPUT_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`📋 Copied ${file} to output directory`);
      }
    });
    
    console.log('\n🔨 To compile the PDF, run:');
    console.log(`   cd cv/output && pdflatex cv.tex`);
    
  } catch (error) {
    console.error('❌ Error writing LaTeX file:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { generateLatexCV, loadResume };
