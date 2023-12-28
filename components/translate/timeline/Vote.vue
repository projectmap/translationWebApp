<template>
  <li class="c-vote" :class="rootClasses">
    <div class="c-node">
      <span v-if="score == 0" class="u-icon u-icon++">remove</span>
      <span v-else-if="score < 0" class="u-icon u-icon+++">
        arrow_drop_down
      </span>
      <span v-else-if="isReviewer" class="u-icon">done</span>
      <span v-else-if="isTrustee" class="u-icon">done_all</span>
    </div>
    <user-component
      class="u-truncate"
      :user="item.user"
      :date="item.date"
      points
      passive
    >
      {{ item.action + ' ' }}
    </user-component>
  </li>
</template>

<script setup>
import get from 'lodash/get';

import userComponent from '~/components/utilities/User';

const props = defineProps({
  item: { type: Object, default: null },
});

const isTrustee = computed(() => {
  return get(props.item, 'role') === 'trustee';
});

const isReviewer = computed(() => {
  return get(props.item, 'role') === 'translator';
});

const score = computed(() => {
  return get(props.item, 'assessment', 0);
});

const rootClasses = () => {
  if (score === 0) return '';
  else if (score < 0) return 'is-red';
  else if (isReviewer) return 'is-green';
  else if (isTrustee) return 'is-purple';
  return '';
};
</script>
