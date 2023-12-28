<script setup>
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import Search from './Search';
import FilterComponent from './Filter';
import LayoutButtons from './LayoutButtons';
import { useTranslationStore, useUserStore } from '~/store';
import { fetchAPI } from '~/helpers/apiCore';

const props = defineProps({
  seamless: Boolean,
  type: { type: String, default: '' },
  title: { type: String, default: '' },
  hide: { type: Array, default: () => [] },
  archive: { type: Boolean, default: false },
  layout: { type: String, default: 'compact' },
});

const emits = defineEmits(['update-options', 'update-layout']);

const state = reactive({
  options: {
    divisions: [],
    unions: [],
    unionsConferenceList: [],
    publishers: [],
  },
  currentDivision: null,
  currentUnion: null,
  currentPublisher: null,
  currentUnionConference: null,
  openDomainFilter: false,
});

const userStore = useUserStore();
const translationStore = useTranslationStore();

const { filterSelected, isGc, filterType } = storeToRefs(userStore);
const { filters } = storeToRefs(translationStore);

onBeforeMount(() => {
  if (
    (isEmpty(filters.value?.languages) || isEmpty(filters.value?.types)) &&
    !props.hide.includes('filters') &&
    !props.hide.includes('header')
  ) {
    translationStore.getLanguageOptions();
  }
});

const hasUnionConference = computed(() => {
  return !isEmpty(state.options?.unionsConferenceList);
});

const getDivisions = async () => {
  try {
    const { data } = await fetchAPI('admin/division/');
    const options = data?.map((a) => {
      if (!a.slug) {
        a.slug = a.domain;
      }
      a.name = `${a.domain} - ${a.name}`;
      return a;
    });
    state.options.divisions = options;
  } catch (e) {}
};

const getUnions = async (divisionId) => {
  try {
    state.options.unions = [];
    const { data } = await fetchAPI(
      `/admin/division/${divisionId}/union?limit=100`
    );

    const options = data?.map((a) => {
      if (!a.slug) {
        a.slug = a.domain;
      }
      a.name = `${a.domain} - ${a.name}`;
      return a;
    });
    state.options.unions = options;
  } catch (e) {}
};

const getPublishers = async (orgId, orgType) => {
  let apiUrl = '';
  switch (orgType) {
    case 'division':
      apiUrl = `admin/division/${orgId}/publishing-house/`;
      break;
    case 'union':
      if (state.currentDivision && orgId) {
        apiUrl = `admin/division/${state.currentDivision?.id}/union/${orgId}/publishing-house/`;
      }
      break;
  }

  try {
    state.options.publishers = [];
    const { data } = await fetchAPI(apiUrl);
    const options = data?.map((a) => {
      if (!a.slug) {
        a.slug = a.domain;
      }
      a.name = `${a.domain} - ${a.name}`;
      return a;
    });
    state.options.publishers = options;
  } catch (e) {}
};

const onDomainUpdate = (value, key) => {
  switch (key) {
    case 'division':
      state.currentDivision = value;
      state.currentUnion = null;
      state.currentPublisher = null;
      state.options.unionsConferenceList = [];

      if (value?.id) {
        getUnions(value?.id);
        getPublishers(value?.id, 'division');
        onUpdate('domain', value?.domain);
      } else {
        state.options.unions = [];
        state.options.publishers = [];
        onUpdate('domain', '');
      }
      break;

    case 'union':
      state.currentUnion = value;
      state.currentUnionConference = null;
      state.currentPublisher = null;
      if (!isEmpty(value?.related)) {
        state.options.unionsConferenceList = value?.related;
      } else {
        state.options.unionsConferenceList = [];
      }
      if (value?.id) {
        getPublishers(value?.id, 'union');
        onUpdate('domain', value?.domain);
      } else {
        state.options.publishers = [];
        onUpdate('domain', state.currentDivision?.domain);
      }
      break;

    case 'union-conference':
      state.currentUnionConference = value;
      state.currentPublisher = null;

      if (value?.id) {
        getPublishers(value?.id, 'union');
        onUpdate('domain', value?.domain);
      } else {
        state.options.publishers = [];
        onUpdate('domain', state.currentUnion?.domain);
      }

      break;

    case 'publisher':
      state.currentPublisher = value;
      if (value?.id) {
        onUpdate('domain', value?.domain);
      } else {
        state.currentUnionConference
          ? onUpdate('domain', state.currentUnionConference?.domain)
          : onUpdate('domain', state.currentUnion?.domain);
      }
      break;
  }
};

