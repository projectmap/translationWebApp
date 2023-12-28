<template>
  <overlay-header v-if="overlay" @scroll-section="scrollToContent" />
  <app-header v-else />
</template>

<script setup>
import AppHeader from './AppHeader.vue';
import OverlayHeader from './OverlayHeader.vue';

defineProps({
  overlay: Boolean,
});

const emit = defineEmits(['scroll-content']);

const scrollToContent = (documentId) => {
  emit('scroll-content', documentId);
};
</script>

<style></style>
