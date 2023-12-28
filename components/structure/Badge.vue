<template>
  <span
    class="c-badge"
    :class="[
      size ? `c-badge${size}` : '',
      color ? `c-badge--${color}` : '',
      {
        'c-badge--border': border,
        'c-badge--soft': soft,
        'c-badge--circle': circle,
        'u-bold': bold,
      },
      // data.class,
      // data.staticClass,
    ]"
  >
    <slot />
  </span>
</template>

<script setup>
defineProps({
  color: { type: String, default: '' },
  size: { type: String, default: '' },
  border: Boolean,
  soft: Boolean,
  circle: Boolean,
  bold: Boolean,
});
</script>

<style lang="scss">
/*
 * 1. compensate for the font which has a little more space above letters than
 *    below
 */
.c-badge {
  padding: 0.15em 0.6em 0.2em; /* 1 */
  word-break: keep-all;
  white-space: nowrap;
  border-radius: $unit-huge;
  background-color: $c-gray-2;
  border-color: $c-border;
  color: $c-gray-8;
  line-height: 1;
  vertical-align: calc(3px + -16%); // visually align with text
}

/*
 * Colors
 **************************/

.c-badge--soft {
  background-color: $c-gray-1;
  border-color: $c-border;
  color: $c-gray-6;
}

.c-badge--dark {
  // background-color: $c-dark;
  // border-color: rgba($c-black, 0.8);
  // color: $c-white;
  background-color: $c-gray-8;
  border-color: $c-gray-9;
  color: $c-gray-2;

  &.c-badge--soft {
    background-color: $c-gray-6;
    border-color: $c-gray-8;
    color: $c-gray-3;
  }
}

.c-badge--primary {
  background-color: $c-primary-5;
  border-color: $c-primary-6;
  color: $c-primary-1;

  &.c-badge--soft {
    background-color: $c-primary-1;
    border-color: $c-primary-3;
    color: $c-primary-7;
  }
}

.c-badge--blue {
  background-color: $c-blue-5;
  border-color: $c-blue-6;
  color: $c-blue-1;

  &.c-badge--soft {
    background-color: $c-blue-1;
    border-color: $c-blue-3;
    color: $c-blue-7;
  }
}

.c-badge--purple {
  background-color: $c-purple-5;
  border-color: $c-purple-9;
  color: $c-purple-1;

  &.c-badge--soft {
    background-color: $c-purple-1;
    border-color: $c-purple-3;
    color: $c-purple-6;
  }
}

.c-badge--red {
  background-color: $c-red-5;
  border-color: $c-red-7;
  color: $c-red-1;

  &.c-badge--soft {
    background-color: $c-red-1;
    border-color: $c-red-3;
    color: $c-red-6;
  }
}

.c-badge--yellow {
  background-color: $c-yellow-5;
  border-color: $c-yellow-6;
  color: $c-white;

  &.c-badge--soft {
    background-color: $c-yellow-1;
    border-color: $c-yellow-4;
    color: $c-yellow-7;
  }
}

.c-badge--green {
  background-color: $c-green-5;
  border-color: $c-green-7;
  color: $c-green-1;

  &.c-badge--soft {
    background-color: $c-green-1;
    border-color: $c-green-3;
    color: $c-green-7;
  }
}

/*
 * Sizes
 **************************/

.c-badge\-\-\- {
  font-size: $font-size-2;
}
.c-badge\-\- {
  font-size: $font-size-3;
}
.c-badge\- {
  font-size: $font-size-4;
}
.c-badge\+ {
  font-size: $font-size-6;
}
.c-badge\+\+ {
  font-size: $font-size-7;
}
.c-badge\+\+\+ {
  font-size: $font-size-8;
}

/*
 * Variants
 **************************/
.c-badge--border {
  padding: calc(0.15em - 1px) calc(0.6em - 1px) calc(0.2em - 1px);
  border-width: 1px;
  border-style: solid;
}

.c-badge--circle {
  display: inline-block; // needed for 'with' to take effect
  padding: 0;
  width: 2em;
  height: 2em;
  line-height: 2em;
  text-align: center;
}
</style>
