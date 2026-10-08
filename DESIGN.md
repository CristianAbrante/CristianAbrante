# Cristian Abrante — Design System

Single source of truth for every surface generated from `resume.json`: the website,
the PDF CV, the README, and the email signature. No visual decision is made outside
this file. If a value is needed and is not here, it gets added here first.

---

## 0. Research Log

- **Visual reference (user-supplied, binding):** four lofi pixel-art / cel-shaded
  workstation illustrations. Extracted: (1) warm amber CRT bloom against a cool
  indigo night room, (2) cream-beige hardware plastic with a hard bevel, (3) a
  consistent upper-left light source (desk lamp / window), (4) hard-edged pixel
  geometry with no soft radii, (5) a desaturated pastel triad — amber, screen
  cyan, sakura rose — sitting on a muted blue-grey ground.
- **Layer A:** `redesign-skill.md` — this is an audit-and-upgrade of an existing
  vanilla-CSS site, not a greenfield build.
- **Layer B:** none from the curated brand set. The user's four images are the
  token source; no brand reference was a better fit than the images themselves.
- **Skipped lanes:** lazyweb and imagen concept drafts — a concrete visual
  reference was supplied, so the reference-fidelity contract already exists.
- **Later amendment:** the accent was moved from the references' amber to azure
  at the owner's request. The references stay binding for *geometry, light
  direction and material* — the hard bevels, the upper-left key light, the cream
  plastic — and no longer for the phosphor hue. See §2, Ramp rationale.

---

## 1. Atmosphere & Identity

A desk at 1 a.m. with one monitor on. The room is cool indigo and the CRT burns
a colder blue inside it, the way a screen actually lights a dark room. It is a
workstation, not a poster — dense, legible, built out of hard-edged panels that
look like they could be clicked on a machine from 1994, but with 2026 typography
and spacing.

**The signature is CRT bloom on hard-edged panels**: every surface is a flat
plane with a 1px border and a hard, un-blurred offset shadow (pixel geometry, no
soft radii), and the one light source in the whole page is the azure glow of the
hero monitor, which bleeds into the page background as a radial pool. The cream
bezel around it is the only warm mass on the page, and it is load-bearing — it is
what stops a blue screen in a blue room from reading as a flat tint.

Restraint is the brief. The retro reads in the *geometry and the light*, never in
novelty: no pixel display font, no visible CRT curvature, no chromatic
aberration, no marquee, no terminal-emulator gimmick. A recruiter reading this on
a phone sees a sharp, fast, legible CV. Someone who looks closer sees the room.

---

## 2. Color

Two themes, `night` (default) and `day`. `night` is reference image 2 (lamp-lit
room after dark). `day` is reference image 3 (warm paper, blue ink, terracotta).

### Palette

| Role | Token | Night | Day | Usage |
|------|-------|-------|-----|-------|
| Surface / base | `--surface-0` | `#13151E` | `#F2EDE1` | Page ground |
| Surface / panel | `--surface-1` | `#191C28` | `#EAE3D3` | Alternating sections |
| Surface / card | `--surface-2` | `#1F2331` | `#FBF7EE` | Cards, entries, nav |
| Surface / raised | `--surface-3` | `#272C3D` | `#FFFFFF` | Chips, label strips, terminal bar |
| Text / primary | `--text-0` | `#E9E4D7` | `#1E2232` | Headings, emphasis |
| Text / secondary | `--text-1` | `#A3A8BD` | `#434963` | Prose, descriptions |
| Text / tertiary | `--text-2` | `#9199AE` | `#575D79` | Metadata, captions |
| Border / default | `--border-0` | `#2B3144` | `#D8CEB8` | Panel edges, rules |
| Border / strong | `--border-1` | `#3C435B` | `#BFB49A` | Hover edges, section rule |
| Accent / base | `--accent` | `#63B3F0` | `#175FA8` | THE interactive accent |
| Accent / hover | `--accent-hover` | `#90CCFF` | `#10497F` | Link + control hover |
| Accent / press | `--accent-press` | `#4290CE` | `#0B3661` | Pressed |
| Accent / soft | `--accent-soft` | `#C4E5FF` | `#4A90D9` | Bloom core, sweep |
| Screen / cyan | `--cyan` | `#6FC6D9` | `#2A7A8C` | Power LED + live status dot only |
| Bloom / rose | `--rose` | `#DE93A8` | `#B2566E` | Reserved for decorative pixel art |
| Shadow | `--shadow` | `#080A11` | `#C0B49A` | Hard offset shadows |
| Bevel | `--bevel` | `rgba(233,228,215,0.055)` | `rgba(255,255,255,0.7)` | 1px inset top-left light edge |
| Glow | `--glow` | `rgba(99,179,240,0.20)` | `rgba(23,95,168,0.15)` | Lamp pool + monitor bloom |
| Pool / cool | `--pool-cool` | `rgba(111,198,217,0.11)` | `rgba(96,148,170,0.09)` | Window light, upper-left |

