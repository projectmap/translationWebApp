<template>
  <div class="c-badge c-badge--soft c-badge--border c-lang">
    <div
      v-if="Array.isArray(countries) && countries.length"
      class="o-flex o-flex--tiny o-flex--middle"
    >
      <div class="c-lang__text">{{ name }}</div>
      <figure
        v-for="country in countries.slice(0, countries.length <= 3 ? 3 : 2)"
        :key="country.alpha2Code"
        class="c-lang__flag"
      >
        <img :src="country.flag" :alt="`flag of ${country.name}`" />
      </figure>
      <div
        v-if="countries.length > 3"
        class="c-lang__flag"
        v-html="'...'"
      ></div>
    </div>
    <div v-else class="c-lang__text">{{ name }}</div>

    <ctooltip :show="countries">
      <h2 class="u-h4-alt u-text-left u-mb0">{{ name }} is spoken in:</h2>
      <div v-if="countries === 'pending'">Loading ... 🏃‍♀</div>
      <div v-else-if="countries === 'error' || !countries">
        Found nothing for this language 🤷
      </div>
      <ul v-else-if="countries" class="o-list-bare c-lang__list u-mb0">
        <li
          v-for="country in countries"
          :key="country.alpha2Code"
          class="o-flex o-flex--middle"
        >
          <figure class="c-lang__flag u-mr--">
            <img :src="country.flag" :alt="`flag of ${country.name}`" />
          </figure>
          <span>
            {{ country.name }}
            <small class="u-bold u-faded u-ml--">
              {{ Math.round(country.population / 1000000) }} M
            </small>
          </span>
        </li>
      </ul>
    </ctooltip>
  </div>
</template>

<script setup>
import get from 'lodash/get';
import Ctooltip from '~/components/utilities/Ctooltip.vue';
import { useTranslationStore } from '~/store';

const props = defineProps({
  language: { type: Object, default: null },
  compact: Boolean,
});

const translationStore = useTranslationStore();

const name = computed(() => {
  return get(props.language, 'name');
});

const code = computed(() => {
  return get(props.language, 'code');
});

const countries = computed(() => {
  if (code.value) return translationStore.getLanguageStat(code.value);
});

// const request = () => {
//   // Make requests with slightly different delay
//   setTimeout(() => {
//     if (code.value) translationStore.requestLanguageStats(code.value);
//   }, Math.floor(Math.random() * 500));
// };

// watch(code.value, () => {
//   request();
// });

// onMounted(() => {
//   request();
// });
</script>

<style lang="scss" scoped>
.c-lang {
  @include font-size(12px, 0.9);
  padding: $unit-0 $unit-1;
  font-weight: 600;
}

.c-lang__text {
  text-transform: uppercase;
}

.c-lang__flag {
  width: $unit-3;
  height: $unit-3;
  font-size: 10px;
  line-height: 7px; // vertical center dots
  overflow: hidden;
  border-radius: $unit;
  margin-bottom: 0;
  background-color: $c-white;
  text-align: center;

  > img {
    display: block;
    height: 100%;
    max-width: unset;
    margin-left: 50%;
    transform: translateX(-50%);
  }
}
</style>
