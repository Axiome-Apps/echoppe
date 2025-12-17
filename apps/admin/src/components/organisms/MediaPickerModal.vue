<script setup lang="ts">
import Modal from '@/components/atoms/Modal.vue';
import CheckIcon from '@/components/atoms/icons/CheckIcon.vue';
import SpinnerIcon from '@/components/atoms/icons/SpinnerIcon.vue';

interface MediaItem {
  id: string;
  filenameDisk?: string;
  filenameOriginal?: string;
  mimeType: string;
}

defineProps<{
  open: boolean;
  title?: string;
  media: MediaItem[];
  loading?: boolean;
  selectedIds?: Set<string>;
  disabledIds?: Set<string>;
  emptyMessage?: string;
  columns?: 4 | 5 | 6;
}>();

const emit = defineEmits<{
  select: [mediaId: string];
  close: [];
}>();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getMediaUrl(item: MediaItem) {
  return `${API_URL}/assets/${item.id}`;
}

function isDisabled(id: string, disabledIds?: Set<string>) {
  return disabledIds?.has(id) ?? false;
}

function handleSelect(item: MediaItem, disabledIds?: Set<string>) {
  if (isDisabled(item.id, disabledIds)) return;
  emit('select', item.id);
}

const columnClasses = {
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};
</script>

<template>
  <Modal
    v-if="open"
    :title="title || 'Choisir une image'"
    size="xl"
    @close="emit('close')"
  >
    <div v-if="loading" class="text-center py-8 text-gray-500">
      <SpinnerIcon class="mx-auto text-blue-600 mb-2" />
      <p>Chargement...</p>
    </div>

    <div v-else-if="media.length === 0" class="text-center py-8 text-gray-500">
      {{ emptyMessage || 'Aucune image disponible.' }}
    </div>

    <div v-else :class="['grid gap-3', columnClasses[columns || 4]]">
      <button
        v-for="item in media"
        :key="item.id"
        @click="handleSelect(item, disabledIds)"
        :disabled="isDisabled(item.id, disabledIds)"
        :class="[
          'aspect-square bg-gray-100 rounded-lg overflow-hidden transition relative',
          isDisabled(item.id, disabledIds)
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:ring-2 hover:ring-blue-500 cursor-pointer'
        ]"
      >
        <img :src="getMediaUrl(item)" class="w-full h-full object-cover" />
        <div
          v-if="selectedIds?.has(item.id) || disabledIds?.has(item.id)"
          class="absolute inset-0 bg-black/30 flex items-center justify-center"
        >
          <CheckIcon size="lg" class="text-white" />
        </div>
      </button>
    </div>
  </Modal>
</template>
