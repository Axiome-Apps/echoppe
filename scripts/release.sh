#!/usr/bin/env sh
# Publication des paquets Échoppe (@echoppe/client, create-echoppe).
#
# Le dist-tag est géré automatiquement par changesets selon le mode :
#   - Mode pre « next » (pré-1.0)  → publie sur dist-tag « next » (opt-in,
#     rien sur « latest » ; installer via `@echoppe/client@next`).
#   - Hors pre (>= 1.0, après `changeset pre exit`) → publie sur « latest ».
set -e

# Build des paquets publiables (dist requis dans le tarball).
bun run --cwd packages/client build
bun run --cwd packages/create-echoppe build

# --- DEBUG TEMPORAIRE (à retirer) : état de l'auth/registre vu par la détection
# changesets, dans l'environnement EXACT du publish. Doit révéler pourquoi
# `npm info` revient « not published » (token .npmrc parasite ? registre ? 404
# natif OIDC ?). Cf. npm/cli #8976.
echo "::group::debug détection npm"
echo "npm=$(npm -v)  node=$(node -v)  registry=$(npm config get registry)"
echo "--- .npmrc projet ---"; cat .npmrc 2>/dev/null || echo "(aucun)"
echo "--- .npmrc home  ---"; cat ~/.npmrc 2>/dev/null || echo "(aucun)"
echo "--- id-token env présent ? ---"; [ -n "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ] && echo "oui" || echo "non"
echo "--- npm info @echoppe/client ---"; npm info @echoppe/client version dist-tags 2>&1 && echo "exit=0" || echo "exit=$?"
echo "::endgroup::"

bunx changeset publish
