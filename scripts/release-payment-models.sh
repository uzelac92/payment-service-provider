#!/usr/bin/env bash
set -euo pipefail

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

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree not clean. Commit or stash changes first."; exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
  echo "⚠️  You are on branch '$CURRENT_BRANCH'. Continue? (y/N)"
  read -r yn; [[ "$yn" =~ ^[Yy]$ ]] || exit 1
fi

PKG_DIR="packages/payment-models"
cd "$PKG_DIR"

CURRENT_VER="$(node -p "require('./package.json').version")"
echo "📦 @uzelac92/payment-models current version: $CURRENT_VER"

CMD=(npm version "$BUMP_TYPE" --tag-version-prefix="payment-models-v")
[[ -n "$PREID" ]] && CMD+=(--preid "$PREID")

if [[ "$DRYRUN" == "true" ]]; then
  echo "🧪 Dry run:"; printf '  %q ' "${CMD[@]}"; echo; exit 0
fi

# Run version bump (this creates the git tag automatically)
"${CMD[@]}"

# Read the new plain version from package.json
NEW_VER="$(node -p "require('./package.json').version")"
NEW_TAG="payment-models-v${NEW_VER}"
echo "🏷️  Created git tag: ${NEW_TAG}"

cd "$ROOT_DIR"

# Push branch and that specific tag
git push origin "$CURRENT_BRANCH"
git push origin "$NEW_TAG"

echo "✅ Pushed. GitHub Actions should publish @uzelac92/payment-models on tag: ${NEW_TAG}"