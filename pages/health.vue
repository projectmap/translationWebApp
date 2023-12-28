<template>
  <div class="c__health">
    <h3>Status : Healthy</h3>
    <p>Application is running properly.</p>
  </div>
</template>

<script setup>
useHead({
  meta: { public: true },
});
</script>

<style lang="scss" scoped>
.c__health {
  padding: 30px;
  h3 {
    margin-bottom: 10px;
  }
}
</style>
