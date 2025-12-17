<script setup lang="ts">
import Input from '@/components/atoms/Input.vue';
import Textarea from '@/components/atoms/Textarea.vue';
import Label from '@/components/atoms/Label.vue';

withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'textarea';
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    rows?: number;
    size?: 'sm' | 'md' | 'lg';
    error?: string;
  }>(),
  {
    type: 'text',
    disabled: false,
    required: false,
    rows: 3,
    size: 'md',
  }
);

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <div>
    <Label :size="size" :required="required">{{ label }}</Label>
    <Textarea
      v-if="type === 'textarea'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :size="size"
    />
    <Input
      v-else
      :type="type"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
    />
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>
