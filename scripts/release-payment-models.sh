#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/release-payment-models.sh [patch|minor|major|prerelease] [--preid beta] [--dry]
#
# Examples:
#   scripts/release-payment-models.sh patch
#   scripts/release-payment-models.sh minor
#   scripts/release-payment-models.sh prerelease --preid rc
#   scripts/release-payment-models.sh patch --dry

BUMP_TYPE="${1:-patch}"
PREID=""
DRYRUN="false"

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --preid) PREID="$2"; shift 2 ;;
    --dry)   DRYRUN="true"; shift ;;
    *)       echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# Ensure we're at repo root
ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

# Safety checks
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree not clean. Commit or stash changes first."
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo "⚠️  You are on branch '$CURRENT_BRANCH'. Continue? (y/N)"
  read -r yn
  [[ "$yn" == "y" || "$yn" == "Y" ]] || exit 1
fi

PKG_DIR="packages/payment-models"
cd "$PKG_DIR"

# Show current version
CURRENT_VER="$(node -p "require('./package.json').version")"
echo "📦 @uzelac92/payment-models current version: $CURRENT_VER"

# Build npm version command
CMD=(npm version "$BUMP_TYPE" --tag-version-prefix="payment-models-v")
if [[ -n "$PREID" ]]; then
  CMD+=(--preid "$PREID")
fi

if [[ "$DRYRUN" == "true" ]]; then
  echo "🧪 Dry run:"
  printf '  %q ' "${CMD[@]}"; echo
  exit 0
fi

# Bump version, commit, tag
NEW_TAG="$("${CMD[@]}")"  # npm echoes the new tag
echo "🏷️  Created tag: $NEW_TAG"

# Push commit + tag
cd "$ROOT_DIR"
git push origin "$CURRENT_BRANCH" --follow-tags

echo "✅ Pushed. GitHub Actions should publish @uzelac92/payment-models shortly."