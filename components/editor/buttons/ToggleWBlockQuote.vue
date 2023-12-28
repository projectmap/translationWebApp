<template>
  <command-button
    command-name="blockquote"
    action-name="Blockquote"
    :command-image-icon="isDisabled ? blockquoteDisabled : blockquote"
    :type="type"
    :type-attr="state.typeAttr"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import blockquote from '@/components/editor/extensions/WTextBlockExtension/assets/images/blockquote.svg';
import blockquoteDisabled from '@/components/editor/extensions/WTextBlockExtension/assets/images/blockquote-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});

const type = ref('wTextBlock');
const state = reactive({
  typeAttr: {
    type: 'blockquote',
  },
});

const command = () => {
  props.editorInstance
    .chain()
    .focus()
    .convertWTextBlock({
      type: 'blockquote',
    })
    .run();
};

const isDisabled = computed(() => {
  return isEmpty(props.editorInstance);
});
</script>

<style></style>
