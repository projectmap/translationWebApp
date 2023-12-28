<template>
  <translate
    v-if="translation"
    :translation="translation"
    :chapter-num="state.chapter"
    :focus-paragraph="state.paragraph"
  />
  <div v-else class="o-wrapper o-wrapper--slim u-text-center u-pv+++">
    <alert color="red" class="u-mb+">
      <div class="o-flex o-flex--unit o-flex--center o-flex--middle">
        <img src="/img/illustration-bug.svg" style="max-width: 100px" />
        <div>
          Sorry, we couldn't find the abbreviation
          <strong>'{{ state.abbreviation }}'</strong> in our system.
        </div>
      </div>
    </alert>
    <nuxt-link class="c-btn c-btn--minimal" @click="$router.back()">
      <span class="u-icon">arrow_back</span> Back
    </nuxt-link>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import { useTranslationStore } from '~/store';
import Translate from '@/components/translate';
import Alert from '@/components/utilities/Alert';

definePageMeta({
  layout: 'fullwidth',
  offline: true,
});

const translationStore = useTranslationStore();

const { translation: selectedTranslation } = storeToRefs(translationStore);
const state = reactive({
  language: null,
  abbreviation: null,
  chapter: null,
  paragraph: null,
});

const resetState = () => {
  state.language = null;
  state.abbreviation = null;
  state.chapter = null;
  state.paragraph = null;
  translationStore.resetStore();
};

const { data: translation } = await useAsyncData(async (nuxtApp) => {
  state.language = nuxtApp.$router.currentRoute.value.params?.language;
  state.abbreviation = nuxtApp.$router.currentRoute.value.params?.abbreviation;
  state.chapter = parseInt(nuxtApp.$router.currentRoute.value.params?.chapter);
  state.paragraph = nuxtApp.$router.currentRoute.value.query?.paragraph
    ? parseInt(nuxtApp.$router.currentRoute.value.query?.paragraph)
    : 0;

  if (selectedTranslation.value?.id) {
    return selectedTranslation?.value;
  } else {
    try {
      const data = await translationStore.fetchTranslation(
        nuxtApp.$router.currentRoute.value.params.language,
        nuxtApp.$router.currentRoute.value.params.abbreviation
      );

      if (!isEmpty(data)) {
        return data;
      }

      return null;
    } catch (e) {}
  }
});

onUnmounted(() => {
  resetState();
});
</script>
