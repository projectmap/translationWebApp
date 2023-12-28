<template>
  <li class="c-timeline__lock">
    <div class="c-timeline__node">
      <span class="u-icon u-icon+">lock_outline</span>
    </div>
    <div>{{ item.text }}</div>
  </li>
</template>

<script setup>
defineProps({
  item: { default: null },
});
</script>
