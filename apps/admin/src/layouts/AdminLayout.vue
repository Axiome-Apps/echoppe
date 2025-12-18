<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import type { NavigationConfig } from '@/types/navigation';
import SidebarNav from '@/components/organisms/SidebarNav.vue';
import SidebarUserMenu from '@/components/molecules/SidebarUserMenu.vue';

const router = useRouter();
const auth = useAuth();

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

const navigationConfig: NavigationConfig = [
  {
    title: '',
    items: [
      {
        name: 'Tableau de bord',
        path: '/',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
    ],
  },
  {
    title: 'CATALOGUE',
    items: [
      {
        name: 'Produits',
        path: '/produits',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        badge: { key: 'outOfStock', variant: 'warning' },
      },
      {
        name: 'Catégories',
        path: '/categories',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      },
      {
        name: 'Collections',
        path: '/collections',
        icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      },
      {
        name: 'Stock',
        path: '/stock',
        icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4',
      },
    ],
  },
  {
    title: 'COMMANDES',
    items: [
      {
        name: 'Commandes',
        path: '/commandes',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        badge: { key: 'pendingOrders', variant: 'info' },
      },
      {
        name: 'Expédition',
        path: '/expeditions',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      },
      {
        name: 'Paiements',
        path: '/paiements',
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      },
    ],
  },
  {
    title: 'CONTENU',
    items: [
      {
        name: 'Médiathèque',
        path: '/medias',
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      },
    ],
  },
];

const badgeCounts = ref<Record<string, number>>({
  outOfStock: 0,
  pendingOrders: 0,
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col">
      <!-- Logo -->
      <div class="flex items-center h-16 px-6 border-b border-gray-200 shrink-0">
        <h1 class="text-xl font-bold text-gray-900">
          Echoppe
        </h1>
      </div>

      <!-- Navigation scrollable -->
      <div class="flex-1 overflow-y-auto">
        <SidebarNav
          :navigation="navigationConfig"
          :badge-counts="badgeCounts"
        />
      </div>

      <!-- User menu -->
      <SidebarUserMenu
        v-if="auth.user.value"
        :first-name="auth.user.value.firstName"
        :last-name="auth.user.value.lastName"
        @logout="handleLogout"
      />
    </aside>

    <!-- Main content -->
    <main class="ml-64 p-6">
      <router-view />
    </main>
  </div>
</template>
