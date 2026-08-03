# Resume Generation Scripts

This directory contains scripts for generating different resume formats from `resume.json`.

## Available Scripts

### `generate-readme.js`

Generates `README.md` from `resume.json`.

**Usage:**
```bash
npm run generate:readme
```

**What it does:**
- Reads `resume.json`
- Filters entries with `visibility: ["readme"]`
- Generates README.md with:
  - Greeting header
  - About section (from `basics.summary`)
  - Work Experience (filtered by visibility)
  - Links section (LinkedIn, GitHub, website, email)

**Features:**
- Displays technologies from `technologies` field
- Formats dates as "Month Year - Month Year" (or "Present")
- Handles GitHub organization URLs with special formatting
- Adds HTML comments indicating the file is auto-generated

---

### `generate-website.js`

Generates the static website in `website/output/` from `resume.json`.

**Usage:**
```bash
npm run generate:website
```

---

### Compile PDF with Typst

**Usage:**
```bash
npm run generate:pdf     # one-time compile
npm run watch:pdf        # live preview (recompiles on change)
```

**What it does:**
- Compiles `cv/cv.typ` to `cv/output/cv.pdf` using the Typst CLI
- `cv/cv.typ` reads `resume.json` directly — there is no intermediate
  code-generation step or script for the PDF

**Prerequisites:**
- Typst must be installed (see [cv/README.md](../cv/README.md))

---

### Generate All Formats

**Usage:**
```bash
npm run generate:all
```

Equivalent to running:
```bash
npm run generate:readme && npm run generate:pdf && npm run generate:website
```

## Development

All scripts are written in Node.js and use only built-in modules (no external dependencies required for generation scripts).

### Script Structure

Each generation script follows this pattern:

1. **Load**: Read and parse `resume.json`
2. **Filter**: Apply visibility rules for the target format
3. **Transform**: Convert JSON data to target format
4. **Write**: Save the generated output

### Adding New Scripts

When adding new generation scripts:

1. Place them in the `scripts/` directory
2. Add npm script in `package.json`
3. Follow the existing pattern for loading/filtering
4. Add documentation here
5. Export functions for testing if needed

## Troubleshooting

**Script fails to find resume.json:**
- Ensure you're running scripts from the project root
- Scripts use relative paths from the scripts directory

**Generated output looks incorrect:**
- Check visibility fields in resume.json
- Verify JSON is valid with `node -c resume.json`
- Review script logic for the specific format

## Examples

```bash
# Generate README only
npm run generate:readme

# Compile PDF CV with Typst
npm run generate:pdf

# Live preview the PDF while editing resume.json or cv/cv.typ
npm run watch:pdf

# Generate everything (README + PDF + website)
npm run generate:all
```
