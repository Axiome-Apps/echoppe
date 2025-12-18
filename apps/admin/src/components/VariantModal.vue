<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Modal from '@/components/atoms/Modal.vue';
import Button from '@/components/atoms/Button.vue';
import Label from '@/components/atoms/Label.vue';
import Select from '@/components/atoms/Select.vue';
import Input from '@/components/atoms/Input.vue';
import Combobox from '@/components/atoms/Combobox.vue';
import type { ComboboxOption } from '@/components/atoms/Combobox.vue';
import { api } from '@/lib/api';

type Variant = {
  id: string;
  product: string;
  sku: string | null;
  barcode: string | null;
  priceHt: string;
  compareAtPriceHt: string | null;
  costPrice: string | null;
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  isDefault: boolean;
  status: 'draft' | 'published' | 'archived';
  sortOrder: number;
  quantity: number;
  reserved: number;
  lowStockThreshold: number | null;
};

type Option = {
  id: string;
  name: string;
  values: { id: string; value: string }[];
};

const props = defineProps<{
  productId: string;
  variant?: Variant | null;
  options: Option[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [variant: Variant];
  'update:options': [options: Option[]];
}>();

const isNew = computed(() => !props.variant);
const saving = ref(false);

// Form data
const form = ref({
  status: 'draft' as 'draft' | 'published' | 'archived',
  quantity: 0,
  costPrice: '',
  priceHt: '',
  compareAtPriceHt: '',
  sku: '',
  barcode: '',
  length: '',
  width: '',
  height: '',
  weight: '',
});

// Options data (for variant)
const variantOptions = ref<{ optionId: string; valueId: string }[]>([]);

// Initialize form when variant changes
watch(
  () => props.variant,
  (v) => {
    if (v) {
      form.value = {
        status: v.status,
        quantity: v.quantity,
        costPrice: v.costPrice ?? '',
        priceHt: v.priceHt,
        compareAtPriceHt: v.compareAtPriceHt ?? '',
        sku: v.sku ?? '',
        barcode: v.barcode ?? '',
        length: v.length ?? '',
        width: v.width ?? '',
        height: v.height ?? '',
        weight: v.weight ?? '',
      };
    } else {
      form.value = {
        status: 'draft',
        quantity: 0,
        costPrice: '',
        priceHt: '',
        compareAtPriceHt: '',
        sku: '',
        barcode: '',
        length: '',
        width: '',
        height: '',
        weight: '',
      };
    }
  },
  { immediate: true }
);

// Computed volume
const volume = computed(() => {
  const l = parseFloat(form.value.length) || 0;
  const w = parseFloat(form.value.width) || 0;
  const h = parseFloat(form.value.height) || 0;
  if (l && w && h) {
    const vol = (l * w * h) / 1000; // cm³ to dm³ (liters)
    return vol.toFixed(2);
  }
  return null;
});

// Status options
const statusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

// Option combobox helpers
function getOptionComboboxOptions(opt: Option): ComboboxOption[] {
  return opt.values.map((v) => ({ value: v.id, label: v.value }));
}

function getSelectedValueForOption(optionId: string): string {
  return variantOptions.value.find((vo) => vo.optionId === optionId)?.valueId ?? '';
}

function setValueForOption(optionId: string, valueId: string) {
  const existing = variantOptions.value.find((vo) => vo.optionId === optionId);
  if (existing) {
    existing.valueId = valueId;
  } else {
    variantOptions.value.push({ optionId, valueId });
  }
}

async function createOptionValue(optionId: string, value: string) {
  const { data } = await api.products({ id: props.productId }).options({ optionId }).values.post({
    value,
  });

  if (data && 'id' in data) {
    // Update local options
    const updatedOptions = props.options.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, values: [...opt.values, { id: data.id, value: data.value }] };
      }
      return opt;
    });
    emit('update:options', updatedOptions);
    setValueForOption(optionId, data.id);
  }
}

