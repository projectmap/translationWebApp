<template>
  <section class="callback">
    <div class="login-process">
      <processing-modal message="Logging in, Please Wait..." />
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'empty',
  redirect: '/',
});
</script>

<style lang="scss" scoped>
.callback {
  height: 100vh;
  display: flex;
  .login-process {
    border-radius: 5px;
    box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
    height: fit-content;
    width: fit-content;
    margin: auto;
  }
}
</style>
