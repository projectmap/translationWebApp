<template>
  <div class="c-aside">
    <header class="c-aside__header u-text-center">
      <strong v-if="currentSegment">{{ reference }}</strong>
    </header>
    <div v-if="currentSegment" class="o-flex">
      <button
        :class="{ 'c-aside__active': isActive }"
        style="outline: none"
        class="c-btn c-btn--light c-btn--edgy c-btn--baseline u-nowrap u-1/1"
        @click.prevent="changeTabs(true)"
      >
        Timeline
      </button>
      <button
        :class="{ 'c-aside__active': !isActive }"
        style="outline: none"
        class="c-btn c-btn--light c-btn--edgy c-btn--baseline u-nowrap u-1/1"
        @click.prevent="changeTabs(false)"
      >
        Similar
      </button>
    </div>
    <div v-if="isActive" style="overflow: scroll">
      <scrollable v-if="currentSegment">
        <timeline :current-segment="currentSegment" :chapter="chapter" />
      </scrollable>
      <div v-else-if="chapter" class="u-center u-p">
        <stats :stats="chapter">
          Chapter: <strong>{{ chapter.content }}</strong>
        </stats>
      </div>
      <div v-else class="u-text-center u-p">No Data available</div>
    </div>
    <div v-else style="overflow: scroll; overflow-x: hidden">
      <div v-if="currentSegment">
        <similar :current-segment="currentSegment" :chapter="chapter" />
      </div>

      <div v-else-if="chapter" class="u-center u-p">
        <stats :stats="chapter">
          Chapter: <strong>{{ chapter.content }}</strong>
        </stats>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import Similar from './similar';
import Timeline from './timeline';
import { useTranslationStore } from '~/store';
import Stats from '@/components/utilities/Stats';
import { striptags, truncate } from '~/plugins/filters';
import Scrollable from '@/components/structure/Scrollable';

defineProps({
  translation: { type: Object, default: null },
  chapter: { type: Object, default: null },
});

const isActive = ref(true);

const translationStore = useTranslationStore();

const { currentSegment } = storeToRefs(translationStore);

const reference = computed(() => {
  const refs = currentSegment.value?.reference;
  if (refs) return `{${refs}}`;
  else return truncate(striptags(currentSegment.value?.original));
});

const changeTabs = (bool) => {
  isActive.value = bool;
};
</script>

<style lang="scss" scoped>
/**
 * 1. Helps to give body a distinct height for .u-scrollable to work;
 */
.c-aside {
  display: flex; /* 1 */
  flex-direction: column;
}

.c-aside__header {
  color: $c-gray-7;
  padding: $unit-small 0;
  background-color: $c-gray-1;
  transition: background-color $global-transition;
  border-bottom: 1px solid $c-border;
}

.c-aside__active {
  border-bottom: 2px solid $c-primary-5;
  background: white !important;
}
</style>
