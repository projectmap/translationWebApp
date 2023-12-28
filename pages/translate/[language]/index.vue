<template>
  <NuxtPage v-if="abbreviation" />
  <div v-else class="o-wrapper o-wrapper--slim u-text-center u-pv u-pb++">
    <breadcrumbs class="u-mb++" :language="language" />
    <p class="u-huge u-mb+">What publication would you like to translate?</p>
    <project-list
      v-if="language"
      class="u-mb+"
      :title="`Choose a publication in ${language.name}`"
      :hide="['filters']"
      :default-params="{ language: language.code }"
    />
    <alert v-else color="red" class="u-mb+">
      <div class="o-flex o-flex--unit o-flex--center o-flex--middle">
        <img src="/img/illustration-bug.svg" style="max-width: 100px" />
        <div>
          Sorry, the laguage code <strong>'{{ languageCode }}'</strong> doesn't
          exist in our system.
        </div>
      </div>
    </alert>
    <nuxt-link class="c-btn c-btn--minimal" @click="$router.back()">
      <span class="u-icon">arrow_back</span>Back
    </nuxt-link>
  </div>
</template>

<script setup>
import { fetchAPI } from '@/helpers/apiCore';
import Alert from '@/components/utilities/Alert';
import ProjectList from '@/components/project-list';
import Breadcrumbs from '@/components/translate/Breadcrumbs';

const { data } = await useAsyncData(async ({ _route: route }) => {
  const code = route.params?.language;
  const { data: languages } = await fetchAPI('/languages/');

  const language = languages?.find((item) => item.code === code);
  return {
    language,
    abbreviationT: route.params?.abbreviation,
    languageCode: code,
  };
});

let { abbreviation } = data?.value;
const { languageCode, language } = data?.value;

onBeforeRouteUpdate((to, _from, next) => {
  abbreviation = to.params.abbreviation;
  next();
});
</script>
