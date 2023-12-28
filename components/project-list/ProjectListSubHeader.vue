<script setup>
import { storeToRefs } from 'pinia';

import Sorting from './Sorting';
import FiltersInWords from './FiltersInWords';
import { useTranslationStore } from '~/store';

const props = defineProps({
  hide: { type: Array, default: () => [] },
  archive: { type: Boolean, default: false },
  search: { type: String, default: '' },
  ordering: { type: String, default: '' },
  params: { type: Object, default: () => {} },
});

const emits = defineEmits(['update-options', 'remove-filters']);

const translationStore = useTranslationStore();
const { filters } = storeToRefs(translationStore);

const currentLanguage = computed(() => {
  return filters.value?.languages?.find(
    (item) => item.code === props.params.language
  );
});

const currentType = computed(() => {
  return filters.value?.types?.find((item) => item.slug === props.params?.type);
});

const currentTag = computed(() => {
  return filters.value?.tags?.find((item) => item.slug === props.params?.tag);
});

const currentOrdering = computed(() => {
  return props.ordering?.find((item) => item.param === props.params?.ordering);
});

const inTranslation = computed(() => {
  return !props.params?.is_authorized;
});

const onUpdate = (key, value) => {
  emits('update-options', key, value);
};

const removeFilters = () => {
  emits('remove-filters');
};
</script>

<template>
  <div
    v-if="!hide.includes('subheader')"
    class="o-flex o-flex--small o-flex--middle u-small u-mb-"
    :class="{ 'u-ph': seamless }"
  >
    <!-- in translation -->
    <div>
      <button
        class="o-flex__item c-btn c-btn--minimal c-btn--"
        :class="{ 'u-bold': inTranslation }"
        @click="onUpdate('is_authorized', false)"
      >
        <i class="u-icon">edit</i> In Translation
      </button>
      <button
        class="o-flex__item c-btn c-btn--minimal c-btn--"
        :class="{ 'u-bold': !inTranslation }"
        @click="onUpdate('is_authorized', true)"
      >
        <i class="u-icon">done</i> Done
      </button>
    </div>

    <!-- filters in words -->
    <filters-in-words
      v-if="!hide.includes('filters')"
      class="o-flex__item u-muted"
      :search="search"
      :language="currentLanguage ? currentLanguage.name : ''"
      :type="currentType ? currentType.name : ''"
      :tag="currentTag ? currentTag.name : ''"
      :archive="archive"
      @remove:filters="removeFilters"
    />

    <div class="o-flex__spacer"></div>

    <!-- sorting -->
    <sorting
      v-if="!hide.includes('sorting')"
      class="o-flex__item"
      :options="ordering"
      :current="currentOrdering"
      @update:current="onUpdate('ordering', $event.param)"
    />
  </div>
</template>

<style></style>
