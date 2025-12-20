<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/lib/api';

type Provider = NonNullable<Awaited<ReturnType<typeof api.payments.providers.get>>['data']>[number];

const loading = ref(true);
const providers = ref<Provider[]>([]);

async function loadProviders() {
  loading.value = true;
  const { data } = await api.payments.providers.get();
  if (data) {
    providers.value = data;
  }
  loading.value = false;
}

onMounted(loadProviders);

function getProviderIcon(id: string) {
  switch (id) {
    case 'stripe':
      return 'M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z';
    case 'paypal':
      return 'M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z';
    default:
      return '';
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Paiements
      </h1>
      <p class="text-gray-500 mt-1">
        Configurez les moyens de paiement de votre boutique
      </p>
    </div>

    <div
      v-if="loading"
      class="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500"
    >
      Chargement...
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="provider in providers"
        :key="provider.id"
        class="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div
              :class="[
                'w-12 h-12 rounded-lg flex items-center justify-center',
                provider.isConfigured ? 'bg-gray-900' : 'bg-gray-100'
              ]"
            >
              <svg
                class="w-6 h-6"
                :class="provider.isConfigured ? 'text-white' : 'text-gray-400'"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path :d="getProviderIcon(provider.id)" />
              </svg>
            </div>

            <!-- Info -->
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ provider.name }}
              </h3>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ provider.description }}
              </p>
            </div>
          </div>

          <!-- Status -->
          <div class="flex items-center gap-3">
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                provider.isConfigured
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              ]"
            >
              <span
                :class="[
                  'w-2 h-2 rounded-full',
                  provider.isConfigured ? 'bg-green-500' : 'bg-gray-400'
                ]"
              />
              {{ provider.isConfigured ? 'Actif' : 'Non configuré' }}
            </span>
          </div>
        </div>

        <!-- Configuration hint -->
        <div
          v-if="!provider.isConfigured"
          class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <p class="text-sm text-amber-800">
            <strong>Configuration requise</strong>
          </p>
          <p class="text-sm text-amber-700 mt-1">
            <template v-if="provider.id === 'stripe'">
              Ajoutez <code class="bg-amber-100 px-1 py-0.5 rounded">STRIPE_SECRET_KEY</code> et
              <code class="bg-amber-100 px-1 py-0.5 rounded">STRIPE_WEBHOOK_SECRET</code>
              dans vos variables d'environnement.
            </template>
            <template v-else-if="provider.id === 'paypal'">
              Ajoutez <code class="bg-amber-100 px-1 py-0.5 rounded">PAYPAL_CLIENT_ID</code> et
              <code class="bg-amber-100 px-1 py-0.5 rounded">PAYPAL_CLIENT_SECRET</code>
              dans vos variables d'environnement.
            </template>
          </p>
        </div>

        <!-- Configured info -->
        <div
          v-else
          class="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg"
        >
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <svg
              class="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Prêt à recevoir des paiements
          </div>
          <p class="text-xs text-gray-500 mt-2">
            <template v-if="provider.id === 'stripe'">
              Les webhooks doivent pointer vers <code class="bg-gray-100 px-1 py-0.5 rounded">/payments/webhook/stripe</code>
            </template>
            <template v-else-if="provider.id === 'paypal'">
              Les webhooks doivent pointer vers <code class="bg-gray-100 px-1 py-0.5 rounded">/payments/webhook/paypal</code>
            </template>
          </p>
        </div>
      </div>
    </div>

    <!-- Help section -->
    <div class="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 class="font-semibold text-blue-900">
        Comment configurer les paiements ?
      </h3>
      <ol class="mt-3 space-y-2 text-sm text-blue-800">
        <li>
          <strong>1.</strong> Créez un compte sur le service de paiement (Stripe ou PayPal)
        </li>
        <li>
          <strong>2.</strong> Récupérez vos clés API depuis le dashboard du service
        </li>
        <li>
          <strong>3.</strong> Ajoutez les clés dans le fichier <code class="bg-blue-100 px-1 py-0.5 rounded">.env</code> de l'API
        </li>
        <li>
          <strong>4.</strong> Configurez les webhooks dans le dashboard du service
        </li>
        <li>
          <strong>5.</strong> Redémarrez l'API pour appliquer les changements
        </li>
      </ol>
    </div>
  </div>
</template>
