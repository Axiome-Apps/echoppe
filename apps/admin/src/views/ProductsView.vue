<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/lib/api';
import Badge from '@/components/atoms/Badge.vue';
import ConfirmModal from '@/components/atoms/ConfirmModal.vue';
import Thumbnail from '@/components/atoms/Thumbnail.vue';
import DataTable from '@/components/organisms/DataTable/DataTable.vue';
import type { DataTableColumn } from '@/components/organisms/DataTable/types';
import type { BatchAction } from '@/components/organisms/DataTable/DataTableHeader.vue';

// Types inférés depuis Eden
type Product = NonNullable<Awaited<ReturnType<typeof api.products.get>>['data']>[number];
type Category = NonNullable<Awaited<ReturnType<typeof api.categories.get>>['data']>[number];

interface ProductMedia {
  product: string;
  media: string;
  isFeatured: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const router = useRouter();

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const productThumbnails = ref<Map<string, string>>(new Map());
const loading = ref(true);
const deleteModalOpen = ref(false);
const selectedProducts = ref<Product[]>([]);

async function loadProducts() {
  loading.value = true;
  const { data } = await api.products.get();
  if (data && Array.isArray(data)) products.value = data;
  loading.value = false;
}

async function loadProductThumbnails() {
  // Fetch product media relations in parallel
  const thumbnails = new Map<string, string>();

  await Promise.all(
    products.value.map(async (product) => {
      try {
        const { data: productMediaList } = await api.products({ id: product.id }).media.get();
        if (productMediaList && Array.isArray(productMediaList)) {
          const featured = (productMediaList as ProductMedia[]).find((pm) => pm.isFeatured);
          if (featured) {
            // Use /assets/:id route (takes media UUID)
            thumbnails.set(product.id, `${API_URL}/assets/${featured.media}`);
          }
        }
      } catch {
        // Ignore errors for individual products
      }
    })
  );

  productThumbnails.value = thumbnails;
}

async function loadCategories() {
  const { data } = await api.categories.get();
  if (data && Array.isArray(data)) categories.value = data;
}

onMounted(async () => {
  await Promise.all([loadProducts(), loadCategories()]);
  await loadProductThumbnails();
});

function openCreate() {
  router.push('/produits/new');
}

function openEdit(product: Product) {
  router.push(`/produits/${product.id}`);
}

function confirmDeleteSelected() {
  if (selectedProducts.value.length === 0) return;
  deleteModalOpen.value = true;
}

async function deleteSelectedProducts() {
  for (const product of selectedProducts.value) {
    await api.products({ id: product.id }).delete();
  }
  deleteModalOpen.value = false;
  selectedProducts.value = [];
  await loadProducts();
}

function cancelDelete() {
  deleteModalOpen.value = false;
}

function getCategoryName(id: string) {
  return categories.value.find((c) => c.id === id)?.name || '-';
}

type StatusVariant = 'success' | 'warning' | 'default';

function getStatusConfig(status: string): { label: string; variant: StatusVariant } {
  switch (status) {
    case 'published':
      return { label: 'Publie', variant: 'success' };
    case 'draft':
      return { label: 'Brouillon', variant: 'warning' };
    case 'archived':
      return { label: 'Archive', variant: 'default' };
    default:
      return { label: status, variant: 'default' };
  }
}

function formatDate(date: Date | string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

// Column definitions for DataTable
const columns = computed<DataTableColumn<Product>[]>(() => [
  {
    id: 'thumbnail',
    label: '',
    accessorKey: 'id',
    size: 64,
    sortable: false,
    hideable: false,
    cell: ({ row }) =>
      h(Thumbnail, {
        src: productThumbnails.value.get(row.original.id) || null,
        alt: row.original.name,
        size: 'lg',
      }),
  },
  {
    id: 'name',
    label: 'Nom',
    accessorKey: 'name',
    cell: ({ row }) =>
      h('div', {}, [
        h('p', { class: 'font-medium text-gray-900' }, row.original.name),
        h('p', { class: 'text-sm text-gray-500' }, row.original.slug),
      ]),
  },
  {
    id: 'category',
    label: 'Categorie',
    accessorKey: 'category',
    cell: ({ row }) => h('span', { class: 'text-gray-600' }, getCategoryName(row.original.category)),
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
    id: 'description',
    label: 'Description',
    accessorKey: 'description',
    defaultVisible: false,
    cell: ({ row }) => h(
      'span',
      { class: 'text-gray-500 text-sm line-clamp-1 max-w-xs' },
      row.original.description || '-'
    ),
  },
  {
    id: 'dateCreated',
    label: 'Date creation',
    accessorKey: 'dateCreated',
    defaultVisible: false,
    cell: ({ row }) => h('span', { class: 'text-gray-500 text-sm' }, formatDate(row.original.dateCreated)),
  },
  {
    id: 'dateUpdated',
    label: 'Derniere modif.',
    accessorKey: 'dateUpdated',
    defaultVisible: false,
    cell: ({ row }) => h('span', { class: 'text-gray-500 text-sm' }, formatDate(row.original.dateUpdated)),
  },
]);

// Batch actions
const batchActions: BatchAction[] = [
  { id: 'delete', label: 'Supprimer', icon: 'trash', variant: 'danger' },
  { id: 'draft', label: 'Brouillon', icon: 'archive' },
];

function handleSelectionChange(selected: Product[]) {
  selectedProducts.value = selected;
}

async function setProductsStatus(status: 'draft' | 'published' | 'archived') {
  for (const p of selectedProducts.value) {
    await api.products({ id: p.id }).patch({ status });
  }
  selectedProducts.value = [];
  await loadProducts();
}

function handleBatchAction(actionId: string) {
  if (actionId === 'delete') {
    confirmDeleteSelected();
  } else if (actionId === 'draft') {
    setProductsStatus('draft');
  }
}

const deleteMessage = computed(() => {
  const count = selectedProducts.value.length;
  if (count === 1) {
    return `Voulez-vous vraiment supprimer le produit « ${selectedProducts.value[0].name} » ? Cette action est irreversible.`;
  }
  return `Voulez-vous vraiment supprimer ces ${count} produits ? Cette action est irreversible.`;
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Produits</h1>
    </div>

    <DataTable
      :data="products"
      :columns="columns"
      :loading="loading"
      :batch-actions="batchActions"
      :on-batch-action="handleBatchAction"
      search-placeholder="Rechercher un produit..."
      add-label="Nouveau produit"
      empty-message="Aucun produit"
      :on-row-click="openEdit"
      @add="openCreate"
      @selection-change="handleSelectionChange"
    />

    <ConfirmModal
      :open="deleteModalOpen"
      title="Supprimer les produits"
      :message="deleteMessage"
      confirm-label="Supprimer"
      @confirm="deleteSelectedProducts"
      @cancel="cancelDelete"
    />
  </div>
</template>
