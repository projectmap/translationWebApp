<template>
  <command-button
    command-name="anchor"
    action-name="Anchor"
    :disabled="isDisabled"
    :command-image-icon="isDisabled ? anchorIconDisabled : anchorIcon"
    :type="type"
    :type-attr="state.id"
    :editor-instance="editorInstance"
    @command-function="toggleAnchorPopUp"
  />

  <div v-if="state.anchorPopUp" class="anchor-popup">
    <div class="header o-flex o-flex--between o-flex--middle">
      <span>Insert wAnchor Attributes</span>
      <i class="u-icon" @click.prevent="toggleAnchorPopUp">close</i>
    </div>
    <form class="anchor__form">
      <dl class="o-layout__item">
        <dt>
          <label> Id </label>
        </dt>
        <dd>
          <input
            id="id"
            v-model="state.id"
            type="number"
            name="id"
            placeholder="Enter id here"
            min="0"
          />
        </dd>
      </dl>

      <div class="action-container">
        <button
          class="c-btn c-btn--primary c-btn--- anchor-btn text-white"
          type="submit"
          @click.prevent="command"
        >
          Set WAnchor
        </button>
        <button
          class="c-btn c-btn--ghost c-btn--primary c-btn--- anchor-btn"
          type="submit"
          @click.prevent="resetForm"
        >
          Reset Form
        </button>
        <button
          class="c-btn c-btn--ghost c-btn--red c-btn--- anchor-btn"
          type="submit"
          @click.prevent="removeAnchor"
        >
          Remove WAnchor
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import CommandButton from './CommandButton.vue';
import anchorIcon from '@/components/editor/extensions/WAnchorExtension/assets/images/W-anchor_icon.svg';
import anchorIconDisabled from '@/components/editor/extensions/WAnchorExtension/assets/images/W-anchor_icon-disabled.svg';

const props = defineProps({
  isTextSelected: { type: Boolean, default: false },
  editorInstance: { type: Object, default: () => {} },
});

const type = ref('wAnchor');

const state = reactive({
  anchorPopUp: false,
  id: null,
});

const toggleAnchorPopUp = () => {
  state.anchorPopUp = !state.anchorPopUp;
};

const resetForm = () => {
  state.id = null;
};

const command = () => {
  if (state.id) {
    const newId = state.id.toString();
    props.editorInstance
      .chain()
      .focus()
      .toggleWAnchor({
        id: newId,
      })
      .run();
  }
  toggleAnchorPopUp();
  resetForm();
};

const removeAnchor = () => {
  props.editorInstance.chain().focus().removeWAnchor().run();
  toggleAnchorPopUp();
  resetForm();
};

const isDisabled = computed(() => {
  return isEmpty(props.editorInstance) || props.isTextSelected;
});
</script>

<style lang="scss">
.anchor-popup {
  border: 1px solid #cad1d9;
  position: absolute;
  inset: 0px auto auto 0px;
  margin: 0px;
  top: 65px;
  left: auto;
  right: auto;
  background-color: white;
  z-index: 1;
  width: 450px;
  min-height: 100px;
  max-height: fit-content;
  border-radius: 5px;

  .header {
    padding: 10px;
    border-bottom: 1px solid #cad1d9;

    .u-icon {
      cursor: pointer;
    }
  }

  .anchor__form {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 10px;

    .o-layout__item {
      padding: 0px;
      margin-bottom: 10px;

      label {
        font-size: 13px;
        font-weight: 400;
      }

      dd {
        margin: 5px 0 0 0;
      }
      /* Chrome, Safari, Edge, Opera */
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Firefox */
      input[type='number'] {
        -moz-appearance: textfield;
      }
      input::placeholder {
        color: $c-gray-4;
        font-size: 14px;
      }
    }

    .action-container {
      margin-top: auto;
      text-align: end;
      margin-top: 15px;

      .anchor-btn {
        padding: 5px 10px;
        font-size: 14px;
        text-transform: uppercase;
        margin-left: 10px;
      }
    }
  }
}
</style>
