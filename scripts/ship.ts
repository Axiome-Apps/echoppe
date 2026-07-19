#!/usr/bin/env bun
// Prépare et pousse une release en une commande. Crée un changeset `@echoppe/client` au niveau BUMP
// (défaut `minor`), le committe et pousse `main` → la CI ouvre la PR « Version Packages » ; son merge
// publie npm + images à la version dérivée (flux one-move). Le NIVEAU est l'unique curseur : il pilote
// la version (0.4.0 --minor--> 0.5.0), donc le tag `v*` et les images.
//
//   bun run ship "résumé du changelog"             # minor (défaut)
//   BUMP=major bun run ship "refonte du contrat"   # major
//   BUMP=patch bun run ship "corrige X"            # patch
//   bun run ship --dry "…"                         # crée le changeset, ne commit/push pas
//
// En 0.x, un changement CASSANT = `minor` (le `major` est réservé au passage 1.0).
import { $ } from 'bun';

const LEVELS = ['patch', 'minor', 'major'] as const;
type Level = (typeof LEVELS)[number];

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const bump = (process.env.BUMP ?? 'minor') as Level;
if (!LEVELS.includes(bump)) fail(`BUMP invalide : « ${bump} » (attendu : ${LEVELS.join(' | ')}).`);

const dry = process.argv.includes('--dry');
const summary = process.argv
  .slice(2)
  .filter((a) => a !== '--dry')
  .join(' ')
  .trim();
if (!summary) fail('Résumé requis : bun run ship "ce qui change (ligne de changelog)".');

// Garde-fous : on ne pousse une release que depuis `main`, working tree propre (le changeset doit
// être le seul changement embarqué, le reste du travail déjà committé).
const branch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();
if (branch !== 'main') fail(`Release depuis « ${branch} » refusée — bascule sur main.`);

const dirty = (await $`git status --porcelain`.text()).trim();
if (dirty && !dry) fail(`Working tree non propre — committe ou stash avant de ship :\n${dirty}`);

const slug = `ship-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
const file = `.changeset/${slug}.md`;
await Bun.write(file, `---\n"@echoppe/client": ${bump}\n---\n\n${summary}\n`);
console.log(`✓ changeset ${bump} : ${file}`);

if (dry) {
  console.log('(--dry) rien de committé/poussé. Retire --dry pour lancer la release.');
  process.exit(0);
}

await $`git add ${file}`;
await $`git commit -m ${`release: ${bump} — ${summary}`}`;
await $`git push origin main`;
console.log(
  `✓ poussé sur main (${bump}). La CI ouvre la PR « Version Packages » — merge-la pour publier npm + images.`,
);
