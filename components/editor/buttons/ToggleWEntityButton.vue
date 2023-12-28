<template>
  <command-button
    command-name="Entity"
    action-name="Toggle wEntity"
    :type="type"
    :disabled="!isTextSelected"
    :editor-instance="editorInstance"
    @command-function="toggleWEntityPopUp"
  />

  <div v-if="state.entityPopUp" class="entity-popup">
    <div class="header o-flex o-flex--between o-flex--middle">
      <span>Insert wEntity Attributes</span>
      <i class="u-icon" @click.prevent="toggleWEntityPopUp">close</i>
    </div>

    <form class="entity__form">
      <dl class="o-layout__item">
        <dt>
          <label> Type </label>
        </dt>
        <dd>
          <select v-model="state.entityType" class="entity-type-select">
            <option v-for="entity in entityTypes" :key="entity" :value="entity">
              {{ entity }}
            </option>
          </select>
        </dd>
      </dl>
      <dl class="o-layout__item">
        <dt>
          <label> Value </label>
        </dt>
        <dd>
          <input
            id="title"
            v-model="state.value"
            class="title-input"
            type="text"
            placeholder="Enter entity value here"
          />
        </dd>
      </dl>

      <div class="action-container">
        <button
          class="c-btn c-btn--primary c-btn--- entity-btn text-white"
          type="submit"
          @click.prevent="command"
        >
          Toggle WEntity
        </button>
        <button
          class="c-btn c-btn--ghost c-btn--primary c-btn--- entity-btn"
          type="submit"
          @click.prevent="resetForm"
        >
          Reset Form
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { entityTypes } from '../utils';
import CommandButton from './CommandButton.vue';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
  isTextSelected: { type: Boolean, default: false },
});

const type = ref('wEntity');

const state = reactive({
  entityPopUp: false,
  value: null,
  entityType: null,
});

const toggleWEntityPopUp = () => {
  state.entityPopUp = !state.entityPopUp;
};

const resetForm = () => {
  state.value = null;
  state.entityType = null;
};

const command = () => {
  if (state.entityType && state.value) {
    props.editorInstance
      .chain()
      .focus()
      .toggleWEntity({
        type: state.entityType,
        value: state.value,
      })
      .run();

    toggleWEntityPopUp();
    resetForm();
  }
};
</script>

<style lang="scss">
.entity-popup {
  border: 1px solid #cad1d9;
  position: absolute;
  inset: 0px auto auto 0px;
  margin: 0px;
  top: 45px;
  background-color: white;
  z-index: 1;
  width: 400px;
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

  .entity__form {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 10px;

    .entity-type-select {
      -webkit-appearance: auto;
    }

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

      input::placeholder {
        color: $c-gray-4;
        font-size: 14px;
      }
    }

    .action-container {
      margin-top: auto;
      text-align: end;
      margin-top: 15px;

      .entity-btn {
        padding: 5px 10px;
        font-size: 14px;
        text-transform: uppercase;
        margin-left: 10px;
      }
    }
  }
}
</style>
