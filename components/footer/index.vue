<template>
  <overlay-footer v-if="overlay" @scroll-section="scrollToContent" />
  <app-footer v-else />
</template>

<script setup>
import AppFooter from './AppFooter.vue';
import OverlayFooter from './OverlayFooter.vue';

defineProps({
  overlay: Boolean,
});

const emit = defineEmits(['scroll-content']);

const scrollToContent = (documentId) => {
  emit('scroll-content', documentId);
};
</script>

<style></style>
