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

### `generate-signature.js`

Generates Gmail-pasteable email signatures in `signature/output/` from
`resume.json`.

**Usage:**
```bash
npm run generate:signature
open signature/output/index.html   # preview + copy buttons
```

**What it does:**
- Reads `basics` only (name, label, email, url, location, profiles) — the
  signature shows the job title without an employer and omits the phone
  number, so it stays valid across job changes
- Writes three variants plus a plain-text fallback:
  - `signature-standard.html` — accent bar, full contact details, no images
  - `signature-photo.html` — adds the avatar hosted at `cristianabrante.com/picture.jpg`
  - `signature-minimal.html` — two compact lines for replies
  - `signature.txt` — plain-text signature
  - `index.html` — preview page with per-variant copy-to-clipboard buttons

**Email-client constraints enforced by the generator:**
- Table-based layout with `role="presentation"`, no `<style>` blocks and no
  classes — Gmail strips both from pasted signatures
- Every style is inline, including explicit `color` on each `<a>` (Gmail does
  not inherit link color)
- Spacing comes from spacer rows and `line-height`, not margins
- Brand colors are mirrored from `website/template/style.css`

---

### Compile PDF with Typst

**Usage:**
```bash
npm run generate:pdf     # one-time compile
npm run watch:pdf        # live preview (recompiles on change)
```

**What it does:**
- Compiles `cv/cv.typ` to `cv/output/cv-cristian-abrante.pdf` using the Typst CLI
- `cv/cv.typ` reads `resume.json` directly — there is no intermediate
  code-generation step or script for the PDF

**Prerequisites:**
- Typst must be installed (see [cv/README.md](../cv/README.md))

---

### `verify-ats.js`

Verifies the compiled PDF is ATS-parseable.

**Usage:**
```bash
npm run verify:ats
```

**What it does:**
- Extracts the PDF text layer with `pdftotext` (requires poppler:
  `brew install poppler` on macOS)
- Asserts every pdf-visible field from `resume.json` appears in the extracted
  text (contact info, sections, jobs, education, awards, skills, languages)
- Writes `cv/output/ats-report.json` and `cv/output/ats-report.md`
- Exits non-zero on any missing field (used as a PR gate in CI)

---

### `verify-website.js`

Verifies the generated website is structurally coherent.

**Usage:**
```bash
npm run generate:website && npm run verify:website
```

**What it does:**
- Asserts every website-visible `resume.json` field reaches the HTML: basics,
  profiles, work (position, company, summary, **highlights**, technologies),
  education, skills and awards
- Asserts every referenced local asset exists in `website/output/`
- Fails on root-absolute asset paths (`/foo.css`), which break when the site is
  served from a subfolder such as a PR preview
- Fails on unreplaced `{{PLACEHOLDER}}` tokens, invalid JSON-LD, and in-page
  `#anchors` with no matching element
- Exits non-zero on any failure (used as a PR gate in CI)

> `cv/cv.typ` renders `job.summary` but **not** `job.highlights`, so highlights
> appear on the website only. This script is the only thing guarding them.

---

### `build-preview.js`

Assembles the per-PR preview bundle published to Cloudflare Pages.

**Usage:**
```bash
npm run generate:all        # produce website, signature and CV first
npm run generate:preview    # assemble preview/
# optionally with PR context:
npm run generate:preview -- --pr 48 --sha $(git rev-parse HEAD)
```

**What it does:**
- Copies `website/output/`, `signature/output/` and the compiled CV into a
  single bundle. `website/` and `signature/` are nested because both ship an
  `index.html`:

  ```
  preview/
    index.html      landing page linking to all three
    website/
    signature/
    cv.pdf
    robots.txt      Disallow: /
  ```

- Generates a mobile-first landing page showing the PR number and commit
- Forces `<meta name="robots" content="noindex, nofollow">` into every HTML file
  in the bundle, replacing the website's production `index, follow` directive
- Exits non-zero with the exact `npm run` command to fix if any build output is
  missing

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
