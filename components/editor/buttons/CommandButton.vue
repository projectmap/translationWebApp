<template>
  <button
    class="toolbar-btn"
    :class="[{ 'is-active': isActive }, customClass]"
    :disabled="disabled || !isEditorInitiated"
    @click="commandAction"
  >
    <template v-if="commandImageIcon">
      <img class="image-icon" :src="commandImageIcon" />
    </template>
    <template v-else-if="commandIcon">
      <i class="u-icon">{{ commandIcon }}</i>
    </template>
    <template v-else> {{ commandName }}</template>
    <ctooltip :show="true"> {{ actionName }} </ctooltip>
  </button>
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';
import Ctooltip from '~/components/utilities/Ctooltip.vue';

const props = defineProps({
  commandName: { type: String, default: '' },
  commandImageIcon: { type: String, default: '' },
  commandIcon: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: '' },
  typeAttr: { type: Object, default: () => {} },
  editorInstance: { type: Object, default: () => {} },
  actionName: { type: String, default: '' },
  customClass: { type: String, default: '' },
});

const emit = defineEmits(['command-function']);

const isActive = computed(() => {
  if (props.type && !isEmpty(props.editorInstance)) {
    return props.editorInstance.isActive(props.type, props.typeAttr ?? {});
  }
  return false;
});

const isEditorInitiated = computed(() => {
  return !isEmpty(props.editorInstance);
});

const commandAction = () => {
  emit('command-function');
};
</script>

<style lang="scss">
.image-icon {
  width: 13px;
}
</style>
