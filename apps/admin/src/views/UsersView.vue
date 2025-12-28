<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '@/lib/api';
import { useToast } from '@/composables/useToast';
import Badge from '@/components/atoms/Badge.vue';
import Button from '@/components/atoms/Button.vue';
import DataTable from '@/components/organisms/DataTable/DataTable.vue';
import Pagination from '@/components/molecules/Pagination.vue';
import FilterText from '@/components/molecules/PageHeader/FilterText.vue';
import FilterSelect from '@/components/molecules/PageHeader/FilterSelect.vue';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';
import type { DataTableColumn } from '@/components/organisms/DataTable/types';
import type { BatchAction, FilterOption } from '@/components/molecules/PageHeader/types';
import type { StatusVariant } from '@/types/ui';
import type { ApiData } from '@/types/api';

// Types inférés depuis Eden
type UsersResponse = ApiData<ReturnType<typeof api.users.get>>;
type User = UsersResponse['data'][number];

type RolesResponse = ApiData<ReturnType<typeof api.roles.get>>;
type Role = RolesResponse[number];

const DEFAULT_LIMIT = 20;

const router = useRouter();
const route = useRoute();
const toast = useToast();

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const loading = ref(true);
const selectedUsers = ref<User[]>([]);

// Pagination state
const paginationMeta = ref({
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  totalPages: 0,
});

// Filters
const searchFilter = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const filtersOpen = ref(false);

// Delete modal
const showDeleteModal = ref(false);
const userToDelete = ref<User | null>(null);
const deleting = ref(false);

const statusOptions: FilterOption[] = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

const roleOptions = computed<FilterOption[]>(() =>
  roles.value.map((r) => ({ value: r.id, label: r.name })),
);

async function loadRoles() {
  try {
    const { data } = await api.roles.get();
    if (data) {
      roles.value = data;
    }
  } catch {
    // Silently fail
  }
}

async function loadUsers() {
  loading.value = true;
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
    loading.value = false;
  }
}

function setPage(page: number) {
  paginationMeta.value.page = page;
  router.replace({ query: { ...route.query, page: page > 1 ? String(page) : undefined } });
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

onMounted(() => {
  loadRoles();
  loadUsers();
});

function openEdit(user: User) {
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

// Column definitions for DataTable
const columns = computed<DataTableColumn<User>[]>(() => [
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

// Batch actions
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
      // Skip owner
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

async function confirmDelete() {
  if (!userToDelete.value) return;

  deleting.value = true;
  try {
    await api.users({ id: userToDelete.value.id }).delete();
    toast.success('Utilisateur supprimé');
    showDeleteModal.value = false;
    userToDelete.value = null;
    await loadUsers();
  } catch {
    toast.error('Erreur lors de la suppression');
  } finally {
    deleting.value = false;
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
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Utilisateurs
      </h1>
      <Button variant="primary" @click="createUser">
        Ajouter un utilisateur
      </Button>
    </div>

    <DataTable
      v-model:filters-open="filtersOpen"
      :data="users"
      :columns="columns"
      :loading="loading"
      :batch-actions="batchActions"
      :on-batch-action="handleBatchAction"
      :show-add="false"
      :searchable="false"
      filterable
      :active-filters-count="activeFiltersCount"
      empty-message="Aucun utilisateur"
      :on-row-click="openEdit"
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

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :open="showDeleteModal"
      title="Supprimer l'utilisateur"
      :message="`Voulez-vous vraiment supprimer ${userToDelete?.firstName} ${userToDelete?.lastName} ?`"
      confirm-label="Supprimer"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
