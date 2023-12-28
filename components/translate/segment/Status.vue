<template>
  <div class="c-status">
    <cite v-if="position === 'header-left' && ref" class="c-status__ref">
      {{ ref }}
    </cite>
    <template v-if="statistics && position === 'header-right'">
      <tooltip
        :text="singularPlural(statistics.comments, 'comment', 'comments')"
      >
        <badge border soft :class="{ 'u-muted': !statistics.comments }">
          <span class="u-icon">comment</span> {{ statistics.comments }}
        </badge>
      </tooltip>
      <tooltip :text="singularPlural(statistics.records, 'edit', 'edits')">
        <badge border soft :class="{ 'u-muted': !statistics.records }">
          <span class="u-icon">edit</span> {{ statistics.records }}
        </badge>
      </tooltip>
    </template>
  </div>
</template>

<script setup>
import Badge from '~/components/structure/Badge';
import Tooltip from '~/components/utilities/Tooltip';
import { singularPlural } from '~/helpers/Util';

const props = defineProps({
  statistics: { type: Object, default: () => ({}) },
  reference: { type: String, default: '' },
  position: { type: String, default: '' },
});

const ref = computed(() => {
  return props.reference ? '{' + props.reference + '}' : '';
});
</script>

<style lang="scss" scoped>
.c-status {
  @include font-size($font-size-tiny);

  > * {
    margin-right: $unit-tiny;
  }

  .c-badge {
    border-radius: 4px;
    border: 1px solid #787878;
    display: inline-flex;
    padding: 2px 8px;
    align-items: center;
    gap: 4px;
  }
}

.c-status__ref {
  @include font-size($font-size);

  font-style: normal; // undo italic of <cite>
  line-height: 1;
  color: #0e6a8f;
  font-weight: 600;
}
</style>
