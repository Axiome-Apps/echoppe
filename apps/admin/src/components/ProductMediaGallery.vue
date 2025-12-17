<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/lib/api';
import StarIcon from '@/components/atoms/icons/StarIcon.vue';
import TrashIcon from '@/components/atoms/icons/TrashIcon.vue';
import MediaPickerModal from '@/components/organisms/MediaPickerModal.vue';

type Media = NonNullable<Extract<Awaited<ReturnType<typeof api.media.get>>['data'], unknown[]>>[number];

interface ProductMedia {
  product: string;
  media: string;
  sortOrder: number;
  isFeatured: boolean;
  featuredForVariant: string | null;
}

interface Variant {
  id: string;
  sku: string | null;
}

const props = defineProps<{
  productId: string;
  variants: Variant[];
}>();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const productMedia = ref<ProductMedia[]>([]);
const allMedia = ref<Media[]>([]);
const loading = ref(true);
const showPicker = ref(false);

const mediaWithDetails = computed(() => {
  return productMedia.value.map((pm) => {
    const media = allMedia.value.find((m) => m.id === pm.media);
    return { ...pm, mediaDetails: media };
  });
});

const galleryMediaIds = computed(() => new Set(productMedia.value.map((pm) => pm.media)));

async function loadProductMedia() {
  const { data } = await api.products({ id: props.productId }).media.get();
  if (data && Array.isArray(data)) productMedia.value = data;
}

async function loadAllMedia() {
  const { data } = await api.media.get({ query: {} });
  if (data && Array.isArray(data)) {
    allMedia.value = data.filter((m) => m.mimeType.startsWith('image/'));
  }
}

onMounted(async () => {
  loading.value = true;
  await Promise.all([loadProductMedia(), loadAllMedia()]);
  loading.value = false;
});

async function addMedia(mediaId: string) {
  const maxSortOrder = Math.max(0, ...productMedia.value.map((m) => m.sortOrder));
  await api.products({ id: props.productId }).media.post({
    mediaId,
    sortOrder: maxSortOrder + 1,
    isFeatured: productMedia.value.length === 0,
  });
  await loadProductMedia();
  showPicker.value = false;
}

async function removeMedia(mediaId: string) {
  await api.products({ id: props.productId }).media({ mediaId }).delete();
  await loadProductMedia();
}

async function setFeatured(mediaId: string) {
  await api.products({ id: props.productId }).media({ mediaId }).put({
    isFeatured: true,
  });
  await loadProductMedia();
}

async function setVariantFeatured(mediaId: string, variantId: string | null) {
  await api.products({ id: props.productId }).media({ mediaId }).put({
    featuredForVariant: variantId,
  });
  await loadProductMedia();
}

function getMediaUrl(item: Media) {
  return `${API_URL}/assets/${item.id}`;
}

function getVariantLabel(variantId: string) {
  const variant = props.variants.find((v) => v.id === variantId);
  return variant?.sku || 'Variante';
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-gray-900">Images du produit</h3>
      <button
        @click="showPicker = true"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        + Ajouter des images
      </button>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Chargement...</div>

    <div v-else-if="mediaWithDetails.length === 0" class="text-gray-500 text-sm">
      Aucune image. Cliquez sur "Ajouter des images" pour commencer.
    </div>

    <div v-else class="grid grid-cols-4 gap-4">
      <div
        v-for="item in mediaWithDetails"
        :key="item.media"
        class="relative group"
      >
        <div
          class="aspect-square bg-gray-100 rounded-lg overflow-hidden"
          :class="{ 'ring-2 ring-blue-500': item.isFeatured }"
        >
          <img
            v-if="item.mediaDetails"
            :src="getMediaUrl(item.mediaDetails)"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Badges -->
        <div class="absolute top-2 left-2 flex flex-col gap-1">
          <span
            v-if="item.isFeatured"
            class="px-2 py-0.5 bg-blue-600 text-white text-xs rounded"
          >
            Featured
          </span>
          <span
            v-if="item.featuredForVariant"
            class="px-2 py-0.5 bg-purple-600 text-white text-xs rounded"
          >
            {{ getVariantLabel(item.featuredForVariant) }}
          </span>
        </div>

        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
          <button
            v-if="!item.isFeatured"
            @click="setFeatured(item.media)"
            class="p-2 bg-white rounded-full hover:bg-blue-50"
            title="Definir comme featured"
          >
            <StarIcon size="sm" class="text-blue-600" />
          </button>

          <!-- Variant selector -->
          <div v-if="variants.length > 0" class="relative">
            <select
              :value="item.featuredForVariant || ''"
              @change="setVariantFeatured(item.media, ($event.target as HTMLSelectElement).value || null)"
              class="p-2 text-xs bg-white rounded border-0 cursor-pointer"
            >
              <option value="">Aucune variante</option>
              <option v-for="v in variants" :key="v.id" :value="v.id">
                {{ v.sku || 'Variante' }}
              </option>
            </select>
          </div>

          <button
            @click="removeMedia(item.media)"
            class="p-2 bg-white rounded-full hover:bg-red-50"
            title="Retirer"
          >
            <TrashIcon size="sm" class="text-red-600" />
          </button>
        </div>
      </div>
    </div>

    <!-- Media Picker Modal -->
    <MediaPickerModal
      :open="showPicker"
      title="Ajouter des images"
      :media="allMedia"
      :disabled-ids="galleryMediaIds"
      :columns="5"
      empty-message="Aucune image dans la mediatheque."
      @select="addMedia"
      @close="showPicker = false"
    />
  </div>
</template>
