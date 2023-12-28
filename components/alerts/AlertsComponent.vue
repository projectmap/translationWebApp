<template>
  <snackbar-component
    v-if="state.visibleAlert"
    :active="state.active"
    :dismissable="state.visibleAlert.dismissable"
    :duration="state.visibleAlert.duration"
    :color="state.visibleAlert.color"
    @update:active="snackbarUpdate"
  >
    <div v-html="state.visibleAlert.message"></div>
  </snackbar-component>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import SnackbarComponent from './Snackbar';
import { userAlertStore } from '~/store';

const state = reactive({
  active: true,
  visibleAlert: null,
});

const alertStore = userAlertStore();

const { hasNext, getCurrent: current } = storeToRefs(alertStore);

watch(current, (newAlert, oldAlert) => {
  if (oldAlert && newAlert && newAlert.id === oldAlert.id) return;
  state.active = false;
  setTimeout(() => {
    state.visibleAlert = newAlert;
    state.active = true;
  }, 300);
});

const next = () => {
  if (hasNext.value) alertStore.next();
};

const snackbarUpdate = (isActive) => {
  if (!isActive) next();
};
</script>
