<template>
  <keep-alive>
    <div>
      <div v-if="open" class="overlay">
        <div>
          <h2>{{ modalText }}</h2>
          <div class="loader"></div>
        </div>
      </div>
    </div>
  </keep-alive>
</template>

<script setup>
/**
 * Example usage of this modal:
 *   <modal title="Test Modal" :open.sync="modal">
 *     <component>
 *   </modal>
 *
 * Example with <keep-alive>:
 *  <keep-alive>
 *    <modal v-if="modal" :open="true" @update:open="state => (open = state)">
 *      <component>
 *    </modal>
 *  </keep-alive>
 *
 * Note: the v-if has to be on the modal component directly, otherwise
 *       keep-alive does not work
 */

defineProps({
  modalText: { type: String, default: '' },
  open: Boolean,
});
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  background: rgba(0, 0, 0, 0.5);
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  text-align: center;
  z-index: 100;
  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 100%;
    h2 {
      color: white;
    }
  }
}

/* Safari */
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loader {
  border: 16px solid #f3f3f3;
  border-radius: 50%;
  border-top: 16px solid #3498db;
  width: 120px;
  height: 120px;
  -webkit-animation: spin 2s linear infinite; /* Safari */
  animation: spin 2s linear infinite;
}
</style>
