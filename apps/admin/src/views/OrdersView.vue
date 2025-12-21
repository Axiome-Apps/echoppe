<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '@/lib/api';
import { useToast } from '@/composables/useToast';
import Badge from '@/components/atoms/Badge.vue';
import DataTable from '@/components/organisms/DataTable/DataTable.vue';
import Pagination from '@/components/molecules/Pagination.vue';
import type { DataTableColumn } from '@/components/organisms/DataTable/types';
import type { BatchAction } from '@/components/organisms/DataTable/DataTableHeader.vue';

// Types inférés depuis Eden
type OrdersResponse = NonNullable<Awaited<ReturnType<typeof api.orders.get>>['data']>;
type Order = OrdersResponse['data'][number];

const DEFAULT_LIMIT = 20;

const router = useRouter();
const route = useRoute();
const toast = useToast();

const orders = ref<Order[]>([]);
const loading = ref(true);
const selectedOrders = ref<Order[]>([]);

// Pagination state
const paginationMeta = ref({
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  totalPages: 0,
});

// Filters
const statusFilter = ref<string>('');
const dateFromFilter = ref<string>('');
const dateToFilter = ref<string>('');
const amountMinFilter = ref<string>('');
const amountMaxFilter = ref<string>('');
const showFilters = ref(false);

async function loadOrders() {
  loading.value = true;
  try {
    const query: Record<string, string | number> = {
      page: paginationMeta.value.page,
      limit: paginationMeta.value.limit,
    };

    if (statusFilter.value) query.status = statusFilter.value;
    if (dateFromFilter.value) query.dateFrom = dateFromFilter.value;
    if (dateToFilter.value) query.dateTo = dateToFilter.value;
    if (amountMinFilter.value) query.amountMin = parseFloat(amountMinFilter.value);
    if (amountMaxFilter.value) query.amountMax = parseFloat(amountMaxFilter.value);

    const { data } = await api.orders.get({ query });
    if (data?.data && data?.meta) {
      orders.value = data.data;
      paginationMeta.value = data.meta;
    }
  } catch {
    toast.error('Erreur lors du chargement des commandes');
  } finally {
    loading.value = false;
  }
}

function setPage(page: number) {
  paginationMeta.value.page = page;
  router.replace({ query: { ...route.query, page: page > 1 ? String(page) : undefined } });
  loadOrders();
}

function applyFilters() {
  paginationMeta.value.page = 1;
  loadOrders();
}

function resetFilters() {
  statusFilter.value = '';
  dateFromFilter.value = '';
  dateToFilter.value = '';
  amountMinFilter.value = '';
  amountMaxFilter.value = '';
  paginationMeta.value.page = 1;
  loadOrders();
}

onMounted(loadOrders);

function openDetail(order: Order) {
  router.push(`/commandes/${order.id}`);
}

type StatusVariant = 'success' | 'warning' | 'default' | 'error' | 'info';

function getStatusConfig(status: string): { label: string; variant: StatusVariant } {
  const config: Record<string, { label: string; variant: StatusVariant }> = {
    pending: { label: 'En attente', variant: 'warning' },
    confirmed: { label: 'Confirmée', variant: 'success' },
    processing: { label: 'En traitement', variant: 'info' },
    shipped: { label: 'Expédiée', variant: 'success' },
    delivered: { label: 'Livrée', variant: 'success' },
    cancelled: { label: 'Annulée', variant: 'default' },
    refunded: { label: 'Remboursée', variant: 'error' },
  };
  return config[status] || { label: status, variant: 'default' };
}

