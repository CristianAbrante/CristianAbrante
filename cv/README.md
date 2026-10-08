# CV Directory

This directory contains the Typst-based PDF CV generation system, using the
[modern-cv](https://typst.app/universe/package/modern-cv) template.

## Structure

```
cv/
├── cv.typ            # Typst template (reads resume.json directly)
├── picture.jpg       # Profile picture
├── modern-cv/        # Vendored modern-cv 0.10.0 (with custom header params)
├── fonts/            # Vendored fonts (IBM Plex Mono, IBM Plex Sans, Font Awesome 7)
├── logos/            # Company/university logos for entries
└── output/           # Generated files (git-ignored)
    └── cv-cristian-abrante.pdf   # Compiled PDF
```

There is no code-generation step: `cv.typ` loads `../resume.json` natively with
Typst's `json()` function and filters entries by visibility at compile time.

## Generating the CV

### Prerequisites

You need the Typst CLI installed.

**Recommended — [mise](https://mise.jdx.dev) (all platforms):** `mise.toml` at the
repository root pins Typst, Node and uv, so one command gets the exact versions
CI uses:

```bash
mise install
```

Typst comes from mise's `aqua` backend, which downloads the official prebuilt
binary — no Rust toolchain and no Homebrew required.

<details>
<summary>Installing Typst without mise</summary>

```bash
brew install typst                   # macOS
snap install typst                   # Linux
cargo install --locked typst-cli     # any platform, needs Rust
winget install --id Typst.Typst      # Windows
```

Prebuilt binaries for every platform are also published on the
[Typst releases page](https://github.com/typst/typst/releases).

</details>

All required fonts are vendored in `cv/fonts/` — no font installation needed.

`npm run verify:ats` additionally needs poppler's `pdftotext`
(`brew install poppler`); poppler is not available through mise.

### Compile

```bash
npm run generate:pdf
```

This runs (from the repository root):
```bash
typst compile cv/cv.typ cv/output/cv-cristian-abrante.pdf --root . --font-path cv/fonts
```

- `--root .` allows `cv.typ` to read `resume.json` at the repository root.
- `--font-path cv/fonts` uses the vendored fonts for reproducible output.

### Live preview (watch mode)

```bash
npm run watch:pdf
```

Recompiles automatically whenever `cv.typ` or `resume.json` changes. Open
`cv/output/cv-cristian-abrante.pdf` in a viewer that auto-reloads (e.g. Skim on macOS, or the
Preview pane in VS Code with a PDF extension).

### One-Command Generation

Generate everything (README + PDF + website) at once:
```bash
npm run generate:all
```

## What's Included in the PDF

The PDF CV includes entries from `resume.json` with `visibility: ["pdf"]`:

- **Profile**: Summary from `basics.summary`
- **Work Experience**: Position, company, dates, summary, and technologies
- **Education**: Institution, degree, dates, grade, and key subjects
- **Awards**: Title, awarder, and date
- **Skills & Languages**: Skill categories and language fluency
- **Contact Info**: Email, phone, website, LinkedIn, GitHub (with icons)

## Customization

### Changing CV Content

Edit `resume.json` and recompile:
```bash
npm run generate:pdf
```

### Changing CV Style

The CV uses the [modern-cv](https://github.com/DeveloperPaul123/modern-cv)
Typst template, vendored in `cv/modern-cv/` (v0.10.0). The vendored copy adds
two header parameters not available upstream: `name-size` and
`profile-picture-size`. To customize, edit `cv/cv.typ`:

- **Accent color**: the `accent` binding at the top of `cv.typ`
  (`rgb("#175FA8")`, deep azure). It and the ink ramp in
  `cv/modern-cv/lib.typ` are the day-theme tokens from
  [`DESIGN.md`](../DESIGN.md) — change them there first, not here.
- **Header size**: `name-size: 22pt`, `profile-picture-size: 2.6cm`
- **Body size**: `size: 10.5pt` in `cv/modern-cv/lib.typ` (the `resume` function,
  not the `coverletter` twin below it). This is the largest size that still fits
  one page in IBM Plex Sans — 10.75pt spills onto a second. Check
  `pdfinfo cv/output/cv-cristian-abrante.pdf` after changing it or adding content
- **Fonts**: `font: "IBM Plex Sans"` for body, `header-font: "IBM Plex Mono"` for the name — the same families as the website
- **Paper size**: `paper-size: "a4"`
- **Sections**: Reorder or edit the `= Section` blocks and their loops

For deeper styling changes (spacing, colors, header layout), edit
`cv/modern-cv/lib.typ` directly — it is part of this repository.

### Entry Logos

Work and education entries can show a small logo next to their title. Add a
`logo` field to the entry in `resume.json`, with a path relative to `cv/`:

```json
{
  "name": "Company",
  "logo": "logos/company.png",
  "visibility": ["pdf"]
}
```

Place the image in `cv/logos/` (square images render best; they're displayed
at text height with slightly rounded corners). Entries without a `logo` field
render without one.

### Profile Picture

Replace `cv/picture.jpg` with your own photo (square, 1:1 aspect ratio
recommended). Set `profile-picture: none` in `cv.typ` to remove it.

### Fonts

Fonts are vendored in `cv/fonts/` so local and CI builds are reproducible:

- **IBM Plex Mono** (the name in the header) — SIL OFL 1.1
- **IBM Plex Sans** (body) — SIL OFL 1.1
- **Font Awesome 7 Free** (contact icons) — SIL OFL 1.1

## Visibility Control

To control what appears in the PDF, edit the `visibility` field in `resume.json`:

```json
{
  "work": [
    {
      "name": "Company",
      "visibility": ["readme", "pdf", "website"]
    }
  ]
}
```

**PDF visibility rules:**
- `"pdf"` in visibility array → included in PDF
- Otherwise → excluded

## Troubleshooting

**Error: `typst: command not found`**
- Typst is not installed. See Prerequisites section above.

**Warning: `unknown font family`**
- Make sure you compile with `--font-path cv/fonts` (the npm scripts do this
  automatically).

**Error: `file not found (searched at /resume.json)`**
- Compile from the repository root with `--root .` (use the npm scripts).

**Icons show as empty boxes:**
- The Font Awesome 7 OTF files must be present in `cv/fonts/`.

## CI/CD

GitHub Actions (`.github/workflows/sync-resume.yml`) automatically:
1. Installs Typst via `jdx/mise-action@v2`, pinned in `mise.toml`
2. Compiles `cv/cv.typ` to PDF
3. Uploads the PDF as an artifact and creates a GitHub release

Triggered on pushes to `master` that change `resume.json`, `cv/cv.typ`, or
`cv/fonts/`.

## References

- [modern-cv Template](https://github.com/DeveloperPaul123/modern-cv)
- [Typst Documentation](https://typst.app/docs/)
- [JSON Resume Schema](https://jsonresume.org/schema/)
