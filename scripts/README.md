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

### Generate All Formats

**Usage:**
```bash
npm run generate:all
```

**What it does:**
- Generates README.md
- Generates LaTeX CV files (cv.tex, page1sidebar.tex)
- Compiles PDF from LaTeX

This is equivalent to running:
```bash
npm run generate:readme && npm run generate:cv && npm run generate:pdf
```

**Future:** Will also generate website files (Phase 5).

---

### Compile PDF from LaTeX

**Usage:**
```bash
npm run generate:pdf
```

**What it does:**
- Compiles `cv/output/cv.tex` to `cv/output/cv.pdf` using pdflatex
- Runs in non-interactive mode for automated builds

**Prerequisites:**
- LaTeX must be installed (see [cv/README.md](../cv/README.md))
- LaTeX files must already be generated (`npm run generate:cv`)

---

### `generate:all` (Coming in Phase 7)

Generates all formats at once:
```bash
npm run generate:all
```

Currently generates:
- README.md
- LaTeX CV (cv.tex)

Future: Will also generate website files.

## Future Scripts

Additional scripts will be added in upcoming phases:

- `generate-cv.js` - Generate LaTeX CV (Phase 3)
- `generate-website.js` - Generate static website (Phase 5)
- `generate-all.js` - Generate all formats (Phase 7)
- `validate-resume.js` - Validate resume.json schema (Phase 7)

## Future Scripts

Additional scripts planned for upcoming phases:

- `generate-website.js` - Generate static website (Phase 5)
- `validate-resume.js` - Validate resume.json schema (Phase 7)

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

# Generate LaTeX CV files only
npm run generate:cv

# Compile PDF from existing LaTeX files
npm run generate:pdf

# Generate everything (README + CV + PDF)
npm run generate:all
```
