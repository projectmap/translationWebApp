<template>
  <pane>
    <!-- Aside -->
    <template #aside>
      <div class="c-a8s__nav">
        <label
          v-for="(item, i) in filters"
          :key="i"
          class="c-a8s__nav-item"
          :class="{ 'is-active': state.filter === item }"
        >
          <input
            v-model="state.filter"
            type="radio"
            name="filter"
            :value="item"
          />
          <span :class="{ 'u-bold': state.filter === item }">{{
            item.name
          }}</span>
          <small
            class="c-badge"
            :class="{ 'c-badge--dark': state.filter === item }"
            >{{ count[item.type] }}</small
          >
        </label>
      </div>
      <div class="u-truncate u-mt-">
        <nuxt-link to="/dashboard" class="c-link u-small u-muted">
          <i class="u-icon">arrow_back</i> Dashboard
        </nuxt-link>
      </div>
    </template>

    <!-- Main -->
    <template #main>
      <header class="o-flex o-flex--baseline c-pane__header">
        <h1 class="u-mb0 u-mr">Activities</h1>
        <p v-show="state.filter.type !== 'all'" class="u-mb0 u-large u-muted">
          Filtered by "<strong>{{ state.filter.name }}</strong
          >"
        </p>
      </header>
      <ul class="o-list-bare">
        <li v-for="item in filteredItems" :key="item.id" class="u-mb-">
          <activity-label
            v-if="item.type === 'label'"
            :item="item"
            root-class="u-ph"
          />
          <activity
            v-else
            :custom-class="{ 'c-card': item.type !== 'label' }"
            :item="item"
            root-class="u-ph"
          />
        </li>
      </ul>
    </template>
  </pane>
</template>

<script setup>
import get from 'lodash/get';
import { storeToRefs } from 'pinia';

import { useActivitiesStore } from '~/store';
import Pane from '~/components/structure/Pane';
import addDatesToList from '~/helpers/addDatesToList';
import ActivityLabel from '@/components/activities/Label.vue';
useHead({
  title: 'Activities',
});

const route = useRoute();

const filters = [
  { name: 'All', type: 'all' },
  { name: 'Edits', type: 'edit' },
  { name: 'Comments', type: 'comment' },
  { name: 'Reviews', type: 'review' },
  { name: 'Authorizations', type: 'authorization' },
];

const state = reactive({
  filters,
  filter: filters[0],
});

const activitiesStore = useActivitiesStore();
const { get: items } = storeToRefs(activitiesStore);

onBeforeMount(async () => {
  await activitiesStore.request({ limit: 100 });
});

onMounted(() => {
  const query = get(route.query, 'filter');
  if (query) state.filter = filters.find((item) => item.type === query);
});

const filterItems = (type) => {
  return type === 'all'
    ? items.value
    : items.value.filter((item) => item.type === type);
};
const filteredItems = computed(() => {
  return addDatesToList(filterItems(state.filter.type), 'date');
});

const count = computed(() => {
  return {
    all: items.value.length,
    edit: filterItems('edit').length,
    comment: filterItems('comment').length,
    review: filterItems('review').length,
    authorization: filterItems('authorization').length,
  };
});
</script>

<style lang="scss" scoped>
.c-a8s__nav {
  margin-left: -$unit;
  margin-right: -$unit - 2px;
}

.c-a8s__nav-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: $unit-small $unit;
  border-right: 2px solid transparent;
  border-radius: $global-radius 0 0 $global-radius;
  cursor: pointer;

  &:hover {
    border-color: $c-gray-5;
    background-color: $c-gray-1;
  }

  &.is-active {
    border-color: $c-primary-5;
    background-color: $c-gray-2;
  }

  > input {
    display: none;
  }
}
</style>
