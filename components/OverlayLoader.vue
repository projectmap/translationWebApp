<template>
  <div :class="{ 'overlay-loader': active, 'no-overlay-loader': !active }">
    <div v-if="active" class="loading-content">
      <div class="base-loader">
        <div class="c-spinner c-spinner--small"></div>
        <div class="text-component">
          {{ message }}
        </div>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false },
  message: { type: String, default: 'Processing...' },
});
</script>

<style lang="scss" scoped>
.overlay-loader {
  position: relative;
  .loading-content {
    height: 100%;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    position: absolute;
    background-color: rgba(24, 28, 50, 0.04);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;

    .base-loader {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 200px;
      max-width: fit-content;
      height: 80px;
      background: white;
      border-radius: 8px;
      padding: 0 20px;
      box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
      .c-spinner {
        margin: 0 10px 0 0;
      }

      .text-component {
        font-size: 18px;
        font-weight: 600;
      }
    }
  }
}

.no-overlay-loader {
  position: page;
}
</style>
