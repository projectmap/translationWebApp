<script setup>
import isEmpty from 'lodash/isEmpty';
import first from 'lodash/first';
import Modal from '../../../structure/Modal.vue';
import ProcessingModal from '../../new-project/ProcessingModal.vue';
import { userAlertStore } from '~/store';
import { fetchAPI, storeAPI, updateAPI } from '~/helpers/apiCore';
import FilterComponent from '~/components/project-list/Filter';
import { camelCase } from '~/helpers/Util';

const props = defineProps({
  continent: { type: Object },
  languages: { type: Array, default: () => [] },
  unavailableLanguages: { type: Array, default: () => [] },
  originalWorks: { type: Array, default: () => [] },
  types: { type: Array, default: () => [] },
  currentStep: { type: Number, default: 1 },
  title: { type: String, default: '' },
  abbreviation: { type: String, default: '' },
  selectedOriginalWork: { type: Array, default: () => {} },
  selectedLanguage: { type: Array, default: () => {} },
  selectedUnavailableLanguage: { type: Array, default: () => {} },
  selectedBook: { type: Array, default: () => {} },
  selectedEditPurpose: { type: String, default: 'translation' },
  selectedBookType: { type: String, default: 'sentence' },
  isTitleValid: { type: Boolean },
  isAbbrValid: { type: Boolean },
  showTitleValidation: { type: Boolean },
  validatingTitle: { type: Boolean },
  validatingAbbr: { type: Boolean },
  showAbbrValidation: { type: Boolean },
  isWorkValid: { type: Boolean },
  validatingWork: { type: Boolean },
  showWorkValidation: { type: Boolean },
  action: { type: String, default: 'create' },
  languageSearchLimit: { type: Number },
  languageOptionsCount: { type: Number },
  currentLanguageLength: { type: Number },
  isLanguageLoading: { type: Boolean },
  predefinedBookType: { type: String, default: null },
  predefinedBookAbbr: { type: String, default: null },
});

const state = reactive({
  showAddNewLanguageModal: false,
  isLanugageSumbitDisabled: true,
  pending: false,
  languageCode: null,
  languageCodeError: false,
  customAddedLanguage: '',
  selectedMultipleContinents: [],
  editType: [
    {
      name: 'Translation',
      slug: 'translation',
    },
    {
      name: 'Live Editing',
      slug: 'original',
    },
  ],
  bookTypes: [
    { slug: 'sentence', name: 'Sentence' },
    { slug: 'paragraph', name: 'Paragraph' },
  ],
});

const addCustomAddedLanguageDetails = (name) => {
  if (!name) {
    emits('update-filter', 'selectedUnavailableLanguage', null);
  }
  state.customAddedLanguage = name;
};

const alertStore = userAlertStore();

const handleOpenAddNewLanguageModal = () => {
  state.showAddNewLanguageModal = true;
  emits('update-fetchCurrentlyAvailableLanguagesOnlyFlag', false);
  emits('update-search-limit', 20);
};

const closeAddNewLanguageModal = () => {
  emits('update-fetchCurrentlyAvailableLanguagesOnlyFlag', true);
  state.showAddNewLanguageModal = false;
  state.languageCode = null;
  emits('update-filter', 'selectedUnavailableLanguage', null);
  emits('update-search-limit', 20);
};

watch(
  () => [props.selectedUnavailableLanguage, state.customAddedLanguage],
  () => {
    if (props.selectedUnavailableLanguage || state.customAddedLanguage.length) {
      state.languageCode = props.selectedUnavailableLanguage?.code;

      state.isLanugageSumbitDisabled = false;
    } else {
      state.isLanugageSumbitDisabled = true;
    }
  }
);

const iso6393Pattern = /^[a-z]{3}$/;
function isValidISO6393(code) {
  return iso6393Pattern.test(code);
}

