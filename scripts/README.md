# Resume Generation Scripts

Scripts that generate different resume formats from the single source of truth: [`resume.json`](../resume.json).

## Scripts

| Command | Script | Output |
|---|---|---|
| `npm run generate:readme` | [`generate-readme.js`](./generate-readme.js) | Root `README.md` (entries with `visibility: ["readme"]`) |
| `npm run generate:cv` | [`generate-cv-typst.js`](./generate-cv-typst.js) | `cv/typst/cv.typ` (entries with `visibility: ["pdf"]`) |
| `npm run generate:pdf` | `typst compile ...` | `cv/typst/cv.pdf` |
| `npm run generate:website` | [`generate-website.js`](./generate-website.js) | `website/output/` (entries with `visibility: ["website"]`) |
| `npm run validate:ats` | [`validate-ats.js`](./validate-ats.js) | Asserts the PDF text layer parses cleanly for ATS |
| `npm run generate:all` | — | Runs all of the above in order and validates ATS at the end |

## Prerequisites

- **Node.js 20+** — all generators
- **[Typst](https://github.com/typst/typst)** — `brew install typst` (compiles the CV PDF)
- **poppler-utils** — `brew install poppler` on macOS / `apt-get install poppler-utils` on Ubuntu (provides `pdftotext` used by `validate:ats`)

## PDF Design

The PDF CV uses the [`basic-resume`](https://typst.app/universe/package/basic-resume/) Typst package (single column, Computer Modern serif, small-caps section headings). This is the same editorial style popularised by Jake Gutierrez's LaTeX template. The design is deliberately ATS-safe: single column, standard section headings (`Experience`, `Education`, `Skills`, `Awards`), plain bullets, selectable text layer.

To tweak colors, fonts, or layout, edit the `#show: resume.with(...)` block in [`generate-cv-typst.js`](./generate-cv-typst.js).

## Visibility

Every generator filters `resume.json` by the `visibility` array on each entry:

- `"readme"` → included in the GitHub README
- `"pdf"`    → included in the PDF CV
- `"website"` → included in the website build

See [`SCHEMA.md`](../SCHEMA.md) for full documentation.
