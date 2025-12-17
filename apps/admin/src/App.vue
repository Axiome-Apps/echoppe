<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuth } from './composables/useAuth';

const auth = useAuth();

onMounted(async () => {
  await auth.checkAuth();
});
</script>

<template>
  <router-view />
</template>