### Screen tokens (theme-independent)

A CRT emits its own light, so the screen keeps the same phosphor hues in both
themes. These live in `:root`, never in a theme block:

| Token | Value | Usage |
|-------|-------|-------|
| `--screen-hi` | `#BFE3FF` | Bright end of the phosphor range |
| `--screen-cool` | `#6FC6D9` | Cool end of the phosphor range |
| `--screen-bloom` | `rgba(120,190,255,0.42)` | `0 0 46px -6px` bloom onto the bezel |
| `--screen-wash` | `rgba(150,205,255,0.20)` | Radial wash from the top of the tube |
| `--screen-glare` | `rgba(205,230,255,0.50)` | Diagonal glass reflection |

The three alpha tokens exist because the CRT's light is the one place the system
paints with transparency. They were previously raw `rgba()` literals inside the
`.crt` rules, which meant the tube was the only component whose colour could not
be changed from the palette — exactly what this file forbids.

### Logo tile tokens (theme-independent)

Third-party marks arrive as dark-on-transparent, light-on-dark and opaque
bitmaps, so they are always set on a light tile rather than re-coloured. These
deliberately do **not** vary by theme — that is the exception that keeps every
logo legible in night mode.

| Token | Value | Usage |
|-------|-------|-------|
| `--tile-bg` | `#F7F2E6` | Tile ground |
| `--tile-edge` | `#C7BCA6` | Tile border |
| `--tile-ink` | `#2A2F42` | Monogram fallback text |

### Ramp rationale

The accent is a four-stop perceptual azure ramp, not one hex at varying opacity.
Night uses the bright half on dark ground and gets *lighter* on hover; day shifts
the same hue down into deep navy and gets *darker* on hover, because contrast
must increase on interaction in both directions. Day's `#175FA8` is chosen
specifically to clear 4.5:1 on `#F2EDE1` (measured 5.55:1).

The tube used to be amber. Blue is a deliberate owner preference, taken with the
surfaces left exactly as they were, so the room keeps the cool indigo it was
built with. The trade is stated plainly: the screen and the room now sit in the
same hue family, so the CRT reads less as *the one warm light in a cool room* and
more as a lit panel within it. The counterweights that keep the hero from going
flat are the cream `--crt-plastic` bezel, which is the only large warm mass left
on the page, and the `--screen-hi` bloom, which stays several steps lighter than
any surface so the aperture still reads as emitting rather than filled.

### PDF mapping

The PDF CV shares this palette but **not** the typography — Source Sans 3 /
Roboto keep the document in a conventional CV register that mono headings would
cost. It prints on white, so it uses the **day** ramp. The ink constants live in
the vendored `cv/modern-cv/lib.typ`; the accent is the `accent` binding at the
top of `cv/cv.typ`.

| Typst constant | Token | Value | Contrast on white |
|---|---|---|---|
| `default-accent-color` | `--accent` | `#175FA8` | 6.48:1 |
| `color-darknight`, `color-darkgray` | `--text-0` | `#1E2232` | 15.79:1 |
| `default-location-color` | `--text-1` | `#434963` | 8.85:1 |
| `color-gray` | `--text-2` | `#575D79` | 6.47:1 |
| `color-rule` | `--border-1` | `#BFB49A` | 2.06:1 (non-text rule) |

