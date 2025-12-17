<script setup lang="ts">
import SearchInput from '@/components/molecules/SearchInput.vue';
import Button from '@/components/atoms/Button.vue';

export interface BatchAction {
  id: string;
  label: string;
  icon?: 'trash' | 'archive' | 'edit';
  variant?: 'default' | 'danger';
}

withDefaults(
  defineProps<{
    totalItems: number;
    selectedCount?: number;
    searchable?: boolean;
    searchPlaceholder?: string;
    filterable?: boolean;
    showAdd?: boolean;
    addLabel?: string;
    modelValue?: string;
    batchActions?: BatchAction[];
  }>(),
  {
    selectedCount: 0,
    searchable: true,
    searchPlaceholder: 'Rechercher...',
    filterable: true,
    showAdd: true,
    addLabel: 'Ajouter',
    batchActions: () => [],
  }
);

defineEmits<{
  'update:modelValue': [value: string];
  add: [];
  filter: [];
  batchAction: [actionId: string];
  clearSelection: [];
}>();
</script>

<template>
  <div class="flex items-center justify-between gap-4 mb-4">
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-500">
        {{ totalItems }} element{{ totalItems > 1 ? 's' : '' }}
      </span>

      <!-- Batch actions when items selected -->
      <template v-if="selectedCount > 0">
        <span class="text-sm font-medium text-blue-600">
          {{ selectedCount }} selectionne{{ selectedCount > 1 ? 's' : '' }}
        </span>
        <div class="flex items-center gap-1 ml-2">
          <button
            v-for="action in batchActions"
            :key="action.id"
            type="button"
            @click.stop="$emit('batchAction', action.id)"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            :class="action.variant === 'danger'
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-700 hover:bg-gray-100'"
          >
            <!-- Delete icon -->
            <svg v-if="action.icon === 'trash'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <!-- Archive icon -->
            <svg v-else-if="action.icon === 'archive'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <!-- Edit icon -->
            <svg v-else-if="action.icon === 'edit'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {{ action.label }}
          </button>
          <button
            @click="$emit('clearSelection')"
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ml-1"
            title="Annuler la selection"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </template>
    </div>

    <div class="flex items-center gap-2">
      <SearchInput
        v-if="searchable"
        :model-value="modelValue || ''"
        @update:model-value="$emit('update:modelValue', $event)"
        :placeholder="searchPlaceholder"
      />

      <button
        v-if="filterable"
        @click="$emit('filter')"
        class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        title="Filtrer"
      >
        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      <Button
        v-if="showAdd"
        variant="primary"
        size="md"
        @click="$emit('add')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ addLabel }}
      </Button>
    </div>
  </div>
</template>