const showDomainFilter = () => {
  state.openDomainFilter = !state.openDomainFilter;
  if (isEmpty(state.options.divisions)) {
    getDivisions();
  }
};

const onUpdate = (key, value) => {
  emits('update-options', key, value);
};

const updateLayout = (layout) => {
  emits('update-layout', layout);
};

const getArchivedProjects = () => {
  if (props.archive) {
    updateLayout('detail');
    onUpdate('archive', false);
  } else {
    updateLayout('compact');
    onUpdate('archive', true);
  }
};
</script>

<template>
  <header
    v-if="!hide.includes('header')"
    class="o-flex o-flex--small o-flex--between o-flex--middle u-mb-"
    :class="{ 'u-ph': seamless }"
  >
    <!-- title -->
    <h2 v-if="title" class="o-flex__item u-h5 u-bolder u-truncate u-mb0">
      {{ title }}
    </h2>

    <div v-if="$slots.header" class="o-flex__item">
      <slot name="header" />
    </div>

    <!-- search -->
    <search
      v-if="!hide.includes('search')"
      class="o-flex__item u-shrink"
      @submit="onUpdate('search', $event)"
    />

    <!-- filters -->
    <div
      v-if="!hide.includes('filters')"
      class="o-flex__item u-nowrap filters-container"
    >
      <!-- languages -->
      <filter-component
        icon="translate"
        label="Languages"
        :options="filters.languages"
        :current="filterSelected"
        allow-all
        search
        @update:current="onUpdate('language', $event)"
      />

      <!-- types -->
      <filter-component
        icon="bookmark_outline"
        label="Types"
        :options="filters.types"
        :current="filterType"
        allow-all
        @update:current="onUpdate('type', $event)"
      />

      <button
        class="c-btn c-btn--light c-btn- c-btn--baseline u-nowrap c-btn--shadow"
        :class="{ 'is-active': state.openDomainFilter }"
        @click="showDomainFilter"
      >
        <span class="u-icon">label_outline</span>
        <span> Domain </span>
      </button>

      <div v-if="state.openDomainFilter" class="domain-filters">
        <div class="arrow"></div>
        <filter-component
          icon=""
          label="Division"
          :options="state.options.divisions"
          :current="state.currentDivision"
          search
          :shadow="false"
          outline
          clearable
          @update:current="onDomainUpdate($event, 'division')"
        />
        <filter-component
          icon=""
          label="Union"
          :options="state.options.unions"
          :current="state.currentUnion"
          search
          :shadow="false"
          outline
          clearable
          @update:current="onDomainUpdate($event, 'union')"
        />
        <filter-component
          v-if="hasUnionConference"
          icon=""
          label="Union Conference"
          :options="state.options.unionsConferenceList"
          :current="state.currentUnionConference"
          search
          :shadow="false"
          outline
          clearable
          @update:current="onDomainUpdate($event, 'union-conference')"
        />
        <filter-component
          icon=""
          label="Publishing house"
          :options="state.options.publishers"
          :current="state.currentPublisher"
          search
          :shadow="false"
          outline
          clearable
          @update:current="onDomainUpdate($event, 'publisher')"
        />
      </div>
      <button
        v-if="isGc"
        class="c-btn c-btn--light c-btn- c-btn--baseline u-nowrap c-btn--shadow c-btn-archive"
        :class="{ 'is-active': archive }"
        @click="getArchivedProjects"
      >
        <span class="u-icon">archive</span>
        <span> Archived </span>
      </button>
    </div>

    <!-- layout switch -->
    <layout-buttons
      v-if="!hide.includes('filters')"
      class="o-flex__item u-shrink0"
      :layout="layout"
      :seamless="seamless"
      :archive="archive"
      @update:layout="updateLayout"
    />
  </header>
</template>

<style></style>
