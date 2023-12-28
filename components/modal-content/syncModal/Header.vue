<script setup>
import get from 'lodash/get';

import Book from '~/components/project-list/project/Book.vue';
import Language from '~/components/project-list/project/Language.vue';

const props = defineProps({
  offlineBook: { type: Object, default: () => {} },
});

const runtimeConfig = useRuntimeConfig();
const { egwApi } = runtimeConfig.public;

const egwBookNumber = computed(() => {
  return parseInt(get(props.offlineBook, 'original.key'));
});
</script>

<template>
  <div class="o-flex o-flex--middle">
    <div class="o-flex book-cover">
      <book :number="egwBookNumber" :egw-api="egwApi" />
    </div>
    <div class="o-flex o-flex--column book-info">
      <language
        v-if="offlineBook.language"
        class="u-shrink0 u-relative u-z10 u-mr language"
        :language="offlineBook.languageObj"
      />
      <h2 class="u-truncate">
        {{ offlineBook.title }}
      </h2>
    </div>
  </div>
</template>

<style></style>
