<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Modal from '@/components/atoms/Modal.vue';
import Button from '@/components/atoms/Button.vue';
import Label from '@/components/atoms/Label.vue';
import Select from '@/components/atoms/Select.vue';
import Input from '@/components/atoms/Input.vue';
import Combobox from '@/components/atoms/Combobox.vue';
import type { ComboboxOption } from '@/components/atoms/Combobox.vue';
import { api } from '@/lib/api';

// Type pour les options globales (sans valeurs)
type GlobalOption = { id: string; name: string };

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
  optionValues?: string[]; // IDs des valeurs d'option sélectionnées
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
  onClose: () => void;
  onSaved: () => void;
  onOptionsChange: (options: Option[]) => void;
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

// Global options (all available options)
const globalOptions = ref<GlobalOption[]>([]);

// Load global options on mount
onMounted(async () => {
  const { data } = await api.products.options.get();
  if (data && Array.isArray(data)) {
    globalOptions.value = data;
  }
});

// Options disponibles pour ajout (exclut celles déjà sur le produit)
const availableOptionsForAdd = computed((): ComboboxOption[] => {
  const productOptionIds = new Set(props.options.map((o) => o.id));
  return globalOptions.value
    .filter((go) => !productOptionIds.has(go.id))
    .map((go) => ({ value: go.id, label: go.name }));
});

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
      // Initialize variant options from saved values
      if (v.optionValues && v.optionValues.length > 0) {
        variantOptions.value = v.optionValues.map((valueId) => {
          // Find which option this value belongs to
          const opt = props.options.find((o) => o.values.some((val) => val.id === valueId));
          return { optionId: opt?.id ?? '', valueId };
        }).filter((vo) => vo.optionId);
      } else {
        variantOptions.value = [];
      }
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
      variantOptions.value = [];
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
  // Eden bracket notation pour les params dynamiques
  const { data } = await (api.products as any)[props.productId].options[optionId].values.post({ value });

  if (data && 'id' in data) {
    const updatedOptions = props.options.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, values: [...opt.values, { id: data.id, value: data.value }] };
      }
      return opt;
    });
    props.onOptionsChange(updatedOptions);
    setValueForOption(optionId, data.id);
  }
}

// New option creation
const showAddOptionCombobox = ref(false);

async function addExistingOption(optionId: string) {
  // Trouve l'option globale pour récupérer ses valeurs
  const globalOpt = globalOptions.value.find((go) => go.id === optionId);
  if (!globalOpt) return;

  // Associe l'option au produit via l'API
  const { data } = await api.products({ id: props.productId }).options.post({
    name: globalOpt.name,
  });

  if (data && 'id' in data) {
    // Recharge les valeurs de cette option
    const { data: values } = await (api.products as any)[props.productId].options[optionId].values.get();
    const newOption: Option = {
      id: data.id,
      name: data.name,
      values: Array.isArray(values) ? values.map((v: { id: string; value: string }) => ({ id: v.id, value: v.value })) : [],
    };
    props.onOptionsChange([...props.options, newOption]);
    showAddOptionCombobox.value = false;
  }
}