This also fixed an inherited accessibility defect: modern-cv's teal `#15959F`
sat at 3.60:1 on white, under the 4.5:1 floor for body-sized text.

### Rules

- **`--accent` is the only interactive color.** Links, hover, focus rings,
  active nav, the cursor. Never decorative.
- **`--cyan` is semantic, not decorative**: the CRT screen fill and the "currently
  working" status dot. Nowhere else.
- **`--rose` appears only inside the hero's pixel-art illustration.** It never
  touches text or UI chrome.
- Greys are **blue-tinted** in night and **warm-tinted** in day. Never mix the two
  families within a theme.
- Shadows carry the ground's hue (`--shadow`), never `rgba(0,0,0,x)`.
- No pure `#000` and no pure `#FFF` as a page ground.

---

## 3. Typography

Two families, same superfamily, both with real computing heritage. **No Inter, no
system-ui fallback as the primary, no pixel display face.**

### Font stack

- **Chrome / headings / metadata:** `"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace`
- **Prose:** `"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif`
- Self-hosted as `woff2` in `website/template/fonts/`, `font-display: swap`,
  latin subset. Weights: Mono 400/500/600 + 400 italic, Sans 400/500/600.

Mono owns every piece of interface furniture — nav, section headers, dates,
locations, tech chips, buttons, the footer. Sans owns only running prose
(summary, job descriptions, highlights). That split is what makes the site read
as a *machine displaying a document* rather than as a terminal cosplay.

### Scale

| Level | Token | Size | Family | Weight | Line height | Tracking |
|-------|-------|------|--------|--------|-------------|----------|
| Display | `--fs-display` | `clamp(2.25rem, 6vw, 3.5rem)` | Mono | 600 | 1.05 | `-0.03em` |
| H1 | `--fs-h1` | `clamp(1.5rem, 3.2vw, 1.875rem)` | Mono | 600 | 1.2 | `-0.02em` |
| H2 | `--fs-h2` | `1.25rem` | Mono | 600 | 1.3 | `-0.01em` |
| H3 | `--fs-h3` | `1.0625rem` | Mono | 500 | 1.4 | `0` |
| Lead | `--fs-lead` | `clamp(1rem, 1.6vw, 1.125rem)` | Sans | 400 | 1.75 | `0` |
| Body | `--fs-body` | `1rem` | Sans | 400 | 1.7 | `0` |
| Small | `--fs-sm` | `0.875rem` | Sans / Mono | 400 | 1.6 | `0` |
| Meta | `--fs-meta` | `0.8125rem` | Mono | 400 | 1.5 | `0.01em` |
| Micro | `--fs-micro` | `0.6875rem` | Mono | 500 | 1.4 | `0.14em` |

### Rules

- Prose columns cap at `--measure` (65ch). Never full-bleed paragraphs.
- All numerics use `font-variant-numeric: tabular-nums` so date columns align.
- Micro labels are uppercase with `0.14em` tracking; nothing else is uppercase.
- Headings use `text-wrap: balance`, paragraphs use `text-wrap: pretty`.
- Body never drops below `0.8125rem`.

---

## 4. Spacing & Layout

Base unit **4px**. Spacing is on an 8px rhythm above `--space-2`.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon-to-label, chip inset |
| `--space-2` | 8px | Inline groups, chip gaps |
| `--space-3` | 12px | Tight stack |
| `--space-4` | 16px | Default stack, card inset (mobile) |
| `--space-5` | 20px | Entry inner spacing |
| `--space-6` | 24px | Card inset (desktop) |
| `--space-8` | 32px | Between entries |
| `--space-10` | 40px | Between content blocks |
| `--space-12` | 48px | Header-to-content |
| `--space-16` | 64px | Section padding (mobile) |
| `--space-20` | 80px | Section padding (desktop) |
| `--space-28` | 112px | Hero vertical |

### Grid

