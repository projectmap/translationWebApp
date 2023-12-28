<template>
  <command-button
    command-name="Redo"
    action-name="Redo"
    custom-class="redo-btn"
    :command-image-icon="isDisabled ? redoButtonDisabled : redoButton"
    :editor-instance="editorInstance"
    :disabled="isDisabled"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import redoButton from '@/components/editor/buttons/assets/redo.svg';
import redoButtonDisabled from '@/components/editor/buttons/assets/redo-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});

const command = () => {
  props.editorInstance.chain().focus().redo().run();
};

const isDisabled = computed(() => {
  if (isEmpty(props.editorInstance)) return true;

  if (!isEmpty(props.editorInstance)) {
    return !props.editorInstance.can().redo();
  }
  return false;
});
</script>

<style></style>