const submitNewLanguageData = async () => {
  if (!isValidISO6393(state.languageCode)) {
    state.languageCodeError = true;
  } else {
    state.languageCodeError = false;
    let languageToAdd = {};

    if (
      props.selectedUnavailableLanguage &&
      props.selectedUnavailableLanguage.name === state.customAddedLanguage
    ) {
      languageToAdd = {
        ...props.selectedUnavailableLanguage,
        continent: state.selectedMultipleContinents,
        code: state.languageCode,
        slug: state.languageCode,
        available: true,
      };
    } else {
      languageToAdd = {
        continent: state.selectedMultipleContinents,
        name: state.customAddedLanguage,
        code: state.languageCode,
        slug: state.languageCode,
        available: true,
      };
    }

    state.pending = true;

    if (
      props.selectedUnavailableLanguage &&
      props.selectedUnavailableLanguage.name === state.customAddedLanguage
    ) {
      try {
        const res = await updateAPI(
          `/languages-obj/${languageToAdd.id}/`,
          languageToAdd
        );
        if (
          res?.name === props.selectedUnavailableLanguage.name &&
          res?.code === props.selectedUnavailableLanguage.code
        ) {
          const message = `${props.selectedUnavailableLanguage.name} has been successfully added as a new language.`;
          alertStore.new({
            message,
            color: 'green',
            duration: 3000,
          });
          closeAddNewLanguageModal();
          emits('update-fetchCurrentlyAvailableLanguagesOnlyFlag', true);
        }
        state.pending = false;
      } catch (e) {
        console.error(e);
        state.pending = false;
      }
    } else {
      try {
        const res = await storeAPI('/languages-obj/', languageToAdd);
        if (res?.id !== undefined) {
          const message = `${res.name} has been successfully added as a new language.`;
          alertStore.new({
            message,
            color: 'green',
            duration: 3000,
          });
          closeAddNewLanguageModal();
          emits('update-fetchCurrentlyAvailableLanguagesOnlyFlag', true);
        }
        state.pending = false;
      } catch (e) {
        console.error(e);
        state.pending = false;
      }
    }
  }
};

const emits = defineEmits([
  'update-unique-checker',
  'update-filter',
  'update-form-data',
  'update-fetchCurrentlyAvailableLanguagesOnlyFlag',
  'update-search-limit',
]);

const validation = inject('validation');

const checkForWorkValidation = computed(() => {
  return props.selectedOriginalWork?.id + '-' + props.selectedLanguage?.code;
});

let validateWorkTimeout;
const validateWork = () => {
  if (props.selectedOriginalWork?.id && props.selectedLanguage?.code) {
    clearTimeout(validateWorkTimeout);

    validateWorkTimeout = setTimeout(() => {
      emits('update-unique-checker', 'validatingWork', true);
      emits('update-unique-checker', 'showWorkValidation', true);
      fetchAPI(
        `check-work/?original=${props.selectedOriginalWork?.id}&language=${props.selectedLanguage?.code}`
      )
        .then((response) => {
          if (response?.exists) {
            emits('update-unique-checker', 'isWorkValid', false);
          } else {
            emits('update-unique-checker', 'isWorkValid', true);
          }
          emits('update-unique-checker', 'validatingWork', false);
        })
        .catch(() => {
          emits('update-unique-checker', 'validatingWork', false);
        });
    }, 300);
  }
};

watch(checkForWorkValidation.value, (newValue) => {
  if (newValue) {
    validateWork();
  }
});

