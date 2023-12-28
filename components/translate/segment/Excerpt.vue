<template>
  <card
    v-if="segment"
    class="c-excerpt"
    size="small"
    :seamless="seamless"
    @click="emits('click')"
  >
    <div class="c-card__content u-pb0">
      <component
        :is="segment.tag"
        v-if="segment"
        class="u-content u-text-left u-mb0"
        :class="segmentClasses"
        :v-html="excerpt"
      ></component>
    </div>
    <template #footer>
      <airline class="u-ph-" :class="{ 'u-p0': seamless }" :segment="segment">
        <template #right>
          <button
            v-if="button"
            class="c-btn c-btn--light c-btn--square c-btn--"
            @click="$emit('click')"
          >
            <i class="u-icon">{{ isLocked ? 'visibility' : 'mode_edit' }}</i>
          </button>
        </template>
      </airline>
    </template>
  </card>
</template>

<script setup>
import get from 'lodash/get';

import Airline from './Airline';
import Card from '~/components/structure/Card';

const props = defineProps({
  segment: { type: Object, default: null },
  maxLength: { type: Number, default: 120 },
  button: Boolean,
  seamless: Boolean,
});

const emits = defineEmits(['click']);

const isAi = computed(() => {
  return get(props.segment, 'ai.content') && !props.segment.content;
});

const mutedClass = computed(() => {
  if (isAi.value) {
    return 'u-muted';
  }
});

const segmentClasses = computed(() => {
  if (props.segment?.classes) {
    return [...props.segment.classes, mutedClass.value];
  }
  return [mutedClass.value];
});

const isLocked = computed(() => {
  return get(props.segment, 'lockedBy', null) !== null;
});

const excerpt = computed(() => {
  const text =
    get(props.segment, 'content') || get(props.segment, 'ai.content', '');
  if (text.length > props.maxLength) {
    const regex = new RegExp(`^(.{0,${props.maxLength}}[\\s]).*$`);
    return text.replace(regex, '$1...');
  } else {
    return text;
  }
});
</script>

<style lang="scss" scoped>
.c-excerpt {
  @include font-size($font-size-small, 1.3);

  &.c-card:hover {
    cursor: pointer;
  }
}
</style>
