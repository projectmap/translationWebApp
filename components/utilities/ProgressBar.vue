<template>
  <div
    class="progress"
    :class="[
      {
        'progress--slim': slim,
        'progress--wide': wide,
        'progress--edgy': edgy,
      },
      // data.class,
      // data.staticClass,
    ]"
  >
    <div
      v-for="(width, i) in bars"
      :key="i"
      :style="{ width: width + '%' }"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  bars: { type: Array, default: () => [] },
  slim: Boolean,
  wide: Boolean,
  edgy: Boolean,
});
</script>

<style lang="scss" scoped>
.progress {
  display: flex;
  position: relative;
  min-width: $unit-large;
  height: 4px;
  background-color: $c-gray-2;
  border-radius: 2px;
  vertical-align: middle;
  overflow: hidden;

  > div {
    position: absolute;
    left: 0;
    height: 4px;
  }

  &--slim,
  &--slim > div {
    height: 2px;
  }

  &--wide,
  &--wide > div {
    height: 8px;
  }

  &--edgy {
    border-radius: 0;
  }

  // 1st bar
  > div:nth-child(1) {
    background-color: $c-green-4a;
    z-index: 5;
  }

  // 2nd bar
  > div:nth-child(2) {
    background-color: $c-pink-1;
    z-index: 4;
  }

  // 3rd bar
  > div:nth-child(3) {
    background-color: $c-yellow-5a;
    z-index: 3;
  }

  // 4th bar
  > div:nth-child(4) {
    background-color: $c-yellow-4a;
    z-index: 2;
  }
}
</style>
