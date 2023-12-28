<template>
  <div v-if="tooltip">
    <!-- anchor -->
    <progress-bar
      :bars="[
        percent.approved,
        percent.reviewed,
        percent.translated,
        percent.pretranslated,
      ]"
      :slim="slim"
      :wide="wide"
      :edgy="edgy"
    />

    <ctooltip :show="tooltip">
      <stats v-if="stats" :stats="stats"><slot /></stats>
      <span v-else>Statistics are not available</span>
    </ctooltip>
  </div>

  <progress-bar
    v-else
    :bars="[
      percent.approved,
      percent.reviewed,
      percent.translated,
      percent.pretranslated,
    ]"
    :slim="slim"
    :wide="wide"
    :edgy="edgy"
  />
</template>

<script setup>
import floor from 'lodash/floor';
import Ctooltip from './Ctooltip.vue';
import Stats from '@/components/utilities/Stats';
import ProgressBar from '@/components/utilities/ProgressBar';

const props = defineProps({
  stats: { type: Object, default: null },
  tooltip: Boolean,
  slim: Boolean,
  wide: Boolean,
  edgy: Boolean,
});

const percent = computed(() => {
  const total = props.stats?.segments || props?.stats?.editableSegments;
  const pct = (x, y) => (y === 0 ? 0 : floor((x / y) * 100, 1));
  return {
    total,
    pretranslated: pct(props.stats?.pretranslated, total),
    translated: pct(props.stats?.translationDone, total),
    reviewed: pct(props.stats?.reviewDone, total),
    approved: pct(props.stats?.editorDone, total),
  };
});
</script>

<style lang="scss" scoped>
.color-approved {
  color: $c-green-8;
}

.color-reviewed {
  color: $c-green-5;
}

.color-translated {
  color: $c-yellow-7;
}

.color-pre-translated {
  color: $c-yellow-5;
}
</style>
