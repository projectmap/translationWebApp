<template>
  <v-menu :location="placement" :class="customClasses" :disabled="disabled">
    <template #activator="{ props }">
      <div v-bind="props">
        <slot name="anchor"></slot>
      </div>
    </template>

    <v-list class="v-popover c-dropdown__inner">
      <div v-if="hasHeaderSlot" class="c-dropdown__header">
        <slot name="header"></slot>
      </div>

      <scrollable-component
        class="c-dropdown__scrollable"
        :style="{ 'min-width': minWidth, 'max-width': maxWidth }"
        :search-limit="componentProps.searchLimit"
        :options-count="componentProps.optionsCount"
        :option-length="componentProps.currentOptionLength"
        @click="localOpen = false"
        @update-search-limit="updateSearchLimit"
      >
        <slot></slot>
      </scrollable-component>

      <div v-if="hasFooterSlot" class="c-dropdown__footer">
        <slot name="footer"></slot>
      </div>
    </v-list>
  </v-menu>
</template>

<script setup>
import ScrollableComponent from '@/components/structure/Scrollable';

const componentProps = defineProps({
  placement: { type: String, default: 'bottom' },
  display: { type: String, default: 'inline-block' },
  delay: { type: Number, default: 0 },
  open: Boolean,
  minWidth: { type: String, default: '300px' },
  maxWidth: { type: String, default: '' },
  disabled: Boolean,
  customClasses: { type: String, default: '' },
  searchLimit: { type: Number },
  optionsCount: { type: Number },
  currentOptionLength: { type: Number },
});

const nuxtApp = getCurrentInstance();

/* eslint-disable */ // TODO: Remove
let localOpen = ref(false);
localOpen.value = componentProps.open;

const emit = defineEmits([
  'update:open',
  'open',
  'close',
  'update-search-limit',
]);

const updateSearchLimit = (limit) => {
  emit('update-search-limit', limit);
};

watch(localOpen, (currentValue) => {
  if (currentValue) {
    emit('update:open', currentValue);
    emit(currentValue ? 'open' : 'close');
  }
});

watch(componentProps.open, (currentValue) => {
  if (currentValue !== localOpen.value) {
    localOpen.value = currentValue;
  }
});

const hasHeaderSlot = computed(() => {
  return Boolean(nuxtApp.slots?.header);
});

const hasFooterSlot = computed(() => {
  return Boolean(nuxtApp.slots?.footer);
});
</script>

<style src="@/assets/scss/components/dropdowns.scss"></style>
