#!/usr/bin/env bash
# Regenerates .github/instructions/microlearning.instructions.md from the
# canonical standards repo at a pinned ref. Used locally and by the workflows.
#
# Usage:
#   bash .github/scripts/build-instructions.sh            # uses .github/standards.ref
#   bash .github/scripts/build-instructions.sh v1.2.0     # uses an explicit ref
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck disable=SC1091
source "$repo_root/.github/standards.env"

REF="${1:-$(cat "$repo_root/.github/standards.ref")}"
OUT="$repo_root/.github/instructions/microlearning.instructions.md"
RAW="https://raw.githubusercontent.com/${OWNER}/${REPO}/${REF}/${SRC}"

tmp="$(mktemp)"

# --- Fetch the canonical standard -------------------------------------------
# Public canonical repo (recommended): no auth needed.
curl -fsSL "$RAW" -o "$tmp"
# Private canonical repo? Comment the curl above and use this instead, providing
# a token with read access via GH_TOKEN (the STANDARDS_TOKEN secret in CI):
#   gh api "repos/${OWNER}/${REPO}/contents/${SRC}?ref=${REF}" \
#     -H "Accept: application/vnd.github.raw" > "$tmp"
# ----------------------------------------------------------------------------

mkdir -p "$(dirname "$OUT")"
{
  printf -- '---\n'
  printf 'applyTo: "%s"\n' "$APPLY_TO"
  printf -- '---\n\n'
  printf '<!-- GENERATED FILE — DO NOT EDIT.\n'
  printf '     Synced from %s/%s@%s by .github/scripts/build-instructions.sh.\n' "$OWNER" "$REPO" "$REF"
  printf '     Change the source in that repo and cut a new release; do not edit here. -->\n\n'
  cat "$tmp"
} > "$OUT"
rm -f "$tmp"

echo "Wrote $OUT from ${OWNER}/${REPO}@${REF}"
