<template>
  <li class="c-timeline__label">
    <div class="c-timeline__label-inner">
      { {{ item.reference }} } {{ item.itCovers }} %
    </div>
  </li>
</template>

<script setup>
defineProps({
  item: { default: null },
});
</script>
