<template>
  <v-popover
    class="c-tooltip-anchor"
    :class="[display ? `v-popover--${display}` : '']"
    :trigger="trigger"
    :placement="placement"
    :delay="delay"
    @show="setEvent('tooltip-show', true)"
    @hide="setEvent('tooltip-hide', false)"
  >
    <!-- This will be the popover target (for the events and position) -->
    <slot></slot>

    <!-- This will be the content of the popover -->
    <template #popover>
      <span v-html="text"></span>
      <slot name="content"></slot>
    </template>
  </v-popover>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' },
  placement: { type: String, default: 'bottom' },
  trigger: { type: String, default: 'hover' },
  delay: { type: Number, default: 100 },
  display: { type: String, default: '' },
});

const emit = defineEmits(['tooltip-show', 'tooltip-hide']);

const setEvent = (name, payload) => {
  emit(name, payload);
};
</script>
