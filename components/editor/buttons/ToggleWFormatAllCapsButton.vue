<template>
  <command-button
    command-name="All Caps"
    action-name="Allcaps"
    :command-image-icon="isDisabled ? allCapsIconDisabled : allCapsIcon"
    :type="type"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import allCapsIcon from '@/components/editor/extensions/WFormatExtension/assets/images/W-format-allcaps_icon.svg';
import allCapsIconDisabled from '@/components/editor/extensions/WFormatExtension/assets/images/W-format-allcaps_icon-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});
const type = ref('wFormatAllCaps');

const command = () => {
  props.editorInstance.chain().focus().toggleWFormatAllCaps().run();
};

const isDisabled = computed(() => {
  return isEmpty(props.editorInstance);
});
</script>

<style></style>
