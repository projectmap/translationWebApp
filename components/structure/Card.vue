<template>
  <article
    class="c-card"
    :class="[
      {
        'c-card--large': size === 'large',
        'c-card--small': size === 'small',
        'c-card--tiny': size === 'tiny',
        'c-card--seamless': seamless,
        'c-card--flush': flush,
        'c-card--clickable': clickable,
        'c-card--dark': dark,
      },
      // data.class,
      // data.staticClass,
    ]"
  >
    <header v-if="$slots.header" class="c-card__header">
      <slot name="header" />
    </header>
    <div class="c-card__content" :class="{ 'u-pb0': !$slots.default }">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="c-card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<script setup>
defineProps({
  size: { type: String, default: '' },
  seamless: Boolean,
  flush: Boolean,
  clickable: Boolean,
  dark: Boolean,
});
</script>

<style lang="scss">
.c-card {
  --padding: #{$unit};

  box-shadow: $global-shadow-5;
  border-radius: $global-radius;
  background-color: $c-white;
  transition: background-color $global-transition, box-shadow $global-transition;

  &--large {
    --padding: #{$unit-large};
  }

  &--small {
    --padding: #{$unit-small};
  }

  &--tiny {
    --padding: #{$unit-tiny};
  }

  &--auto {
    display: inline-block;
  }

  &--seamless {
    box-shadow: none;
    background-color: transparent;
  }

  &--clickable:hover {
    cursor: pointer;
    background-color: $c-gray-1;
    box-shadow: $global-shadow-3;

    &.c-card--dark {
      background-color: $c-gray-7;
    }
  }

  &--dark {
    background-color: $c-gray-8;
    color: $c-gray-3;
  }
}

.c-card__header {
  @include font-size($font-size-large);

  padding: calc(var(--padding) / 2) var(--padding) 0;
  font-weight: 600;

  .c-card--seamless > & {
    padding: 0 0 calc(var(--padding) / 2);
  }
}

.c-card__content {
  padding: calc(var(--padding) / 2) var(--padding);

  .c-card--seamless > &,
  .c-card--flush > & {
    padding: 0;
  }
}

.c-card__footer {
  padding: calc(var(--padding) / 2) var(--padding);
  border-top: 1px solid $c-border;

  .c-card--seamless > & {
    border-top-width: 0;
    padding: calc(var(--padding) / 2) 0 0;
  }

  .c-card--dark > & {
    border-color: $c-gray-6;
  }
}
</style>
