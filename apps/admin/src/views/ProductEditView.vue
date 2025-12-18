<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/lib/api';
import { useSortable } from '@/composables/sortable';
import type { FlatDropPosition } from '@/composables/sortable';
import Button from '@/components/atoms/Button.vue';
import Select from '@/components/atoms/Select.vue';
import Label from '@/components/atoms/Label.vue';
import Badge from '@/components/atoms/Badge.vue';
import IconButton from '@/components/atoms/IconButton.vue';
import RichTextEditor from '@/components/atoms/RichTextEditor.vue';
import GripIcon from '@/components/atoms/icons/GripIcon.vue';
import TrashIcon from '@/components/atoms/icons/TrashIcon.vue';
import PlusIcon from '@/components/atoms/icons/PlusIcon.vue';
import ProductMediaGallery from '@/components/ProductMediaGallery.vue';
import VariantModal from '@/components/VariantModal.vue';

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
const loading = ref(true);
const saving = ref(false);
const activeTab = ref<'variants' | 'media'>('variants');

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
    form.value = {
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      category: data.category,
      taxRate: data.taxRate,
      collection: '',
      status: data.status,
    };
    // Load variants with their option values
    if ('variants' in data && Array.isArray(data.variants)) {
      variants.value = data.variants;
    }
    // Load options with values
    if ('options' in data && Array.isArray(data.options)) {
      options.value = data.options;
    }
  }
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

// Drag & drop for variants reorder
async function handleVariantReorder(draggedId: string, targetId: string, position: FlatDropPosition) {
  if (!productId.value) return;

  // Calculer le nouvel ordre
  const sortableItems = variants.value.map((v) => ({ id: v.id, sortOrder: v.sortOrder }));
  const newOrder = variantSortable.calculateNewOrder(sortableItems, draggedId, targetId, position);

  if (newOrder.length === 0) return;

  // Mettre à jour en local d'abord pour un feedback immédiat
  const reorderedVariants = [...variants.value].sort((a, b) => {
    const aOrder = newOrder.find((o) => o.id === a.id)?.sortOrder ?? a.sortOrder;
    const bOrder = newOrder.find((o) => o.id === b.id)?.sortOrder ?? b.sortOrder;
    return aOrder - bOrder;
  });
  variants.value = reorderedVariants;

  // Mettre à jour l'API
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

  // Reload pour avoir les données fraîches
  await loadProduct();
}

const variantSortable = useSortable({
  dropZoneAttr: 'data-variant-drop',
  onReorder: handleVariantReorder,
});

