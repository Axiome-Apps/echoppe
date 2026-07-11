<script setup lang="ts">
// Bloc « endpoint » de la référence SDK : schéma/prose à gauche, panneau code sticky à
// droite (look API type Stripe/Scalar). Alimenté par deux slots remplis en markdown
// depuis la page générée — le contenu (ModelDoc, code-group, ResponseSample) garde donc
// la coloration Shiki et les onglets natifs de VitePress.
</script>

<template>
  <div class="api-block">
    <div class="api-block__doc">
      <slot name="doc" />
    </div>
    <div class="api-block__code">
      <slot name="code" />
    </div>
  </div>
</template>

<style scoped>
.api-block {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: start;
  margin: 1rem 0 3rem;
}

/* Le panneau code suit le scroll tant que la colonne schéma (plus haute) défile. */
.api-block__code {
  position: sticky;
  top: calc(var(--vp-nav-height) + 1.5rem);
}

/* Sous ~960px la scène n'a plus la place pour 2 colonnes → on empile, code sous schéma. */
@media (max-width: 959px) {
  .api-block {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .api-block__code {
    position: static;
  }
}
</style>