// A method that is called when the user selects an option from the dropdown.
const onUpdate = (key, value) => {
  switch (key) {
    case 'original-work': {
      emits('update-filter', 'selectedOriginalWork', value);

      if (value?.id) {
        emits('update-form-data', 'original', value?.id);

        if (!isEmpty(value?.bookScope)) {
          emits('update-filter', 'selectedBookType', first(value?.bookScope));
          emits('update-form-data', 'bookType', first(value?.bookScope));
        }
      } else {
        emits('update-form-data', 'title', null);
        emits('update-form-data', 'bookType', null);
        emits('update-form-data', 'original', null);
        emits('update-form-data', 'abbreviation', null);
        emits('update-unique-checker', 'showAbbrValidation', false);
        emits('update-unique-checker', 'showTitleValidation', false);
      }
      break;
    }

    case 'language': {
      emits('update-filter', 'selectedLanguage', value);

      if (value) {
        emits('update-form-data', 'language', value?.code);
        emits('update-form-data', 'language_obj', value?.id);
      } else {
        emits('update-form-data', 'language', null);
        emits('update-form-data', 'language_obj', null);
      }
      break;
    }

    case 'unavailableLanguage': {
      emits('update-filter', 'selectedUnavailableLanguage', value);

      break;
    }

    case 'type': {
      emits('update-filter', 'selectedBook', value);

      if (value) {
        emits('update-form-data', 'type', value);
      } else {
        emits('update-form-data', 'type', null);
        emits('update-form-data', 'title', null);
        emits('update-form-data', 'original', null);
        emits('update-filter', 'selectedOriginalWork', null);
        emits('update-form-data', 'abbreviation', null);
      }
      break;
    }

    case 'workType':
      emits('update-filter', 'selectedEditPurpose', value);

      if (value) {
        emits('update-form-data', 'workType', value);

        if (value === 'original') {
          onUpdate('title', null);
          onUpdate('abbreviation', null);
          onUpdate('language', null);
        }
      } else {
        emits('update-form-data', 'workType', null);
      }
      break;

    case 'bookType': {
      emits('update-filter', 'selectedBookType', value);

      if (value) {
        emits('update-form-data', 'bookType', value);
      } else {
        emits('update-form-data', 'bookType', null);
      }
      break;
    }

    case 'title': {
      if (value) {
        emits('update-form-data', 'title', value);
      } else {
        emits('update-form-data', 'title', null);
        emits('update-unique-checker', 'showTitleValidation', false);
      }
      break;
    }

    case 'abbreviation': {
      if (value) {
        emits('update-form-data', 'abbreviation', value);
      } else {
        emits('update-form-data', 'abbreviation', null);
        emits('update-unique-checker', 'showAbbrValidation', false);
      }
      break;
    }

    case 'continent': {
      emits('update-filter', 'selectedContinent', value);

      if (value) {
        emits('update-form-data', 'continent', value);
      } else {
        emits('update-form-data', 'continent', null);
      }
      break;
    }
  }
};

const updateSearchLimit = (limit) => {
  emits('update-search-limit', limit);
};

let inputDebounceTimeout;

const handleInputDebounce = (e, field) => {
  switch (field) {
    case 'title':
      onUpdate(field, e.target.value);
      clearTimeout(inputDebounceTimeout);
      inputDebounceTimeout = setTimeout(() => {
        if (e.target.value.trim() !== '') {
          emits('update-unique-checker', 'validatingTitle', true);
          emits('update-unique-checker', 'showTitleValidation', true);

          fetchAPI(`check-title/?title=${e.target.value}/`)
            .then((response) => {
              if (response?.data?.exists) {
                emits('update-unique-checker', 'isTitleValid', false);
              } else {
                emits('update-unique-checker', 'isTitleValid', true);
              }
              emits('update-unique-checker', 'validatingTitle', false);
            })
            .catch(() => {
              emits('update-unique-checker', 'validatingTitle', false);
            });
        } else {
          emits('update-unique-checker', 'showTitleValidation', false);
        }
      }, 500);
      break;

    case 'abbreviation':
      e.target.value = e.target.value.replace(/\s/g, '');
      onUpdate(field, e.target.value);
      clearTimeout(inputDebounceTimeout);
      inputDebounceTimeout = setTimeout(() => {
        if (e.target.value.trim() !== '') {
          emits('update-unique-checker', 'validatingAbbr', true);
          emits('update-unique-checker', 'showAbbrValidation', true);
          fetchAPI(`check-abbreviation?abbr=${e.target.value}/`)
            .then((response) => {
              if (response?.data?.exists) {
                emits('update-unique-checker', 'isAbbrValid', false);
              } else {
                emits('update-unique-checker', 'isAbbrValid', true);
              }
              emits('update-unique-checker', 'validatingAbbr', false);
            })
            .catch(() => {
              emits('update-unique-checker', 'validatingAbbr', false);
            });
        } else {
          emits('update-unique-checker', 'showAbbrValidation', false);
        }
      }, 500);
      break;
  }
};

