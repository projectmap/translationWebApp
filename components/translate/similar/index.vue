<template>
  <ul class="c-timeline">
    <li v-if="isPending" class="c-timeline__item">
      <div class="c-node">
        <span class="c-spinner c-spinner--tiny"></span>
      </div>
      <strong class="u-muted">Loading ...</strong>
    </li>

    <li v-else-if="isEmpty(items)" class="c-timeline__item">
      <div class="c-node">
        <span class="u-icon">edit</span>
      </div>
      <strong class="u-muted">No similar translations found.</strong>
    </li>
    <div v-for="item in items" :key="item.original">
      <label-component :item="item"></label-component>
      <div class="c-timeline__item">
        <record-component
          :chapter-position="currentSegment.chapterPosition"
          :item="item"
        ></record-component>
      </div>
    </div>
  </ul>
  <!-- <div style="padding-left: 5px">No similar translations found</div> -->
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import LabelComponent from './Label';
import RecordComponent from './Record';
import { cleanerUrl } from '@/helpers/Util';
import { fetchAPI } from '~/helpers/apiCore';

const props = defineProps({
  chapter: { type: Object, default: null },
  currentSegment: { type: Object, default: null },
});

/* eslint-disable */ // TODO: fix lint
let isPending = ref(false);
let isError = ref(false);
let items = ref([]);

const url = computed(() => {
  if (props.chapter?.url) {
    const position = props.currentSegment?.position;
    return `${cleanerUrl(props.chapter?.url)}${position}/`;
  }
  return null;
});

watch(
  () => props.chapter,
  async () => {
    items.value = [];
    items.value = await requestItems(url.value);
  },
  {
    deep: true,
  }
);

watch(
  () => props.currentSegment,
  async () => {
    items.value = [];
    items.value = await requestItems(url.value);
  }
);

onMounted(async () => {
  items.value = await requestItems(url.value);
});

const requestItems = async (url) => {
  if (url) {
    isPending.value = true;
    isError.value = null;
    let items = [];
    try {
      const { data } = await fetchAPI(`${url}similars/`);
      items = data;
    } catch (error) {
      isError.value = error;
    }
    isPending.value = false;
    return items;
  }
};
</script>
