<template>
  <v-list-item
    :class="[typeClass, activeClass]"
    class="c-dropdown__item u-truncate"
    :to="to"
    @click="onClick"
  >
    <slot></slot>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: 'div' },
  url: { type: String, default: '' },
  active: Boolean,
  noPrefetch: Boolean,
});

const emit = defineEmits(['click']);

const activeClass = computed(() => {
  if (props.active) {
    return 'is-active';
  }
  return '';
});

// NOTE: MIGHT NEED THIS CODE FOR LATER USE
// const tag = computed(() => {
//   switch (props.type) {
//     case 'divider':
//     case null:
//     case undefined:
//       return 'div';
//     default:
//       return props.type;
//   }
// });

const typeClass = computed(() => {
  switch (props.type) {
    case 'a':
    case 'nuxt-link':
      return 'c-dropdown__link';
    case 'button':
      return 'c-dropdown__button';
    case 'divider':
      return 'c-dropdown__divider';
    case 'text-divider':
      return 'c-dropdown__text-divider';

    default:
      return 'c-dropdown__item';
  }
});

const to = computed(() => {
  return props.url && props.url;
});

const onClick = (event) => {
  emit('click', event);
};
</script>

<style lang="scss">
.c-dropdown__item {
  display: flex !important;
  word-wrap: break-word;
  .v-list-item__content {
    display: flex;
    width: 100%;
  }
}

.c-dropdown__divider {
  padding: 0px !important;
}
</style>
