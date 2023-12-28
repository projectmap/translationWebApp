<template>
  <div id="app" class="o-site">
    <alerts-component />
    <site-header id="site-header" fullwidth />
    <main id="site-content" role="main">
      <slot />
    </main>

    <version-update-modal />

    <site-footer id="site-footer" />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import { disableRightClickOnSiteOnProduction } from '../helpers/Util';
import SiteHeader from '@/components/header';
import SiteFooter from '@/components/footer';
import { useAuthStore, useUserStore, userAlertStore } from '@/store';
import AlertsComponent from '~/components/alerts/AlertsComponent.vue';
import VersionUpdateModal from '@/components/modal-content/versionUpdateModal/index.vue';

const userStore = useUserStore();
const alertStore = userAlertStore();
const authStore = useAuthStore();
const { isOnline } = storeToRefs(authStore);
const { showVersionUpdateModal } = storeToRefs(alertStore);

useAsyncData(({ $router, $pinia }) => {
  const onlineStatus = $pinia.state.value['auth-store'].isOnline;
  const currentRoute = $router.currentRoute.value?.fullPath;

  if (!onlineStatus && currentRoute.includes('/translate/')) return;

  userStore.getInitialDatas();
  alertStore.fetchNotificationCount();
});

onMounted(() => {
  if (isOnline.value && !showVersionUpdateModal.value) {
    alertStore.handleAppVersionUpdate();
  }
  disableRightClickOnSiteOnProduction();
});
</script>
