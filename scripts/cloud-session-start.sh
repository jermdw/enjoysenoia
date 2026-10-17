#!/usr/bin/env bash
# SessionStart hook (.claude/settings.json) for Claude Code cloud sessions
# (claude.ai/code). Does nothing on a local machine.
#
# Leaves a fresh cloud VM able to build, lint and run the rules tests:
#   - installs node_modules, unless they are already newer than the lockfile
#   - writes the gitignored .firebaserc that deploy.yml writes in CI, so
#     firebase.json's hosting targets resolve
#   - fetches the firebase-tools version test:rules pins, so the first
#     `npm run test:rules` does not stall on the download
#
# Secrets do not belong here or in the cloud environment's variables: anyone
# using the environment can read them. Deploys run in GitHub Actions instead
# (deploy.yml on a PR or merge, deploy-backend.yml for rules and functions).
set -euo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}"

if [ ! node_modules/.package-lock.json -nt package-lock.json ]; then
  npm ci --no-audit --no-fund
fi

if [ ! -f .firebaserc ]; then
  cat > .firebaserc <<'JSON'
{
  "projects": { "default": "enjoysenoia" },
  "targets": {
    "enjoysenoia": {
      "hosting": {
        "main": ["enjoysenoia"],
        "masquerade": ["thehalloweenmasquerade"],
        "halloween": ["senoiahalloween"],
        "christmas": ["senoiachristmas"]
      }
    }
  }
}
JSON
fi

# Keep in step with the version in package.json's test:rules.
npx -y firebase-tools@15.33.0 --version >/dev/null 2>&1 \
  || echo "cloud-session-start: could not fetch firebase-tools; test:rules will retry" >&2
