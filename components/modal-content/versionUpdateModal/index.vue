<template>
  <modal
    title="Chapter Approval"
    :open="showVersionUpdateModal"
    custom-classes="c-modal--completion"
  >
    <div class="c-modal--completion__body">
      <div class="c-modal--completion__body--upper">
        <img src="~/assets/images/updates.png" class="warning" />
      </div>
      <div class="c-modal--completion__body--lower">
        <p class="u-mb-- info-text">A new version is available.</p>
        <p class="u-mb-- sub-info-text">
          Please click on reload to get the updates for smooth use.
        </p>
      </div>
    </div>

    <div class="c-modal--completion__footer">
      <button class="c-btn--ghost c-btn--primary" @click="clearData">
        Reload
      </button>
    </div>
  </modal>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { setDataToLocalStorage } from '~/helpers/apiCore';
import Modal from '~/components/structure/Modal.vue';

import { userAlertStore } from '~/store';

const alertStore = userAlertStore();
const { showVersionUpdateModal } = storeToRefs(alertStore);

const runtimeConfig = useRuntimeConfig();
const { buildVersion } = runtimeConfig.public;

const clearData = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller.postMessage({ type: 'clearCache' });
    window.location.reload();
    setDataToLocalStorage('BUILD_VERSION', buildVersion);
    alertStore.closeVersionUpdateModal();
  } else {
    console.error('Service Worker not available');
    alertStore.closeVersionUpdateModal();
  }
};
</script>