- `--measure`: `65ch` — prose column cap.
- `--width-content`: `1080px` — standard container.
- `--width-wide`: `1200px` — hero and nav container.
- Gutter: `clamp(1.25rem, 5vw, 2.5rem)`.
- Breakpoints: `sm 480px`, `md 768px`, `lg 1024px`.

### Layout grammar

- **Nothing is centered except the contact block.** Section headers are left-aligned
  with a rule bleeding to the container's right edge. The hero is asymmetric.
- **Experience and education are a two-column log**, not a dotted timeline: a
  fixed mono date rail on the left (`11rem` at `lg`), content on the right.
  Collapses to a single stacked column below `md`.
- Vertical section padding is optically asymmetric — bottom is one step larger
  than top — because the section rule sits at the top edge.

---

## 5. Components

### Panel (base primitive — every card is this)

- **Structure:** `<div class="panel">` — a flat `--surface-2` plane, `1px solid
  --border-0`, `border-radius: 0`, and the raised recipe
  `inset 1px 1px 0 var(--bevel), 3px 3px 0 var(--shadow)`. The inset is the
  upper-left light edge; the offset is an un-blurred displaced copy. No blur
  anywhere. This is the pixel-geometry rule.
- **Spacing:** `--space-6` inset desktop / `--space-4` below 520px.
- **States: none. Panel is non-interactive.** Entries, award items, skill carts
  and the terminal are documents, not controls — they carry no hover or press,
  because a lift on something you cannot click is slop. The lift/press ladder
  belongs to Control below. Links *inside* a Panel carry their own states.
- **Layout:** stack.

### Section header

- **Structure:** `<header class="section-head">` → micro index (`01`), mono title,
  then a `1px` rule filling remaining width.
- **Spacing:** `--space-12` below.
- **States:** none (non-interactive).

### Chip (technology / keyword tag)

- **Structure:** `<span class="chip">` — mono `--fs-meta`, `--surface-3` fill,
  `1px solid --border-0`, square corners, `--space-1`/`--space-2` inset.
- **Variants:** `.chip` (default), `.chip--key` (accent-bordered, used for the
  top skill in a category).
- **States:** non-interactive. No hover.

### Link

- **Structure:** inline `<a>`, `--accent`, no underline at rest; a `1px`
  `currentColor` bottom border drawn via `background-image` so it animates.
- **States:** rest (dim rule) → hover (`--accent-hover`, rule reaches full width)
  → focus-visible (accent outline) → visited (no change; this is a CV).
- **Motion:** 160ms `ease-out` on `background-size`.

### Control (hero actions, theme toggle, skip link)

- **Structure:** mono, meta or uppercase micro, `--surface-2` fill, `1px` border,
  the Panel raised recipe. The theme toggle wraps its label in `[ ]` brackets
  tinted `--accent`.
- **Variants:** `.action` (default) and `.action--primary`, which tints the
  border toward `--accent` and sets the label in `--accent`. Exactly one primary
  control exists on the page — the CV download — because the whole point is a
  single obvious next step for a recruiter. A second one would cancel the first.
- **States:**
  - rest — `inset 1px 1px 0 --bevel, 3px 3px 0 --shadow`
  - hover — `translate(-2px, -2px)`, offset grows to `5px 5px 0`, border `--border-1`
  - active — `translate(1px, 1px)`, offset shrinks to `1px 1px 0` (physical key press)
  - focus-visible — `2px solid --accent` outline at `2px` offset
- **Motion:** `transform` + `box-shadow`, 140ms `ease-out`.
- **Accessibility:** real `<button>` with `aria-pressed` for the theme toggle;
  minimum 40px hit height.

### CRT frame (hero focal object — the signature)

A beveled plastic bezel (`--crt-plastic-hi/-/-lo`, `--crt-edge`) wrapping the
pixel-art portrait, on a visible neck and foot. Five stacked layers fill the
screen aperture, in this order:

1. **portrait** — `profile-pixel.png`, `image-rendering: pixelated`, only a light
   `contrast(1.08) saturate(1.06)` lift
