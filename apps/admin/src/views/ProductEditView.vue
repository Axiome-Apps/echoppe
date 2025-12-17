<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/lib/api';
import Button from '@/components/atoms/Button.vue';
import ProductMediaGallery from '@/components/ProductMediaGallery.vue';

// Types inférés depuis Eden
type Product = NonNullable<Awaited<ReturnType<typeof api.products.get>>['data']>[number];
type Category = NonNullable<Awaited<ReturnType<typeof api.categories.get>>['data']>[number];
type TaxRate = NonNullable<Awaited<ReturnType<typeof api['tax-rates']['get']>>['data']>[number];
type VariantResponse = Awaited<ReturnType<ReturnType<typeof api.products>['variants']['get']>>;
type Variant = NonNullable<Extract<VariantResponse['data'], unknown[]>>[number];

const route = useRoute();
const router = useRouter();

const isNew = computed(() => route.params.id === 'new');
const productId = computed(() => (isNew.value ? null : route.params.id as string));

const product = ref<Product | null>(null);
const categories = ref<Category[]>([]);
const taxRates = ref<TaxRate[]>([]);
const variants = ref<Variant[]>([]);
const loading = ref(true);
const saving = ref(false);
const activeTab = ref<'general' | 'variants' | 'media'>('general');

const form = ref({
  name: '',
  slug: '',
  description: '',
  category: '',
  taxRate: '',
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

// Load data
async function loadCategories() {
  const { data } = await api.categories.get();
  if (data && Array.isArray(data)) categories.value = data;
}

async function loadTaxRates() {
  const { data } = await api['tax-rates'].get();
  if (data && Array.isArray(data)) taxRates.value = data;
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
  await Promise.all([loadCategories(), loadTaxRates()]);

  if (!isNew.value) {
    await Promise.all([loadProduct(), loadVariants()]);
  } else {
    form.value.category = categories.value[0]?.id || '';
    form.value.taxRate = taxRates.value[0]?.id || '';
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

    <div v-else class="bg-white rounded-lg shadow">
      <!-- Tabs -->
      <div class="border-b flex">
        <button
          @click="activeTab = 'general'"
          :class="['px-6 py-3 text-sm font-medium border-b-2 -mb-px', activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
        >
          General
        </button>
        <button
          v-if="!isNew"
          @click="activeTab = 'variants'"
          :class="['px-6 py-3 text-sm font-medium border-b-2 -mb-px', activeTab === 'variants' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
        >
          Variantes ({{ variants.length }})
        </button>
        <button
          v-if="!isNew"
          @click="activeTab = 'media'"
          :class="['px-6 py-3 text-sm font-medium border-b-2 -mb-px', activeTab === 'media' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
        >
          Medias
        </button>
      </div>

      <div class="p-6">
        <!-- General Tab -->
        <form v-if="activeTab === 'general'" @submit.prevent="save" class="space-y-4 max-w-2xl">
          <div :class="isNew ? '' : 'grid grid-cols-2 gap-4'">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div v-if="!isNew">
              <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                v-model="form.slug"
                type="text"
                disabled
                class="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              v-model="form.description"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
              <select v-model="form.category" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Taux de TVA</label>
              <select v-model="form.taxRate" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option v-for="tax in taxRates" :key="tax.id" :value="tax.id">{{ tax.name }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select v-model="form.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="draft">Brouillon</option>
              <option value="published">Publie</option>
              <option value="archived">Archive</option>
            </select>
          </div>
        </form>

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
</template>
