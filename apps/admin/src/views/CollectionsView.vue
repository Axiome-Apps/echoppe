<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/lib/api';
import Button from '@/components/atoms/Button.vue';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';
import MediaPicker from '@/components/MediaPicker.vue';

// Type inféré depuis Eden
type Collection = NonNullable<Awaited<ReturnType<typeof api.collections.get>>['data']>[number];

const collections = ref<Collection[]>([]);
const loading = ref(true);
const showForm = ref(false);
const editing = ref<Collection | null>(null);
const saving = ref(false);
const deleteModalOpen = ref(false);
const collectionToDelete = ref<Collection | null>(null);

const form = ref({
  name: '',
  slug: '',
  description: '',
  image: null as string | null,
  isVisible: true,
});

async function loadCollections() {
  loading.value = true;
  const { data } = await api.collections.get();
  if (data && Array.isArray(data)) collections.value = data;
  loading.value = false;
}

onMounted(loadCollections);

function openCreate() {
  editing.value = null;
  form.value = {
    name: '',
    slug: '',
    description: '',
    image: null,
    isVisible: true,
  };
  showForm.value = true;
}

function openEdit(collection: Collection) {
  editing.value = collection;
  form.value = {
    name: collection.name,
    slug: collection.slug,
    description: collection.description || '',
    image: collection.image,
    isVisible: collection.isVisible,
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
    image: form.value.image || undefined,
    isVisible: form.value.isVisible,
  };

  if (editing.value) {
    await api.collections({ id: editing.value.id }).put(payload);
  } else {
    await api.collections.post(payload);
  }

  saving.value = false;
  showForm.value = false;
  await loadCollections();
}

function confirmDelete(collection: Collection) {
  collectionToDelete.value = collection;
  deleteModalOpen.value = true;
}

async function deleteCollection() {
  if (!collectionToDelete.value) return;
  await api.collections({ id: collectionToDelete.value.id }).delete();
  deleteModalOpen.value = false;
  collectionToDelete.value = null;
  await loadCollections();
}

function cancelDelete() {
  deleteModalOpen.value = false;
  collectionToDelete.value = null;
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Collections</h1>
      <Button variant="primary" size="lg" @click="openCreate">
        Nouvelle collection
      </Button>
    </div>

    <div v-if="loading" class="text-gray-500">Chargement...</div>

    <div v-else-if="collections.length === 0" class="text-gray-500">
      Aucune collection
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Visible</th>
            <th class="w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="coll in collections"
            :key="coll.id"
            class="hover:bg-gray-100/50 cursor-pointer transition-colors"
            @click="openEdit(coll)"
          >
            <td class="px-6 py-4">
              <p class="font-medium text-gray-900">{{ coll.name }}</p>
              <p class="text-sm text-gray-500">{{ coll.slug }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ coll.description || '-' }}
            </td>
            <td class="px-6 py-4">
              <span v-if="coll.isVisible" class="text-green-600">Oui</span>
              <span v-else class="text-gray-400">Non</span>
            </td>
            <td class="px-6 py-4">
              <button
                @click.stop="confirmDelete(coll)"
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
            {{ editing ? 'Modifier la collection' : 'Nouvelle collection' }}
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <MediaPicker v-model="form.image" />
            </div>

            <div class="flex items-center">
              <input
                v-model="form.isVisible"
                type="checkbox"
                id="isVisible"
                class="w-4 h-4 rounded border-gray-300"
              />
              <label for="isVisible" class="ml-2 text-sm text-gray-700">Visible</label>
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
      title="Supprimer la collection"
      :message="`Voulez-vous vraiment supprimer la collection « ${collectionToDelete?.name} » ? Cette action est irreversible.`"
      confirm-label="Supprimer"
      @confirm="deleteCollection"
      @cancel="cancelDelete"
    />
  </div>
</template>