function formatDate(date: Date | string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatPrice(amount: string | number) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

// Column definitions for DataTable
const columns = computed<DataTableColumn<Order>[]>(() => [
  {
    id: 'orderNumber',
    label: 'N° Commande',
    accessorKey: 'orderNumber',
    cell: ({ row }) =>
      h('span', { class: 'font-mono font-medium text-gray-900' }, row.original.orderNumber),
  },
  {
    id: 'customer',
    label: 'Client',
    accessorKey: 'customer',
    cell: ({ row }) =>
      h('div', {}, [
        h(
          'p',
          { class: 'font-medium text-gray-900' },
          `${row.original.customer.firstName} ${row.original.customer.lastName}`,
        ),
        h('p', { class: 'text-sm text-gray-500' }, row.original.customer.email),
      ]),
  },
  {
    id: 'status',
    label: 'Statut',
    accessorKey: 'status',
    cell: ({ row }) => {
      const config = getStatusConfig(row.original.status);
      return h(Badge, { variant: config.variant }, () => config.label);
    },
  },
  {
    id: 'totalTtc',
    label: 'Total',
    accessorKey: 'totalTtc',
    cell: ({ row }) =>
      h('span', { class: 'font-medium text-gray-900' }, formatPrice(row.original.totalTtc)),
  },
  {
    id: 'dateCreated',
    label: 'Date',
    accessorKey: 'dateCreated',
    cell: ({ row }) =>
      h('span', { class: 'text-gray-500 text-sm' }, formatDate(row.original.dateCreated)),
  },
]);

// Batch actions
const batchActions: BatchAction[] = [
  { id: 'processing', label: 'En traitement', icon: 'edit' },
  { id: 'shipped', label: 'Expédiée', icon: 'archive' },
  { id: 'cancelled', label: 'Annuler', icon: 'trash', variant: 'danger' },
];

function handleSelectionChange(selected: Order[]) {
  selectedOrders.value = selected;
}

async function setOrdersStatus(status: 'processing' | 'shipped' | 'cancelled') {
  try {
    for (const o of selectedOrders.value) {
      await api.orders({ id: o.id }).status.patch({ status });
    }
    toast.success(`${selectedOrders.value.length} commande(s) mise(s) à jour`);
    selectedOrders.value = [];
    await loadOrders();
  } catch {
    toast.error('Erreur lors de la mise à jour');
  }
}

function handleBatchAction(actionId: string) {
  if (actionId === 'processing') {
    setOrdersStatus('processing');
  } else if (actionId === 'shipped') {
    setOrdersStatus('shipped');
  } else if (actionId === 'cancelled') {
    setOrdersStatus('cancelled');
  }
}

const activeFiltersCount = computed(() => {
  let count = 0;
  if (statusFilter.value) count++;
  if (dateFromFilter.value || dateToFilter.value) count++;
  if (amountMinFilter.value || amountMaxFilter.value) count++;
  return count;
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Commandes
      </h1>
    </div>

    <!-- Filters toggle -->
    <div class="mb-4">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        @click="showFilters = !showFilters"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filtres
        <span
          v-if="activeFiltersCount > 0"
          class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full"
        >
          {{ activeFiltersCount }}
        </span>
      </button>
    </div>

    <!-- Filters panel -->
    <div
      v-if="showFilters"
      class="mb-6 p-4 bg-white border border-gray-200 rounded-lg"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            v-model="statusFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">
              Tous
            </option>
            <option value="pending">
              En attente
            </option>
            <option value="confirmed">
              Confirmée
            </option>
            <option value="processing">
              En traitement
            </option>
            <option value="shipped">
              Expédiée
            </option>
            <option value="delivered">
              Livrée
            </option>
            <option value="cancelled">
              Annulée
            </option>
            <option value="refunded">
              Remboursée
            </option>
          </select>
        </div>

        <!-- Date from -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date début</label>
          <input
            v-model="dateFromFilter"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Date to -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
          <input
            v-model="dateToFilter"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Amount range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Montant</label>
          <div class="flex gap-2">
            <input
              v-model="amountMinFilter"
              type="number"
              placeholder="Min"
              class="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              v-model="amountMaxFilter"
              type="number"
              placeholder="Max"
              class="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          @click="resetFilters"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          @click="applyFilters"
        >
          Appliquer
        </button>
      </div>
    </div>

    <DataTable
      :data="orders"
      :columns="columns"
      :loading="loading"
      :batch-actions="batchActions"
      :on-batch-action="handleBatchAction"
      search-placeholder="Rechercher une commande..."
      empty-message="Aucune commande"
      :on-row-click="openDetail"
      @selection-change="handleSelectionChange"
    />

    <Pagination
      v-if="paginationMeta.totalPages > 1"
      :page="paginationMeta.page"
      :total-pages="paginationMeta.totalPages"
      :total="paginationMeta.total"
      :limit="paginationMeta.limit"
      @update:page="setPage"
    />
  </div>
</template>
