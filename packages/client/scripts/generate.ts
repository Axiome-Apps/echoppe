#!/usr/bin/env bun
/**
 * Régénère le contrat figé (`openapi.json`) puis les types TypeScript.
 *
 * 1. Récupère le spec OpenAPI de l'API en cours d'exécution.
 * 2. Filtre sur la surface storefront + tree-shake, puis le fige dans `openapi.json`.
 * 3. Génère `src/openapi.ts` depuis ce snapshot (pas l'URL → déterministe).
 * 4. Génère `src/models.ts` : des alias plats des schémas, importables directement
 *    (`import type { ProductDetail } from '@echoppe/client'`).
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

// Barrel d'alias plats : chaque schéma nommé devient un type importable directement,
// sans passer par l'indexation `components['schemas']['X']`.
const schemaNames = Object.keys(spec.components?.schemas ?? {}).sort();
const models = [
  '// Généré par scripts/generate.ts — NE PAS ÉDITER À LA MAIN.',
  '// Alias plats des schémas du contrat (surface boutique), importables directement :',
  "//   import type { ProductDetail } from '@echoppe/client';",
  '',
  "import type { components } from './openapi.js';",
  '',
  ...schemaNames.map((name) => `export type ${name} = components['schemas']['${name}'];`),
  '',
].join('\n');
await Bun.write('src/models.ts', models);
console.log(`✓ src/models.ts généré (${schemaNames.length} alias plats)`);
