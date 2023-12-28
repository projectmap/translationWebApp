<template>
  <transition name="fade">
    <div v-if="active" class="c-snackbar" :class="css">
      <div class="c-snackbar__content">
        <slot />
      </div>
      <button
        v-if="dismissable"
        type="button"
        class="c-btn c-btn--minimal c-snackbar__button"
        @click="dismiss"
      >
        Close
      </button>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  active: Boolean,
  duration: { type: Number, default: 4000 },
  dismissable: { type: Boolean, default: true },
  color: { type: String, default: '' },
});

const emit = defineEmits(['update:active']);

const timeoutID = ref(null);

const css = computed(() => (props.color ? 'c-snackbar--' + props.color : null));

const dismiss = () => {
  clearTimeout(timeoutID.value);
  timeoutID.value = null;
  emit('update:active', false);
};
const startDuration = () => {
  if (props.duration > 0) {
    timeoutID.value = setTimeout(() => {
      dismiss();
    }, props.duration);
  }
};

onMounted(() => {
  startDuration();
});

watch(
  () => props.active,
  (isActive) => {
    if (isActive) startDuration();
  }
);
</script>

<style lang="scss" scoped>
.c-snackbar {
  position: fixed;
  padding: $unit-small $unit;
  z-index: 210;
  width: 50vw;
  left: 25vw;
  bottom: $unit-small;
  border-radius: $global-radius;
  box-shadow: $global-shadow-5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba($c-black, 0.85);
  color: $c-white;
  backdrop-filter: blur(10px);

  &--red {
    background-color: rgba($c-red-9, 0.95);
    color: $c-red-1;
  }

  &--green {
    background-color: rgba($c-green-9, 0.95);
    color: $c-green-1;
  }

  &--blue {
    background-color: rgba($c-primary-8, 0.95);
    color: $c-primary-1;
  }

  @supports (backdrop-filter: blur(10px)) {
    background-color: rgba($c-black, 0.7);

    &--red {
      background-color: rgba($c-red-9, 0.8);
    }

    &--green {
      background-color: rgba($c-green-9, 0.8);
    }

    &--blue {
      background-color: rgba($c-primary-8, 0.8);
    }
  }
}

// .c-snackbar__content {
// }

.c-snackbar__button {
  padding: $unit-tiny;
  text-transform: uppercase;
  color: $c-yellow-3;
  font-weight: bold;
  margin-left: $unit-small;

  .c-snackbar--red &,
  .c-snackbar--green &,
  .c-snackbar--blue & {
    color: currentcolor;
    opacity: 0.7;
  }

  &:hover {
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: $global-transition;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: translateY($unit-small);
}
</style>
