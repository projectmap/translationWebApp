<template>
  <div
    ref="dropdown"
    class="c-scrollable dropdown"
    @scroll="handleDropdownScroll"
  >
    <slot />
  </div>
</template>

<script setup>
import { scrollTo } from '~/helpers/Util';

const props = defineProps({
  scrollToTop: Boolean,
  scrollToBottom: Boolean,
  searchLimit: { type: Number },
  optionsCount: { type: Number },
  optionLength: { type: Number },
});

const emits = defineEmits([
  'update:scrollToTop',
  'update:scrollToBottom',
  'update-search-limit',
]);

const dropdown = ref(null);
const handleDropdownScroll = () => {
  const dropdownElement = dropdown.value;
  const scrollY = dropdownElement.scrollTop;

  if (
    dropdownElement.clientHeight + scrollY >= dropdownElement.scrollHeight &&
    props.optionsCount !== props.optionLength &&
    props.searchLimit &&
    props.searchLimit <= props.optionsCount
  ) {
    emits('update-search-limit', props.searchLimit + 20);
  }
};

// Listen to prop changes
watch(
  () => props.scrollToTop,
  (state) => {
    if (!state) return;
    scrollTo(this, this.$el, 'top');
    emits('update:scrollToTop', false);
  }
);
watch(
  () => props.scrollToBottom,
  (state) => {
    if (!state) return;
    scrollTo(this, this.$el, 'bottom');
    emits('update:scrollToBottom', false);
  }
);
</script>

<style lang="scss" scoped>
/*
 * 1. This is the only solution I found to make "overflow: scroll" consistently
 *    work with height limitation on the container
 */
.c-scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
  // display: flex;
  // flex-direction: column-reverse;

  &::-webkit-scrollbar {
    height: $unit-tiny;
    width: $unit-tiny;
    background-color: $c-gray-2;
  }

  &::-webkit-scrollbar-thumb {
    background-color: $c-gray-4;
    border-radius: $global-radius;
  }
}
</style>
