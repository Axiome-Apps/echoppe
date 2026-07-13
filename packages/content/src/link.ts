// Component `link` LIVRÉ avec le package. Remplace le champ `url` (retiré) : un lien n'est pas
// une simple chaîne mais un couple libellé + cible, avec ouverture dans un nouvel onglet
// optionnelle. Le dev le pose comme n'importe quel component : `cta: link`.

import { defineComponent } from './define.js';
import { field as f } from './field.js';

export const link = defineComponent('link', {
  label: 'Lien',
  icon: 'link',
  fields: {
    label: f.text({ label: 'Libellé', required: true }),
    href: f.text({ label: 'Cible', required: true }),
    newTab: f.boolean({ label: 'Ouvrir dans un nouvel onglet' }),
  },
});
