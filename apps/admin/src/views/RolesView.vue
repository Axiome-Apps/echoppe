<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRoles, type Role } from '@/composables/roles';
import { useToast } from '@/composables/useToast';
import Button from '@/components/atoms/Button.vue';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';

const router = useRouter();
const toast = useToast();
const { roles, loading, loadRoles, deleteRole } = useRoles();

const deleteModalOpen = ref(false);
const roleToDelete = ref<Role | null>(null);

onMounted(loadRoles);

function editRole(id: string) {
  router.push({ name: 'role-edit', params: { id } });
}

function confirmDelete(role: Role) {
  roleToDelete.value = role;
  deleteModalOpen.value = true;
}

async function handleDelete() {
  if (!roleToDelete.value) return;

  const success = await deleteRole(roleToDelete.value.id);
  if (success) {
    toast.success('Role supprime');
  } else {
    toast.error('Erreur lors de la suppression');
  }

  deleteModalOpen.value = false;
  roleToDelete.value = null;
}

function cancelDelete() {
  deleteModalOpen.value = false;
  roleToDelete.value = null;
}
</script>

<template>
  <div>
    <div class="flex justify-end mb-4">
      <Button
        variant="primary"
        size="lg"
        @click="router.push({ name: 'role-new' })"
      >
        Nouveau role
      </Button>
    </div>

    <div
      v-if="loading"
      class="text-gray-500"
    >
      Chargement...
    </div>

    <div
      v-else-if="roles.length === 0"
      class="text-gray-500"
    >
      Aucun role
    </div>

    <div
      v-else
      class="bg-white rounded-lg shadow overflow-hidden"
    >
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Nom
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Scope
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
              Type
            </th>
            <th class="w-12" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="r in roles"
            :key="r.id"
            class="hover:bg-gray-100/50 cursor-pointer transition-colors"
            @click="editRole(r.id)"
          >
            <td class="px-6 py-4">
              <p class="font-medium text-gray-900">
                {{ r.name }}
              </p>
              <p class="text-sm text-gray-500">
                {{ r.description || '-' }}
              </p>
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                  r.scope === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                ]"
              >
                {{ r.scope === 'admin' ? 'Admin' : 'Boutique' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                  r.isSystem
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-purple-100 text-purple-700'
                ]"
              >
                {{ r.isSystem ? 'Systeme' : 'Personnalise' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <button
                v-if="!r.isSystem"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Supprimer"
                @click.stop="confirmDelete(r)"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmModal
      :open="deleteModalOpen"
      title="Supprimer le role"
      :message="`Voulez-vous vraiment supprimer le role « ${roleToDelete?.name} » ? Cette action est irreversible.`"
      confirm-label="Supprimer"
      @confirm="handleDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
