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

### `generate-cv.js`

Generates LaTeX CV from `resume.json`.

**Usage:**
```bash
npm run generate:cv
```

**What it does:**
- Reads `resume.json`
- Filters entries with `visibility: ["pdf"]`
- Generates LaTeX file at `cv/output/cv.tex` with:
  - Work Experience (latest position only)
  - Education (master's degrees only)
  - Contact information in sidebar
  - Technologies for each position

**Features:**
- Escapes LaTeX special characters automatically
- Formats dates for LaTeX documents
- Copies necessary template files (altacv.cls, picture.jpg)
- Auto-generated comment in output file

**Compiling to PDF:**
After generating the LaTeX file, compile it:
```bash
cd cv/output && pdflatex cv.tex
```

Or run both steps:
```bash
npm run generate:cv && cd cv/output && pdflatex -interaction=nonstopmode cv.tex
```

See [cv/README.md](../cv/README.md) for full documentation.

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

# (Coming soon) Generate all formats
npm run generate:all

# (Coming soon) Validate resume before generating
npm run validate:resume && npm run generate:all
```
