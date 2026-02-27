# FGPS Website — Development Rules

## Mandatory QA Pipeline

After ANY change to HTML, CSS, or JS files, complete ALL steps before committing:

### Step 1: Run automated checks
```bash
./scripts/qa-check.sh
```
This runs Lighthouse (desktop+mobile), axe-core WCAG 2.1 AA, gsap.from() audit, CSS contrast floor check.
**Must pass with 0 failures.**

### Step 2: Visual QA — take screenshots and review them
```bash
# Start local server
cd /path/to/site && python3 -m http.server 8099 &

# Desktop screenshot
playwright-cli open "http://localhost:8099"
playwright-cli resize 1440 900
playwright-cli screenshot

# Mobile screenshot
playwright-cli resize 390 844
playwright-cli screenshot
```
**Review each screenshot for:**
- Text readable on ALL backgrounds (especially text over hero image)
- No overlapping elements
- No invisible text (check light text on light image areas)
- Proper spacing — no elements too close together
- Cards/sections visually distinct from page background
- Hero vessel image visible on both viewports
- No "boxy" overlays or hard gradient edges

### Step 3: Code review
Before committing, review your own changes for:
- No `gsap.from()` anywhere (use `gsap.set()` + `gsap.to()`)
- No `rgba(255,255,255,0.5)` or lower for readable text
- No hardcoded colors — use CSS variables
- No duplicate/redundant content (same message in badge AND headline)
- Mobile responsive — check all new CSS works at ≤768px
- Verify `filter: drop-shadow()` values aren't too heavy (look cheap/grungy)
- All `text-shadow` values subtle (max 0.5 opacity, not multiple heavy shadows)

### Step 4: Deploy
```bash
git add -A && git commit -m "description"
git push origin master
API_KEY=$(op read "op://lyra_vault/coolify Lyra api/credential")
curl -s -X POST "http://100.94.205.58:8000/api/v1/applications/gc80ss8kccsw4ogcscgkow8s/restart" \
  -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json"
```

## UX/UI Best Practices

### Typography Over Images
- Prefer dark overlay gradients over text-shadow/drop-shadow for readability
- If using text-shadow: keep it subtle — `0 1px 8px rgba(0,0,0,0.4)` max
- If using drop-shadow on gradient text: light touch only — heavy shadows look cheap on professional B2B sites
- Ensure minimum 20px spacing between text lines of different styles/colors

### Visual Hierarchy
- Don't repeat the same message in multiple elements (e.g. badge + headline both saying "trusted by")
- Hero badge should complement the headline, not duplicate it
- Section labels (small uppercase) should introduce, not repeat, the h2 below

### Hero Section
- Hero image should be visible and vibrant, not washed out by overlay
- Left-to-right gradient overlay: darker on text side, lighter on image side
- On mobile: reposition image to show focal point (vessel)
- Stats bar needs solid dark background for readability

### Spacing
- Consistent vertical rhythm between sections
- Cards need enough margin for visual breathing room
- On mobile: reduce padding/margins proportionally, don't just stack

## GSAP Rules (CRITICAL)

- **NEVER use `gsap.from()`** — if ScrollTrigger doesn't fire, elements stay invisible forever
- **ALWAYS use `gsap.set()` + `gsap.to()`** — set initial state explicitly, animate TO the visible state
- Add a safety-net `setTimeout` (3-5s) that forces elements visible if animations fail
- No `pin: true` on mobile

## Contrast Requirements

- Body text on page bg: minimum 4.5:1 (WCAG AA)
- Body text on card bg: minimum 4.5:1
- Large text (≥18px bold / ≥24px): minimum 3:1
- Test against sRGB, not wide-gamut — assume low-quality monitors
- Never use `rgba(255,255,255,0.5)` or lower for readable text

## CSS Variables (current palette)
```
--navy-900: #101828  (page background)
--navy-800: #0d1526  (card backgrounds)
--navy-700: #121e35  (problem cards)
--text-primary: #edf1f7
--text-secondary: #a8b7cc
--text-muted: #94a4ba
--teal: #00d4aa
--amber: #f5a623
--border: rgba(255,255,255,0.12)
```

## Mobile Rules
- Test at 390×844 (iPhone 14 Pro)
- Cards/content visible by default (no scroll-dependent visibility)
- Hero `object-position` must show vessel on portrait crop
- Hero overlay dark enough for text over photo

## File Structure
- `index.html` — homepage
- `products.html`, `services.html`, `about.html`, `contact.html`, `claim.html`
- `assets/css/style.css` — all styles
- `assets/js/main.js` — all JS
- `assets/img/`, `assets/video/`
- `scripts/qa-check.sh` — automated QA

## No Emojis
B2B professional site. No emojis in HTML. Inline SVG icons only.

## This is Paul Dowd's company
Tone: engineer's craftsmanship, not SaaS startup. No glowy effects, no flashy animations. Clean, authoritative, technically confident. Paul is a geomatician who calls himself a software developer first, entrepreneur second. The site should reflect that.
