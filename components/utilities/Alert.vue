<template>
  <div
    v-show="!isClosed"
    role="alert"
    class="c-alert"
    :class="{
      'is-collapsed': isCollapsed,
      'c-alert--green': color === 'green',
      'c-alert--red': color === 'red',
      'c-alert--blue': color === 'blue',
      'c-alert--edgy': edgy,
    }"
    @click="onClick"
  >
    <div class="c-alert__message">
      <slot></slot>
    </div>
    <div class="c-alert__btn">
      <button
        v-if="collapsible"
        class="c-btn c-btn--square c-btn--minimal"
        @click.stop="onCollapse"
      >
        <i v-if="isCollapsed" class="u-icon"> add </i>
        <i v-else class="u-icon"> remove </i>
      </button>
      <button
        v-if="closable"
        class="c-btn c-btn--square c-btn--minimal"
        @click.stop="onClose"
      >
        <i class="u-icon"> close </i>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  color: {
    type: String,
    default: '',
  },
  edgy: Boolean,
  closable: Boolean,
  closed: Boolean,
  collapsible: Boolean,
  collapsed: Boolean,
});

const isClosed = ref(false);
const isCollapsed = ref(false);

const emit = defineEmits(['update:closed', 'update:collapsed']);

onBeforeMount(() => {
  if (props.closed) isClosed.value = true;
  if (props.collapsed) isCollapsed.value = true;
});

watch(
  () => props.closed,
  (state) => {
    isClosed.value = state;
  }
);

watch(
  () => props.collapsed,
  (state) => {
    isCollapsed.value = state;
  }
);

const onClose = () => {
  isClosed.value = true;
  emit('update:closed', true);
};
const onCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('update:collapsed', !props.collapsed);
};
const onClick = () => {
  if (collapsible && isCollapsed.value) onCollapse();
};
</script>
