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
   - Commits and pushes changes back to master if changed
   - Uses `[skip ci]` in commit message to prevent infinite loops

2. **Generates LaTeX CV**
   - Runs `npm run generate:cv`
   - Creates `cv.tex` and `page1sidebar.tex`

3. **Generates Website**
   - Runs `npm run generate:website`
   - Creates HTML, CSS, and JS files in `website/output/`
   - Commits website files to repository if changed

4. **Compiles PDF**
   - Installs LaTeX (texlive) on Ubuntu runner
   - Runs `npm run generate:pdf`
   - Generates `cv.pdf`

5. **Uploads Artifacts**
   - Uploads PDF as GitHub Actions artifact (90-day retention)
   - Artifact name: `cv-YYYY.MM.DD-{git-sha}`

6. **Creates Release**
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
  ├─ Generate cv.tex + page1sidebar.tex
  ├─ Generate website files (HTML, CSS, JS)
  ├─ Commit README.md and website files (if changed)
  ├─ Compile cv.pdf
  ├─ Upload cv.pdf as artifact
  └─ Create release with cv.pdf
```

### `deploy-website.yml` - GitHub Pages Deployment

Automatically deploys the resume website to GitHub Pages when `resume.json` or website files change.

**Triggers:**
- Push to `master` branch with changes to:
  - `resume.json`
  - `website/**` (any website files)
  - `scripts/generate-website.js`
- Manual trigger via GitHub Actions UI (workflow_dispatch)

**What it does:**

1. **Generates Website**
   - Runs `npm run generate:website`
   - Creates fresh HTML, CSS, and JS from `resume.json`

2. **Prepares for Deployment**
   - Adds `.nojekyll` file to prevent Jekyll processing
   - Configures GitHub Pages settings

3. **Deploys to GitHub Pages**
   - Uploads `website/output/` as Pages artifact
   - Deploys to production URL: `https://cristianabrante.github.io`

**Environment:**
- Runner: `ubuntu-latest`
- Node.js: v20
- Environment: `github-pages`

**Permissions:**
- `contents: read` - Read repository files
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - Required for Pages deployment

**Concurrency:**
- Only one deployment at a time
- Queued deployments wait for current to complete
- Ensures no conflicting deployments

**Example workflow run:**

```
resume.json updated → Workflow triggered
  ├─ Generate website from resume.json
  ├─ Add .nojekyll file
  ├─ Upload website/output/ to Pages
  └─ Deploy to https://cristianabrante.github.io
```

## Manual Trigger

You can manually trigger any workflow:

1. Go to **Actions** tab in GitHub
2. Select the workflow (**Sync Resume Formats** or **Deploy Website**)
3. Click **Run workflow**
4. Select branch (usually `master`)
5. Click **Run workflow**

This is useful for:
- Regenerating formats after template changes
- Creating a new PDF release manually
- Deploying website changes immediately
- Testing workflow changes

## Accessing Generated Files

### README.md
- Automatically committed to repository
- View at: `https://github.com/CristianAbrante/CristianAbrante/blob/master/README.md`

### Website
- Automatically deployed to GitHub Pages
- View at: `https://cristianabrante.github.io`
- Updates within 1-2 minutes after workflow completes

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
# Test full workflow (all formats)
npm run generate:all

# Test individual formats
npm run generate:readme
npm run generate:cv
npm run generate:website
npm run generate:pdf

# Verify outputs
ls -la cv/output/cv.pdf
ls -la website/output/
cat README.md
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

**Website not deploying:**
- Verify GitHub Pages is enabled in repository settings
- Check that "Source" is set to "GitHub Actions" (not branch)
- Go to Settings → Pages in repository
- Ensure `pages: write` and `id-token: write` permissions are set
- Check deployment URL in workflow run output

**Release creation fails:**
- Check `GITHUB_TOKEN` has correct permissions
- Verify tag format is unique
- Ensure PDF file exists at specified path

## Security

- Uses `GITHUB_TOKEN` (automatically provided by GitHub Actions)
- No custom secrets required
- Bot account for commits: `github-actions[bot]`
- Only triggers on specific file changes in `master` branch
- GitHub Pages deployment uses secure OIDC token authentication

## GitHub Pages Setup

To enable website deployment, you need to configure GitHub Pages in your repository settings:

### One-Time Setup Steps:

1. **Go to Repository Settings:**
   - Navigate to: `https://github.com/CristianAbrante/CristianAbrante/settings/pages`

2. **Configure Source:**
   - Under "Build and deployment" section
   - Set **Source** to: `GitHub Actions` (not "Deploy from a branch")
   - Click **Save**

3. **Trigger First Deployment:**
   - **Option A:** Make any change to `resume.json` and push
   - **Option B:** Go to Actions → "Deploy Website" → "Run workflow"

4. **Verify Deployment:**
   - Go to Actions tab and watch the "Deploy Website" workflow run
   - Once complete (usually 1-2 minutes), visit: `https://cristianabrante.github.io`
   - Your resume website should be live!

### Custom Domain (Optional):

If you want to use a custom domain like `cristianabrante.com`:

1. Add your domain in repository Settings → Pages → Custom domain
2. Create CNAME file: `echo "your-domain.com" > website/output/CNAME`
3. Configure DNS with your domain provider:
   - For apex domain (cristianabrante.com): Add A records to GitHub IPs
   - For subdomain (www.cristianabrante.com): Add CNAME to `cristianabrante.github.io`

See [GitHub Pages custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for details.

## Future Enhancements

Planned improvements:
- Add JSON schema validation before generation
- Add notification on successful generation
- Support for multiple language versions
- Automated screenshot generation for website previews
- Integration with LinkedIn API for automatic profile sync
