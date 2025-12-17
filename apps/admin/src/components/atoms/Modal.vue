<script setup lang="ts">
import CloseIcon from './icons/CloseIcon.vue';

withDefaults(
  defineProps<{
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }>(),
  {
    size: 'sm',
  }
);

defineEmits<{
  close: [];
}>();

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
};
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div :class="['bg-white rounded-lg shadow-xl w-full mx-4 max-h-[90vh] overflow-auto', sizeClasses[size]]">
      <div v-if="title || $slots.header" class="flex items-start justify-between p-5 pb-0">
        <slot name="header">
          <h2 class="text-lg font-semibold">{{ title }}</h2>
        </slot>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1"
        >
          <CloseIcon />
        </button>
      </div>
      <div class="p-5">
        <slot />
      </div>
      <div v-if="$slots.footer" class="px-5 pb-5">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
