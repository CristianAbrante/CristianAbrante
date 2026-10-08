# GitHub Actions Workflows

This directory contains CI/CD workflows for automating resume generation.

## Workflows

### `sync-resume.yml` - Resume Format Synchronization

Automatically generates and updates all resume formats when `resume.json` changes.

**Triggers:**
- Push to `master` branch with changes to `resume.json`, `cv/cv.typ`, or `cv/fonts/**`
- Manual trigger via GitHub Actions UI (workflow_dispatch)

**What it does:**

1. **Generates README.md**
   - Runs `npm run generate:readme`
   - Commits and pushes changes back to master if changed
   - Uses `[skip ci]` in commit message to prevent infinite loops

2. **Generates Website**
   - Runs `npm run generate:website`
   - Creates HTML, CSS, and JS files in `website/output/`
   - Output is gitignored; deployment happens via the `deploy-website.yml` workflow (GitHub Pages)

3. **Compiles PDF with Typst**
   - Installs Typst via `typst-community/setup-typst@v5` (with package caching)
   - Runs `npm run generate:pdf` → `typst compile cv/cv.typ cv/output/cv-cristian-abrante.pdf --root . --font-path cv/fonts`
   - `cv/cv.typ` reads `resume.json` directly (no code generation step)
   - Fonts are vendored in `cv/fonts/` (Roboto, Source Sans 3, Font Awesome 7)

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
- Typst: latest (via typst-community/setup-typst)

**Permissions:**
- `contents: write` - Required to commit README changes and create releases

**Example workflow run:**

```
resume.json updated → Workflow triggered
  ├─ Generate README.md
  ├─ Generate website files (HTML, CSS, JS)
  ├─ Commit README.md and website files (if changed)
  ├─ Compile cv-cristian-abrante.pdf (typst compile cv/cv.typ)
  ├─ Upload cv-cristian-abrante.pdf as artifact
  └─ Create release with cv-cristian-abrante.pdf
```

### `pr-preview.yml` - Per-PR Live Preview

Builds all three deliverables on every pull request and publishes them to a
single live URL on Cloudflare Pages, so the website, the email signature and the
CV can be reviewed in a real browser (including from a phone) before merging.

**Triggers:**
- Pull requests changing `resume.json`, `website/**`, `signature/**`, `cv/**`,
  `scripts/**`, or the workflow itself

**What it does:**

1. **Generates** website, signature and CV (`generate:website`, `generate:signature`, `generate:pdf`)
2. **Runs both verification gates**, reporting into the same sticky comment:
   - `verify:website` — every website-visible `resume.json` field reached the HTML
   - `verify:ats` — every pdf-visible field survives `pdftotext` extraction, the
     same technique an Applicant Tracking System uses
   
   Both use `continue-on-error` so the preview still deploys and the comment
   still posts when a check fails — you can look at the broken output while
   reading the failure. A final step then fails the job, so the check still
   goes red.
3. **Assembles the preview bundle** (`generate:preview` → `scripts/build-preview.js`):

   ```
   preview/
     index.html      landing page linking to all three
     website/        generated site
     signature/      signature variants + copy-to-clipboard page
     cv.pdf          compiled CV (renders inline in the browser)
     robots.txt      Disallow: /
   ```

4. **Diffs the CV text layer** against the base branch — compiles the base
   commit's CV in a `git worktree`, extracts both with `pdftotext`, and posts a
   unified diff. Catches silently dropped or reworded CV content.
5. **Uploads the bundle** as artifact `preview-pr{number}` (14-day retention).
   This runs for *every* PR, including forks.
6. **Deploys to Cloudflare Pages** via `cloudflare/wrangler-action@v4` with
   `--branch=pr-{number}`, producing a stable alias URL
   `https://pr-{number}.cristianabrante-preview.pages.dev`
7. **Comments on the PR** with the three links, a pass/fail table for both
   verification gates (with expandable per-field failures and warnings), and the
   CV text diff — one sticky comment, updated in place
   (marker `<!-- pr-preview-comment -->`)

**Run the gates locally:**
```bash
brew install poppler   # one-time, for pdftotext
npm run generate:all
npm run verify:website && npm run verify:ats
```

**Fork and Dependabot safety:**
- Steps 1–5 run for everyone. Steps 6–7 are gated on
  `github.event.pull_request.head.repo.full_name == github.repository`, because
  fork PRs receive neither repository secrets nor a writable `GITHUB_TOKEN`.
  Fork PRs therefore stay **green** and still get the verified artifact.
- The `paths:` filter deliberately excludes `package.json` / `package-lock.json`,
  so Dependabot PRs never trigger this workflow.
- This workflow uses `pull_request`, never `pull_request_target` — the latter
  would expose deployment credentials to arbitrary fork code.

