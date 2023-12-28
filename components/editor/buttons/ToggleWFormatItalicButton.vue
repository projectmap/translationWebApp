<template>
  <command-button
    command-name="I"
    action-name="Italic"
    :type="type"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import CommandButton from './CommandButton.vue';
const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
});

const type = ref('wFormatItalic');

const command = () => {
  props.editorInstance.chain().focus().toggleWFormatItalic().run();
};
</script>

<style></style>
