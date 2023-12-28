<template>
  <div :class="customClass">
    <div
      class="o-flex o-flex--middle c-activity"
      :class="[rootClass, `c-activity--${icon.color}`, 'c-activity--hover']"
      @click.prevent="goToTranslation(item)"
    >
      <div class="o-flex__item c-activity__icon">
        <div :class="[`u-${icon.color}`]">
          <i class="u-icon">{{ icon.id }}</i>
        </div>
      </div>
      <div class="o-flex__item c-activity__body">
        <div class="u-truncate">{{ excerpt }}</div>
        <div class="c-activity__meta u-truncate">
          <span :class="[`u-${icon.color}`]">{{ item.type }}</span>
          <span v-if="item.reference">{{ item.reference }}</span>
          <time v-if="item.date" :datetime="item.date">
            {{ formattedDate }}
          </time>
        </div>
      </div>
    </div>
  </div>
  <segment-popover
    :segment="segment"
    :delay="{ show: 800, hide: 100 }"
    display="block"
  >
    <span>{{ excerpt }}</span>
  </segment-popover>
</template>

<script setup>
import formatDistance from 'date-fns/formatDistance';
import get from 'lodash/get';

import parseDate from '~/helpers/parseDate';
import { striptags } from '~/plugins/filters';
import SegmentPopover from '~/components/translate/segment/Popover';

const props = defineProps({
  item: { type: Object, default: () => ({}) },
  rootClass: { type: String, default: '' },
  customClass: { type: String, default: '' },
});

const router = useRouter();

const type = computed(() => {
  return get(props.item, 'type', null);
});

const icon = computed(() => {
  switch (type.value) {
    case 'edit':
      return { id: 'edit', color: 'blue' };
    case 'comment':
      return { id: 'comment', color: 'yellow' };
    case 'review':
      return { id: 'done', color: 'green' };
    case 'authorization':
      return { id: 'done_all', color: 'purple' };
    default:
      return { id: 'priority_high', color: 'dark' };
  }
});

const segment = computed(() => {
  return type.value === 'edit' ? props.item : get(props.item, 'segment', null);
});

const excerpt = computed(() => {
  let excerpt;
  if (type.value === 'comment') excerpt = props.item.content;
  if (!excerpt && segment.value)
    excerpt = segment.value.content || segment.value.original;

  return striptags(excerpt);
});

const formattedDate = computed(() => {
  const date = parseDate(get(props.item, 'date'));
  return formatDistance(date, Date.now()) + ' ago';
});

const url = computed(() => {
  return `/translate/${segment.value?.lang}/${segment.value?.abbreviation}/chapter/${segment.value?.chapter}/?paragraph=${segment.value?.chapterPosition}`;
});

const goToTranslation = (item) => {
  if (item?.position) {
    router.push(url.value);
  }
};
</script>

<style lang="scss" scoped>
.c-activity {
  color: currentColor;
  padding: $unit-tiny $unit-small;
  border-radius: $global-radius;

  &--hover:hover,
  &--hover:active,
  &--hover:focus {
    background-color: $c-gray-2;
    border-width: 0 !important;
  }

  cursor: pointer;
}

.c-activity__icon {
  margin-right: $unit-4;
  flex-shrink: 0;
}

.c-activity__body {
  flex-grow: 2;
  overflow: hidden;
}

/**
 * 1. Offset the smaller line-height of the meta line so it doesn't look
 *    like unequal padding on the parrent
 * 2. approximately the width of a whitespace
 */
.c-activity__meta {
  @include font-size($font-size-tiny);
  color: $c-muted;
  margin-bottom: 0.1em; /* 1 */

  > *:not(:first-child)::before {
    content: '\00B7';
    margin-right: 0.18em; /* 2 */
  }
}
</style>
