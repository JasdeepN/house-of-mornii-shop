#!/usr/bin/env bash
# Scan for CSS duplication, hardcoded colors, and inline styles in the project.
# Usage: bash scripts/scan-css-duplication.sh [src_dir]

set -euo pipefail

SRC_DIR="${1:-src}"
REPORT_FILE="${2:-/dev/stdout}"

echo "=== UI Duplication Scan ===" > "$REPORT_FILE"
echo "Source directory: $SRC_DIR" >> "$REPORT_FILE"
echo "Date: $(date -u +%Y-%m-%d)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Hardcoded OKLCH colors in JSX (outside className)
echo "--- Hardcoded OKLCH colors (outside className) ---" >> "$REPORT_FILE"
grep -rn 'oklch(' "$SRC_DIR"/ --include='*.tsx' --include='*.ts' | \
  grep -v 'className' | grep -v '\.css' | grep -v '\.scss' || echo "(none found)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 2. Hardcoded hex colors in JSX
echo "--- Hardcoded hex colors ---" >> "$REPORT_FILE"
grep -rn '#[0-9a-fA-F]\{3,6\}' "$SRC_DIR"/ --include='*.tsx' | \
  grep -v 'className' | grep -v '\.css' | grep -v '\.scss' || echo "(none found)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 3. Inline style objects
echo "--- Inline style objects ---" >> "$REPORT_FILE"
grep -rn 'style={' "$SRC_DIR"/ --include='*.tsx' | head -20 >> "$REPORT_FILE" || echo "(none found)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 4. Duplicate class patterns (glass-panel, golden-glow, etc.)
echo "--- Class pattern frequency ---" >> "$REPORT_FILE"
for pattern in "glass-panel" "golden-glow" "font-cinzel" "font-cormorant" "font-inter"; do
  count=$(grep -rn "$pattern" "$SRC_DIR"/ --include='*.tsx' | wc -l)
  echo "  $pattern: $count occurrences" >> "$REPORT_FILE"
done
echo "" >> "$REPORT_FILE"

# 5. Custom cubic-bezier values (should use luxuryEase)
echo "--- Custom cubic-bezier values ---" >> "$REPORT_FILE"
grep -rn 'cubic-bezier(' "$SRC_DIR"/ --include='*.tsx' --include='*.ts' | \
  grep -v 'luxuryEase' || echo "(none found)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 6. Non-standard font sizes
echo "--- Non-standard font sizes (text-[...px]) ---" >> "$REPORT_FILE"
grep -rn 'text-\[.*px\]' "$SRC_DIR"/ --include='*.tsx' | \
  grep -v 'text-\[18px\]' | grep -v 'text-\[16px\]' | grep -v 'text-\[14px\]' | grep -v 'text-\[12px\]' | \
  grep -v 'text-\[48px\]' | grep -v 'text-\[36px\]' | grep -v 'text-\[28px\]' | grep -v 'text-\[24px\]' || echo "(all standard)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 7. Components not using cn()
echo "--- Components without cn() import ---" >> "$REPORT_FILE"
for file in "$SRC_DIR"/components/*.tsx; do
  if [ -f "$file" ]; then
    basename=$(basename "$file")
    if ! grep -q 'import.*cn.*from' "$file" && ! grep -q 'className={' "$file"; then
      echo "  $basename: no cn() usage (may be OK if no conditional classes)" >> "$REPORT_FILE"
    fi
  fi
done
echo "" >> "$REPORT_FILE"

echo "=== Scan complete ===" >> "$REPORT_FILE"
