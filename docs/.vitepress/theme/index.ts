import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import ModelDoc from './components/ModelDoc.vue';
import ResponseSample from './components/ResponseSample.vue';
import SchemaFields from './components/SchemaFields.vue';

// Thème par défaut + composants de la référence SDK (rendus depuis le contrat storefront).
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // SchemaFields enregistré globalement → utilisable récursivement dans son propre template.
    app.component('SchemaFields', SchemaFields);
    app.component('ModelDoc', ModelDoc);
    app.component('ResponseSample', ResponseSample);
  },
} satisfies Theme;
