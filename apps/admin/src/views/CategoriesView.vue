<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/lib/api';
import Button from '@/components/atoms/Button.vue';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';
import MediaPicker from '@/components/MediaPicker.vue';

// Type inféré depuis Eden
type Category = NonNullable<Awaited<ReturnType<typeof api.categories.get>>['data']>[number];

const categories = ref<Category[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref<Category | null>(null);
const saving = ref(false);
const deleteModalOpen = ref(false);
const categoryToDelete = ref<Category | null>(null);

const form = ref({
  name: '',
  slug: '',
  description: '',
  parent: null as string | null,
  image: null as string | null,
  sortOrder: 0,
  isVisible: true,
});

const parentOptions = computed(() => {
  return categories.value.filter((c) => c.id !== editing.value?.id);
});

async function loadCategories() {
  loading.value = true;
  const { data } = await api.categories.get();
  if (data && Array.isArray(data)) categories.value = data;
  loading.value = false;
}

onMounted(loadCategories);

function openCreate() {
  editing.value = null;
  form.value = {
    name: '',
    slug: '',
    description: '',
    parent: null,
    image: null,
    sortOrder: 0,
    isVisible: true,
  };
  showForm.value = true;
}

function openEdit(category: Category) {
  editing.value = category;
  form.value = {
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    parent: category.parent,
    image: category.image,
    sortOrder: category.sortOrder,
    isVisible: category.isVisible,
  };
  showForm.value = true;
}

function generateSlug() {
  form.value.slug = form.value.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function save() {
  saving.value = true;

  const payload = {
    name: form.value.name,
    slug: form.value.slug,
    description: form.value.description || undefined,
    parent: form.value.parent || undefined,
    image: form.value.image || undefined,
    sortOrder: form.value.sortOrder,
    isVisible: form.value.isVisible,
  };

  if (editing.value) {
    await api.categories({ id: editing.value.id }).put(payload);
  } else {
    await api.categories.post(payload);
  }

  saving.value = false;
  showForm.value = false;
  await loadCategories();
}

function confirmDelete(category: Category) {
  categoryToDelete.value = category;
  deleteModalOpen.value = true;
}

async function deleteCategory() {
  if (!categoryToDelete.value) return;
  await api.categories({ id: categoryToDelete.value.id }).delete();
  deleteModalOpen.value = false;
  categoryToDelete.value = null;
  await loadCategories();
}

function cancelDelete() {
  deleteModalOpen.value = false;
  categoryToDelete.value = null;
}

function getParentName(parentId: string | null) {
  if (!parentId) return '-';
  const parent = categories.value.find((c) => c.id === parentId);
  return parent?.name || '-';
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
      <Button variant="primary" size="lg" @click="openCreate">
        Nouvelle categorie
      </Button>
    </div>

    <div v-if="loading" class="text-gray-500">Chargement...</div>

    <div v-else-if="categories.length === 0" class="text-gray-500">
      Aucune categorie
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Parent</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ordre</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Visible</th>
            <th class="w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="category in categories"
            :key="category.id"
            class="hover:bg-gray-100/50 cursor-pointer transition-colors"
            @click="openEdit(category)"
          >
            <td class="px-6 py-4">
              <p class="font-medium text-gray-900">{{ category.name }}</p>
              <p class="text-sm text-gray-500">{{ category.slug }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ getParentName(category.parent) }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ category.sortOrder }}
            </td>
            <td class="px-6 py-4">
              <span v-if="category.isVisible" class="text-green-600">Oui</span>
              <span v-else class="text-gray-400">Non</span>
            </td>
            <td class="px-6 py-4">
              <button
                @click.stop="confirmDelete(category)"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Supprimer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Form Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showForm = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        <div class="p-6">
          <h2 class="text-lg font-semibold mb-4">
            {{ editing ? 'Modifier la categorie' : 'Nouvelle categorie' }}
          </h2>

          <form @submit.prevent="save" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                v-model="form.name"
                type="text"
                required
                @blur="!editing && generateSlug()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                v-model="form.slug"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Categorie parente</label>
              <select v-model="form.parent" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option :value="null">Aucune (racine)</option>
                <option v-for="cat in parentOptions" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <MediaPicker v-model="form.image" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                <input
                  v-model.number="form.sortOrder"
                  type="number"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div class="flex items-center pt-6">
                <input
                  v-model="form.isVisible"
                  type="checkbox"
                  id="isVisible"
                  class="w-4 h-4 rounded border-gray-300"
                />
                <label for="isVisible" class="ml-2 text-sm text-gray-700">Visible</label>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <Button variant="secondary" size="lg" @click="showForm = false">
                Annuler
              </Button>
              <Button variant="primary" size="lg" :loading="saving" type="submit">
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ConfirmModal
      :open="deleteModalOpen"
      title="Supprimer la categorie"
      :message="`Voulez-vous vraiment supprimer la categorie « ${categoryToDelete?.name} » ? Cette action est irreversible.`"
      confirm-label="Supprimer"
      @confirm="deleteCategory"
      @cancel="cancelDelete"
    />
  </div>
</template>
