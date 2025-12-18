<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/lib/api';
import Button from '@/components/atoms/Button.vue';
import Select from '@/components/atoms/Select.vue';
import Label from '@/components/atoms/Label.vue';
import ProductMediaGallery from '@/components/ProductMediaGallery.vue';

// Types inferes depuis Eden
type Product = NonNullable<Awaited<ReturnType<typeof api.products.get>>['data']>['data'][number];
type Category = NonNullable<Awaited<ReturnType<typeof api.categories.get>>['data']>[number];
type TaxRate = NonNullable<Awaited<ReturnType<typeof api['tax-rates']['get']>>['data']>[number];
type Collection = NonNullable<Awaited<ReturnType<typeof api.collections.get>>['data']>['data'][number];
type VariantResponse = Awaited<ReturnType<ReturnType<typeof api.products>['variants']['get']>>;
type Variant = NonNullable<Extract<VariantResponse['data'], unknown[]>>[number];

const route = useRoute();
const router = useRouter();

const isNew = computed(() => route.params.id === 'new');
const productId = computed(() => (isNew.value ? null : route.params.id as string));

const product = ref<Product | null>(null);
const categories = ref<Category[]>([]);
const taxRates = ref<TaxRate[]>([]);
const collections = ref<Collection[]>([]);
const variants = ref<Variant[]>([]);
const loading = ref(true);
const saving = ref(false);
const activeTab = ref<'variants' | 'media'>('variants');

const form = ref({
  name: '',
  slug: '',
  description: '',
  category: '',
  taxRate: '',
  collection: '',
  status: 'draft' as 'draft' | 'published' | 'archived',
});

const newVariant = ref({
  sku: '',
  priceHt: '',
  costPrice: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  quantity: 0,
});

const editingVariantId = ref<string | null>(null);
const editVariantForm = ref({
  sku: '',
  priceHt: '',
  costPrice: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  quantity: 0,
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
  }
}

async function loadVariants() {
  if (!productId.value) return;

  const { data } = await api.products({ id: productId.value }).variants.get();
  if (data && Array.isArray(data)) variants.value = data;
}

