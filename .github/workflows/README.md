# GitHub Actions Workflows

This directory contains CI/CD workflows for automating resume generation.

## Workflows

### `sync-resume.yml` - Resume Format Synchronization

Automatically generates and updates all resume formats when `resume.json` changes.

**Triggers:**
- Push to `master` branch with changes to `resume.json`
- Manual trigger via GitHub Actions UI (workflow_dispatch)

**What it does:**

1. **Generates README.md**
   - Runs `npm run generate:readme`
   - Commits and pushes changes back to master if README changed
   - Uses `[skip ci]` in commit message to prevent infinite loops

2. **Generates LaTeX CV**
   - Runs `npm run generate:cv`
   - Creates `cv.tex` and `page1sidebar.tex`

3. **Compiles PDF**
   - Installs LaTeX (texlive) on Ubuntu runner
   - Runs `npm run generate:pdf`
   - Generates `cv.pdf`

4. **Uploads Artifacts**
   - Uploads PDF as GitHub Actions artifact (90-day retention)
   - Artifact name: `cv-YYYY.MM.DD-{git-sha}`

5. **Creates Release**
   - Creates a GitHub release with the PDF attached
   - Tag format: `cv-YYYY.MM.DD-{git-sha}`
   - Includes commit SHA and generation date in release notes

**Environment:**
- Runner: `ubuntu-latest`
- Node.js: v20
- LaTeX: texlive-latex-base + fonts + extras

**Permissions:**
- `contents: write` - Required to commit README changes and create releases

**Example workflow run:**

```
resume.json updated → Workflow triggered
  ├─ Generate README.md
  ├─ Commit README.md (if changed)
  ├─ Generate cv.tex + page1sidebar.tex  
  ├─ Compile cv.pdf
  ├─ Upload cv.pdf as artifact
  └─ Create release with cv.pdf
```

## Manual Trigger

You can manually trigger the workflow:

1. Go to **Actions** tab in GitHub
2. Select **Sync Resume Formats** workflow
3. Click **Run workflow**
4. Select branch (usually `master`)
5. Click **Run workflow**

This is useful for:
- Regenerating formats after template changes
- Creating a new PDF release manually
- Testing workflow changes

## Accessing Generated Files

### README.md
- Automatically committed to repository
- View at: `https://github.com/CristianAbrante/CristianAbrante/blob/master/README.md`

### PDF (Artifacts)
- Go to workflow run page
- Download from "Artifacts" section
- Available for 90 days

### PDF (Releases)
- Go to: `https://github.com/CristianAbrante/CristianAbrante/releases`
- Download latest CV: `https://github.com/CristianAbrante/CristianAbrante/releases/latest`
- Permanent storage

## Development

### Testing Locally

Before pushing workflow changes, test generation locally:

```bash
# Test full workflow
npm run generate:all

# Verify output
ls -la cv/output/cv.pdf
```

### Workflow Modifications

When modifying the workflow:

1. Update this documentation
2. Test locally with `npm run generate:all`
3. Create PR for workflow changes
4. Test on PR branch using manual trigger
5. Merge when verified

### Common Issues

**LaTeX compilation fails:**
- Check LaTeX installation step includes all required packages
- Test locally: `npm run generate:pdf`
- Check logs in GitHub Actions run

**README not committing:**
- Verify `contents: write` permission is set
- Check git config in workflow
- Look for `[skip ci]` in commit message to avoid loops

**Release creation fails:**
- Check `GITHUB_TOKEN` has correct permissions
- Verify tag format is unique
- Ensure PDF file exists at specified path

## Security

- Uses `GITHUB_TOKEN` (automatically provided by GitHub Actions)
- No custom secrets required
- Bot account for commits: `github-actions[bot]`
- Only triggers on `resume.json` changes in `master` branch

## Future Enhancements

Planned improvements:
- Add JSON schema validation before generation
- Generate website files (Phase 5)
- Add notification on successful generation
- Deploy website to GitHub Pages
