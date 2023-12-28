<template>
  <button class="u-no-btn" @click="$emit('update:state', !state)">
    <span v-if="labels[0]" :class="{ 'u-faded': state }">{{ labels[0] }}</span>
    <span class="c-toggle">
      <input :checked="state" type="checkbox" />
      <span class="c-toggle__dot"></span>
    </span>
    <span :class="{ 'u-faded': !state }">
      <slot />
      {{ labels[1] }}
    </span>
  </button>
</template>

<script setup>
defineProps({
  state: Boolean,
  labels: { type: Array, default: () => [] }, // e.g. ["Left", "Right"]
});
</script>

<style lang="scss" scoped>
$switch-width: 3em;
$switch-height: 1em;

.c-toggle {
  display: inline-block;
  width: $switch-width;
  margin: 0 $switch-height/3;
  height: $switch-height;
  vertical-align: -$switch-height * 0.1; // Chrome rendering issues
}

.c-toggle > input[type='checkbox'] {
  display: none;
}

.c-toggle__dot {
  display: block;
  cursor: pointer;
  position: relative;
  background-color: $c-green-5;
}

/**
   * 1. chrome clipping with opacity workaround
   */
.c-toggle__dot::before {
  content: '';
  position: absolute;
  height: $switch-height;
  width: ($switch-width - $switch-height) * 1.05; /* 1 */
  left: $switch-height/2;
  top: 0;
  background-color: rgba($c-black, 0.5);
  box-shadow: 0 1px 2px 1px rgba($c-black, 0.3) inset;
  border-radius: $switch-height/2;
  opacity: 0.5;
  transition: background-color 0.4s ease-in-out;
}

.c-toggle__dot::after {
  content: '';
  position: absolute;
  width: $switch-height * 1.5;
  height: $switch-height * 1.5;
  left: 0;
  top: -$switch-height * 0.25;
  background-color: $c-white;
  box-shadow: $global-shadow-1;
  border-radius: $switch-height;
  transition: all $global-transition ease-in-out;
}

.c-toggle > input[type='checkbox']:checked + .c-toggle__dot::before {
  background-color: inherit;
}

.c-toggle > input[type='checkbox']:checked + .c-toggle__dot::after {
  background: inherit;
  transform: translateX($switch-width - $switch-height * 1.5);
}
</style>
