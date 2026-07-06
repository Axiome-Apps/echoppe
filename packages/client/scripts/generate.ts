#!/usr/bin/env bun
/**
 * Régénère le contrat figé (`openapi.json`) puis les types TypeScript.
 *
 * 1. Récupère le spec OpenAPI de l'API en cours d'exécution.
 * 2. Le fige dans `openapi.json` (snapshot versionné, reproductible).
 * 3. Génère `src/openapi.ts` depuis ce snapshot (pas l'URL → déterministe).
 *
 * Usage : `bun run generate` (API par défaut sur http://localhost:7532),
 * ou `ECHOPPE_API_URL=https://api.exemple.fr bun run generate`.
 */
import { $ } from 'bun';

const apiUrl = (process.env.ECHOPPE_API_URL ?? 'http://localhost:7532').replace(/\/+$/, '');
const specUrl = `${apiUrl}/docs/json`;

const response = await fetch(specUrl);
if (!response.ok) {
  throw new Error(`Récupération du spec OpenAPI échouée : ${response.status} sur ${specUrl}`);
}

const spec = (await response.json()) as { paths: Record<string, unknown> };
await Bun.write('openapi.json', `${JSON.stringify(spec, null, 2)}\n`);
console.log(`✓ openapi.json figé (${Object.keys(spec.paths).length} routes)`);

await $`bunx openapi-typescript openapi.json -o src/openapi.ts`;
console.log('✓ src/openapi.ts généré');
