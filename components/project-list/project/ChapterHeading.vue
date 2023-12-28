<template>
  <nuxt-link :to="url" class="c-chapter u-no-link">
    <div class="c-chapter__num">
      {{ item.number }}
    </div>
    <div class="c-chapter__title">
      <div>
        <span v-html="item.content"></span>
        <span class="c-chapter__stats">
          <span class="u-yellow">{{ item.translationDone }}</span>
          <span class="u-green">/ {{ item.reviewDone }}</span>
          <span class="u-dark-green"> / {{ item.editorDone }} </span>
          <!-- NOTE: MIGHT NEED THIS CODE LATER -->
          <!-- <span class="u-faded">/ {{ item.limit }}</span> -->
        </span>
      </div>
      <progress-component :stats="item" modifier="slim" wide />
    </div>
  </nuxt-link>
</template>

<script setup>
import ProgressComponent from '~/components/utilities/Progress';

/* eslint-disable */ // TODO: fix lint
const props = defineProps({
  item: { required: true },
  url: { type: String, default: '' },
});
</script>

<style lang="scss" scoped>
.c-chapter {
  display: flex;
  align-items: center;
  padding: $unit-tiny $unit $unit-small $unit-small;

  &:not(.is-placeholder):hover {
    background-color: white;
    cursor: pointer;
  }

  .c-progress {
    margin-top: 2px;
  }
}

.c-chapter__num {
  font-size: 1em;
  font-weight: bold;
  margin-right: $unit-small;
  width: $unit;
  text-align: right;
}

.c-chapter__title {
  @include font-size($font-size-small);

  flex-grow: 2;

  > div:first-child {
    font-weight: 600;
    display: flex;
    justify-content: space-between;
  }
}

.c-chapter__stats {
  @include font-size($font-size-small);

  font-weight: normal;
}
</style>
