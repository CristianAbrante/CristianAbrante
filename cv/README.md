# CV

Single-page PDF CV generated from [`resume.json`](../resume.json) using [Typst](https://typst.app) + the [`basic-resume`](https://typst.app/universe/package/basic-resume/) package.

## Structure

```
cv/
└── typst/
    ├── cv.typ    # Generated Typst source (from resume.json)
    └── cv.pdf    # Compiled PDF (committed, released via GitHub Actions)
```

## Generate

```bash
# One command
npm run generate:cv && npm run generate:pdf

# Or: everything (README + CV + website + ATS validation)
npm run generate:all
```

## Design

Editorial single-column layout: Computer Modern serif, small-caps section headings underlined in teal (`#025159`), plain bullets. Optimised for both human readability and ATS parsing (Workday, Greenhouse, Lever, Taleo, iCIMS).

To customise colors, fonts, or margins, edit the `#show: resume.with(...)` block in [`scripts/generate-cv-typst.js`](../scripts/generate-cv-typst.js).

## ATS Validation

Every generation runs `npm run validate:ats`, which extracts the PDF text layer with `pdftotext` and asserts that standard section headings appear in the expected reading order. See [`scripts/validate-ats.js`](../scripts/validate-ats.js).

## Prerequisites

- **Typst**: `brew install typst`
- **poppler-utils** (for `validate:ats`): `brew install poppler`
