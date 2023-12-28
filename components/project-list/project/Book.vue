<template>
  <div class="c-book" :class="[`c-book--${size}`, { 'c-book--dummy': dummy }]">
    <div
      class="c-book__cover"
      :style="{
        backgroundImage: number
          ? `url(${egwApi}/covers/${number}?type=${
              props.size === 'large' ? 'medium' : 'small'
            })`
          : '',
      }"
    >
      <ctooltip :show="!dummy && tooltip">
        <img
          class="u-rounded"
          style="width: 205px"
          :src="`${egwApi}/covers/${number}?type=large`"
        />
      </ctooltip>
    </div>
  </div>
</template>

<script setup>
import Ctooltip from '~/components/utilities/Ctooltip.vue';
const props = defineProps({
  abbreviation: { type: String, default: '' },
  number: { type: Number, default: null },
  size: { type: String, default: '' },
  dummy: Boolean,
  egwApi: {
    type: String,
    default: '',
  },
  tooltip: { type: Boolean, default: true },
});
</script>

<style lang="scss" scoped>
// https://a.egwwritings.org/covers/127_l.jpg (409x600)
// https://a.egwwritings.org/covers/127_m.jpg (239x351)
// https://a.egwwritings.org/covers/127_s.jpg (112x164)

.c-tooltip {
  background-color: transparent;
}
.c-book {
  --border: 2px;
  --width: #{$unit-7};

  position: relative;
  box-shadow: $global-shadow-2;
  background-color: lightgray;
  padding-right: var(--border);
  border: var(--border) solid #4f4f4f;
  border-radius: var(--border) calc(var(--border) * 2) calc(var(--border) * 2)
    var(--border);

  &::after {
    content: '';
    display: block;
    position: absolute;
    z-index: 2;
    width: calc(var(--border) * 2);
    top: calc(-1 * var(--border));
    left: 0;
    bottom: calc(-1 * var(--border));
    border-radius: 2px 0 0 2px;
    background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.25) 20%,
      rgba(255, 255, 255, 0.3) 45%,
      rgba(0, 0, 0, 0.3) 49%,
      rgba(0, 0, 0, 0.25) 84%,
      rgba(0, 0, 0, 0) 100%
    );
  }
}

.c-book__cover {
  position: relative;
  width: var(--width);
  height: calc(var(--width) * (600 / 409));
  z-index: 1;
  margin-left: calc(-1 * var(--border));
  margin-top: calc(-1 * var(--border));
  margin-bottom: calc(-1 * var(--border));
  border-radius: var(--border) calc(var(--border) * 2) calc(var(--border) * 2)
    var(--border);
  background-color: #1e1e1e;
  background-image: linear-gradient(45deg, #1e1e1e 0%, #4f4f4f 100%);
  background-size: cover;
  box-shadow: 0 0 12px rgba($c-black, 0.6) inset;
}

/* Sizes */
.c-book--huge {
  --border: 4px;
  --width: #{$unit-9};
}

.c-book--large {
  --border: 3px;
  --width: #{$unit-8};
}

.c-book--small {
  --border: 1px;
  --width: #{$unit-6};
}

.c-book--tiny {
  --border: 1px;
  --width: #{$unit-5};
}

/* Dummy */
.c-book--dummy {
  opacity: 0.4;
}
</style>
