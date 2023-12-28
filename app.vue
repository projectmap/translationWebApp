<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="hsl(198, 53%, 49%)" :height="5" />

    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useRegisterSW } from 'virtual:pwa-register/vue';

import { useAuthStore } from '~/store';

const nuxtApp = useNuxtApp();

const authStore = useAuthStore();
const { isOnline } = storeToRefs(authStore);

onMounted(() => {
  const onLine = 'onLine' in navigator && navigator.onLine;
  authStore.onlineHandler(onLine);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    nuxtApp.provide('installEvent', event);
  });

  window.addEventListener('online', () => {
    if (!isOnline.value) {
      authStore.onlineHandler(true);
    }
  });

  window.addEventListener('offline', () => {
    if (isOnline.value) {
      authStore.onlineHandler(false);
    }
  });
});

useRegisterSW({
  immediate: true,
});
</script>
