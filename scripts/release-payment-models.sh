#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/release-payment-models.sh [patch|minor|major|prerelease] [--preid beta] [--dry]
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

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

# Safety
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree not clean. Commit or stash changes first."; exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo "⚠️  You are on '$CURRENT_BRANCH'. Continue? (y/N)"
  read -r yn; [[ "$yn" =~ ^[Yy]$ ]] || exit 1
fi

PKG_DIR="packages/payment-models"
cd "$PKG_DIR"

CURRENT_VER="$(node -p "require('./package.json').version")"
echo "📦 @uzelac92/payment-models current version: $CURRENT_VER"

# Build npm version command (NO git tag/commit)
CMD=(npm version "$BUMP_TYPE" --no-git-tag-version)
[[ -n "$PREID" ]] && CMD+=(--preid "$PREID")

if [[ "$DRYRUN" == "true" ]]; then
  echo "🧪 Dry run:"; printf '  %q ' "${CMD[@]}"; echo; exit 0
fi

"${CMD[@]}"

NEW_VER="$(node -p "require('./package.json').version")"
NEW_TAG="payment-models-v${NEW_VER}"
echo "🆕 New version: $NEW_VER"
cd "$ROOT_DIR"

# Commit the version bump from repo root
git add "$PKG_DIR/package.json"
git commit -m "chore(payment-models): release v${NEW_VER}"

# Create and push the tag explicitly
git tag -a "$NEW_TAG" -m "release: @uzelac92/payment-models v${NEW_VER}"
git push origin "$CURRENT_BRANCH"
git push origin "$NEW_TAG"

echo "✅ Pushed ${NEW_TAG}. GitHub Actions will publish @uzelac92/payment-models."