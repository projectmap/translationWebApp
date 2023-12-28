<template>
  <v-tooltip
    v-if="show"
    class="c-tooltip"
    :class="customClasses"
    activator="parent"
    :location="placement"
    content-class="c-tooltip__inner"
  >
    <span v-if="text" v-html="text"></span>
    <slot></slot>
  </v-tooltip>
</template>

<script setup>
defineProps({
  show: Boolean,
  placement: { type: String, default: 'bottom' },
  text: { type: String, default: '' },
  customClasses: { type: String, default: '' },
});
</script>
