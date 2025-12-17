<script setup lang="ts">
import GridIcon from '@/components/atoms/icons/GridIcon.vue';
import ListIcon from '@/components/atoms/icons/ListIcon.vue';

defineProps<{
  modelValue: 'grid' | 'list';
}>();

defineEmits<{
  'update:modelValue': [value: 'grid' | 'list'];
}>();
</script>

<template>
  <div class="flex border border-gray-300 rounded-lg overflow-hidden">
    <button
      @click="$emit('update:modelValue', 'grid')"
      :class="['p-1.5', modelValue === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50']"
      title="Vue grille"
    >
      <GridIcon size="sm" />
    </button>
    <button
      @click="$emit('update:modelValue', 'list')"
      :class="['p-1.5', modelValue === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50']"
      title="Vue liste"
    >
      <ListIcon size="sm" />
    </button>
  </div>
</template>
