// https://nuxt.com/docs/api/configuration/nuxt-config

import { isCI, isDevelopment, isProduction } from 'std-env';

console.info(`API_BASE_URL=${process.env.NUXT_PUBLIC_API_BASE_URL}`);
console.info(`EGW_API=${process.env.NUXT_PUBLIC_EGW_API}`);
console.info(`API_BASE_URL=${process.env.NUXT_PUBLIC_CPANEL_URL}`);

export default defineNuxtConfig({
  components: {
    global: true,
    dirs: ['@/components/translate/timeline', '@/components/activities'],
  },

  runtimeConfig: {
    public: {
      // Must match camelcase or same key with env key after NUXT_PUBLIC_
      cpanelUrl: process.env.NUXT_PUBLIC_CPANEL_URL,
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      egwApi: process.env.NUXT_PUBLIC_EGW_API,
      buildVersion: process.env.NUXT_PUBLIC_BUILD_VERSION,
    },
  },
  app: {
    /*
     ** Headers of the page
     */
    head: {
      title: 'ellen4all – Crowd-Translating Ellen White',
      titleTemplate: '%s | ellen4all',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          hid: 'description',
          name: 'description',
          content:
            "Translating Ellen White's writings into every language with your help",
        },

        {
          name: 'format-detection',
          content: 'telephone=no',
        },
        {
          name: 'msapplication-tap-highlight',
          content: 'no',
        },
        {
          name: 'og:image',
          content: '/img/ellen-600.jpg',
        },
        {
          name: 'theme-color',
          content: '#3b97bf',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,400i,600&display=swap&subset=cyrillic,cyrillic-ext,greek,greek-ext,latin-ext,vietnamese',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
        },
        {
          rel: 'manifest',
          href: '/e4all.webmanifest',
        },
      ],
    },
  },

  /*
   ** Global CSS
   */
  css: ['@/assets/scss/main.scss', 'vuetify/lib/styles/main.sass'],

  /*
   ** Nuxt.js modules
   */
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@vite-pwa/nuxt',
  ],

  build: {
    transpile: ['vuetify'],
  },

  router: {
    options: {
      linkActiveClass: 'is-active',
      linkExactActiveClass: 'is-exact-active',
    },
  },

  vite: {
    // Import styles with variables
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/assets/scss/settings-and-tools.scss";',
        },
      },
    },
  },

  ssr: false,

  pwa: {
    mode: isCI || isProduction ? 'production' : 'development',
    disable: isDevelopment && process.env.NUXT_DEV_PWA !== 'true',
    scope: '/',
    srcDir: './service-worker',
    filename: 'sw.js',
    strategies: 'injectManifest',
    injectRegister: false,
    includeManifestIcons: false,
    manifest: false,
    injectManifest: {
      globPatterns: [
        '**/*.{js,json,css,html,txt,svg,png,ico,webp,woff,woff2,ttf,eot,otf}',
      ],
      globIgnores: ['sw.js,manifest.json', 'e4all.webmanifest'],
    },
    devOptions: {
      enabled: process.env.NUXT_DEV_PWA === 'true',
      type: 'module',
    },
  },
});
