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

bunx changeset publish
