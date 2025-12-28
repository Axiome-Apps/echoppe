<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/lib/api';
import { useToast } from '@/composables/useToast';
import Button from '@/components/atoms/Button.vue';
import MediaPicker from '@/components/molecules/MediaPicker.vue';
import type { ApiData, ApiItem } from '@/types/api';

type Company = ApiData<ReturnType<typeof api.company.get>>;
type Country = ApiItem<ReturnType<typeof api.company.countries.get>>;

const toast = useToast();
const loading = ref(true);
const saving = ref(false);
const countries = ref<Country[]>([]);
const initialState = ref<string | null>(null);

const legalForms = [
  { value: 'EI', label: 'Entreprise Individuelle (EI)' },
  { value: 'AE', label: 'Auto-Entrepreneur' },
  { value: 'EURL', label: 'EURL' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SASU', label: 'SASU' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SA', label: 'SA' },
  { value: 'SCI', label: 'SCI' },
];

const form = ref({
  shopName: '',
  logo: null as string | null,
  publicEmail: '',
  publicPhone: '',
  legalName: '',
  legalForm: '',
  siren: '',
  siret: '',
  tvaIntra: '',
  rcsCity: '',
  shareCapital: '',
  street: '',
  street2: '',
  postalCode: '',
  city: '',
  country: '',
  documentPrefix: 'REC',
  invoicePrefix: 'FA',
  taxExempt: false,
  publisherName: '',
  hostingProvider: '',
  hostingAddress: '',
  hostingPhone: '',
});

const hasChanges = computed(() => {
  if (!initialState.value) return form.value.shopName.trim() !== '';
  return JSON.stringify(form.value) !== initialState.value;
});

async function loadCompany() {
  loading.value = true;

  const [companyRes, countriesRes] = await Promise.all([
    api.company.get(),
    api.company.countries.get(),
  ]);

  if (countriesRes.data) {
    countries.value = countriesRes.data;
  }

  if (companyRes.data) {
    const c = companyRes.data as Company;
    form.value = {
      shopName: c.shopName,
      logo: c.logo,
      publicEmail: c.publicEmail,
      publicPhone: c.publicPhone ?? '',
      legalName: c.legalName,
      legalForm: c.legalForm ?? '',
      siren: c.siren ?? '',
      siret: c.siret ?? '',
      tvaIntra: c.tvaIntra ?? '',
      rcsCity: c.rcsCity ?? '',
      shareCapital: c.shareCapital ?? '',
      street: c.street,
      street2: c.street2 ?? '',
      postalCode: c.postalCode,
      city: c.city,
      country: c.country,
      documentPrefix: c.documentPrefix,
      invoicePrefix: c.invoicePrefix,
      taxExempt: c.taxExempt,
      publisherName: c.publisherName ?? '',
      hostingProvider: c.hostingProvider ?? '',
      hostingAddress: c.hostingAddress ?? '',
      hostingPhone: c.hostingPhone ?? '',
    };
    initialState.value = JSON.stringify(form.value);
  }

  loading.value = false;
}

onMounted(loadCompany);

