<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/lib/api';
import { useSortable, type FlatDropPosition } from '@/composables/sortable';
import Button from '@/components/atoms/Button.vue';
import Select from '@/components/atoms/Select.vue';
import Label from '@/components/atoms/Label.vue';
import Badge from '@/components/atoms/Badge.vue';
import IconButton from '@/components/atoms/IconButton.vue';
import RichTextEditor from '@/components/atoms/RichTextEditor.vue';
import TrashIcon from '@/components/atoms/icons/TrashIcon.vue';
import EditIcon from '@/components/atoms/icons/EditIcon.vue';
import Thumbnail from '@/components/atoms/Thumbnail.vue';
import ProductMediaGallery from '@/components/ProductMediaGallery.vue';
import VariantModal from '@/components/VariantModal.vue';
import DataTable from '@/components/organisms/DataTable/DataTable.vue';
import type { DataTableColumn } from '@/components/organisms/DataTable/types';
import { type Media } from '@/composables/media';

// Types inferes depuis Eden
type Product = NonNullable<Awaited<ReturnType<typeof api.products.get>>['data']>['data'][number];
type Category = NonNullable<Awaited<ReturnType<typeof api.categories.get>>['data']>[number];
type TaxRate = NonNullable<Awaited<ReturnType<typeof api['tax-rates']['get']>>['data']>[number];
type Collection = NonNullable<Awaited<ReturnType<typeof api.collections.get>>['data']>['data'][number];
// Type pour une variante avec ses optionValues (retourné par GET /products/:id)
type ProductDetailResponse = Awaited<ReturnType<ReturnType<typeof api.products>['get']>>;
type ProductDetail = Extract<NonNullable<ProductDetailResponse['data']>, { variants: unknown[] }>;
type Variant = ProductDetail['variants'][number];
type Option = {
  id: string;
  name: string;
  values: { id: string; value: string }[];
};

// Type ProductMedia inféré depuis Eden
type ProductMedia = NonNullable<Awaited<ReturnType<ReturnType<typeof api.products>['media']['get']>>['data']>[number];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const route = useRoute();
const router = useRouter();

const isNew = computed(() => route.params.id === 'new');
const productId = computed(() => (isNew.value ? null : route.params.id as string));

const product = ref<Product | null>(null);
const categories = ref<Category[]>([]);
const taxRates = ref<TaxRate[]>([]);
const collections = ref<Collection[]>([]);
const variants = ref<Variant[]>([]);
const options = ref<Option[]>([]);
const variantThumbnails = ref<Map<string, string>>(new Map());
const productMedia = ref<ProductMedia[]>([]);
const mediaCache = ref<Map<string, Media>>(new Map());
const loading = ref(true);
const saving = ref(false);

// Dirty state tracking
const initialFormState = ref<typeof form.value | null>(null);

const hasChanges = computed(() => {
  if (!initialFormState.value) return false;
  if (isNew.value && form.value.name.trim()) return true; // Nouveau produit avec un nom
  return JSON.stringify(form.value) !== JSON.stringify(initialFormState.value);
});

// Modal state
const showVariantModal = ref(false);
const editingVariant = ref<Variant | null>(null);

const form = ref({
  name: '',
  slug: '',
  description: '',
  category: '',
  taxRate: '',
  collection: '',
  status: 'draft' as 'draft' | 'published' | 'archived',
});

// Computed options for selects
const categoryOptions = computed(() =>
  categories.value.map((c: Category) => ({ value: c.id, label: c.name }))
);

const taxRateOptions = computed(() =>
  taxRates.value.map((t: TaxRate) => ({ value: t.id, label: `${t.name} (${t.rate}%)` }))
);

const collectionOptions = computed(() => [
  { value: '', label: 'Aucune collection' },
  ...collections.value.map((c: Collection) => ({ value: c.id, label: c.name }))
]);

const statusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publie' },
  { value: 'archived', label: 'Archive' },
];

