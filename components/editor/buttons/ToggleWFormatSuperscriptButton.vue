<template>
  <command-button
    command-name="Super Script"
    action-name="Superscript"
    :command-image-icon="isDisabled ? superScriptIconDisabled : superScriptIcon"
    :type="type"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import superScriptIcon from '@/components/editor/extensions/WFormatExtension/assets/images/W-format-superscript_icon.svg';
import superScriptIconDisabled from '@/components/editor/extensions/WFormatExtension/assets/images/W-format-superscript_icon-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});

const type = ref('wFormatSuperscript');

const command = () => {
  props.editorInstance.chain().focus().toggleWFormatSuperscript().run();
};

const isDisabled = computed(() => {
  return isEmpty(props.editorInstance);
});
</script>

<style></style>
