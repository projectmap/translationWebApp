<template>
  <div v-if="filters || search" class="u-nowrap">
    <span v-if="search" class="u-mr-">
      Results for <strong>"{{ search }}"</strong>
    </span>
    <span v-if="filters" class="u-mr-" v-html="filters"></span>
    <button
      v-if="filters"
      class="c-btn c-btn--ghost c-btn--- u-tiny u-bold"
      @click="emit('remove:filters')"
    >
      <i class="u-icon">clear</i> Remove filters
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  search: { type: String, default: '' },
  language: { type: String, default: '' },
  type: { type: String, default: '' },
  tag: { type: String, default: '' },
  archive: { type: Boolean, default: false },
});

const emit = defineEmits(['remove:filters']);

const filters = computed(() => {
  // prepare filters
  const filters = [];
  if (props.language) filters.push(props.language);
  if (props.type) filters.push(props.type);
  if (props.tag) filters.push(props.tag);
  if (props.archive) filters.push('Archived Projects');

  // filter string
  let str = '';
  if (filters.length) {
    str += 'Filtered by ';
    filters.forEach((name, i) => {
      str += `<strong>${name}</strong>`;
      if (i < filters.length - 2) str += ', ';
      else if (i === filters.length - 2) str += ' and ';
    });
  }
  return str;
});
</script>