**Search engine indexing:**
Cloudflare serves `X-Robots-Tag: noindex` on all preview deployments
automatically. `build-preview.js` additionally forces
`<meta name="robots" content="noindex, nofollow">` into every HTML file and
writes a root `robots.txt`, so draft resume content stays unindexed regardless
of host.

**Required repository secrets:**
- `CLOUDFLARE_API_TOKEN` - token with the **Cloudflare Pages: Edit** permission
- `CLOUDFLARE_ACCOUNT_ID` - your Cloudflare account ID

**Permissions:**
- `contents: read` - Read repository files
- `pull-requests: write` - Create/update the preview comment
- `deployments: write` - Let the Cloudflare action create a GitHub Deployment

---

### `verify-website.yml` - Website Verification

Asserts the generated website is coherent, on every PR that can affect it.

**Triggers:**
- Pull requests changing `resume.json`, `website/**`,
  `scripts/generate-website.js`, `scripts/verify-website.js`, or the workflow itself

**What it does:**

1. **Generates the website** from `resume.json`
2. **Runs `npm run verify:website`**, which fails the check if:
   - any website-visible `resume.json` field is missing from the HTML —
     including `highlights`, which `cv/cv.typ` does **not** render, making this
     the only gate protecting them
   - a referenced local asset does not exist in `website/output/`
   - an asset path is root-absolute (breaks when served from a preview subfolder)
   - a `{{PLACEHOLDER}}` was left unreplaced
   - the JSON-LD block is not valid JSON
   - an in-page `#anchor` has no matching element

**Run locally:**
```bash
npm run generate:website && npm run verify:website
```

**Permissions:**
- `contents: read` - Read repository files

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
   - Adds `CNAME` file with custom domain: `cristianabrante.com`
   - Configures GitHub Pages settings

3. **Deploys to GitHub Pages**
   - Uploads `website/output/` as Pages artifact
   - Deploys to production URL: `https://cristianabrante.com` (custom domain)
   - Also accessible via: `https://cristianabrante.github.io` (redirects to custom domain)

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
  ├─ Add CNAME file (cristianabrante.com)
  ├─ Upload website/output/ to Pages
  └─ Deploy to https://cristianabrante.com
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
- Automatically deployed to GitHub Pages with custom domain
- Primary URL: `https://cristianabrante.com`
- Also accessible: `https://cristianabrante.github.io` (redirects to custom domain)
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
npm run generate:website
npm run generate:pdf

# Live preview while editing resume.json or cv/cv.typ
npm run watch:pdf

# Verify outputs
ls -la cv/output/cv-cristian-abrante.pdf
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

**Typst compilation fails:**
- Test locally: `npm run generate:pdf`
- Ensure fonts are present in `cv/fonts/` (compilation warns about unknown font families)
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
   - Once complete (usually 1-2 minutes), visit: `https://cristianabrante.com`
   - Your resume website should be live!

### Custom Domain Setup:

This repository is configured to use the custom domain `cristianabrante.com`.

**What's already configured in code:**
- ✅ CNAME file automatically generated in deployment workflow
- ✅ Points to: `cristianabrante.com`

**What you need to configure externally:**

1. **DNS Configuration (GoDaddy):**
   
   Add these DNS records in your GoDaddy account:
   
   **A Records (for apex domain):**
   ```
   Type: A, Name: @, Value: 185.199.108.153, TTL: 600
   Type: A, Name: @, Value: 185.199.109.153, TTL: 600
   Type: A, Name: @, Value: 185.199.110.153, TTL: 600
   Type: A, Name: @, Value: 185.199.111.153, TTL: 600
   ```
   
   **CNAME Record (for www subdomain):**
   ```
   Type: CNAME, Name: www, Value: cristianabrante.github.io, TTL: 600
   ```

2. **GitHub Pages Settings:**
   - Go to: Settings → Pages → Custom domain
   - Enter: `cristianabrante.com`
   - Click "Save"
   - Wait for DNS check to pass (green checkmark)
   - Check "Enforce HTTPS" (appears after DNS verification)
   - Wait 1-2 hours for SSL certificate provisioning

3. **Verify Setup:**
   - `https://cristianabrante.com` → Your website (primary URL)
   - `https://www.cristianabrante.com` → Redirects to cristianabrante.com
   - `https://cristianabrante.github.io` → Redirects to cristianabrante.com

**Timeline:**
- DNS propagation: 1-48 hours (usually 1-2 hours)
- SSL certificate: 1-24 hours (usually 1-2 hours)

See [GitHub Pages custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for details.

## Future Enhancements

Planned improvements:
- Add JSON schema validation before generation
- Add notification on successful generation
- Support for multiple language versions
- Automated screenshot generation for website previews
- Integration with LinkedIn API for automatic profile sync
