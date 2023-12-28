<template>
  <ul class="c-activities">
    <li v-for="item in items" :key="item.id" class="c-activities__item">
      <component :is="componentName(type)" :item="item" />
    </li>
  </ul>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
});

const componentName = (type) => {
  const compName = type === 'label' ? 'Label' : 'Activity';
  return resolveComponent(compName);
};
</script>

<style lang="scss" scoped>
.c-activities {
  list-style: none;
  margin-left: 0;
  text-align: left;
}

.c-activities__item {
  margin-left: -$unit-small;
  width: calc(100% + #{$unit-small});
  transition: $global-transition;
  border-radius: $global-radius;
}
</style>
