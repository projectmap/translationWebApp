<template>
  <table class="stats c-table c-table--small c-table--border u-mb0 u-text-left">
    <!-- :class="[data.class, data.staticClass]" -->
    <caption v-if="$slots.default" class="u-tiny">
      <slot />
    </caption>
    <tbody>
      <tr class="color-pretranslated">
        <th>Draft-Translated:</th>
        <td>
          {{ stats.pretranslated ? stats.pretranslated : 0 }}
          <span class="u-faded"> / {{ segmentCount }}</span>
        </td>
        <td>{{ percentage(props.stats, 'pretranslated') }}%</td>
      </tr>
      <tr class="color-translated">
        <th>Translated:</th>
        <td>
          {{ props.stats.translationDone }}
          <span class="u-faded">/ {{ segmentCount }}</span>
        </td>
        <td>{{ percentage(stats, 'translationDone') }}%</td>
      </tr>
      <tr class="color-reviewed">
        <th>Reviewed:</th>
        <td>
          {{ stats.reviewDone }}
          <span class="u-faded">/ {{ segmentCount }}</span>
        </td>
        <td>{{ percentage(stats, 'reviewDone') }}%</td>
      </tr>
      <tr class="color-approved">
        <th>Edited:</th>
        <td>
          {{ stats.editorDone }}
          <span class="u-faded">/ {{ segmentCount }}</span>
        </td>
        <td>{{ percentage(stats, 'editorDone') }}%</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import floor from 'lodash/floor';

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      segments: 0,
      pretranslated: 0,
      translationDone: 0,
      reviewDone: 0,
      editorDone: 0,
    }),
    required: true,
    /* eslint-disable */ // TODO: fix lint
    validator: (obj) =>
      obj.hasOwnProperty('segments') &&
      obj.hasOwnProperty('pretranslated') &&
      obj.hasOwnProperty('translationDone') &&
      obj.hasOwnProperty('reviewDone') &&
      obj.hasOwnProperty('editorDone'),
  },
});

const segmentCount = computed(() => {
  return props.stats?.segments || props.stats?.editableSegments;
});

const percentage = (stats, prop) => {
  const x = stats?.[prop];
  const y = segmentCount.value;
  if (x && y) {
    return y === 0 ? 0 : floor((x / y) * 100, 1);
  }
  return 0;
};
</script>

<style lang="scss" scoped>
.stats {
  th,
  td {
    white-space: nowrap;
  }
}

.color-approved {
  color: $c-green-4a;
}

.color-reviewed {
  color: $c-pink-1;
}

.color-translated {
  color: $c-yellow-5a;
}

.color-pretranslated {
  color: $c-yellow-4a;
}
</style>
