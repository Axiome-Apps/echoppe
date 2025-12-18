<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/lib/api';
import StarIcon from '@/components/atoms/icons/StarIcon.vue';
import TrashIcon from '@/components/atoms/icons/TrashIcon.vue';
import MediaBrowserModal from '@/components/organisms/MediaBrowserModal.vue';
import { type Media, getMediaUrl as getMediaAssetUrl } from '@/composables/media';

// Types inférés depuis Eden
type ProductMedia = NonNullable<Awaited<ReturnType<ReturnType<typeof api.products>['media']['get']>>['data']>[number];
type Variant = NonNullable<Awaited<ReturnType<ReturnType<typeof api.products>['variants']['get']>>['data']>[number];

const props = defineProps<{
  productId: string;
  variants: Variant[];
}>();

const productMedia = ref<ProductMedia[]>([]);
const mediaCache = ref<Map<string, Media>>(new Map());
const loading = ref(true);
const showPicker = ref(false);

const mediaWithDetails = computed(() => {
  return productMedia.value.map((pm) => {
    const media = mediaCache.value.get(pm.media);
    return { ...pm, mediaDetails: media };
  });
});

const featuredMedia = computed(() => mediaWithDetails.value.find((m) => m.isFeatured));
const otherMedia = computed(() => mediaWithDetails.value.filter((m) => !m.isFeatured));

async function loadProductMedia() {
  const { data } = await api.products({ id: props.productId }).media.get();
  if (data) {
    productMedia.value = data;
    // Charger les détails des médias manquants
    for (const pm of data) {
      if (!mediaCache.value.has(pm.media)) {
        const { data: mediaData } = await api.media({ id: pm.media }).get();
        if (mediaData && 'id' in mediaData) {
          mediaCache.value.set(pm.media, mediaData as Media);
        }
      }
    }
  }
}

onMounted(async () => {
  loading.value = true;
  await loadProductMedia();
  loading.value = false;
});

async function handleMediaSelect(media: Media) {
  const maxSortOrder = Math.max(0, ...productMedia.value.map((m) => m.sortOrder));
  await api.products({ id: props.productId }).media.post({
    mediaId: media.id,
    sortOrder: maxSortOrder + 1,
    isFeatured: productMedia.value.length === 0,
  });
  mediaCache.value.set(media.id, media);
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
  return getMediaAssetUrl(item);
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
        class="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
      >
        + Ajouter des images
      </button>
    </div>

    <div v-if="loading" class="text-gray-500 text-sm">Chargement...</div>

    <div v-else-if="mediaWithDetails.length === 0" class="text-gray-500 text-sm">
      Aucune image. Cliquez sur "Ajouter des images" pour commencer.
    </div>

    <!-- Grid: featured (2x2) + small images -->
    <div v-else class="grid grid-cols-10 gap-2">
      <!-- Featured image (spans 2 cols and 2 rows) -->
      <div
        v-if="featuredMedia"
        class="col-span-2 row-span-2 relative group"
      >
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden ring-2 ring-blue-500">
          <img
            v-if="featuredMedia.mediaDetails"
            :src="getMediaUrl(featuredMedia.mediaDetails)"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Badge -->
        <div class="absolute top-2 left-2 flex flex-col gap-1">
          <span class="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
            Principale
          </span>
          <span
            v-if="featuredMedia.featuredForVariant"
            class="px-2 py-0.5 bg-purple-600 text-white text-xs rounded"
          >
            {{ getVariantLabel(featuredMedia.featuredForVariant) }}
          </span>
        </div>

        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
          <div v-if="variants.length > 0" class="relative">
            <select
              :value="featuredMedia.featuredForVariant || ''"
              @change="setVariantFeatured(featuredMedia.media, ($event.target as HTMLSelectElement).value || null)"
              class="p-2 text-xs bg-white rounded border-0 cursor-pointer"
            >
              <option value="">Aucune variante</option>
              <option v-for="v in variants" :key="v.id" :value="v.id">
                {{ v.sku || 'Variante' }}
              </option>
            </select>
          </div>

          <button
            @click="removeMedia(featuredMedia.media)"
            class="p-2 bg-white rounded-full hover:bg-red-50"
            title="Retirer"
          >
            <TrashIcon size="sm" class="text-red-600" />
          </button>
        </div>
      </div>

      <!-- Other images (small) -->
      <div
        v-for="item in otherMedia"
        :key="item.media"
        class="relative group"
      >
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            v-if="item.mediaDetails"
            :src="getMediaUrl(item.mediaDetails)"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Badge variante -->
        <span
          v-if="item.featuredForVariant"
          class="absolute top-1 left-1 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded"
        >
          {{ getVariantLabel(item.featuredForVariant) }}
        </span>

        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 rounded-lg">
          <button
            @click="setFeatured(item.media)"
            class="p-1.5 bg-white rounded-full hover:bg-blue-50"
            title="Définir comme principale"
          >
            <StarIcon size="sm" class="text-blue-600" />
          </button>

          <div v-if="variants.length > 0" class="relative">
            <select
              :value="item.featuredForVariant || ''"
              @change="setVariantFeatured(item.media, ($event.target as HTMLSelectElement).value || null)"
              class="p-1 text-[10px] bg-white rounded border-0 cursor-pointer"
            >
              <option value="">—</option>
              <option v-for="v in variants" :key="v.id" :value="v.id">
                {{ v.sku || 'Var.' }}
              </option>
            </select>
          </div>

          <button
            @click="removeMedia(item.media)"
            class="p-1.5 bg-white rounded-full hover:bg-red-50"
            title="Retirer"
          >
            <TrashIcon size="sm" class="text-red-600" />
          </button>
        </div>
      </div>
    </div>

    <!-- Media Browser Modal -->
    <MediaBrowserModal
      v-if="showPicker"
      title="Ajouter une image"
      accept="images"
      :on-select="handleMediaSelect"
      :on-close="() => showPicker = false"
    />
  </div>
</template>