2. **wash** — cool radial from the top, `mix-blend-mode: screen`
3. **glare** — diagonal glass reflection, `mix-blend-mode: screen`
4. **scan** — 3px-period scanline mask at 55%
5. **vignette** — radial falloff to near-black at the aperture edge

**The colour grade is baked into the bitmap, not applied in CSS.** The overlays
are deliberately weak (wash 0.20, glare 0.09) because they sit on an already
graded 20-colour image; the values that worked for a raw photograph wash the
pixel art out. If the portrait is ever replaced with an ungraded photo, the
grade has to come back — see the Portrait asset below.

- The bezel carries a top-left highlight and bottom-right shade (single light
  source, upper-left, matching the references), a `7px 7px 0` hard shadow, and
  the screen emits a `0 0 46px -6px` azure bloom onto the bezel plus an ambient
  `--glow` radial onto the page. The bezel stays cream: it is the warm mass the
  blue screen is read against.
- A power LED (`--cyan`) sits on the chin and pulses on a 3.2s cycle.
- **Motion:** one-time power-on sweep (Section 6). Non-interactive, no hover.

### Portrait asset

`picture.jpg` (repo root) is the source of truth; `profile-pixel.png` is derived
from it by `scripts/generate-pixel-portrait.py` and committed, so CI stays
Node-only. 132×99, 20 colours, ~4 KB, 4:3 to match the CRT aperture exactly so
nothing is cropped. The grade is a luma-indexed ramp from deep navy shadows
through steel and slate blue to pale ice highlights — the same colour story as
the phosphor, which is what lets the CSS overlays stay almost transparent.

**The grade must be regenerated whenever the accent ramp moves.** It is baked
into the bitmap, so a palette change that skips this step leaves a face in the
old hue sitting inside a tube in the new one.

Re-run after changing the photo: `uv run scripts/generate-pixel-portrait.py`.

### CV download

The site self-hosts the PDF at `/cv.pdf` rather than linking GitHub Releases, so
the download never leaves the domain. `generate-website.js` copies
`cv/output/cv-cristian-abrante.pdf` into the output and stamps the real size onto the
button; the deploy workflow compiles the PDF *before* generating the site, and
`npm run preview:website` does the same locally so the two cannot diverge. The
link carries `download="<Name>-CV.pdf"` so the saved file is not a bare
`cv.pdf`.

### Logo tile

- **Structure:** `<span class="tile">` → a `2.5rem` square (`2.125rem` under
  520px) on `--tile-bg` with a `--tile-edge` border and a `2px` hard shadow,
  containing either an `<img>` at 74% or a `.tile__mono` monogram.
- **Monogram fallback:** initials derived from the organisation name — dotted
  acronyms are collapsed first (`I.E.S.` → `IES`) and then paired with the next
  significant word, so sibling institutions do not render identical tiles.
- **States:** none. Decorative and `aria-hidden`; the organisation name is
  already adjacent as text.

### Disclosure (collapsed entry)

Built on native `<details>`/`<summary>` so it works with zero JavaScript and is
keyboard-operable for free (Enter and Space both toggle).

- **Collapsed** shows logo tile, role, organisation, location or grade, and the
  technology chips — enough to scan a career without reading it.
- **Expanded** adds a rule, then the summary prose, highlights and the outbound
  link. Chips live *outside* `<details>` so they never hide.
- **Header layout:** grid, `tile | id | meta | chev`. Under 760px it reflows to
  `tile id chev` over a full-width `meta` row — as a flex row the location
  collided with the wrapped role at 375px.
- **Motion:** `::details-content` height transition behind
  `@supports (interpolate-size: allow-keywords)`. The guard is load-bearing:
  without it, non-supporting browsers get `block-size: 0` and no way to expand.
- **Print:** `beforeprint` opens every `<details>` and `afterprint` restores
  them, because CSS cannot force a disclosure open.

### Earlier-entries group

