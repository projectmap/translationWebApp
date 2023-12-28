<template>
  <command-button
    command-name="Sub Script"
    action-name="Subscript"
    :command-image-icon="isDisabled ? subScriptIconDisabled : subScriptIcon"
    :type="type"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import subScriptIcon from '@/components/editor/extensions/WFormatExtension/assets/images/W-format-subscript_icon.svg';
import subScriptIconDisabled from '@/components/editor/extensions/WFormatExtension/assets/images/W-format-subscript_icon-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});

const type = ref('wFormatSubscript');

const command = () => {
  props.editorInstance.chain().focus().toggleWFormatSubscript().run();
};

const isDisabled = computed(() => {
  return isEmpty(props.editorInstance);
});
</script>

<style></style>
