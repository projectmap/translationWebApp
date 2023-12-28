<template>
  <keep-alive>
    <transition
      name="fade"
      @after-enter="() => (visible = true)"
      @before-leave="() => (visible = false)"
    >
      <div
        v-if="open"
        class="c-modal-context"
        :class="[`c-modal-context--${context}`]"
        tabindex="0"
      >
        <div class="c-modal-container" :class="{ 'u-1/1': full }">
          <div ref="modal" class="c-modal" :class="customClasses">
            <div class="c-modal__header" :class="{ 'u-p0': !title }">
              <h1 class="c-modal__title">
                {{ title }}
              </h1>
              <button
                class="c-btn c-btn--minimal c-btn--square"
                @click.stop="close"
              >
                <i class="u-icon">close</i>
              </button>
            </div>
            <div class="c-modal__body">
              <slot />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </keep-alive>
</template>

<script setup>
/**
 * Example usage of this modal:
 *   <modal title="Test Modal" :open.sync="modal">
 *     <component>
 *   </modal>
 *
 * Example with <keep-alive>:
 *  <keep-alive>
 *    <modal v-if="modal" :open="true" @update:open="state => (open = state)">
 *      <component>
 *    </modal>
 *  </keep-alive>
 *
 * Note: the v-if has to be on the modal component directly, otherwise
 *       keep-alive does not work
 */

const props = defineProps({
  title: { type: String, default: '' },
  customClasses: { type: String, default: '' },
  context: { type: String, default: 'global' }, // global | local
  open: Boolean,
  full: Boolean,
});

const emit = defineEmits(['update:open']);

const visible = ref(false);

// Template Ref
const modal = ref(null);

watch(
  () => props.open,
  (newState) => {
    if (newState) nextTick(() => modal.value.focus());
    else modal.value.blur();
  }
);

const close = () => {
  emit('update:open', false);
};

const outsideClick = (event) => {
  if (!(props.open && visible.value)) return;
  if (event && modal.value && !modal.value.contains(event.target)) close();
};

onMounted(() => {
  if (process.client) document.addEventListener('click', outsideClick);
});

onUnmounted(() => {
  if (process.client) document.removeEventListener('click', outsideClick);
});
</script>

<style lang="scss" scoped>
.c-modal-context {
  position: fixed;
  z-index: 200;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba($c-black, 0.7);
  transition: opacity $global-transition;

  &--local {
    position: absolute;
    background-color: rgba($c-black, 0.4);
  }
}

.c-modal-container {
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-block;
  max-width: 60vw;
  z-index: 1000;
}

/*
 * 1. undo inherited styles
 */
.c-modal {
  color: $c-text;
  text-align: left; /* 1 */
  border-radius: $global-radius;
  box-shadow: 0 0 $unit rgba($c-black, 0.5);
  background-color: $c-gray-1;
  transition: transform $global-transition ease;
  white-space: normal; /* 1 */

  .fade-enter &,
  .fade-leave-to & {
    transform: scale(0.95);
  }
}

.c-modal__header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  flex-wrap: nowrap;
  border-radius: $global-radius $global-radius 0 0;
  background-color: $c-gray-2;
  border-bottom: 1px solid $c-border;
}

.c-modal__title {
  @include font-size($font-size);

  font-weight: bold;
  margin-bottom: 0;
  padding: $unit-small $unit;
}

.c-modal__body {
  padding: $unit-small $unit;
}
</style>
