<template>
  <section class="o-wrapper o-wrapper--flush c-pane">
    <aside
      class="c-pane__aside"
      :class="asideClass"
      :style="{ flexBasis: 100 - mainWidth + '%' }"
    >
      <slot name="aside" />
    </aside>
    <div
      class="c-pane__main"
      :class="mainClass"
      :style="{ flexBasis: mainWidth + '%' }"
    >
      <slot name="main" />
    </div>
  </section>
</template>

<script setup>
defineProps({
  mainWidth: { type: Number, default: 75 },
  asideClass: { type: String, default: '' },
  mainClass: { type: String, default: '' },
});
</script>

<style lang="scss">
.c-pane {
  display: flex;
  background-color: $c-gray-1;

  @include mq($until: tablet) {
    display: block;
  }
}

.c-pane__aside,
.c-pane__main {
  flex-grow: 0;
  flex-shrink: 0;
  min-width: 0; // Truncate Hack
}

.c-pane__aside {
  background-color: $c-white;
  border-right: 2px solid $c-gray-3;
  &:not(.no-padding) {
    padding: $unit-large $unit;
  }

  @include mq($until: tablet) {
    border-right-color: transparent;
    border-bottom: 2px solid $c-gray-3;
  }
}

.c-pane__main {
  padding: $unit-large;
  min-height: 80vh;
}

@media (max-width: 576px) {
  .c-pane__main {
    padding: 10px !important;
  }
}

.c-pane__header {
  border-bottom: 2px solid $c-primary-5;
  margin-bottom: $unit;
}
</style>