watch(
  () => props.continent,
  () => {
    emits('update-filter', 'selectedLanguage', null);
  }
);

watch(
  () => [props.continent, state.showAddNewLanguageModal],
  () => {
    if (state.showAddNewLanguageModal) {
      state.selectedMultipleContinents[0] = props.continent.name;
    }
  }
);

const continentOptions = [
  { slug: 'Africa', name: 'Africa' },
  { slug: 'Antarctica', name: 'Antarctica' },
  { slug: 'Asia', name: 'Asia' },
  { slug: 'Europe', name: 'Europe' },
  { slug: 'North America', name: 'North America' },
  { slug: 'Oceania', name: 'Oceania' },
  { slug: 'South America', name: 'South America' },
];

const addSelectedContinents = (e) => {
  if (e.target.checked) {
    state.selectedMultipleContinents = [
      ...state.selectedMultipleContinents,
      e.target.name,
    ];
  } else {
    state.selectedMultipleContinents = state.selectedMultipleContinents.filter(
      (item) => item !== e.target.name
    );
  }
};
</script>

<template>
  <div class="step">
    <div class="step-container">
      <div class="step-form">
        <h5 v-if="action === 'create'">
          Select a work and the language you would like to start with
        </h5>
        <div v-if="action === 'create'" class="form-row o-flex">
          <div class="form-item form-item--full-width">
            <p class="u-muted u-mb--">Select Type</p>
            <div class="o-flex book-type">
              <label
                v-for="(type, index) in types"
                :key="index"
                class="o-flex o-flex--middle radio-btn"
              >
                <input
                  type="radio"
                  :checked="type.slug === selectedBook"
                  :value="type.slug"
                  :disabled="
                    predefinedBookType && predefinedBookType !== type.slug
                  "
                  @input="(e) => onUpdate('type', e.target.value)"
                />
                <span> {{ type.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <modal
          :open="state.showAddNewLanguageModal"
          custom-classes="c-modal--completion c-modal--add-language"
        >
          <processing-modal v-if="state.pending" />
          <div v-else>
            <div class="header o-flex o-flex--middle">
              <h4>Add Language</h4>
              <button
                class="close-btn"
                @click.prevent="closeAddNewLanguageModal"
              >
                <i class="u-icon">close</i>
              </button>
            </div>
            <div class="body">
              <div class="form-row o-flex">
                <div class="form-item form-item--full-width">
                  <p class="u-muted u-mb--">Name</p>
                  <filter-component
                    label="Select Language"
                    :input-with-dropdown="true"
                    :shadow="false"
                    :outline="true"
                    :options="unavailableLanguages"
                    :search-limit="props.languageSearchLimit"
                    :options-count="props.languageOptionsCount"
                    :current-option-length="props.currentLanguageLength"
                    :is-language-loading="props.isLanguageLoading"
                    :current="selectedUnavailableLanguage"
                    :selected-continent="props.continent?.name"
                    :fetch-available-languages="false"
                    :allow-all="false"
                    :limit-label="false"
                    search
                    clearable
                    :show-loader="validatingWork"
                    :error="!isWorkValid"
                    :language-module="true"
                    module="project-creation"
                    @update:current="onUpdate('unavailableLanguage', $event)"
                    @update-search-limit="updateSearchLimit"
                    @update-custom-added-language="
                      addCustomAddedLanguageDetails
                    "
                  />
                </div>
              </div>

              <div class="form-row o-flex">
                <div class="form-item form-item--full-width">
                  <p class="u-muted u-mb--">Code</p>

                  <input
                    id="lang-code"
                    v-model="state.languageCode"
                    maxlength="3"
                    minlength="3"
                    class="c-input"
                    type="text"
                  />
                  <p v-if="state.languageCodeError" class="error-msg">
                    Please provide valid ISO 639-3 code
                  </p>
                </div>
              </div>

              <div class="form-row o-flex">
                <div class="form-item form-item--full-width">
                  <p class="u-muted u-mb-- bold">Add Other Continents</p>
                  <div
                    v-for="continentOption in continentOptions"
                    :key="continentOption.slug"
                    class="options-container"
                  >
                    <h6 class="continent-options u-muted u-mb--">
                      {{ continentOption.name }}
                    </h6>
                    <br />
                    <input
                      :id="continentOption.slug"
                      class="checkbox-input"
                      :disabled="props.continent.name === continentOption.name"
                      type="checkbox"
                      :name="continentOption.slug"
                      :value="continentOption.slug"
                      :checked="
                        props.continent.name === continentOption.name ||
                        state.selectedMultipleContinents.includes(
                          continentOption.name
                        )
                      "
                      @input="
                        (e) => {
                          addSelectedContinents(e);
                        }
                      "
                    />
                    <h6></h6>
                  </div>
                </div>
              </div>

              <div class="add-language-btn-container">
                <button
                  class="c-btn--ghost c-btn--primary"
                  @click.prevent="closeAddNewLanguageModal"
                >
                  Cancel
                </button>
                <button
                  class="c-btn--dark c-btn--primary"
                  :class="{ 'disabled-btn': state.isLanugageSumbitDisabled }"
                  :disabled="state.isLanugageSumbitDisabled"
                  @click.prevent="submitNewLanguageData"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </modal>
        <div v-if="action === 'create'" class="form-row o-flex">
          <div class="form-item form-item--full-width">
            <p class="u-muted u-mb--">Choose Continent</p>
            <filter-component
              label="Select"
              :shadow="false"
              :outline="true"
              :options="continentOptions"
              :current="props.continent"
              :allow-all="false"
              :limit-label="false"
              module="project-creation"
              @update:current="onUpdate('continent', $event)"
            />
          </div>
        </div>

        <div
          v-if="action === 'create' && selectedEditPurpose === 'translation'"
          class="form-row o-flex"
        >
          <div class="form-item form-item--full-width">
            <div class="trans-lang-label-btn">
              <p class="u-muted u-mb--">Translation Language</p>
              <button
                :disabled="!props.continent"
                class="add-lang-btn-text"
                :class="{ 'disable-add-btn': !props.continent }"
                @click="handleOpenAddNewLanguageModal"
              >
                Add
                <span class="u-icon">add</span>
              </button>
            </div>

            <filter-component
              label="Select"
              :shadow="false"
              :outline="true"
              :options="props.continent ? languages : []"
              :search-limit="props.languageSearchLimit"
              :options-count="props.languageOptionsCount"
              :current-option-length="props.currentLanguageLength"
              :is-language-loading="props.isLanguageLoading"
              :current="selectedLanguage"
              :selected-continent="props.continent?.name"
              :allow-all="false"
              :limit-label="false"
              search
              clearable
              :show-loader="validatingWork"
              :error="!isWorkValid"
              :language-module="true"
              module="project-creation"
              @update:current="onUpdate('language', $event)"
              @update-search-limit="updateSearchLimit"
            />
            <p
              v-if="
                validation.$dirty &&
                validation.translationFormData.language_obj.$invalid
              "
              class="c-form__error--small"
            >
              Language is required
            </p>
            <p v-else-if="!isWorkValid" class="c-form__error--small">
              Work already exists, please select another language.
            </p>
          </div>
        </div>

        <div v-if="action === 'create'" class="form-row o-flex">
          <div class="form-item form-item--full-width">
            <p class="u-muted u-mb--">Select Original Book</p>
            <div v-if="predefinedBookAbbr && selectedOriginalWork">
              <div class="unqiue-validation-item c-input c-input--outline">
                <input
                  type="text"
                  :value="selectedOriginalWork.name"
                  disabled
                />
              </div>
            </div>
            <template v-else>
              <filter-component
                label="Select"
                :shadow="false"
                :outline="true"
                :limit-label="false"
                :options="originalWorks"
                :current="selectedOriginalWork"
                :allow-all="false"
                search
                clearable
                :show-loader="validatingWork"
                :error="!isWorkValid"
                module="project-creation"
                @update:current="onUpdate('original-work', $event)"
              />
              <p
                v-if="
                  validation.$dirty &&
                  validation.translationFormData.original.$invalid
                "
                class="c-form__error--small"
              >
                Original Work is required
              </p>
              <p v-else-if="!isWorkValid" class="c-form__error--small">
                Work already exists, please select another book.
              </p>
            </template>
          </div>
        </div>

        <div
          v-if="
            action === 'create' &&
            selectedOriginalWork &&
            selectedOriginalWork.bookScope
          "
          class="form-row o-flex"
        >
          <div class="form-item form-item--full-width">
            <p
              v-if="selectedOriginalWork.bookScope.length === 1"
              class="u-muted u-mb--"
            >
              Content Type
            </p>
            <p v-else class="u-muted u-mb--">Select Content Type</p>
            <div class="o-flex content-type">
              <label
                v-for="(type, index) in selectedOriginalWork.bookScope"
                :key="index"
                class="o-flex o-flex--middle radio-btn"
              >
                <input
                  type="radio"
                  :checked="type === selectedBookType"
                  :value="type"
                  @input="(e) => onUpdate('bookType', e.target.value)"
                />
                <span> {{ camelCase(type) }}</span>
              </label>
            </div>
          </div>
        </div>

        <div
          v-if="action === 'create' && selectedOriginalWork"
          class="form-row o-flex"
        >
          <div class="form-item form-item--full-width">
            <p class="u-muted u-mb--">Select Purpose</p>
            <div class="o-flex content-type">
              <label
                v-for="(type, index) in state.editType"
                :key="index"
                class="o-flex o-flex--middle radio-btn"
                :class="{
                  disabled:
                    !selectedOriginalWork.canTranslateOriginal &&
                    type.slug === 'original',
                }"
              >
                <input
                  type="radio"
                  :checked="type.slug === selectedEditPurpose"
                  :value="type.slug"
                  :disabled="
                    !selectedOriginalWork.canTranslateOriginal &&
                    type.slug === 'original'
                  "
                  @input="(e) => onUpdate('workType', e.target.value)"
                />
                <span> {{ type.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <template v-if="selectedEditPurpose === 'translation'">
          <div class="form-row o-flex">
            <div class="form-item form-item--full-width">
              <p v-if="action === 'create'" class="u-muted u-mb--">
                Enter Translated Title
              </p>
              <p v-else class="u-muted u-mb--">Translated Title</p>

              <div
                class="unqiue-validation-item c-input c-input--outline"
                :class="{
                  'c-input--outline-error':
                    showTitleValidation && !isTitleValid,
                }"
              >
                <input
                  type="text"
                  :value="title"
                  @input="
                    (e) => {
                      handleInputDebounce(e, 'title');
                    }
                  "
                />

                <span
                  v-if="validatingTitle"
                  class="c-spinner c-spinner--tiny"
                ></span>
                <span v-else class="mark-container">
                  <span v-if="showTitleValidation">
                    <span v-if="isTitleValid" class="u-icon valid">check</span>
                    <span v-else class="u-icon invalid">close</span>
                  </span>
                </span>
              </div>

              <p
                v-if="
                  validation.$dirty &&
                  validation.translationFormData.title.$invalid &&
                  validation.translationFormData.title.required.$invalid
                "
                class="c-form__error--small"
              >
                Title is required
              </p>
              <p
                v-if="
                  !isTitleValid ||
                  (validation.$dirty &&
                    validation.translationFormData.title.$invalid &&
                    validation.translationFormData.title.titleAlreadyExists
                      .$invalid)
                "
                class="c-form__error--small"
              >
                Title already exists.
              </p>
            </div>
          </div>

          <div class="form-row o-flex">
            <div class="form-item form-item--full-width">
              <p v-if="action === 'create'" class="u-muted u-mb--">
                Add Abbreviation
              </p>
              <p v-else class="u-muted u-mb--">Abbreviation</p>
              <div
                class="unqiue-validation-item c-input c-input--outline"
                :class="{
                  'c-input--outline-error': showAbbrValidation && !isAbbrValid,
                }"
              >
                <input
                  type="text"
                  :value="abbreviation"
                  @input="
                    (e) => {
                      handleInputDebounce(e, 'abbreviation');
                    }
                  "
                />
                <span
                  v-if="validatingAbbr"
                  class="c-spinner c-spinner--tiny"
                ></span>
                <span v-else class="mark-container">
                  <span v-if="showAbbrValidation">
                    <span v-if="isAbbrValid" class="u-icon valid">check</span>
                    <span v-else class="u-icon invalid">close</span>
                  </span>
                </span>
              </div>
              <p
                v-if="
                  validation.$dirty &&
                  validation.translationFormData.abbreviation.$invalid &&
                  validation.translationFormData.abbreviation.required.$invalid
                "
                class="c-form__error--small"
              >
                Abbreviation is required
              </p>
              <p
                v-if="
                  !isAbbrValid ||
                  (validation.$dirty &&
                    validation.translationFormData.abbreviation.$invalid &&
                    validation.translationFormData.abbreviation
                      .abbrAlreadyExists.$invalid)
                "
                class="c-form__error--small"
              >
                Abbreviation already exists.
              </p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.content-type {
  .radio-btn > * {
    min-width: fit-content;
  }
}
.book-type {
  flex-wrap: wrap;
  input {
    width: 10px !important;
  }
  label {
    &:last-child {
      margin-top: 10px;
    }
  }
}

.content-type {
  flex-wrap: wrap;
  input {
    width: 10px !important;
  }
}

.unqiue-validation-item {
  display: flex;
  padding-right: 12px;
  input {
    border: none !important;
    &:focus-visible {
      outline: none !important;
    }
  }

  .valid,
  .invalid {
    font-size: 20px;
  }

  .valid {
    color: green;
  }

  .invalid {
    color: red;
  }

  .mark-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.trans-lang-label-btn {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}
.add-language-btn-container {
  display: flex;
  justify-content: flex-end;
  .c-btn--primary {
    width: 80px;
    height: 40px;
    padding: 0px;
    border-radius: 4px;
  }
  .disabled-btn {
    opacity: 0.4;
  }
  :last-child {
    margin-left: 10px;
  }
}
.add-lang-btn-text {
  font-size: 14px;
  font-weight: 500;
  color: $c-primary-5;
}
.disable-add-btn {
  opacity: 0.4;
}

.code-field-container {
  margin-top: 24px;
}

.error-msg {
  color: red;
}
.continent-selector {
  margin-bottom: 24px;
}

.c-modal--add-language {
  .c-modal__body {
    padding: 0 !important;
  }
  .header {
    padding: 10px 15px;
    border-bottom: 1px solid $c-border;

    h4 {
      margin-bottom: 0px;
    }

    .close-btn {
      margin-left: auto;
      margin-bottom: auto;
      font-size: 20px;
    }
  }

  .body {
    padding: 10px 15px;
  }
}

.radio-btn {
  width: 20%;

  &.disabled {
    input {
      cursor: not-allowed;
    }
    span {
      color: lightgray;
      cursor: not-allowed;
    }
  }
}
.continent-options {
  margin: 0;
  width: 250px;
  font-weight: 500;
}
.options-container {
  display: flex;
  align-items: center;
}
.checkbox-input {
  width: 32px !important;
}
.bold {
  font-weight: 800;
}
</style>
