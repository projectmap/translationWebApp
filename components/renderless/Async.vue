<template>
  <div>
    <slot
      :pending="pending"
      :error="error"
      :data="data"
      :pagination="pagination"
    />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import { fetchAPI } from '~/helpers/apiCore';
import { useAuthStore, useUserStore } from '~/store';

import { OFFLINE_BOOK } from '~/service-worker/constants';
import { getLocalTranslationData } from '~/service-worker/db';

const props = defineProps({
  url: { type: String, default: '', required: true },
  params: { type: Object, default: () => ({}) },
  manualRefresh: Boolean,
});

const authStore = useAuthStore();
const { isOnline } = storeToRefs(authStore);

const userStore = useUserStore();
const { userDownloadInfo } = storeToRefs(userStore);

const pending = ref(true);
const error = ref(false);
const data = ref(null);
const pagination = ref(null);

const requestData = async () => {
  data.value = null;
  pending.value = true;
  pagination.value = null;

  try {
    for (const item in props.params) {
      if (props.params[item] === null) {
        // eslint-disable-next-line
        delete props.params[item];
      }
    }
    if (isOnline.value) {
      const result = await fetchAPI(props.url, {
        params: props.params,
      });

      if (result?.statusCode === 200) {
        data.value = result?.data;
        pagination.value = {
          count: result?.count,
          next: result?.next,
          previous: result?.previous,
        };
      }
    } else {
      const work = userDownloadInfo.value.workId;

      if (work) {
        const offlineTranslation = await getLocalTranslationData(
          `${work}_${OFFLINE_BOOK}`
        );
        if (!isEmpty(offlineTranslation)) {
          data.value = [offlineTranslation];
        }
      }
    }

    error.value = false;
  } catch (e) {
    data.value = null;
    pagination.value = null;
    error.value = e;
  }
  pending.value = false;
};

watch(() => isOnline.value, requestData, { immediate: true });

watch(() => [props.params, props.manualRefresh], requestData, {
  deep: true,
});

watch(
  () => userDownloadInfo.value.workId,
  (value) => {
    if (value > 0) {
      requestData();
    }
  },
  {
    deep: true,
  }
);
</script>
