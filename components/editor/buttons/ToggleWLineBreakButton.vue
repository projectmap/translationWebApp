<template>
  <command-button
    command-name="linebreak"
    action-name="Linebreak"
    custom-class="line-break-btn"
    :disabled="isDisabled"
    :command-image-icon="isDisabled ? paragraphIconDisabled : paragraphIcon"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import paragraphIcon from '@/components/editor/buttons/assets/line-break.svg';
import paragraphIconDisabled from '@/components/editor/buttons/assets/line-break-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
  isTextSelected: { type: Boolean, default: false },
});

const command = () => {
  props.editorInstance.chain().focus().setHardBreak().run();
};

const isDisabled = computed(() => {
  return isEmpty(props.editorInstance) || props.isTextSelected;
});
</script>

<style></style>
