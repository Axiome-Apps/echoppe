// Les trois verbes de déclaration (naming validé) :
//   - defineComponent : atom/molecule — groupe de champs nommé RÉUTILISABLE, non insérable en page.
//   - defineSection   : bloc de page — va dans `page.sections`, fetché + bouclé par le front.
//   - defineContent   : racine — LE seul point lu par la CLI ; les components sont AUTO-COLLECTÉS
//                       en marchant les références des sections.
//
// Génériques : `defineSection`/`defineComponent` capturent les champs `F` (const) et le nom `Name`
// (littéral), `defineContent` capture le tuple `S` des sections. Cette préservation alimente
// l'inférence de types côté front (`InferData` / `InferSections`, cf. types.ts).

import type { ContentDefinition, Definition, Fields } from './types.js';

export interface DefinitionConfig<F extends Fields> {
  label?: string;
  icon?: string;
  fields: F;
}

const define = <F extends Fields, Name extends string>(
  role: Definition['role'],
  name: Name,
  config: DefinitionConfig<F>,
): Definition<F, Name> => ({
  kind: 'definition',
  role,
  name,
  label: config.label,
  icon: config.icon,
  fields: config.fields,
});

export function defineComponent<const F extends Fields, Name extends string>(
  name: Name,
  config: DefinitionConfig<F>,
): Definition<F, Name> {
  return define('component', name, config);
}

export function defineSection<const F extends Fields, Name extends string>(
  name: Name,
  config: DefinitionConfig<F>,
): Definition<F, Name> {
  return define('section', name, config);
}

export interface ContentConfig<S extends readonly Definition[]> {
  sections: S;
}

export function defineContent<const S extends readonly Definition[]>(
  config: ContentConfig<S>,
): ContentDefinition<S> {
  for (const section of config.sections) {
    if (section.role !== 'section') {
      throw new Error(
        `defineContent : « ${section.name} » est un component, pas une section. Seules les sections (defineSection) sont insérables en page.`,
      );
    }
  }
  return { kind: 'content', sections: config.sections };
}