async function createOption(name: string) {
  if (!name.trim()) return;

  const { data } = await api.products({ id: props.productId }).options.post({
    name: name.trim(),
  });

  if (data && 'id' in data) {
    const newOption: Option = { id: data.id, name: data.name, values: [] };
    props.onOptionsChange([...props.options, newOption]);
    // Ajoute aux options globales pour ne pas la re-proposer
    globalOptions.value.push({ id: data.id, name: data.name });
    showAddOptionCombobox.value = false;
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
    let savedVariant: Variant | null = null;

    if (isNew.value) {
      const { data } = await api.products({ id: props.productId }).variants.post(payload);
      if (data && 'id' in data) {
        savedVariant = data as Variant;
      }
    } else if (props.variant) {
      const { data } = await api
        .products({ id: props.productId })
        .variants({ variantId: props.variant.id })
        .put(payload);
      if (data && 'id' in data) {
        savedVariant = data as Variant;
      }
    }

    // Save option values for the variant
    if (savedVariant) {
      const optionValueIds = variantOptions.value
        .map((vo) => vo.valueId)
        .filter((id) => id);

      // Eden bracket notation pour les params dynamiques
      await (api.products as any)[props.productId].variants[savedVariant.id].options.put({ optionValueIds });

      props.onSaved();
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal :title="isNew ? 'Nouvelle variante' : 'Modifier la variante'" size="2xl" tall @close="onClose">
    <div class="space-y-6">
      <!-- Section: Infos principales -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Infos principales
        </h3>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <Label>Statut</Label>
            <Select v-model="form.status" :options="statusOptions" size="lg" />
          </div>
          <div>
            <Label>Stock</Label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      <!-- Section: Tarification -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Tarification
        </h3>
        <div class="grid grid-cols-3 gap-6">
          <div>
            <Label>Coût d'achat</Label>
            <div class="relative">
              <input
                v-model="form.costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
          </div>
          <div>
            <Label required>Prix HT</Label>
            <div class="relative">
              <input
                v-model="form.priceHt"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
          </div>
          <div>
            <Label>Prix barré</Label>
            <div class="relative">
              <input
                v-model="form.compareAtPriceHt"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: Références -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Références
        </h3>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <Label>SKU</Label>
            <Input v-model="form.sku" placeholder="ABC-123" size="lg" />
          </div>
          <div>
            <Label>Code-barres</Label>
            <Input v-model="form.barcode" placeholder="EAN / UPC" size="lg" />
          </div>
        </div>
      </section>

      <!-- Section: Dimensions -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Dimensions
        </h3>
        <div class="grid grid-cols-4 gap-6">
          <div>
            <Label>Longueur</Label>
            <div class="relative">
              <input
                v-model="form.length"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">cm</span>
            </div>
          </div>
          <div>
            <Label>Largeur</Label>
            <div class="relative">
              <input
                v-model="form.width"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">cm</span>
            </div>
          </div>
          <div>
            <Label>Hauteur</Label>
            <div class="relative">
              <input
                v-model="form.height"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">cm</span>
            </div>
          </div>
          <div>
            <Label>Poids</Label>
            <div class="relative">
              <input
                v-model="form.weight"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 pr-12 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">kg</span>
            </div>
          </div>
        </div>
        <div v-if="volume" class="mt-2 text-sm text-gray-500">
          Volume calculé : <span class="font-medium">{{ volume }} L</span>
        </div>
      </section>

      <!-- Section: Options -->
      <section>
        <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Options</h3>

        <!-- Existing options -->
        <div v-if="options.length > 0" class="space-y-4 mb-4">
          <div v-for="opt in options" :key="opt.id">
            <Label>{{ opt.name }}</Label>
            <Combobox
              :model-value="getSelectedValueForOption(opt.id)"
              :options="getOptionComboboxOptions(opt)"
              :placeholder="`Sélectionner ${opt.name.toLowerCase()}`"
              size="lg"
              @update:model-value="setValueForOption(opt.id, $event)"
              @create="createOptionValue(opt.id, $event)"
            />
          </div>
        </div>

        <!-- Add new option -->
        <div v-if="showAddOptionCombobox" class="flex gap-3 items-end">
          <div class="flex-1">
            <Label>Option à ajouter</Label>
            <Combobox
              model-value=""
              :options="availableOptionsForAdd"
              placeholder="Sélectionner ou créer une option"
              size="lg"
              @update:model-value="addExistingOption($event)"
              @create="createOption($event)"
            />
          </div>
          <button
            type="button"
            class="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
            @click="showAddOptionCombobox = false"
          >
            Annuler
          </button>
        </div>
        <button
          v-else
          type="button"
          class="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          @click="showAddOptionCombobox = true"
        >
          + Ajouter une option
        </button>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="ghost" @click="onClose">Annuler</Button>
        <Button variant="primary" :loading="saving" @click="save">
          {{ isNew ? 'Créer' : 'Enregistrer' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
