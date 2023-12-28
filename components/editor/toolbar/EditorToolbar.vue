<script setup>
import { storeToRefs } from 'pinia';
import ToggleWPageBreak from '../buttons/ToggleWPageBreak.vue';
import UndoHistoryButton from '../buttons/UndoHistoryButton.vue';
import RedoHistoryButton from '../buttons/RedoHistoryButton.vue';
import ToggleWLinkButton from '../buttons/ToggleWLinkButton.vue';
import ToggleWBlockQuote from '../buttons/ToggleWBlockQuote.vue';
import ToggleWIndentPlus from '../buttons/ToggleWIndentPlus.vue';
import ToggleWLangButton from '../buttons/ToggleWLangButton.vue';
import ToggleWIndentMinus from '../buttons/ToggleWIndentMinus.vue';
import ToggleWAnchorButton from '../buttons/ToggleWAnchorButton.vue';
import ToggleWNonEgwButton from '../buttons/ToggleWNonEgwButton.vue';
import ToggleWEntityButton from '../buttons/ToggleWEntityButton.vue';
import ToggleWLineBreakButton from '../buttons/ToggleWLineBreakButton.vue';
import ToggleWFormatBoldButton from '../buttons/ToggleWFormatBoldButton.vue';
import ToggleWFormatAllCapsButton from '../buttons/ToggleWFormatAllCapsButton';
import ToggleWFormatItalicButton from '../buttons/ToggleWFormatItalicButton.vue';
import ToggleWFormatHeadingButton from '../buttons/ToggleWFormatHeadingButton.vue';
import ToggleWFormatUnderlineButton from '../buttons/ToggleWFormatUnderlineButton.vue';
import ToggleWFormatSmallCapsButton from '../buttons/ToggleWFormatSmallCapsButton.vue';
import ToggleWFormatSubscriptButton from '../buttons/ToggleWFormatSubscriptButton.vue';
import ToggleWFormatSuperscriptButton from '../buttons/ToggleWFormatSuperscriptButton.vue';
import { useEditorStore } from '~/store';
defineProps({
  editorInstance: { type: Object, default: () => {} },
  segment: { type: Object, default: () => {} },
  contentType: { type: String, default: '' },
});

const editorStore = useEditorStore();
const { editorInstance, options } = storeToRefs(editorStore);

const state = reactive({
  textEditorInstance: {},
});

const editorOptions = computed(() => {
  return options.value;
});

watch(
  () => editorInstance.value,
  (value) => {
    if (value) {
      state.textEditorInstance = value;
    }
  },
  {
    deep: true,
  }
);

const setHeadingLevel = (level) => {
  editorStore.setEditorOptions('headingLevel', level);
};
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <redo-history-button :editor-instance="state.textEditorInstance" />
      <undo-history-button :editor-instance="state.textEditorInstance" />
    </div>
    <div class="toolbar-group">
      <toggle-w-format-heading-button
        v-if="editorOptions.isHeading"
        :initial-heading-level="editorOptions.headingLevel"
        :editor-instance="state.textEditorInstance"
        @set-heading-level="setHeadingLevel"
      />
      <toggle-w-format-bold-button
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-format-italic-button
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-format-underline-button
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-format-all-caps-button
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-format-small-caps-button
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-format-superscript-button
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-format-subscript-button
        :editor-instance="state.textEditorInstance"
      />
    </div>
    <div class="toolbar-group">
      <toggle-w-link-button
        :segment="segment"
        :content-type="contentType"
        :is-text-selected="editorOptions.isTextSelected"
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-anchor-button
        :is-text-selected="editorOptions.isTextSelected"
        :editor-instance="state.textEditorInstance"
      />
    </div>
    <div class="toolbar-group">
      <toggle-w-line-break-button
        :is-text-selected="editorOptions.isTextSelected"
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-page-break
        :is-text-selected="editorOptions.isTextSelected"
        :editor-instance="state.textEditorInstance"
        :page-break="editorOptions.pageBreak"
      />
    </div>
    <div class="toolbar-group">
      <toggle-w-lang-button
        :is-text-selected="editorOptions.isTextSelected"
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-block-quote :editor-instance="state.textEditorInstance" />
      <toggle-w-indent-minus :editor-instance="state.textEditorInstance" />
      <toggle-w-indent-plus :editor-instance="state.textEditorInstance" />
    </div>
    <div class="toolbar-group">
      <toggle-w-non-egw-button
        :is-text-selected="editorOptions.isTextSelected"
        :editor-instance="state.textEditorInstance"
      />
      <toggle-w-entity-button
        :is-text-selected="editorOptions.isTextSelected"
        :editor-instance="state.textEditorInstance"
      />
    </div>
  </div>
</template>

<style lang="scss">
.toolbar {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 4px 11px;
  gap: 5px;
  overflow-y: auto;
  border-radius: 2px;
  .toolbar-group {
    display: flex;
    -webkit-box-align: center;
    align-items: center;
    gap: 1px;
    width: fit-content;
    color: inherit;
  }

  .toolbar-btn {
    height: 32px;
    min-width: 32px;
    max-width: fit-content;
    display: inline-flex;
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: center;
    justify-content: center;
    position: relative;
    box-sizing: border-box;
    background-color: white;
    outline: 0px;
    margin: 0px;
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
    appearance: none;
    text-decoration: none;
    font-family: Roboto, Helvetica, Arial, sans-serif;
    font-weight: 500;
    font-size: 0.8125rem;
    line-height: 1.75;
    letter-spacing: 0.02857em;
    text-transform: uppercase;
    border-radius: 4px;
    padding: 7px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    color: rgba(0, 0, 0, 0.54);

    img {
      width: 15px;
    }

    &.undo-btn,
    &.redo-btn,
    &.line-break-btn {
      img {
        width: 12px;
      }
    }

    &:disabled {
      color: rgba(0, 0, 0, 0.26) !important;
      border: 1px solid rgba(0, 0, 0, 0.12) !important;
      pointer-events: none;
      cursor: default;
    }
  }

  .toolbar-btn--dropdown {
    -webkit-appearance: none;
    -moz-appearance: none;
    background: transparent;
    background-image: url("data:image/svg+xml;utf8,<svg  fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
    background-repeat: no-repeat;
    background-position-x: 100%;
    background-position-y: 3px;

    &:disabled {
      background-image: url("data:image/svg+xml;utf8,<svg fill='lightgray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
    }
  }

  .heading-toggle,
  .toolbar-btn {
    &:hover {
      background-color: rgba(68, 71, 70, 0.078) !important;
    }

    &.is-active {
      background-color: #d3e3fd !important;
    }
  }
}

.actionbar {
  margin-left: auto;
  display: flex;
  align-items: center;

  button {
    cursor: pointer;
    color: #001d35;
  }

  button:not(:last-child) {
    background-color: #d3e3fd;
    border-radius: 100px;
    padding: 0px 9px;
    font-size: 13px;
    height: 24px;
    font-weight: 500;
  }

  button:last-child {
    margin-left: 10px;
  }

  #translationDone {
    margin-right: 5px;
    width: 66px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
