#!/bin/bash
# FGPS QA Check — run after any HTML/CSS/JS change
# Exit code: 0 = pass, 1 = failures found
# Usage: ./scripts/qa-check.sh [port]

set -e

PORT="${1:-8099}"
SITE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FAILURES=0

echo "=== FGPS QA Check ==="
echo ""

# --- Start local server ---
cd "$SITE_DIR"
fuser -k "$PORT/tcp" 2>/dev/null || true
python3 -m http.server "$PORT" --bind 0.0.0.0 &>/dev/null &
SERVER_PID=$!
sleep 2

cleanup() {
  kill "$SERVER_PID" 2>/dev/null
  fuser -k "$PORT/tcp" 2>/dev/null || true
}
trap cleanup EXIT

URL="http://localhost:$PORT"

# --- 1. Lighthouse Accessibility (Desktop) ---
echo "▶ Lighthouse Accessibility (Desktop)..."
LH_OUT=$(lighthouse "$URL" \
  --only-categories=accessibility \
  --output=json \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --preset=desktop 2>/dev/null)

LH_SCORE=$(echo "$LH_OUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(int(d['categories']['accessibility']['score']*100))")
echo "   Score: $LH_SCORE/100"

if [ "$LH_SCORE" -lt 95 ]; then
  echo "   ❌ FAIL — below 95"
  # Show failing audits
  echo "$LH_OUT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for ref in d['categories']['accessibility']['auditRefs']:
    a=d['audits'][ref['id']]
    if a.get('score') is not None and a['score']<1:
        print(f'   → {a[\"title\"]}')
        for item in a.get('details',{}).get('items',[])[:3]:
            node=item.get('node',{})
            print(f'     {node.get(\"snippet\",\"\")[:100]}')
"
  FAILURES=$((FAILURES+1))
else
  echo "   ✅ PASS"
fi

# --- 2. Lighthouse Accessibility (Mobile) ---
echo ""
echo "▶ Lighthouse Accessibility (Mobile)..."
LH_MOB=$(lighthouse "$URL" \
  --only-categories=accessibility \
  --output=json \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --form-factor=mobile 2>/dev/null)

LH_MOB_SCORE=$(echo "$LH_MOB" | python3 -c "import json,sys; d=json.load(sys.stdin); print(int(d['categories']['accessibility']['score']*100))")
echo "   Score: $LH_MOB_SCORE/100"

if [ "$LH_MOB_SCORE" -lt 95 ]; then
  echo "   ❌ FAIL — below 95"
  echo "$LH_MOB" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for ref in d['categories']['accessibility']['auditRefs']:
    a=d['audits'][ref['id']]
    if a.get('score') is not None and a['score']<1:
        print(f'   → {a[\"title\"]}')
"
  FAILURES=$((FAILURES+1))
else
  echo "   ✅ PASS"
fi

# --- 3. axe-core WCAG 2.1 AA ---
echo ""
echo "▶ axe-core WCAG 2.1 AA..."
AXE_OUT=$(NODE_PATH=/usr/lib/node_modules/openclaw/node_modules:/home/ubuntu/.openclaw/workspace/node_modules node -e "
const { chromium } = require('playwright-core');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('$URL');
  const axeSource = fs.readFileSync(require.resolve('axe-core'), 'utf8');
  await page.evaluate(axeSource);
  const results = await page.evaluate(async () => {
    return await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
    });
  });
  const out = {
    violations: results.violations.length,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    details: results.violations.map(v => ({
      id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.slice(0,3).map(n => n.html.slice(0,100))
    })),
    contrastReview: results.incomplete.filter(i => i.id.includes('contrast')).map(i => ({
      id: i.id,
      nodes: i.nodes.slice(0,5).map(n => n.html.slice(0,100))
    }))
  };
  console.log(JSON.stringify(out));
  await browser.close();
})();
" 2>/dev/null)

AXE_VIOLATIONS=$(echo "$AXE_OUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['violations'])")
AXE_PASSES=$(echo "$AXE_OUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['passes'])")
echo "   Violations: $AXE_VIOLATIONS | Passes: $AXE_PASSES"

if [ "$AXE_VIOLATIONS" -gt 0 ]; then
  echo "   ❌ FAIL"
  echo "$AXE_OUT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for v in d['details']:
    print(f'   → {v[\"id\"]} ({v[\"impact\"]}): {v[\"help\"]}')
    for n in v['nodes']:
        print(f'     {n}')
"
  FAILURES=$((FAILURES+1))
else
  echo "   ✅ PASS"
fi

# Show contrast items needing manual review
echo "$AXE_OUT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
cr = d.get('contrastReview',[])
if cr:
    print()
    print('   ⚠️  Manual contrast review needed (text over images):')
    for c in cr:
        for n in c['nodes']:
            print(f'     → {n}')
" 2>/dev/null

# --- 4. GSAP Safety Check ---
echo ""
echo "▶ GSAP gsap.from() audit..."
GSAP_FROM=$(grep -c "gsap\.from(" "$SITE_DIR/assets/js/main.js" 2>/dev/null || echo "0")
if [ "$GSAP_FROM" -gt 0 ]; then
  echo "   ❌ FAIL — found $GSAP_FROM gsap.from() calls (use gsap.set + gsap.to instead)"
  grep -n "gsap\.from(" "$SITE_DIR/assets/js/main.js" | head -5 | while read line; do
    echo "   → $line"
  done
  FAILURES=$((FAILURES+1))
else
  echo "   ✅ PASS — no gsap.from() calls"
fi

# --- 5. Contrast Variable Check ---
echo ""
echo "▶ CSS contrast floor check..."
python3 -c "
import re
def lum(r,g,b):
    def c(v):
        v=v/255.0
        return v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
    return 0.2126*c(r)+0.7152*c(g)+0.0722*c(b)
def cr(a,b):
    l1,l2=lum(*a),lum(*b)
    if l1<l2:l1,l2=l2,l1
    return (l1+0.05)/(l2+0.05)

css = open('$SITE_DIR/assets/css/style.css').read()
# Extract CSS variables
vars = {}
for m in re.finditer(r'--([\w-]+):\s*#([0-9a-fA-F]{6})', css):
    name, hex_val = m.groups()
    r,g,b = int(hex_val[:2],16), int(hex_val[2:4],16), int(hex_val[4:],16)
    vars[name] = (r,g,b)

# Check key combos
page_bg = vars.get('navy-900', (10,15,28))
card_bg = vars.get('navy-800', (13,21,38))
checks = [
    ('text-primary on navy-900', vars.get('text-primary',(237,241,247)), page_bg, 4.5),
    ('text-secondary on navy-900', vars.get('text-secondary',(168,183,204)), page_bg, 4.5),
    ('text-muted on navy-800', vars.get('text-muted',(148,164,186)), card_bg, 4.5),
    ('teal on navy-900', vars.get('teal',(0,212,170)), page_bg, 3.0),
]
fail=False
for name, fg, bg, minimum in checks:
    if fg and bg:
        ratio = cr(fg, bg)
        status = '✅' if ratio >= minimum else '❌'
        if ratio < minimum: fail=True
        print(f'   {status} {name}: {ratio:.1f}:1 (min {minimum}:1)')
if not fail:
    print('   All contrast floors met')
else:
    exit(1)
"
if [ $? -ne 0 ]; then FAILURES=$((FAILURES+1)); fi

# --- Summary ---
echo ""
echo "================================"
if [ "$FAILURES" -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED"
  exit 0
else
  echo "❌ $FAILURES CHECK(S) FAILED"
  exit 1
fi
