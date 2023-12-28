<template>
  <Ctooltip :show="localSegment">
    <slot />
    <transition name="fade" mode="out-in">
      <div
        v-if="!localSegment"
        key="spinner"
        class="u-pv+"
        style="width: 360px"
      >
        <div class="c-spinner c-spinner--small"></div>
      </div>
      <segment-excerpt
        v-else
        key="segment"
        :segment="localSegment"
        :max-length="320"
        seamless
      />
    </transition>
  </Ctooltip>
</template>

<script setup>
import Ctooltip from '~/components/utilities/Ctooltip.vue';
import SegmentExcerpt from '~/components/translate/segment/Excerpt';

const props = defineProps({
  segment: { type: Object, default: null },
  bookId: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  display: { type: String, default: 'inline' },
  delay: { type: [Number, Object], default: () => ({ show: 300, hide: 100 }) },
});

const localSegment = ref(null);

onBeforeMount(() => {
  localSegment.value = props.segment;
});
</script>

<style lang="scss">
.c-tooltip__inner {
  max-width: $unit * 20 !important;
}
</style>
