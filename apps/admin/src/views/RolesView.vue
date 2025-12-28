<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRoles, type Role } from '@/composables/roles';
import { useToast } from '@/composables/useToast';
import { api } from '@/lib/api';
import Button from '@/components/atoms/Button.vue';
import Badge from '@/components/atoms/Badge.vue';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';
import DataTable from '@/components/organisms/DataTable/DataTable.vue';
import Pagination from '@/components/molecules/Pagination.vue';
import FilterText from '@/components/molecules/PageHeader/FilterText.vue';
import FilterSelect from '@/components/molecules/PageHeader/FilterSelect.vue';
import type { DataTableColumn } from '@/components/organisms/DataTable/types';
import type { BatchAction, FilterOption } from '@/components/molecules/PageHeader/types';
import type { StatusVariant } from '@/types/ui';
import type { ApiData } from '@/types/api';

// Types
type UsersResponse = ApiData<ReturnType<typeof api.users.get>>;
type User = UsersResponse['data'][number];

const router = useRouter();
const route = useRoute();
const toast = useToast();
const { roles, loading: rolesLoading, loadRoles, deleteRole } = useRoles();

// Tabs
const activeTab = ref<'roles' | 'users'>('roles');

// Role deletion
const deleteModalOpen = ref(false);
const roleToDelete = ref<Role | null>(null);

// Users state
const users = ref<User[]>([]);
const usersLoading = ref(false);
const selectedUsers = ref<User[]>([]);
const DEFAULT_LIMIT = 20;

const paginationMeta = ref({
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  totalPages: 0,
});

// User filters
const searchFilter = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const filtersOpen = ref(false);

// User delete modal
const showUserDeleteModal = ref(false);
const userToDelete = ref<User | null>(null);
const deletingUser = ref(false);

const statusOptions: FilterOption[] = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

const roleOptions = computed<FilterOption[]>(() =>
  roles.value
    .filter((r) => r.scope === 'admin')
    .map((r) => ({ value: r.id, label: r.name })),
);

// Init from URL
onMounted(() => {
  if (route.query.tab === 'users') {
    activeTab.value = 'users';
  }
  loadRoles();
  loadUsers();
});

function switchTab(tab: 'roles' | 'users') {
  activeTab.value = tab;
  router.replace({ query: tab === 'users' ? { tab: 'users' } : {} });
}

// === ROLES ===
function editRole(id: string) {
  router.push({ name: 'role-edit', params: { id } });
}

function confirmDeleteRole(role: Role) {
  roleToDelete.value = role;
  deleteModalOpen.value = true;
}

async function handleDeleteRole() {
  if (!roleToDelete.value) return;

  const success = await deleteRole(roleToDelete.value.id);
  if (success) {
    toast.success('Rôle supprimé');
  } else {
    toast.error('Erreur lors de la suppression');
  }

  deleteModalOpen.value = false;
  roleToDelete.value = null;
}

// === USERS ===
async function loadUsers() {
  usersLoading.value = true;
  try {
    const query: Record<string, string | number> = {
      page: paginationMeta.value.page,
      limit: paginationMeta.value.limit,
    };

    if (searchFilter.value) query.search = searchFilter.value;
    if (roleFilter.value) query.role = roleFilter.value;
    if (statusFilter.value) query.status = statusFilter.value;

    const { data } = await api.users.get({ query });
    if (data?.data && data?.meta) {
      users.value = data.data;
      paginationMeta.value = data.meta;
    }
  } catch {
    toast.error('Erreur lors du chargement des utilisateurs');
  } finally {
    usersLoading.value = false;
  }
}

function setPage(page: number) {
  paginationMeta.value.page = page;
  loadUsers();
}

function applyFilters() {
  paginationMeta.value.page = 1;
  loadUsers();
}

function resetFilters() {
  searchFilter.value = '';
  roleFilter.value = '';
  statusFilter.value = '';
  paginationMeta.value.page = 1;
  loadUsers();
}

function openEditUser(user: User) {
  router.push(`/utilisateurs/${user.id}`);
}

function createUser() {
  router.push('/utilisateurs/nouveau');
}

function formatDateTime(date: Date | string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getStatusConfig(isActive: boolean): { label: string; variant: StatusVariant } {
  return isActive
    ? { label: 'Actif', variant: 'success' }
    : { label: 'Inactif', variant: 'default' };
}

const userColumns = computed<DataTableColumn<User>[]>(() => [
  {
    id: 'name',
    label: 'Utilisateur',
    accessorKey: 'firstName',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h('div', {}, [
          h('div', { class: 'flex items-center gap-2' }, [
            h(
              'p',
              { class: 'font-medium text-gray-900' },
              `${row.original.firstName} ${row.original.lastName}`,
            ),
            row.original.isOwner
              ? h(Badge, { variant: 'warning', size: 'sm' }, () => 'Owner')
              : null,
          ]),
          h('p', { class: 'text-sm text-gray-500' }, row.original.email),
        ]),
      ]),
  },
  {
    id: 'role',
    label: 'Rôle',
    accessorKey: 'role',
    cell: ({ row }) =>
      h(Badge, { variant: 'info' }, () => row.original.role.name),
  },
  {
    id: 'status',
    label: 'Statut',
    accessorKey: 'isActive',
    cell: ({ row }) => {
      const config = getStatusConfig(row.original.isActive);
      return h(Badge, { variant: config.variant }, () => config.label);
    },
  },
  {
    id: 'lastLogin',
    label: 'Dernière connexion',
    accessorKey: 'lastLogin',
    cell: ({ row }) =>
      h('span', { class: 'text-gray-500 text-sm' }, formatDateTime(row.original.lastLogin)),
  },
]);

