<template>
  <div class="c-label">
    <span class="c-label__text u-alt"> {{ item.text }}</span>
    <span class="c-label__line"></span>
  </div>
</template>

<script setup>
defineProps({
  item: { type: Object, default: () => ({}) },
});
</script>

<style lang="scss" scoped>
.c-label {
  padding: $unit-tiny $unit-small;
  display: flex;
  align-items: center;
}

.c-label__text {
  @include font-size($font-size-small);
  color: $c-gray-6;
}

.c-label__line {
  flex-grow: 2;
  margin-left: $unit-small;
  background-color: $c-gray-5;
  height: 1px;
}
</style>