// Computed for dates display
const dateCreated = computed(() => {
  if (!product.value?.dateCreated) return '-';
  return new Date(product.value.dateCreated).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const dateUpdated = computed(() => {
  if (!product.value?.dateUpdated) return '-';
  return new Date(product.value.dateUpdated).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// Load data
async function loadCategories() {
  const { data } = await api.categories.get();
  if (data) categories.value = data;
}

async function loadTaxRates() {
  const { data } = await api['tax-rates'].get();
  if (data && Array.isArray(data)) taxRates.value = data;
}

async function loadCollections() {
  const { data } = await api.collections.get({ query: { limit: 100 } });
  if (data && 'data' in data) collections.value = data.data;
}

async function loadProduct() {
  if (!productId.value) return;

  const { data } = await api.products({ id: productId.value }).get();
  if (data && 'id' in data) {
    product.value = data;
    const formData = {
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      category: data.category,
      taxRate: data.taxRate,
      collection: '',
      status: data.status,
    };
    form.value = formData;
    // Store initial state for dirty checking
    initialFormState.value = { ...formData };
    // Load variants with their option values
    if ('variants' in data && Array.isArray(data.variants)) {
      variants.value = data.variants;
    }
    // Load options with values
    if ('options' in data && Array.isArray(data.options)) {
      options.value = data.options;
    }
    // Load product media and variant thumbnails
    await loadProductMedia();
  }
}

async function loadProductMedia() {
  if (!productId.value) return;

  const thumbnails = new Map<string, string>();

  try {
    const { data: productMediaList } = await api.products({ id: productId.value }).media.get();
    if (productMediaList) {
      productMedia.value = productMediaList;

      // Charger les détails des médias manquants
      for (const pm of productMediaList) {
        if (!mediaCache.value.has(pm.media)) {
          const { data: mediaData } = await api.media({ id: pm.media }).get();
          if (mediaData && 'id' in mediaData) {
            mediaCache.value.set(pm.media, mediaData as Media);
          }
        }
        // Construire les thumbnails des variantes
        if (pm.featuredForVariant) {
          thumbnails.set(pm.featuredForVariant, `${API_URL}/assets/${pm.media}`);
        }
      }
    }
  } catch {
    // Ignore errors
  }

  variantThumbnails.value = thumbnails;
}


// Variant modal functions
function openVariantModal(variant?: Variant) {
  editingVariant.value = variant ?? null;
  showVariantModal.value = true;
}

function closeVariantModal() {
  showVariantModal.value = false;
  editingVariant.value = null;
}

async function onVariantSaved() {
  // Reload pour avoir les données fraîches avec optionValues
  await loadProduct();
  closeVariantModal();
}

function updateOptions(newOptions: Option[]) {
  options.value = newOptions;
}

// Handle media changes from ProductMediaGallery - reload media from API
async function handleMediaChange() {
  await loadProductMedia();
}

// Status badge variant
function getStatusBadge(status: string): 'success' | 'warning' | 'default' {
  switch (status) {
    case 'published':
      return 'success';
    case 'draft':
      return 'warning';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'published':
      return 'Publié';
    case 'draft':
      return 'Brouillon';
    case 'archived':
      return 'Archivé';
    default:
      return status;
  }
}

// DataTable columns for variants
type VariantRecord = Variant & Record<string, unknown>;
const variantColumns = computed<DataTableColumn<VariantRecord>[]>(() => [
  {
    id: 'thumbnail',
    label: '',
    accessorKey: 'id',
    size: 64,
    sortable: false,
    hideable: false,
    cell: ({ row }) =>
      h(Thumbnail, {
        src: variantThumbnails.value.get(row.original.id) || null,
        alt: row.original.sku || 'Variante',
        size: 'md',
      }),
  },
  {
    id: 'sku',
    label: 'SKU',
    accessorKey: 'sku',
    cell: ({ row }) => h('span', { class: 'font-mono text-gray-700' }, row.original.sku || '-'),
  },
  {
    id: 'barcode',
    label: 'Code-barres',
    accessorKey: 'barcode',
    defaultVisible: false,
    cell: ({ row }) => h('span', { class: 'font-mono text-gray-500 text-sm' }, row.original.barcode || '-'),
  },
  {
    id: 'priceHt',
    label: 'Prix HT',
    accessorKey: 'priceHt',
    cell: ({ row }) => h('span', { class: 'font-medium' }, `${row.original.priceHt} €`),
  },
  {
    id: 'compareAtPriceHt',
    label: 'Prix barré',
    accessorKey: 'compareAtPriceHt',
    defaultVisible: false,
    cell: ({ row }) =>
      h('span', { class: 'text-gray-500' }, row.original.compareAtPriceHt ? `${row.original.compareAtPriceHt} €` : '-'),
  },
  {
    id: 'costPrice',
    label: 'Coût d\'achat',
    accessorKey: 'costPrice',
    defaultVisible: false,
    cell: ({ row }) =>
      h('span', { class: 'text-gray-500' }, row.original.costPrice ? `${row.original.costPrice} €` : '-'),
  },
  {
    id: 'quantity',
    label: 'Stock',
    accessorKey: 'quantity',
    cell: ({ row }) =>
      h(
        'span',
        { class: row.original.quantity > 0 ? 'text-gray-900' : 'text-red-600 font-medium' },
        String(row.original.quantity)
      ),
  },
  {
    id: 'weight',
    label: 'Poids',
    accessorKey: 'weight',
    defaultVisible: false,
    cell: ({ row }) =>
      h('span', { class: 'text-gray-500' }, row.original.weight ? `${row.original.weight} kg` : '-'),
  },
  {
    id: 'status',
    label: 'Statut',
    accessorKey: 'status',
    cell: ({ row }) =>
      h(Badge, { variant: getStatusBadge(row.original.status), size: 'sm' }, () =>
        getStatusLabel(row.original.status)
      ),
  },
  {
    id: 'actions',
    label: '',
    sortable: false,
    hideable: false,
    size: 90,
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1' }, [
        h(
          IconButton,
          {
            variant: 'ghost',
            size: 'sm',
            title: 'Modifier',
            class: 'text-gray-400 hover:text-blue-600 hover:bg-blue-50',
            onClick: (e: Event) => {
              e.stopPropagation();
              openVariantModal(row.original as Variant);
            },
          },
          () => h(EditIcon, { class: 'w-4 h-4' })
        ),
        h(
          IconButton,
          {
            variant: 'ghost',
            size: 'sm',
            title: 'Supprimer',
            class: 'text-gray-400 hover:text-red-600 hover:bg-red-50',
            onClick: (e: Event) => {
              e.stopPropagation();
              deleteVariant(row.original.id);
            },
          },
          () => h(TrashIcon, { class: 'w-4 h-4' })
        ),
      ]),
  },
]);

// Variants data cast pour DataTable
const variantsData = computed<VariantRecord[]>(() => variants.value as VariantRecord[]);

function handleAddVariant() {
  openVariantModal();
}

function getVariantRowId(row: VariantRecord): string {
  return row.id;
}

// Sortable instance for calculating new order
const variantSortable = useSortable({
  dropZoneAttr: 'data-datatable-drop',
  onReorder: () => {}, // Not used directly, we use handleVariantReorder
});

async function handleVariantReorder(draggedId: string, targetId: string, position: FlatDropPosition) {
  if (!productId.value) return;

  // Calculate new order
  const sortableItems = variants.value.map((v) => ({ id: v.id, sortOrder: v.sortOrder }));
  const newOrder = variantSortable.calculateNewOrder(sortableItems, draggedId, targetId, position);

  if (newOrder.length === 0) return;

  // Update locally first for immediate feedback
  const reorderedVariants = [...variants.value].sort((a, b) => {
    const aOrder = newOrder.find((o) => o.id === a.id)?.sortOrder ?? a.sortOrder;
    const bOrder = newOrder.find((o) => o.id === b.id)?.sortOrder ?? b.sortOrder;
    return aOrder - bOrder;
  });
  variants.value = reorderedVariants;

  // Update API
  await Promise.all(
    newOrder.map(({ id, sortOrder }) => {
      const v = variants.value.find((variant) => variant.id === id)!;
      return api.products({ id: productId.value! }).variants({ variantId: id }).put({
        priceHt: parseFloat(v.priceHt),
        sortOrder,
        sku: v.sku ?? undefined,
        barcode: v.barcode ?? undefined,
        compareAtPriceHt: v.compareAtPriceHt ? parseFloat(v.compareAtPriceHt) : undefined,
        costPrice: v.costPrice ? parseFloat(v.costPrice) : undefined,
        weight: v.weight ? parseFloat(v.weight) : undefined,
        length: v.length ? parseFloat(v.length) : undefined,
        width: v.width ? parseFloat(v.width) : undefined,
        height: v.height ? parseFloat(v.height) : undefined,
        isDefault: v.isDefault,
        status: v.status,
        quantity: v.quantity,
        lowStockThreshold: v.lowStockThreshold ?? undefined,
      });
    })
  );

  // Reload for fresh data
  await loadProduct();
}

onMounted(async () => {
  loading.value = true;
  await Promise.all([loadCategories(), loadTaxRates(), loadCollections()]);

  if (!isNew.value) {
    await loadProduct();
  } else {
    form.value.category = categories.value[0]?.id || '';
    form.value.taxRate = taxRates.value.find(t => t.isDefault)?.id || taxRates.value[0]?.id || '';
    // Store initial state for new product
    initialFormState.value = { ...form.value };
  }

  loading.value = false;
});

// Actions
async function save() {
  saving.value = true;

  const payload = {
    name: form.value.name,
    description: form.value.description || undefined,
    category: form.value.category,
    taxRate: form.value.taxRate,
    status: form.value.status,
  };

  try {
    if (isNew.value) {
      const { data } = await api.products.post(payload);
      if (data && 'id' in data) {
        product.value = data;
        form.value.slug = data.slug;
        router.replace(`/produits/${data.id}`);
      }
    } else if (productId.value) {
      await api.products({ id: productId.value }).put(payload);
      await loadProduct();
    }
  } finally {
    saving.value = false;
  }
}

async function deleteVariant(variantId: string) {
  if (!productId.value) return;

  await api.products({ id: productId.value }).variants({ variantId }).delete();
  variants.value = variants.value.filter((v) => v.id !== variantId);
}

function goBack() {
  router.push('/produits');
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition"
          @click="goBack"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ isNew ? 'Nouveau produit' : form.name || 'Produit' }}
        </h1>
      </div>
      <Button
        variant="primary"
        size="lg"
        :loading="saving"
        :disabled="!hasChanges || saving"
        @click="save"
      >
        {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
      </Button>
    </div>

    <div
      v-if="loading"
      class="text-gray-500"
    >
      Chargement...
    </div>

    <!-- Main layout: 2 columns -->
    <div
      v-else
      class="flex gap-6"
    >
      <!-- Left: Main content -->
      <div class="flex-1 min-w-0 space-y-6">
        <!-- Product info card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-medium text-gray-900 mb-4">
            Informations principales
          </h3>
          <div class="space-y-4">
            <div>
              <Label required>Nom du produit</Label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nom du produit"
              />
            </div>

            <div>
              <Label>Description</Label>
              <RichTextEditor
                :content="form.description"
                :on-change="(html) => form.description = html"
                placeholder="Description du produit..."
                min-height="200px"
              />
            </div>
          </div>
        </div>

        <!-- Media section (only for existing products) -->
        <div
          v-if="!isNew"
          class="bg-white rounded-lg shadow p-6"
        >
          <ProductMediaGallery
            v-if="productId"
            :product-id="productId"
            :variants="variants"
            :product-media="productMedia"
            :media-cache="mediaCache"
            @media-change="handleMediaChange"
          />
        </div>

        <!-- Variants section (only for existing products) -->
        <div
          v-if="!isNew"
          class="bg-white rounded-lg shadow p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-gray-900">
              Variantes ({{ variants.length }})
            </h3>
          </div>
          <DataTable
            :data="variantsData"
            :columns="variantColumns"
            :selectable="false"
            :searchable="false"
            :filterable="false"
            :add-column-enabled="true"
            :reorderable="true"
            :row-id="getVariantRowId"
            :on-reorder="handleVariantReorder"
            add-label="Ajouter une variante"
            empty-message="Aucune variante pour ce produit"
            @add="handleAddVariant"
          />
        </div>
      </div>

      <!-- Right: Sidebar -->
      <div class="w-80 flex-shrink-0 space-y-6">
        <!-- Status card -->
        <div class="bg-white rounded-lg shadow p-5">
          <h3 class="font-semibold text-gray-900 mb-4">
            Publication
          </h3>
          <div>
            <Label>Statut</Label>
            <Select
              v-model="form.status"
              :options="statusOptions"
            />
          </div>
        </div>

        <!-- Organization card -->
        <div class="bg-white rounded-lg shadow p-5">
          <h3 class="font-semibold text-gray-900 mb-4">
            Organisation
          </h3>
          <div class="space-y-4">
            <div>
              <Label required>Catégorie</Label>
              <Select
                v-model="form.category"
                :options="categoryOptions"
                placeholder="Sélectionner une catégorie"
              />
            </div>
            <div>
              <Label>Collection</Label>
              <Select
                v-model="form.collection"
                :options="collectionOptions"
              />
            </div>
          </div>
        </div>

        <!-- Tax card -->
        <div class="bg-white rounded-lg shadow p-5">
          <h3 class="font-semibold text-gray-900 mb-4">
            Fiscalité
          </h3>
          <div>
            <Label required>Taux de TVA</Label>
            <Select
              v-model="form.taxRate"
              :options="taxRateOptions"
            />
          </div>
        </div>

        <!-- Metadata card (only for existing products) -->
        <div
          v-if="!isNew"
          class="bg-white rounded-lg shadow p-5"
        >
          <h3 class="font-semibold text-gray-900 mb-4">
            Informations
          </h3>
          <div class="space-y-4">
            <div>
              <Label>Slug</Label>
              <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-gray-600 font-mono">
                {{ form.slug }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm text-gray-500">Créé le</span>
                <div class="text-sm text-gray-700">
                  {{ dateCreated }}
                </div>
              </div>
              <div>
                <span class="text-sm text-gray-500">Modifié le</span>
                <div class="text-sm text-gray-700">
                  {{ dateUpdated }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Variant Modal -->
    <VariantModal
      v-if="showVariantModal && productId"
      :product-id="productId"
      :variant="editingVariant"
      :options="options"
      :product-media="productMedia"
      :media-cache="mediaCache"
      :on-close="closeVariantModal"
      :on-saved="onVariantSaved"
      :on-options-change="updateOptions"
    />
  </div>
</template>
