<template>
  <command-button
    command-name="Small Caps"
    action-name="Smallcaps"
    :command-image-icon="isDisabled ? smallCapsIconDisabled : smallCapsIcon"
    :type="type"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';
import CommandButton from './CommandButton.vue';
import smallCapsIcon from '@/components/editor/extensions/WFormatExtension/assets/images/W-format-smallcaps_icon.svg';
import smallCapsIconDisabled from '@/components/editor/extensions/WFormatExtension/assets/images/W-format-smallcaps_icon-disabled.svg';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});

const type = ref('wFormatSmallCaps');

const command = () => {
  props.editorInstance.chain().focus().toggleWFormatSmallCaps().run();
};

const isDisabled = computed(() => {
  return isEmpty(props.editorInstance);
});
</script>

<style></style>
