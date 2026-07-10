#!/usr/bin/env bun
/**
 * Génère `docs/sdk/reference.md` : par modèle, un titre (outline VitePress), le composant
 * `<ModelDoc>` (propriétés, rendu par le thème Vue), puis les exemples d'appel (code-group
 * SDK/REST) et de réponse en markdown → coloration Shiki + onglets natifs.
 *
 * Alimenté par le contrat `packages/client/openapi.json` : la page suit le contrat.
 * Usage : `bun run gen:reference` (depuis le paquet docs).
 */
import { codeExample, modelNames, restExample } from '../.vitepress/theme/lib/openapi';

const OUTPUT = new URL('../sdk/reference.md', import.meta.url);

const lines: string[] = [
  '<!-- Généré par docs/scripts/gen-sdk-reference.ts — NE PAS ÉDITER À LA MAIN. -->',
  '',
  '# Référence des modèles',
  '',
  'Forme de chaque schéma exposé par le SDK (surface boutique), rendue depuis le contrat',
  'figé `@echoppe/client`. Chaque modèle liste ses propriétés (type, description, objets',
  'imbriqués dépliables) avec un exemple d’appel et un exemple de réponse.',
  '',
];

for (const name of modelNames) {
  lines.push(`## ${name}`, '', `<ModelDoc name="${name}" />`, '');

  const sdk = codeExample(name);
  const rest = restExample(name);
  if (sdk && rest) {
    lines.push(
      '**Exemple d’appel**',
      '',
      '::: code-group',
      '',
      '```ts [SDK]',
      sdk,
      '```',
      '',
      '```js [REST]',
      rest,
      '```',
      '',
      ':::',
      '',
    );
  }

  lines.push('**Exemple de réponse**', '', `<ResponseSample name="${name}" />`, '');
}

await Bun.write(OUTPUT, `${lines.join('\n').trimEnd()}\n`);
console.log(`✓ docs/sdk/reference.md généré (${modelNames.length} modèles)`);