onMounted(async () => {
  loading.value = true;
  await Promise.all([loadCategories(), loadTaxRates(), loadCollections()]);

  if (!isNew.value) {
    await loadProduct();
  } else {
    form.value.category = categories.value[0]?.id || '';
    form.value.taxRate = taxRates.value.find(t => t.isDefault)?.id || taxRates.value[0]?.id || '';
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
          @click="goBack"
          class="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ isNew ? 'Nouveau produit' : form.name || 'Produit' }}
        </h1>
      </div>
      <Button variant="primary" size="lg" :loading="saving" @click="save">
        {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
      </Button>
    </div>

    <div v-if="loading" class="text-gray-500">Chargement...</div>

    <!-- Main layout: 2 columns -->
    <div v-else class="flex gap-6">
      <!-- Left: Main content -->
      <div class="flex-1 min-w-0 space-y-6">
        <!-- Product info card -->
        <div class="bg-white rounded-lg shadow p-6">
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

        <!-- Tabs: Variants & Media (only for existing products) -->
        <div v-if="!isNew" class="bg-white rounded-lg shadow">
          <div class="border-b flex">
            <button
              @click="activeTab = 'variants'"
              :class="['px-6 py-3 text-sm font-medium border-b-2 -mb-px transition', activeTab === 'variants' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
            >
              Variantes ({{ variants.length }})
            </button>
            <button
              @click="activeTab = 'media'"
              :class="['px-6 py-3 text-sm font-medium border-b-2 -mb-px transition', activeTab === 'media' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
            >
              Medias
            </button>
          </div>

          <div class="p-6">
            <!-- Variants Tab -->
            <div v-if="activeTab === 'variants'" class="space-y-4">
              <!-- Header with add button -->
              <div class="flex justify-end">
                <Button variant="primary" size="sm" @click="openVariantModal()">
                  <PlusIcon class="w-4 h-4 mr-1" />
                  Ajouter une variante
                </Button>
              </div>

              <!-- Variants list -->
              <div v-if="variants.length > 0" class="border border-gray-200 rounded-lg overflow-hidden">
                <table class="w-full">
                  <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th class="w-10"></th>
                      <th class="px-4 py-3 text-left font-medium">SKU</th>
                      <th class="px-4 py-3 text-left font-medium">Prix HT</th>
                      <th class="px-4 py-3 text-left font-medium">Stock</th>
                      <th class="px-4 py-3 text-left font-medium">Statut</th>
                      <th class="px-4 py-3 text-right font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100" data-variant-drop>
                    <tr
                      v-for="v in variants"
                      :key="v.id"
                      :class="[
                        'hover:bg-gray-50 cursor-pointer transition-colors relative group/row',
                        variantSortable.isItemDragging(v.id) && 'opacity-40 bg-blue-50',
                      ]"
                      draggable="true"
                      data-variant-drop
                      @click="openVariantModal(v)"
                      @dragstart="variantSortable.handleDragStart($event, v.id)"
                      @dragover="variantSortable.handleDragOver($event, v.id)"
                      @dragleave="variantSortable.handleDragLeave($event)"
                      @drop="variantSortable.handleDrop($event, v.id)"
                      @dragend="variantSortable.handleDragEnd"
                    >
                      <!-- Drop indicator line - before -->
                      <td
                        v-if="variantSortable.isDropTarget(v.id) && variantSortable.getItemDropPosition(v.id) === 'before'"
                        colspan="6"
                        class="absolute inset-x-0 top-0 h-0 p-0 border-none"
                      >
                        <div class="h-0.5 bg-blue-500 rounded-full mx-2" />
                      </td>
                      <!-- Drop indicator line - after -->
                      <td
                        v-if="variantSortable.isDropTarget(v.id) && variantSortable.getItemDropPosition(v.id) === 'after'"
                        colspan="6"
                        class="absolute inset-x-0 bottom-0 h-0 p-0 border-none"
                      >
                        <div class="h-0.5 bg-blue-500 rounded-full mx-2" />
                      </td>
                      <td class="pl-2 py-3" @click.stop data-variant-drop>
                        <div class="cursor-grab text-gray-400 hover:text-gray-600">
                          <GripIcon />
                        </div>
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <span class="font-mono text-gray-700">{{ v.sku || '-' }}</span>
                      </td>
                      <td class="px-4 py-3 text-sm font-medium">
                        {{ v.priceHt }} €
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <span :class="v.quantity > 0 ? 'text-gray-900' : 'text-red-600 font-medium'">
                          {{ v.quantity }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <Badge :variant="getStatusBadge(v.status)" size="sm">
                          {{ getStatusLabel(v.status) }}
                        </Badge>
                      </td>
                      <td class="px-4 py-3 text-right" @click.stop>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          title="Supprimer"
                          class="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          @click="deleteVariant(v.id)"
                        >
                          <TrashIcon class="w-4 h-4" />
                        </IconButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty state -->
              <div
                v-else
                class="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"
              >
                <p class="text-gray-500 mb-4">Aucune variante pour ce produit</p>
                <Button variant="secondary" size="sm" @click="openVariantModal()">
                  <PlusIcon class="w-4 h-4 mr-1" />
                  Créer la première variante
                </Button>
              </div>
            </div>

            <!-- Media Tab -->
            <div v-if="activeTab === 'media'">
              <ProductMediaGallery
                v-if="productId"
                :product-id="productId"
                :variants="variants"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Sidebar -->
      <div class="w-80 flex-shrink-0 space-y-6">
        <!-- Status card -->
        <div class="bg-white rounded-lg shadow p-5">
          <h3 class="font-semibold text-gray-900 mb-4">Publication</h3>
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
          <h3 class="font-semibold text-gray-900 mb-4">Organisation</h3>
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
          <h3 class="font-semibold text-gray-900 mb-4">Fiscalité</h3>
          <div>
            <Label required>Taux de TVA</Label>
            <Select
              v-model="form.taxRate"
              :options="taxRateOptions"
            />
          </div>
        </div>

        <!-- Metadata card (only for existing products) -->
        <div v-if="!isNew" class="bg-white rounded-lg shadow p-5">
          <h3 class="font-semibold text-gray-900 mb-4">Informations</h3>
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
                <div class="text-sm text-gray-700">{{ dateCreated }}</div>
              </div>
              <div>
                <span class="text-sm text-gray-500">Modifié le</span>
                <div class="text-sm text-gray-700">{{ dateUpdated }}</div>
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
      :on-close="closeVariantModal"
      :on-saved="onVariantSaved"
      :on-options-change="updateOptions"
    />
  </div>
</template>
