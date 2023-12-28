<template>
  <command-button
    command-name="wLang"
    command-icon="translate"
    action-name="Toggle wLang"
    :disabled="!isTextSelected"
    :type="type"
    :editor-instance="editorInstance"
    @command-function="toggleWLangPopUp"
  />

  <div v-if="state.wlangPopUp" class="wlang-popup">
    <div class="header o-flex o-flex--between o-flex--middle">
      <span>Insert wLang Attributes</span>
      <i class="u-icon" @click.prevent="toggleWLangPopUp">close</i>
    </div>

    <form class="wlang__form">
      <dl class="o-layout__item">
        <dt>
          <label> Dir </label>
        </dt>
        <dd>
          <select v-model="state.dir" class="wlang-select">
            <option v-for="dir in directions" :key="dir" :value="dir">
              {{ dir }}
            </option>
          </select>
        </dd>
      </dl>
      <dl class="o-layout__item">
        <dt>
          <label> Lang </label>
        </dt>
        <dd>
          <select v-model="state.wlangType" class="wlang-select">
            <option
              v-for="lang in state.languages"
              :key="lang.code"
              :value="lang.code"
            >
              {{ lang.name }}
            </option>
          </select>
        </dd>
      </dl>

      <div class="action-container">
        <button
          class="c-btn c-btn--primary c-btn--- wlang-btn text-white"
          type="submit"
          @click.prevent="command"
        >
          Toggle WLang
        </button>
        <button
          class="c-btn c-btn--ghost c-btn--primary c-btn--- wlang-btn"
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
import { directions } from '../utils';
import CommandButton from './CommandButton.vue';
import { fetchAPI } from '~/helpers/apiCore';

const props = defineProps({
  isTextSelected: { type: Boolean, default: false },
  editorInstance: { type: Object, default: () => {} },
});

const type = ref('wLang');

const state = reactive({
  wlangPopUp: false,
  dir: null,
  wlangType: null,
  languages: null,
});

const toggleWLangPopUp = () => {
  state.wlangPopUp = !state.wlangPopUp;
};

const resetForm = () => {
  state.value = null;
  state.wlangType = null;
};

const command = () => {
  if (state.wlangType && state.dir) {
    props.editorInstance
      .chain()
      .focus()
      .toggleWLang({
        lang: state.wlangType,
        dir: state.dir,
      })
      .run();

    toggleWLangPopUp();
    resetForm();
  }
};

onMounted(async () => {
  const data = await fetchAPI('/languages/');
  if (data) {
    state.languages = data?.languages;
  } else {
    state.languages = [];
  }
});
</script>

<style lang="scss">
.wlang-popup {
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

  .wlang__form {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 10px;

    .wlang-select {
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

      .wlang-btn {
        padding: 5px 10px;
        font-size: 14px;
        text-transform: uppercase;
        margin-left: 10px;
      }
    }
  }
}
</style>
