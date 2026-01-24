# CV Directory

This directory contains the LaTeX-based PDF CV generation system.

## Structure

```
cv/
├── template/          # LaTeX template files
│   ├── altacv.cls    # AltaCV document class
│   ├── main.tex      # Original template (reference)
│   ├── picture.jpg   # Profile picture
│   └── *.tex         # Sidebar templates (reference)
└── output/           # Generated files (git-ignored)
    ├── cv.tex        # Generated LaTeX from resume.json
    ├── cv.pdf        # Compiled PDF
    └── ...           # LaTeX auxiliary files
```

## Generating the CV

### Prerequisites

You need LaTeX installed on your system:

**macOS:**
```bash
brew install --cask mactex
# Or for a smaller installation:
brew install --cask basictex
```

**Ubuntu/Debian:**
```bash
sudo apt-get install texlive-full
```

**Windows:**
Download and install [MiKTeX](https://miktex.org/) or [TeX Live](https://www.tug.org/texlive/)

### Generation Steps

1. **Generate LaTeX from resume.json:**
   ```bash
   npm run generate:cv
   ```
   This creates `cv/output/cv.tex` from your resume.json data.

2. **Compile to PDF:**
   ```bash
   cd cv/output
   pdflatex cv.tex
   ```
   This creates `cv/output/cv.pdf`.

### One-Command Generation

For convenience, you can also run:
```bash
npm run generate:cv && cd cv/output && pdflatex -interaction=nonstopmode cv.tex
```

## What's Included in the PDF

The PDF CV includes entries from `resume.json` with `visibility: ["pdf"]`:

- **Work Experience**: Latest position only (currently ALOHAS)
- **Education**: Master's degrees only (Aalto + UPM)
- **Technologies**: Listed for each position
- **Contact Info**: Email, website, LinkedIn, GitHub

## Customization

### Changing CV Content

Edit `resume.json` and regenerate:
```bash
npm run generate:cv
cd cv/output && pdflatex cv.tex
```

### Changing CV Style

The CV uses the [AltaCV](https://github.com/liantze/AltaCV) template.

To customize colors, layout, or fonts:
1. Modify `scripts/generate-cv.js` (color definitions, layout)
2. Or edit `cv/template/altacv.cls` directly

Current color scheme:
- **Accent**: Teal (#15959F)
- **Heading**: Dark blue (#133046)
- **Body**: Gray (#666666)

### Profile Picture

Replace `cv/template/picture.jpg` with your own photo. The script will copy it to the output directory automatically.

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

See [SCHEMA.md](../SCHEMA.md) for full documentation.

## Troubleshooting

**Error: `pdflatex: command not found`**
- LaTeX is not installed. See Prerequisites section above.

**PDF looks broken or incomplete:**
- Run `pdflatex cv.tex` twice to resolve references:
  ```bash
  pdflatex cv.tex && pdflatex cv.tex
  ```

**Changes not reflected:**
- Make sure to regenerate the LaTeX file first:
  ```bash
  npm run generate:cv
  ```

**Compilation errors:**
- Check `cv/output/cv.log` for detailed error messages
- Ensure resume.json has valid data
- Run `npm run generate:cv` again

## CI/CD

In Phase 4, GitHub Actions will automatically:
1. Generate `cv.tex` from resume.json
2. Compile to PDF
3. Upload as artifact and release

Until then, generate manually as needed.

## References

- [AltaCV Template](https://github.com/liantze/AltaCV)
- [JSON Resume Schema](https://jsonresume.org/schema/)
- [LaTeX Documentation](https://www.latex-project.org/help/documentation/)
