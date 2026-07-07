#!/usr/bin/env sh
# Publication des paquets Échoppe (@echoppe/client, create-echoppe).
#
# Politique de versions :
#   - Pré-1.0 (mode pre changesets) → dist-tag « next » : opt-in obligatoire,
#     rien sur « latest ». Installer via `@echoppe/client@next`.
#   - À partir de 1.0 (pre exit) → dist-tag « latest » (défaut).
#
# La bascule est automatique : présence de .changeset/pre.json = phase pré-1.0.
set -e

# Build des paquets publiables (dist requis dans le tarball).
bun run --cwd packages/client build
bun run --cwd packages/create-echoppe build

if [ -f .changeset/pre.json ]; then
  echo "→ Phase pré-1.0 : publication sur le dist-tag 'next'"
  bunx changeset publish --tag next
else
  echo "→ Phase stable : publication sur 'latest'"
  bunx changeset publish
fi
