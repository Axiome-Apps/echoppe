// `theme-without-fonts` : le thème par défaut sans Inter — Axiome fournit ses propres
// polices (styles/fonts.css), inutile d'embarquer les 14 fichiers d'Inter.
import DefaultTheme from 'vitepress/theme-without-fonts';
import type { Theme } from 'vitepress';
// Importées après DefaultTheme → nos overrides gagnent à specificité égale.
import './styles/fonts.css';
import './styles/axiome.css';
import './styles/api-reference.css';
import ApiBlock from './components/ApiBlock.vue';
import ModelDoc from './components/ModelDoc.vue';
import ResponseSample from './components/ResponseSample.vue';
import SchemaFields from './components/SchemaFields.vue';

// Thème par défaut (skin Axiome) + composants de la référence SDK (rendus depuis le
// contrat storefront). ApiBlock porte la mise en page 2 colonnes de la page reference.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // SchemaFields enregistré globalement → utilisable récursivement dans son propre template.
    app.component('SchemaFields', SchemaFields);
    app.component('ModelDoc', ModelDoc);
    app.component('ResponseSample', ResponseSample);
    app.component('ApiBlock', ApiBlock);
  },
} satisfies Theme;
