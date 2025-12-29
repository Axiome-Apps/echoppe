import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Échoppe',
  description: 'Documentation de la plateforme e-commerce Échoppe',
  lang: 'fr-FR',
  base: '/echoppe/',
  srcExclude: ['internal/**'],
  ignoreDeadLinks: true,

  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Admin', link: '/admin/' },
      { text: 'Développeur', link: '/dev/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Présentation', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
      ],
      '/admin/': [
        {
          text: 'Administration',
          items: [
            { text: 'Vue d\'ensemble', link: '/admin/' },
            { text: 'Produits', link: '/admin/products' },
            { text: 'Catégories & Collections', link: '/admin/taxonomy' },
            { text: 'Commandes', link: '/admin/orders' },
            { text: 'Clients', link: '/admin/customers' },
            { text: 'Stock', link: '/admin/stock' },
            { text: 'Médiathèque', link: '/admin/media' },
            { text: 'Paramètres', link: '/admin/settings' },
          ],
        },
      ],
      '/dev/': [
        {
          text: 'Développeur',
          items: [
            { text: 'Architecture', link: '/dev/' },
            { text: 'API REST', link: '/dev/api' },
            { text: 'Base de données', link: '/dev/database' },
            { text: 'Authentification', link: '/dev/auth' },
            { text: 'Contribuer', link: '/dev/contributing' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/Axiome-Apps/echoppe' }],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Publié sous licence MIT.',
      copyright: 'Copyright © 2024-present Échoppe',
    },

    outline: {
      label: 'Sur cette page',
    },

    docFooter: {
      prev: 'Page précédente',
      next: 'Page suivante',
    },

    lastUpdated: {
      text: 'Mis à jour le',
    },

    returnToTopLabel: 'Retour en haut',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Thème',
  },
});