const batchActions: BatchAction[] = [
  { id: 'activate', label: 'Activer', icon: 'edit' },
  { id: 'deactivate', label: 'Désactiver', icon: 'archive', variant: 'danger' },
];

function handleSelectionChange(selected: User[]) {
  selectedUsers.value = selected;
}

async function setUsersStatus(isActive: boolean) {
  try {
    for (const u of selectedUsers.value) {
      if (u.isOwner) continue;
      await api.users({ id: u.id }).status.patch({ isActive });
    }
    toast.success(`${selectedUsers.value.length} utilisateur(s) mis à jour`);
    selectedUsers.value = [];
    await loadUsers();
  } catch {
    toast.error('Erreur lors de la mise à jour');
  }
}

function handleBatchAction(actionId: string) {
  if (actionId === 'activate') {
    setUsersStatus(true);
  } else if (actionId === 'deactivate') {
    setUsersStatus(false);
  }
}

async function confirmDeleteUser() {
  if (!userToDelete.value) return;

  deletingUser.value = true;
  try {
    await api.users({ id: userToDelete.value.id }).delete();
    toast.success('Utilisateur supprimé');
    showUserDeleteModal.value = false;
    userToDelete.value = null;
    await loadUsers();
  } catch {
    toast.error('Erreur lors de la suppression');
  } finally {
    deletingUser.value = false;
  }
}

const activeFiltersCount = computed(() => {
  let count = 0;
  if (searchFilter.value) count++;
  if (roleFilter.value) count++;
  if (statusFilter.value) count++;
  return count;
});
</script>

<template>
  <div>
    <!-- Tabs -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'roles'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
          @click="switchTab('roles')"
        >
          Rôles
        </button>
        <button
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
          @click="switchTab('users')"
        >
          Utilisateurs
        </button>
      </div>

      <Button
        v-if="activeTab === 'roles'"
        variant="primary"
        @click="router.push({ name: 'role-new' })"
      >
        Nouveau rôle
      </Button>
      <Button
        v-else
        variant="primary"
        @click="createUser"
      >
        Nouvel utilisateur
      </Button>
    </div>

    <!-- Roles Tab -->
    <div v-if="activeTab === 'roles'">
      <div v-if="rolesLoading" class="text-gray-500">
        Chargement...
      </div>

      <div v-else-if="roles.length === 0" class="text-gray-500">
        Aucun rôle
      </div>

      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
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
                  {{ r.isSystem ? 'Système' : 'Personnalisé' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button
                  v-if="!r.isSystem"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer"
                  @click.stop="confirmDeleteRole(r)"
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
    </div>

    <!-- Users Tab -->
    <div v-else>
      <DataTable
        v-model:filters-open="filtersOpen"
        :data="users"
        :columns="userColumns"
        :loading="usersLoading"
        :batch-actions="batchActions"
        :on-batch-action="handleBatchAction"
        :show-add="false"
        :searchable="false"
        filterable
        :active-filters-count="activeFiltersCount"
        empty-message="Aucun utilisateur"
        :on-row-click="openEditUser"
        @selection-change="handleSelectionChange"
        @apply-filters="applyFilters"
        @reset-filters="resetFilters"
      >
        <template #filters>
          <FilterText
            v-model="searchFilter"
            label="Recherche"
            placeholder="Email, nom, prénom..."
          />
          <FilterSelect
            v-model="roleFilter"
            label="Rôle"
            :options="roleOptions"
          />
          <FilterSelect
            v-model="statusFilter"
            label="Statut"
            :options="statusOptions"
          />
        </template>
      </DataTable>

      <Pagination
        v-if="paginationMeta.totalPages > 1"
        :page="paginationMeta.page"
        :total-pages="paginationMeta.totalPages"
        :total="paginationMeta.total"
        :limit="paginationMeta.limit"
        @update:page="setPage"
      />
    </div>

    <!-- Role Delete Modal -->
    <ConfirmModal
      :open="deleteModalOpen"
      title="Supprimer le rôle"
      :message="`Voulez-vous vraiment supprimer le rôle « ${roleToDelete?.name} » ? Cette action est irréversible.`"
      confirm-label="Supprimer"
      @confirm="handleDeleteRole"
      @cancel="deleteModalOpen = false"
    />

    <!-- User Delete Modal -->
    <ConfirmModal
      :open="showUserDeleteModal"
      title="Supprimer l'utilisateur"
      :message="`Voulez-vous vraiment supprimer ${userToDelete?.firstName} ${userToDelete?.lastName} ?`"
      confirm-label="Supprimer"
      @confirm="confirmDeleteUser"
      @cancel="showUserDeleteModal = false"
    />
  </div>
</template>