async function save() {
  saving.value = true;

  try {
    const payload = {
      shopName: form.value.shopName,
      logo: form.value.logo || null,
      publicEmail: form.value.publicEmail,
      publicPhone: form.value.publicPhone || null,
      legalName: form.value.legalName,
      legalForm: form.value.legalForm || null,
      siren: form.value.siren || null,
      siret: form.value.siret || null,
      tvaIntra: form.value.tvaIntra || null,
      rcsCity: form.value.rcsCity || null,
      shareCapital: form.value.shareCapital || null,
      street: form.value.street,
      street2: form.value.street2 || null,
      postalCode: form.value.postalCode,
      city: form.value.city,
      country: form.value.country,
      documentPrefix: form.value.documentPrefix,
      invoicePrefix: form.value.invoicePrefix,
      taxExempt: form.value.taxExempt,
      publisherName: form.value.publisherName || null,
      hostingProvider: form.value.hostingProvider || null,
      hostingAddress: form.value.hostingAddress || null,
      hostingPhone: form.value.hostingPhone || null,
    };

    const { error } = await api.company.put(payload);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Paramètres enregistrés');
      initialState.value = JSON.stringify(form.value);
    }
  } catch {
    toast.error('Erreur lors de la sauvegarde');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Paramètres de la boutique
      </h1>
      <Button
        variant="primary"
        size="lg"
        :disabled="!hasChanges || saving"
        :loading="saving"
        @click="save"
      >
        Enregistrer
      </Button>
    </div>

    <div
      v-if="loading"
      class="text-gray-500"
    >
      Chargement...
    </div>

    <form
      v-else
      class="space-y-8 max-w-3xl"
      @submit.prevent="save"
    >
      <!-- Section: Informations boutique -->
      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Informations boutique
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique *</label>
            <input
              v-model="form.shopName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email public *</label>
            <input
              v-model="form.publicEmail"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone public</label>
            <input
              v-model="form.publicPhone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Logo</label>
            <MediaPicker v-model="form.logo" />
          </div>
        </div>
      </section>

      <!-- Section: Informations légales -->
      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Informations légales
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Raison sociale *</label>
            <input
              v-model="form.legalName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Forme juridique</label>
            <select
              v-model="form.legalForm"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">
                Sélectionner...
              </option>
              <option
                v-for="lf in legalForms"
                :key="lf.value"
                :value="lf.value"
              >
                {{ lf.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">SIREN</label>
            <input
              v-model="form.siren"
              type="text"
              maxlength="9"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
            <input
              v-model="form.siret"
              type="text"
              maxlength="14"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">N° TVA Intracommunautaire</label>
            <input
              v-model="form.tvaIntra"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ville RCS</label>
            <input
              v-model="form.rcsCity"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capital social (€)</label>
            <input
              v-model="form.shareCapital"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      <!-- Section: TVA -->
      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          TVA
        </h2>
        <div class="flex items-start gap-3">
          <button
            type="button"
            role="switch"
            :aria-checked="form.taxExempt"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :class="form.taxExempt ? 'bg-blue-600' : 'bg-gray-200'"
            @click="form.taxExempt = !form.taxExempt"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="form.taxExempt ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
          <div>
            <p class="text-sm font-medium text-gray-900">
              Exonération de TVA
            </p>
            <p class="text-sm text-gray-500">
              {{ form.taxExempt
                ? 'Les produits sont créés avec une TVA à 0% par défaut (franchise en base de TVA).'
                : 'Les produits sont créés avec une TVA à 20% par défaut.'
              }}
            </p>
          </div>
        </div>
      </section>

      <!-- Section: Adresse -->
      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Adresse
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
            <input
              v-model="form.street"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Complément d'adresse</label>
            <input
              v-model="form.street2"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
            <input
              v-model="form.postalCode"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
            <input
              v-model="form.city"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
            <select
              v-model="form.country"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">
                Sélectionner...
              </option>
              <option
                v-for="c in countries"
                :key="c.id"
                :value="c.id"
              >
                {{ c.name }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Section: Pages légales -->
      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Informations pour pages légales
        </h2>
        <p class="text-sm text-gray-500 mb-4">
          Ces informations sont affichées sur les pages légales du site (mentions légales, CGV, contact).
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Directeur de publication</label>
            <input
              v-model="form.publisherName"
              type="text"
              placeholder="Prénom Nom"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Hébergeur</label>
            <input
              v-model="form.hostingProvider"
              type="text"
              placeholder="Nom de l'hébergeur"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Adresse hébergeur</label>
            <input
              v-model="form.hostingAddress"
              type="text"
              placeholder="Adresse complète"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone hébergeur</label>
            <input
              v-model="form.hostingPhone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      <!-- Section: Numérotation documents -->
      <section class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Numérotation des documents
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Préfixe reçus</label>
            <input
              v-model="form.documentPrefix"
              type="text"
              maxlength="10"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Ex: REC-2025-00001
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Préfixe factures</label>
            <input
              v-model="form.invoicePrefix"
              type="text"
              maxlength="10"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Ex: FA-2025-00001
            </p>
          </div>
        </div>
      </section>

      <!-- Submit button mobile -->
      <div class="md:hidden">
        <Button
          variant="primary"
          size="lg"
          class="w-full"
          :disabled="!hasChanges || saving"
          :loading="saving"
          type="submit"
        >
          Enregistrer
        </Button>
      </div>
    </form>
  </div>
</template>
