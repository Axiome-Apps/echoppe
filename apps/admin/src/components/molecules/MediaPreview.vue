<script setup lang="ts">
import type { Media } from '@/composables/media';
import { getMediaUrl, isImage } from '@/composables/media';
import DocumentIcon from '@/components/atoms/icons/DocumentIcon.vue';

defineProps<{
  media: Media;
  maxHeight?: string;
}>();
</script>

<template>
  <div class="bg-gray-900 flex items-center justify-center p-4" :class="maxHeight || 'min-h-80'">
    <img
      v-if="isImage(media)"
      :src="getMediaUrl(media)"
      :alt="media.alt || ''"
      class="max-w-full max-h-80 object-contain"
    />
    <DocumentIcon v-else size="lg" class="w-20 h-20 text-gray-600" />
  </div>
</template>
