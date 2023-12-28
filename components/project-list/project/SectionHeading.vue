<template>
  <div class="c-section">
    <span class="u-truncate">{{ item.content }}</span>
  </div>
</template>

<script setup>
defineProps({
  item: { required: true },
});
</script>

<style lang="scss" scoped>
.c-section {
  @include font-size($font-size-large, 1);
  margin-top: $unit;
  margin-bottom: $unit-small;
  padding-left: $unit;
  padding-top: $unit;
  padding-right: $unit;
  border-top: $c-border solid 1px;
  color: $c-muted;
  text-transform: uppercase;
}
</style>
