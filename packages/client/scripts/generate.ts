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
import { filterStorefront, type OpenApiSpec } from './filter';
import { STOREFRONT_SURFACE } from './storefront-surface';

const apiUrl = (process.env.ECHOPPE_API_URL ?? 'http://localhost:7532').replace(/\/+$/, '');
const specUrl = `${apiUrl}/docs/json`;

const response = await fetch(specUrl);
if (!response.ok) {
  throw new Error(`Récupération du spec OpenAPI échouée : ${response.status} sur ${specUrl}`);
}

// Le contrat de l'API décrit TOUTES les routes (admin + boutique). Le SDK boutique ne doit
// exposer que la surface storefront → on filtre + tree-shake avant de figer.
const fullSpec = (await response.json()) as OpenApiSpec;
const { spec, missing, keptPaths, keptSchemas } = filterStorefront(fullSpec, STOREFRONT_SURFACE);

if (missing.length > 0) {
  console.warn(`⚠ ${missing.length} route(s) de la surface absente(s) du contrat (dérive ?) :`);
  for (const m of missing) console.warn(`   - ${m}`);
}

await Bun.write('openapi.json', `${JSON.stringify(spec, null, 2)}\n`);
console.log(`✓ openapi.json figé (boutique : ${keptPaths} routes, ${keptSchemas} schémas)`);

await $`bunx openapi-typescript openapi.json -o src/openapi.ts`;
console.log('✓ src/openapi.ts généré');
