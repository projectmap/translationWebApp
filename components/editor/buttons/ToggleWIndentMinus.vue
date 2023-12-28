<template>
  <command-button
    command-name="indentMinus"
    action-name="Decrease indent"
    :command-image-icon="isDisabled ? indentMinusDisabled : indentMinus"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import indentMinus from '@/components/editor/extensions/WTextBlockExtension/assets/images/indent-decrease.svg';
import indentMinusDisabled from '@/components/editor/extensions/WTextBlockExtension/assets/images/indent-decrease-disabled.svg';

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
            action: 'minus',
          })
          .run();

        break;
      }

      default: {
        props.editorInstance
          .chain()
          .focus()
          .updateWTextBlockIndent({
            action: 'minus',
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
