<template>
  <command-button
    command-name="Undo"
    action-name="Undo"
    custom-class="undo-btn"
    :command-image-icon="isDisabled ? undoButtonDisabled : undoButton"
    :editor-instance="editorInstance"
    :disabled="isDisabled"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import undoButton from '@/components/editor/buttons/assets/undo.svg';
import undoButtonDisabled from '@/components/editor/buttons/assets/undo-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});

const command = () => {
  props.editorInstance.chain().focus().undo().run();
};

const isDisabled = computed(() => {
  if (isEmpty(props.editorInstance)) return true;

  if (!isEmpty(props.editorInstance)) {
    return !props.editorInstance.can().undo();
  }
  return false;
});
</script>

<style></style>
