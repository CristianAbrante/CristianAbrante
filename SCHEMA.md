# Resume Schema Documentation

This document describes the extended JSON Resume schema used in `resume.json`, including custom visibility controls for multi-format output generation.

## Overview

The `resume.json` file serves as a single source of truth for generating multiple resume formats:
- **README.md** - GitHub profile with summary and key work experience
- **PDF CV** - LaTeX-generated professional CV (latest position + master's degrees)
- **Website** - Full interactive CV website

## Schema Extensions

### Visibility Control

All major sections support a `visibility` field that controls where each entry appears:

```json
{
  "visibility": ["readme", "pdf", "website"]
}
```

**Valid visibility values:**
- `"readme"` - Entry appears in README.md
- `"pdf"` - Entry appears in LaTeX-generated PDF
- `"website"` - Entry appears on the CV website

**Note:** An entry can have multiple visibility targets. If an entry should appear everywhere, include all three values.

## Sections with Visibility Support

### Work Experience (`work`)

Each work experience entry supports the `visibility` and `technologies` fields:

```json
{
  "work": [
    {
      "name": "Company Name",
      "position": "Job Title",
      "location": "City, Country",
      "url": "https://example.com",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "summary": "Brief description",
      "highlights": ["Achievement 1", "Achievement 2"],
      "technologies": ["Technology 1", "Technology 2", "Technology 3"],
      "visibility": ["readme", "pdf", "website"]
    }
  ]
}
```

**Custom Fields:**
- `technologies` (array of strings, optional): List of technologies/tools used in this position. Displayed in README and can be used in other formats.

**Visibility Guidelines:**
- **README**: First 4-5 most recent/relevant positions
- **PDF**: Only the most recent position (current role)
- **Website**: All positions (complete work history)

### Education (`education`)

Each education entry supports the `visibility` field:

```json
{
  "education": [
    {
      "institution": "University Name",
      "url": "https://university.edu",
      "area": "Field of Study",
      "studyType": "Degree Type",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "score": "GPA / Grade",
      "summary": "Description",
      "courses": ["Course 1", "Course 2"],
      "keywords": ["Skill 1", "Skill 2"],
      "highlights": ["Achievement 1", "Achievement 2"],
      "visibility": ["pdf", "website"]
    }
  ]
}
```

**Visibility Guidelines:**
- **README**: Education section not included in README
- **PDF**: Only Master's degree programs
- **Website**: All education (including bachelor's and secondary education)

### Skills (`skills`)

Each skill category supports the `visibility` field:

```json
{
  "skills": [
    {
      "name": "Skill Category",
      "level": "Advanced/Intermediate/Beginner",
      "keywords": ["Technology 1", "Technology 2"],
      "visibility": ["website"]
    }
  ]
}
```

**Visibility Guidelines:**
- **README**: Skills not shown separately (included inline in work descriptions)
- **PDF**: Skills not shown separately (included inline in work descriptions)
- **Website**: All skill categories displayed

### Awards (`awards`)

Each award supports the `visibility` field:

```json
{
  "awards": [
    {
      "title": "Award Name",
      "date": "YYYY-MM-DD",
      "awarder": "Organization",
      "summary": "Description",
      "visibility": ["website"]
    }
  ]
}
```

**Visibility Guidelines:**
- **README**: Awards not included in README
- **PDF**: Awards not included in PDF
- **Website**: All awards displayed

### Languages (`languages`)

Each language entry supports the `visibility` field:

```json
{
  "languages": [
    {
      "language": "Language Name",
      "fluency": "Proficiency Level",
      "visibility": ["website"]
    }
  ]
}
```

**Visibility Guidelines:**
- **README**: Languages not included in README
- **PDF**: Languages can be added to sidebar if needed
- **Website**: All languages displayed

## Sections Without Visibility Control

The following sections apply globally to all formats:

### Basics (`basics`)

Contains personal information used across all formats:

```json
{
  "basics": {
    "name": "Full Name",
    "label": "Professional Title",
    "image": "URL to photo",
    "email": "email@example.com",
    "phone": "Phone number",
    "url": "https://website.com",
    "summary": "Professional summary",
    "location": {
      "address": "",
      "postalCode": "",
      "city": "City",
      "countryCode": "XX",
      "region": "Region"
    },
    "profiles": [
      {
        "network": "LinkedIn",
        "username": "username",
        "url": "https://linkedin.com/in/username"
      }
    ]
  }
}
```

**Usage:**
- **README**: Uses `summary` and `profiles`
- **PDF**: Uses `name`, `label`, and optionally contact info
- **Website**: Uses all fields

## Base Schema

This schema extends the [JSON Resume Schema v1.0.0](https://jsonresume.org/schema/) with the `visibility` field. All standard JSON Resume fields remain valid and compatible.

### Validation

When updating `resume.json`, ensure:

1. All `visibility` arrays contain only valid values: `"readme"`, `"pdf"`, or `"website"`
2. Dates follow ISO 8601 format: `YYYY-MM-DD`
3. Required fields per JSON Resume schema are present
4. At least one visibility target is specified for entries you want to appear

### Example Visibility Patterns

**Latest work position (appears everywhere relevant):**
```json
"visibility": ["readme", "pdf", "website"]
```

**Recent but not current position (README and website only):**
```json
"visibility": ["readme", "website"]
```

**Historical position (website only for complete history):**
```json
"visibility": ["website"]
```

**Master's degree (PDF and website):**
```json
"visibility": ["pdf", "website"]
```

**Bachelor's degree or earlier education (website only):**
```json
"visibility": ["website"]
```

## Updating the Resume

When adding or updating resume entries:

1. Edit `resume.json` with your changes
2. Include the `visibility` field with appropriate targets for each entry
3. Follow the visibility guidelines above
4. **Automatic generation** (recommended):
   - Commit and push `resume.json` to master branch
   - GitHub Actions automatically generates README.md and PDF CV
   - README.md is committed back to the repository
   - PDF is uploaded as a release
5. **Manual generation** (for local testing):
   - Run `npm run generate:all`
   - Verify outputs in `README.md` and `cv/output/cv.pdf`

## Automation

### CI/CD Pipeline

When `resume.json` is pushed to the `master` branch, a GitHub Actions workflow automatically:

1. **Generates README.md**
   - Runs `npm run generate:readme`
   - Commits changes back to master (if README changed)
   - Uses `[skip ci]` to prevent infinite loops

2. **Generates and Compiles PDF CV**
   - Runs `npm run generate:cv` (creates LaTeX files)
   - Runs `npm run generate:pdf` (compiles to PDF)
   - Uploads PDF as GitHub Actions artifact (90-day retention)

3. **Creates Release**
   - Creates a GitHub release with the PDF attached
   - Tag format: `cv-YYYY.MM.DD-{git-sha}`
   - Includes generation date and commit info

### Manual Workflow Trigger

You can manually trigger resume generation:
1. Go to GitHub Actions tab
2. Select "Sync Resume Formats" workflow
3. Click "Run workflow" on master branch

### Accessing Generated Files

**README.md:**
- Automatically committed to repository
- View on GitHub profile

**PDF CV:**
- Download from [Releases](https://github.com/CristianAbrante/CristianAbrante/releases)
- Latest release: `https://github.com/CristianAbrante/CristianAbrante/releases/latest`
- Also available as workflow artifacts (temporary, 90 days)

See [.github/workflows/README.md](.github/workflows/README.md) for full CI/CD documentation.

## Future Enhancements

Potential future additions to the schema:
- Tag system for more granular filtering (e.g., `"featured"`, `"technical"`)
- Custom ordering/priority fields
- Theme/styling preferences per output format
- Conditional content based on context (e.g., technical vs. business audience)

## Reference

- [JSON Resume Schema](https://jsonresume.org/schema/)
- [JSON Resume Specification](https://github.com/jsonresume/resume-schema)