onMounted(async () => {
  loading.value = true;
  await Promise.all([loadCategories(), loadTaxRates(), loadCollections()]);

  if (!isNew.value) {
    await Promise.all([loadProduct(), loadVariants()]);
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

async function addVariant() {
  if (!productId.value) return;

  const payload = {
    sku: newVariant.value.sku || undefined,
    priceHt: parseFloat(newVariant.value.priceHt) || 0,
    costPrice: newVariant.value.costPrice ? parseFloat(newVariant.value.costPrice) : undefined,
    weight: newVariant.value.weight ? parseFloat(newVariant.value.weight) : undefined,
    length: newVariant.value.length ? parseFloat(newVariant.value.length) : undefined,
    width: newVariant.value.width ? parseFloat(newVariant.value.width) : undefined,
    height: newVariant.value.height ? parseFloat(newVariant.value.height) : undefined,
    quantity: newVariant.value.quantity,
  };

  const { data } = await api.products({ id: productId.value }).variants.post(payload);

  if (data && 'id' in data) {
    variants.value.push(data);
    newVariant.value = { sku: '', priceHt: '', costPrice: '', weight: '', length: '', width: '', height: '', quantity: 0 };
  }
}

function startEditVariant(v: Variant) {
  editingVariantId.value = v.id;
  editVariantForm.value = {
    sku: v.sku || '',
    priceHt: String(v.priceHt),
    costPrice: v.costPrice ? String(v.costPrice) : '',
    weight: v.weight ? String(v.weight) : '',
    length: v.length ? String(v.length) : '',
    width: v.width ? String(v.width) : '',
    height: v.height ? String(v.height) : '',
    quantity: v.quantity,
  };
}

function cancelEditVariant() {
  editingVariantId.value = null;
}

async function updateVariant() {
  if (!productId.value || !editingVariantId.value) return;

  const payload = {
    sku: editVariantForm.value.sku || undefined,
    priceHt: parseFloat(editVariantForm.value.priceHt) || 0,
    costPrice: editVariantForm.value.costPrice ? parseFloat(editVariantForm.value.costPrice) : undefined,
    weight: editVariantForm.value.weight ? parseFloat(editVariantForm.value.weight) : undefined,
    length: editVariantForm.value.length ? parseFloat(editVariantForm.value.length) : undefined,
    width: editVariantForm.value.width ? parseFloat(editVariantForm.value.width) : undefined,
    height: editVariantForm.value.height ? parseFloat(editVariantForm.value.height) : undefined,
    quantity: editVariantForm.value.quantity,
  };

  const { data } = await api.products({ id: productId.value }).variants({ variantId: editingVariantId.value }).put(payload);

  if (data && 'id' in data) {
    const index = variants.value.findIndex((v) => v.id === editingVariantId.value);
    if (index !== -1) variants.value[index] = data;
    editingVariantId.value = null;
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
              <textarea
                v-model="form.description"
                rows="5"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description du produit..."
              ></textarea>
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
            <div v-if="activeTab === 'variants'" class="space-y-6">
              <!-- Existing variants -->
              <div v-if="variants.length > 0" class="space-y-3">
                <div
                  v-for="v in variants"
                  :key="v.id"
                  class="p-4 border border-gray-200 rounded-lg"
                >
                  <!-- View mode -->
                  <template v-if="editingVariantId !== v.id">
                    <div class="flex items-start justify-between">
                      <div class="grid grid-cols-4 gap-4 text-sm flex-1">
                        <div>
                          <span class="text-gray-500">SKU:</span>
                          <span class="ml-1 font-medium">{{ v.sku || '-' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500">Prix HT:</span>
                          <span class="ml-1 font-medium">{{ v.priceHt }} EUR</span>
                        </div>
                        <div>
                          <span class="text-gray-500">Stock:</span>
                          <span class="ml-1 font-medium">{{ v.quantity }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500">Poids:</span>
                          <span class="ml-1 font-medium">{{ v.weight || '-' }} kg</span>
                        </div>
                        <div>
                          <span class="text-gray-500">L:</span>
                          <span class="ml-1 font-medium">{{ v.length || '-' }} cm</span>
                        </div>
                        <div>
                          <span class="text-gray-500">l:</span>
                          <span class="ml-1 font-medium">{{ v.width || '-' }} cm</span>
                        </div>
                        <div>
                          <span class="text-gray-500">H:</span>
                          <span class="ml-1 font-medium">{{ v.height || '-' }} cm</span>
                        </div>
                      </div>
                      <div class="flex gap-2 ml-4">
                        <button
                          @click="startEditVariant(v)"
                          class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          @click="deleteVariant(v.id)"
                          class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </template>

                  <!-- Edit mode -->
                  <template v-else>
                    <div class="grid grid-cols-4 gap-3">
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">SKU</label>
                        <input v-model="editVariantForm.sku" type="text" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Prix HT</label>
                        <input v-model="editVariantForm.priceHt" type="number" step="0.01" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Stock</label>
                        <input v-model.number="editVariantForm.quantity" type="number" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Poids (kg)</label>
                        <input v-model="editVariantForm.weight" type="number" step="0.001" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Longueur (cm)</label>
                        <input v-model="editVariantForm.length" type="number" step="0.1" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Largeur (cm)</label>
                        <input v-model="editVariantForm.width" type="number" step="0.1" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </div>
                      <div>
                        <label class="block text-xs text-gray-500 mb-1">Hauteur (cm)</label>
                        <input v-model="editVariantForm.height" type="number" step="0.1" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      </div>
                    </div>
                    <div class="flex gap-2 mt-3">
                      <Button variant="primary" size="sm" @click="updateVariant">Enregistrer</Button>
                      <Button variant="ghost" size="sm" @click="cancelEditVariant">Annuler</Button>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Add variant form -->
              <div class="p-4 border border-dashed border-gray-300 rounded-lg">
                <h4 class="font-medium mb-4">Ajouter une variante</h4>
                <div class="grid grid-cols-4 gap-4">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">SKU</label>
                    <input v-model="newVariant.sku" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Prix HT</label>
                    <input v-model="newVariant.priceHt" type="number" step="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Stock</label>
                    <input v-model.number="newVariant.quantity" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Poids (kg)</label>
                    <input v-model="newVariant.weight" type="number" step="0.001" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Longueur (cm)</label>
                    <input v-model="newVariant.length" type="number" step="0.1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Largeur (cm)</label>
                    <input v-model="newVariant.width" type="number" step="0.1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Hauteur (cm)</label>
                    <input v-model="newVariant.height" type="number" step="0.1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div class="mt-4">
                  <Button variant="secondary" @click="addVariant">Ajouter la variante</Button>
                </div>
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
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Publication</h3>
          <div>
            <Label size="sm">Statut</Label>
            <Select
              v-model="form.status"
              :options="statusOptions"
              size="sm"
            />
          </div>
        </div>

        <!-- Organization card -->
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Organisation</h3>
          <div class="space-y-3">
            <div>
              <Label size="sm" required>Categorie</Label>
              <Select
                v-model="form.category"
                :options="categoryOptions"
                placeholder="Selectionner une categorie"
                size="sm"
              />
            </div>
            <div>
              <Label size="sm">Collection</Label>
              <Select
                v-model="form.collection"
                :options="collectionOptions"
                size="sm"
              />
            </div>
          </div>
        </div>

        <!-- Tax card -->
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Fiscalite</h3>
          <div>
            <Label size="sm" required>Taux de TVA</Label>
            <Select
              v-model="form.taxRate"
              :options="taxRateOptions"
              size="sm"
            />
          </div>
        </div>

        <!-- Metadata card (only for existing products) -->
        <div v-if="!isNew" class="bg-white rounded-lg shadow p-4">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Informations</h3>
          <div class="space-y-3 text-sm">
            <div>
              <Label size="sm">Slug</Label>
              <div class="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-gray-600 text-xs font-mono">
                {{ form.slug }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-xs text-gray-500">Cree le</span>
                <div class="text-xs text-gray-700">{{ dateCreated }}</div>
              </div>
              <div>
                <span class="text-xs text-gray-500">Modifie le</span>
                <div class="text-xs text-gray-700">{{ dateUpdated }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
