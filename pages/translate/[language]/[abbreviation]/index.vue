<template>
  <NuxtPage />
</template>

<script setup>
definePageMeta({
  layout: 'fullwidth',
  middleware: function (to, from) {
    if (
      to.params.language &&
      to.params.abbreviation &&
      !to.path.includes('contributors') &&
      !to.path.includes('timeline')
    ) {
      return navigateTo(`${to.path}chapter/${from.params.chapter || 1}/`);
    }
  },
});
</script>