async function save() {
  saving.value = true;

  const payload = {
    status: form.value.status,
    quantity: form.value.quantity,
    priceHt: parseFloat(form.value.priceHt) || 0,
    costPrice: form.value.costPrice ? parseFloat(form.value.costPrice) : undefined,
    compareAtPriceHt: form.value.compareAtPriceHt
      ? parseFloat(form.value.compareAtPriceHt)
      : undefined,
    sku: form.value.sku || undefined,
    barcode: form.value.barcode || undefined,
    length: form.value.length ? parseFloat(form.value.length) : undefined,
    width: form.value.width ? parseFloat(form.value.width) : undefined,
    height: form.value.height ? parseFloat(form.value.height) : undefined,
    weight: form.value.weight ? parseFloat(form.value.weight) : undefined,
  };

  try {
    if (isNew.value) {
      const { data } = await api.products({ id: props.productId }).variants.post(payload);
      if (data && 'id' in data) {
        emit('saved', data as Variant);
      }
    } else if (props.variant) {
      const { data } = await api
        .products({ id: props.productId })
        .variants({ variantId: props.variant.id })
        .put(payload);
      if (data && 'id' in data) {
        emit('saved', data as Variant);
      }
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal :title="isNew ? 'Nouvelle variante' : 'Modifier la variante'" size="lg" @close="emit('close')">
    <div class="space-y-6">
      <!-- Section: Infos principales -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Infos principales
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label size="sm">Statut</Label>
            <Select v-model="form.status" :options="statusOptions" size="sm" />
          </div>
          <div>
            <Label size="sm">Stock</Label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0"
              class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      <!-- Section: Tarification -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Tarification
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <Label size="sm">Coût d'achat</Label>
            <div class="relative">
              <input
                v-model="form.costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full px-2 py-1 pr-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
            </div>
          </div>
          <div>
            <Label size="sm" required>Prix HT</Label>
            <div class="relative">
              <input
                v-model="form.priceHt"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                class="w-full px-2 py-1 pr-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
            </div>
          </div>
          <div>
            <Label size="sm">Prix barré</Label>
            <div class="relative">
              <input
                v-model="form.compareAtPriceHt"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full px-2 py-1 pr-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: Références -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Références
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label size="sm">SKU</Label>
            <Input v-model="form.sku" size="sm" placeholder="ABC-123" />
          </div>
          <div>
            <Label size="sm">Code-barres</Label>
            <Input v-model="form.barcode" size="sm" placeholder="EAN / UPC" />
          </div>
        </div>
      </section>

      <!-- Section: Dimensions -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Dimensions
        </h3>
        <div class="grid grid-cols-4 gap-4">
          <div>
            <Label size="sm">Longueur</Label>
            <div class="relative">
              <input
                v-model="form.length"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                class="w-full px-2 py-1 pr-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">cm</span>
            </div>
          </div>
          <div>
            <Label size="sm">Largeur</Label>
            <div class="relative">
              <input
                v-model="form.width"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                class="w-full px-2 py-1 pr-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">cm</span>
            </div>
          </div>
          <div>
            <Label size="sm">Hauteur</Label>
            <div class="relative">
              <input
                v-model="form.height"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                class="w-full px-2 py-1 pr-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">cm</span>
            </div>
          </div>
          <div>
            <Label size="sm">Poids</Label>
            <div class="relative">
              <input
                v-model="form.weight"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                class="w-full px-2 py-1 pr-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">kg</span>
            </div>
          </div>
        </div>
        <div v-if="volume" class="mt-2 text-xs text-gray-500">
          Volume calculé : <span class="font-medium">{{ volume }} L</span>
        </div>
      </section>

      <!-- Section: Options -->
      <section v-if="options.length > 0">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Options</h3>
        <div class="space-y-3">
          <div v-for="opt in options" :key="opt.id">
            <Label size="sm">{{ opt.name }}</Label>
            <Combobox
              :model-value="getSelectedValueForOption(opt.id)"
              :options="getOptionComboboxOptions(opt)"
              :placeholder="`Sélectionner ${opt.name.toLowerCase()}`"
              size="sm"
              @update:model-value="setValueForOption(opt.id, $event)"
              @create="createOptionValue(opt.id, $event)"
            />
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="ghost" @click="emit('close')">Annuler</Button>
        <Button variant="primary" :loading="saving" @click="save">
          {{ isNew ? 'Créer' : 'Enregistrer' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
