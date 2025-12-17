<script setup lang="ts" generic="TData extends Record<string, unknown>">
import { ref, computed, watch, h } from 'vue';
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  FlexRender,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type ColumnDef,
} from '@tanstack/vue-table';
import Checkbox from '@/components/atoms/Checkbox.vue';
import SpinnerIcon from '@/components/atoms/icons/SpinnerIcon.vue';
import ChevronUpIcon from '@/components/atoms/icons/ChevronUpIcon.vue';
import ChevronDownIcon from '@/components/atoms/icons/ChevronDownIcon.vue';
import SortIcon from '@/components/atoms/icons/SortIcon.vue';
import type { DataTableColumn } from './types';
import DataTableHeader, { type BatchAction } from './DataTableHeader.vue';
import ColumnMenu from './ColumnMenu.vue';
import AddColumnPopover from './AddColumnPopover.vue';

const props = withDefaults(
  defineProps<{
    data: TData[];
    columns: DataTableColumn<TData>[];
    loading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    filterable?: boolean;
    selectable?: boolean;
    addColumnEnabled?: boolean;
    onRowClick?: (row: TData) => void;
    addLabel?: string;
    emptyMessage?: string;
    showAdd?: boolean;
    batchActions?: BatchAction[];
    onBatchAction?: (actionId: string) => void;
  }>(),
  {
    loading: false,
    searchable: true,
    searchPlaceholder: 'Rechercher...',
    filterable: true,
    selectable: true,
    addColumnEnabled: true,
    addLabel: 'Ajouter',
    emptyMessage: 'Aucun element',
    showAdd: true,
    batchActions: () => [],
  }
);

const emit = defineEmits<{
  add: [];
  selectionChange: [selectedRows: TData[]];
}>();

const sorting = ref<SortingState>([]);
const globalFilter = ref('');
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref<RowSelectionState>({});
const columnOrder = ref<string[]>([]);

// Initialize column order from props
watch(
  () => props.columns,
  (cols) => {
    if (columnOrder.value.length === 0) {
      columnOrder.value = cols.map((c) => c.id);
    }
  },
  { immediate: true }
);

// Initialize visibility from columns defaultVisible
watch(
  () => props.columns,
  (cols) => {
    const visibility: VisibilityState = {};
    for (const col of cols) {
      if (col.defaultVisible === false) {
        visibility[col.id] = false;
      }
    }
    columnVisibility.value = visibility;
  },
  { immediate: true, once: true }
);

const tableColumns = computed<ColumnDef<TData, unknown>[]>(() => {
  const cols: ColumnDef<TData, unknown>[] = [];

  // Selection column
  if (props.selectable) {
    cols.push({
      id: '_select',
      header: ({ table }) =>
        h(Checkbox, {
          checked: table.getIsAllRowsSelected(),
          onClick: () => table.toggleAllRowsSelected(),
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          checked: row.getIsSelected(),
          onClick: () => row.toggleSelected(),
        }),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    });
  }

  // User-defined columns
  for (const col of props.columns) {
    cols.push({
      id: col.id,
      accessorKey: col.accessorKey ?? col.id,
      header: col.label,
      cell: col.cell,
      enableSorting: col.sortable !== false,
      enableHiding: col.hideable !== false,
      size: col.size,
      minSize: col.minSize,
      maxSize: col.maxSize,
    } as ColumnDef<TData, unknown>);
  }

  return cols;
});

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return tableColumns.value;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get columnOrder() {
      return props.selectable ? ['_select', ...columnOrder.value] : columnOrder.value;
    },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater;
  },
  onGlobalFilterChange: (updater) => {
    globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater;
  },
  onColumnVisibilityChange: (updater) => {
    columnVisibility.value =
      typeof updater === 'function' ? updater(columnVisibility.value) : updater;
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === 'function' ? updater(rowSelection.value) : updater;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  enableRowSelection: props.selectable,
  enableMultiRowSelection: true,
});

// Emit selection changes
watch(rowSelection, () => {
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  emit('selectionChange', selectedRows);
});

// Hidden columns for AddColumnPopover
const hiddenColumns = computed(() => {
  return props.columns
    .filter((col) => columnVisibility.value[col.id] === false)
    .map((col) => ({ id: col.id, label: col.label }));
});

// Get current sort state for a column
function getColumnSort(columnId: string): 'asc' | 'desc' | false {
  const sort = sorting.value.find((s) => s.id === columnId);
  if (!sort) return false;
  return sort.desc ? 'desc' : 'asc';
}

// Sort handlers
function handleSortAsc(columnId: string) {
  sorting.value = [{ id: columnId, desc: false }];
}

