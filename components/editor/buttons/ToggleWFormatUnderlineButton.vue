<template>
  <command-button
    command-name="U"
    action-name="Underline"
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

const type = ref('wFormatUnderline');

const command = () => {
  props.editorInstance.chain().focus().toggleWFormatUnderline().run();
};
</script>

<style></style>