A second `<details>` holding everything past the featured count
(`FEATURED_WORK = 3`, `FEATURED_EDUCATION = 4` in `scripts/generate-website.js`).
Styled as a Control, with the label swapping between `show N earlier …` and
`hide N earlier …` via `[open]` — the inactive label is `display: none` so it
stays out of the accessibility tree.

### Stat strip (hero metadata)

- **Structure:** mono key/value pairs separated by a `·` divider; the live status
  pair carries the `--cyan` pulse dot.

### Terminal block (contact)

- **Structure:** a Panel with a `--surface-0` inner field, a `$` prompt in
  `--accent`, the command in mono, and a block cursor that blinks.
- **States:** the command lines are real links and inherit Link states.

### Email signature

Generated by `scripts/generate-signature.js`. It is pasted into Gmail, so it is
the one surface that cannot use this system's CSS — **no `<style>` block, no
classes, no custom fonts, every rule inline on the element**, because Gmail
strips all three. It therefore borrows the palette only, and maps to the **day**
ramp because it lands on a white message body:

| Generator constant | Token | Value | Contrast on white |
|---|---|---|---|
| `COLOR_ACCENT` | `--accent` (day) | `#175FA8` | 6.48:1 |
| `COLOR_TEXT` | `--text-0` (day) | `#1E2232` | 15.79:1 |
| `COLOR_TEXT_SECONDARY` | `--text-2` (day) | `#575D79` | 6.47:1 |
| `COLOR_SEPARATOR` | `--border-1` (day) | `#BFB49A` | non-text rule |
| `COLOR_BORDER` | `--border-0` (day) | `#D8CEB8` | non-text rule |

Typography falls back to the Arial/Helvetica stack every mail client has. That
is a deliberate exception, not an oversight — a webfont would silently fail in
Outlook and land the signature on a random fallback.

### Signature copy page

`signature/output/index.html`, the page with the per-variant copy buttons. Unlike
the signature itself this is a normal web page, so it **is** built from the
system: night theme, IBM Plex Mono chrome, Panel geometry, Control states.

- Each variant sits on a white `.paper` card inside a Panel, because the
  signature is designed against a white message body and must be judged there.
  The page chrome around it stays in the night theme.
- Copy buttons are Controls and reuse the lift/press ladder. Their transient
  states tint the label only — success `--cyan`, failure `--rose` — so the
  button does not change size and the row never reflows.
- Fonts are copied into `signature/output/fonts/` by the generator. The page is
  opened directly from that folder as often as it is served from the preview
  bundle, so it cannot rely on a sibling directory existing.

### Preview landing page

`preview/index.html`, written by `scripts/build-preview.js`, is the first thing
seen on a PR. It is a Panel grid in the night theme with the same hard-edged
geometry as the site, and the three deliverables are Controls.

- It links `website/fonts/*.woff2` rather than shipping its own copy — the
  bundle always contains `website/`, since `build-preview.js` exits non-zero
  when that build output is missing.
- The PR number and commit are a micro label; the build timestamp is `--text-2`.
- It is explicitly **not** indexed: the generator forces
  `<meta name="robots" content="noindex, nofollow">` into every HTML file in the
  bundle, this page included.

---

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 140ms | `ease-out` | Panel/button hover, press |
| Standard | 220ms | `cubic-bezier(.2,.8,.2,1)` | Theme swap, nav shadow |
| Reveal | 480ms | `cubic-bezier(.16,1,.3,1)` | Scroll-in, staggered 60ms |
| Power-on | 520ms | `ease-out` | Hero CRT, once on load |
| Ambient | 1.1s / 3.2s | `steps(2)` / `ease-in-out` | Cursor blink / LED pulse |

### Rules

- Animate `transform`, `opacity`, `filter`, `box-shadow` only.
- The cursor blink uses `steps(2, jump-none)` — a hard on/off, never a fade. A
  faded cursor is the single most common tell of fake-retro.
- Scroll reveals use `IntersectionObserver`, unobserve after firing.
- **`prefers-reduced-motion: reduce` disables the power-on sweep, the LED pulse,
  the cursor blink, and all reveal transforms.** Content is visible at rest in
  the markup; JS only *adds* motion, so a JS failure never hides content.
