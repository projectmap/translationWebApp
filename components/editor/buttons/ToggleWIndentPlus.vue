<template>
  <command-button
    command-name="indentPlus"
    action-name="Increase indent"
    :command-image-icon="isDisabled ? indentPlusDisabled : indentPlus"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import indentPlus from '@/components/editor/extensions/WTextBlockExtension/assets/images/indent-increase.svg';
import indentPlusDisabled from '@/components/editor/extensions/WTextBlockExtension/assets/images/indent-increase-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});

const command = () => {
  if (props.editorInstance) {
    const { state } = props.editorInstance;
    const nodeName = state.tr?.doc?.firstChild?.type?.name;

    switch (nodeName) {
      case 'wSent': {
        props.editorInstance
          .chain()
          .focus()
          .updateWSentIndent({
            action: 'plus',
          })
          .run();

        break;
      }

      default: {
        props.editorInstance
          .chain()
          .focus()
          .updateWTextBlockIndent({
            action: 'plus',
          })
          .run();
      }
    }
  }
};

const isDisabled = computed(() => {
  return isEmpty(props.editorInstance);
});
</script>

<style></style>
