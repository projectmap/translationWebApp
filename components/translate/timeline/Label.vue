<template>
  <li class="c-timeline__label">
    <div class="c-timeline__label-inner">
      {{ item.text }}
    </div>
  </li>
</template>

<script setup>
defineProps({
  item: { default: null },
});
</script>
