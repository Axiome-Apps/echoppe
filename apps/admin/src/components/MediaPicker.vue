<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/lib/api';
import CloseIcon from '@/components/atoms/icons/CloseIcon.vue';
import EditIcon from '@/components/atoms/icons/EditIcon.vue';
import ImageIcon from '@/components/atoms/icons/ImageIcon.vue';
import MediaPickerModal from '@/components/organisms/MediaPickerModal.vue';

interface Media {
  id: string;
  filenameDisk: string;
  filenameOriginal: string;
  title: string | null;
  mimeType: string;
}

const props = defineProps<{
  modelValue: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const showPicker = ref(false);
const media = ref<Media[]>([]);
const loading = ref(false);
const selectedMedia = ref<Media | null>(null);

async function loadMedia() {
  loading.value = true;
  const { data } = await api.media.get({ query: {} });
  if (data) media.value = (data as Media[]).filter((m) => m.mimeType.startsWith('image/'));
  loading.value = false;
}

async function loadSelected() {
  if (props.modelValue) {
    const { data } = await api.media({ id: props.modelValue }).get();
    if (data) selectedMedia.value = data as Media;
  }
}

onMounted(loadSelected);

function openPicker() {
  loadMedia();
  showPicker.value = true;
}

function handleSelect(mediaId: string) {
  const item = media.value.find((m) => m.id === mediaId);
  if (item) {
    selectedMedia.value = item;
    emit('update:modelValue', item.id);
  }
  showPicker.value = false;
}

function clearMedia() {
  selectedMedia.value = null;
  emit('update:modelValue', null);
}

function getUrl(item: Media) {
  return `${API_URL}/assets/${item.id}`;
}
</script>

<template>
  <div>
    <!-- Selected preview -->
    <div
      v-if="selectedMedia"
      class="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden group"
    >
      <img :src="getUrl(selectedMedia)" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
        <button @click="openPicker" class="p-2 bg-white rounded-full">
          <EditIcon size="sm" />
        </button>
        <button @click="clearMedia" class="p-2 bg-white rounded-full">
          <CloseIcon size="sm" class="text-red-500" />
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <button
      v-else
      @click="openPicker"
      class="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition"
    >
      <ImageIcon size="lg" class="w-8 h-8 mb-1" />
      <span class="text-xs">Choisir</span>
    </button>

    <!-- Picker Modal -->
    <MediaPickerModal
      :open="showPicker"
      title="Choisir une image"
      :media="media"
      :loading="loading"
      empty-message="Aucune image. Uploadez des images dans la mediatheque."
      @select="handleSelect"
      @close="showPicker = false"
    />
  </div>
</template>