- Every animation maps to a state change or an affordance. There is exactly one
  ambient decorative motion (the LED), and it signals "the machine is on" —
  which is the page's one brand idea.

---

## 7. Depth & Surface

**Strategy: hard-edged planes.** Committed, no mixing.

Every raised level is `inset 1px 1px 0 var(--bevel)` plus an un-blurred offset:

| Level | Offset | Usage |
|-------|--------|-------|
| Flat | none | Section grounds, inline text |
| Raised | `3px 3px 0 var(--shadow)` | Panels and controls at rest |
| Lifted | `5px 5px 0 var(--shadow)` | Control hover |
| Pressed | `1px 1px 0 var(--shadow)` | Control active |
| Bezel | `7px 7px 0 var(--shadow)` + two-sided inset bevel | CRT case |
| Bloom | `0 0 46px -6px rgba(120,190,255,.42)` | CRT screen only |

- `border-radius` is `0` everywhere except the CRT screen aperture (`3px`) and the
  LED (`50%`). Rounded corners are the anti-pattern in this system.
- The page ground is **not a flat fill**. Four fixed, `pointer-events: none`
  layers, split across two paint positions:
  - **`.room`, behind all content** — a `--glow` monitor pool from the upper
    right and a `--pool-cool` window wash from the upper left, over a
    9px-period vertical-blind wall texture (`--wall-alpha`, 4–5%).
  - **`.veil`, above all content** — a 3px-period scanline overlay (effective
    2.5% alpha) and an SVG `feTurbulence` grain layer (`--grain-alpha`, 3–3.5%).
    It must paint above so section backgrounds do not mask it; the alpha cap is
    what keeps overlaid text above the contrast floor.

---

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA. Body text ≥ 4.5:1, large text and non-text UI ≥ 3:1, in **both**
  themes. Measured on the shipped build, the tightest pairs are
  `--text-2` on `--surface-3` at **4.87:1** (night) and the same pair at
  **6.47:1** (day). The accent link measures **6.88:1** night and **5.55:1** day.
  Any token change must be re-measured against those pairs.
- Visible focus on every interactive element: `2px solid var(--accent)` at `2px`
  offset. Never `outline: none` without a replacement.
- A `skip to content` link is the first focusable element.
- Full keyboard reachability; the theme toggle is a `<button>` with `aria-pressed`.
- Decorative layers (scanlines, grain, pixel art, the CRT bezel) are
  `aria-hidden` and `pointer-events: none`.
- Scanline and grain overlays stay ≤ 3.5% alpha so they never reduce text
  contrast below the floor.
- `prefers-reduced-motion` honored per Section 6.
- No content depends on JavaScript. The page renders complete with JS disabled.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Latin-only font subset | `website/template/fonts/` | Content is English-only; full subsets would quadruple font weight | Add subsets if the CV is ever translated |
| PDF keeps its own typography | `cv/cv.typ` | Source Sans 3 / Roboto read as a conventional CV; IBM Plex Mono headings would cost the professional register the document needs | Colour is shared, type deliberately is not |
| PDF page is white, not cream | `cv/cv.typ` | A full-bleed `--surface-0` tint costs toner and some print drivers drop it | One-line opt-in documented in `cv.typ` |
| Monogram instead of logo for 4 entries | Coventry University, the three I.E.S. schools | No clean public mark was retrievable; the monogram tile is a deliberate part of the system rather than a gap | Drop a PNG in `cv/logos/` and add `logo:` to that `resume.json` entry |
| No mobile nav drawer | `.nav` under `md` | Section links are dropped on mobile in favour of a single-column scroll; the page is short enough that a drawer adds chrome without aiding navigation | Revisit if the site grows past five sections |
| CRT shares the room's hue family | `.crt`, `--accent` | Blue is an explicit owner preference and the surfaces were deliberately left untouched, so the screen no longer contrasts with the room by temperature. The cream bezel and the lighter `--screen-hi` bloom carry the separation instead | Cool the room to graphite if the hero ever reads flat |
