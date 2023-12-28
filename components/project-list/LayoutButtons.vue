<template>
  <div>
    <button
      class="c-btn c-btn--light c-btn--square c-btn--shadow c-btn-"
      :class="{ 'is-active': layout === 'compact' }"
      :disabled="archive"
      @click="updateLayout('compact')"
    >
      <i v-if="page" class="u-icon">apps</i>
      <i v-else class="u-icon">view_headline</i>
    </button>
    <button
      class="c-btn c-btn--light c-btn--square c-btn--shadow c-btn-"
      :class="{ 'is-active c-btn--dark': layout === 'detail' }"
      :disabled="archive"
      @click="updateLayout('detail')"
    >
      <i class="u-icon">view_list</i>
    </button>
  </div>
</template>

<script setup>
defineProps({
  layout: { type: String, default: 'compact' },
  seamless: Boolean,
  archive: { type: Boolean, default: false },
  page: { type: String, default: '' },
});

const emit = defineEmits(['update:layout']);

const updateLayout = (layout) => {
  emit('update:layout', layout);
};
</script>
