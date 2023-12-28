<template>
  <command-button
    command-name="B"
    action-name="Bold"
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

const type = ref('wFormatBold');

const command = () => {
  props.editorInstance.chain().focus().toggleWFormatBold().run();
};
</script>

<style></style>
