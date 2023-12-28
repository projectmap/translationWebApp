<template>
  <nav class="o-flex o-flex--center">
    <button
      class="c-btn c-btn--light c-btn--shadow c-btn--square c-btn- u-mr--"
      :disabled="!previous"
      title="Previous Page"
      @click="previousPage"
    >
      <i class="u-icon">keyboard_arrow_left</i>
    </button>
    <div class="c-btn-group c-btn--shadow u-mr--">
      <button
        v-for="(n, i) in pagination"
        :key="i"
        class="c-btn c-btn--light c-btn--square c-btn- u-truncate"
        :class="{ 'is-active': n === currentPage }"
        :disabled="n === '...'"
        :title="`Page ${n}`"
        @click="page(n)"
      >
        {{ n }}
      </button>
    </div>
    <button
      class="c-btn c-btn--light c-btn--shadow c-btn--square c-btn-"
      :disabled="!next"
      title="Next Page"
      @click="nextPage"
    >
      <i class="u-icon">keyboard_arrow_right</i>
    </button>
  </nav>
</template>

<script setup>
import max from 'lodash/max';
import min from 'lodash/min';
import range from 'lodash/range';

import getParams from '~/helpers/getHttpParams';

const props = defineProps({
  count: { type: Number, default: 10 },
  next: { type: String, default: '' },
  previous: { type: String, default: '' },
});

const emits = defineEmits(['update:page']);

const limit = computed(() => {
  return props.next
    ? parseInt(getParams(props.next, 'limit'))
    : parseInt(getParams(props.previous, 'limit'));
});

const offset = computed(() => {
  return props.next
    ? parseInt(getParams(props.next, 'offset')) - limit.value
    : isNaN(parseInt(getParams(props.previous, 'offset')))
    ? limit.value
    : parseInt(getParams(props.previous, 'offset')) + limit.value;
});

const pages = computed(() => {
  if (props.count && limit.value) return Math.ceil(props.count / limit.value);
  else return 1;
});

const currentPage = computed(() => {
  if (offset.value && limit.value)
    return Math.ceil(offset.value / limit.value) + 1;
  else return 1;
});

const pagination = computed(() => {
  const arr = [1];
  if (currentPage.value > 5) arr.push('...');

  if (pages.value > 2)
    arr.push(
      ...range(
        max([2, currentPage.value - 3]),
        min([pages.value, currentPage.value + 4])
      )
    );

  if (currentPage.value < pages.value - 4) arr.push('...');
  if (pages.value > 1) arr.push(pages.value);
  return arr;
});

const page = (n) => {
  if (n === currentPage.value) return;
  emits('update:page', {
    limit: limit.value,
    offset: limit.value * (n - 1),
  });
};

const nextPage = () => {
  page(currentPage.value + 1);
};

const previousPage = () => {
  page(currentPage.value - 1);
};
</script>