function handleSortDesc(columnId: string) {
  sorting.value = [{ id: columnId, desc: true }];
}

function handleClearSort() {
  sorting.value = [];
}

// Toggle sort: none -> asc -> desc -> none
function handleToggleSort(columnId: string) {
  const currentSort = getColumnSort(columnId);
  if (currentSort === false) {
    sorting.value = [{ id: columnId, desc: false }];
  } else if (currentSort === 'asc') {
    sorting.value = [{ id: columnId, desc: true }];
  } else {
    sorting.value = [];
  }
}

// Hide column
function handleHideColumn(columnId: string) {
  columnVisibility.value = { ...columnVisibility.value, [columnId]: false };
}

// Show column
function handleShowColumn(columnId: string) {
  const { [columnId]: _, ...rest } = columnVisibility.value;
  columnVisibility.value = rest;
}

// Handle row click
function handleRowClick(row: TData) {
  props.onRowClick?.(row);
}

// Get visible headers (excluding _select)
const visibleHeaders = computed(() => {
  return table
    .getHeaderGroups()[0]
    .headers.filter((h) => h.id !== '_select' && h.column.getIsVisible());
});

// Clear selection
function clearSelection() {
  rowSelection.value = {};
}

// Handle batch action
function handleBatchAction(actionId: string) {
  props.onBatchAction?.(actionId);
}
</script>

<template>
  <div class="w-full">
    <DataTableHeader
      :total-items="data.length"
      :selected-count="Object.keys(rowSelection).length"
      :searchable="searchable"
      :search-placeholder="searchPlaceholder"
      :filterable="filterable"
      :show-add="showAdd"
      :add-label="addLabel"
      :batch-actions="batchActions"
      v-model="globalFilter"
      @add="emit('add')"
      @batch-action="handleBatchAction"
      @clear-selection="clearSelection"
    />

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500">
        <SpinnerIcon size="lg" class="mx-auto text-blue-600" />
        <p class="mt-2">Chargement...</p>
      </div>

      <div v-else-if="table.getRowModel().rows.length === 0" class="p-8 text-center text-gray-500">
        {{ emptyMessage }}
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <!-- Selection header -->
            <th
              v-if="selectable"
              class="w-10 px-3 py-3"
            >
              <FlexRender
                :render="table.getHeaderGroups()[0].headers.find(h => h.id === '_select')?.column.columnDef.header"
                :props="table.getHeaderGroups()[0].headers.find(h => h.id === '_select')?.getContext()"
              />
            </th>

            <!-- Column headers -->
            <th
              v-for="header in visibleHeaders"
              :key="header.id"
              class="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider group select-none"
              :class="[
                header.column.getCanSort()
                  ? 'cursor-pointer hover:bg-gray-100 transition-colors'
                  : '',
                getColumnSort(header.id) ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500'
              ]"
              :style="{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }"
              @click="header.column.getCanSort() && handleToggleSort(header.id)"
            >
              <div class="flex items-center gap-2">
                <span class="flex-1">
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </span>

                <!-- Sort indicator - always visible when sorted -->
                <span v-if="getColumnSort(header.id)" class="text-blue-600">
                  <ChevronUpIcon v-if="getColumnSort(header.id) === 'asc'" size="sm" />
                  <ChevronDownIcon v-else size="sm" />
                </span>

                <!-- Sort hint on hover (when not sorted) -->
                <span
                  v-else-if="header.column.getCanSort()"
                  class="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <SortIcon size="sm" />
                </span>

                <ColumnMenu
                  v-if="header.column.getCanSort() || header.column.getCanHide()"
                  :column-id="header.id"
                  :sortable="header.column.getCanSort()"
                  :hideable="header.column.getCanHide()"
                  :current-sort="getColumnSort(header.id)"
                  @sort-asc="handleSortAsc(header.id)"
                  @sort-desc="handleSortDesc(header.id)"
                  @clear-sort="handleClearSort"
                  @hide="handleHideColumn(header.id)"
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </th>

            <!-- Add column header -->
            <th v-if="addColumnEnabled" class="w-10 px-2 py-3">
              <AddColumnPopover
                :hidden-columns="hiddenColumns"
                @show="handleShowColumn"
              />
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="hover:bg-gray-50 transition-colors"
            :class="{ 'cursor-pointer': !!onRowClick }"
            @click="handleRowClick(row.original)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              class="px-4 py-3 text-sm"
              :class="{
                'w-10 px-3': cell.column.id === '_select',
              }"
            >
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </td>

            <!-- Empty cell for add column -->
            <td v-if="addColumnEnabled" class="w-10" />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
