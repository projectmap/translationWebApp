<template>
  <div class="new-project">
    <div class="new-project__header">
      <h1>Start a Project</h1>
      <p class="common-info-text">
        Select a work that you would like to start the translation process for
      </p>
    </div>
    <div class="new-project__body o-flex o-flex--column o-flex--middle w-100">
      <ul class="new-project__stepper-nav o-flex">
        <li
          v-for="item in state.steps"
          :key="item"
          class="stepper-nav__item o-flex o-flex--column o-flex--middle"
          :class="{
            finished: state.currentStep > item.count,
          }"
          @click.prevent="
            () => {
              state.currentStep > item.count && updateStep(item.count);
            }
          "
        >
          <div
            class="stepper-nav__item-count"
            :class="{
              active: state.currentStep === item.count,
              finished: state.currentStep > item.count,
            }"
          >
            <div
              v-if="
                state.currentStep !== item.count &&
                state.currentStep < item.count
              "
              class="inner-circle"
            ></div>
            <div
              v-if="
                state.currentStep !== item.count &&
                state.currentStep > item.count
              "
              class="u-icon"
            >
              check
            </div>
            <span v-if="state.currentStep === item.count">
              {{ item.count }}</span
            >
          </div>
          <div class="stepper-nav__item-label">
            {{ item.label }}
          </div>
        </li>
      </ul>
      <div class="new-project__stepper o-flex--column">
        <!-- Select Original Work -->
        <original-works
          v-if="state.currentStep === 1"
          :languages="state.languages"
          :is-language-loading="state.isLanguageLoading"
          :language-search-limit="state.languageSearchLimit"
          :language-options-count="state.languageOptionsCount"
          :current-language-length="state.currentLanguagesLenth"
          :unavailable-languages="state.unavailableLanguages"
          :original-works="state.originalWorks"
          :current-step="state.currentStep"
          :title="state.translationFormData.title"
          :types="state.types"
          :selected-original-work="state.selectedOriginalWork"
          :selected-language="state.selectedLanguage"
          :selected-unavailable-language="state.selectedUnavailableLanguage"
          :selected-book="state.selectedBook"
          :selected-edit-purpose="state.selectedEditPurpose"
          :selected-book-type="state.selectedBookType"
          :abbreviation="state.translationFormData.abbreviation"
          :is-title-valid="state.uniqueValidationObj.isTitleValid"
          :is-abbr-valid="state.uniqueValidationObj.isAbbrValid"
          :show-title-validation="state.uniqueValidationObj.showTitleValidation"
          :validating-title="state.uniqueValidationObj.validatingTitle"
          :validating-abbr="state.uniqueValidationObj.validatingAbbr"
          :show-abbr-validation="state.uniqueValidationObj.showAbbrValidation"
          :is-work-valid="state.uniqueValidationObj.isWorkValid"
          :validating-work="state.uniqueValidationObj.validatingWork"
          :show-work-validation="state.uniqueValidationObj.showWorkValidation"
          :continent="state.translationFormData.continent"
          :predefined-book-type="predefinedBookType"
          :predefined-book-abbr="predefinedBookAbbr"
          @update-fetchCurrentlyAvailableLanguagesOnlyFlag="
            updateFetchCurrentlyAvailableLanguagesOnlyFlag
          "
          @update-step="updateStep"
          @update-form-data="updateData"
          @update-filter="updateFilters"
          @update-unique-checker="updateUniqueChecker"
          @update-search-limit="updateSearchLimit"
        />

        <!-- Division, union and publishers -->
        <admins-selection
          v-if="state.currentStep === 2"
          :divisions="state.divisions"
          :unions="state.unions"
          :publishers="state.publishers"
          :current-step="state.currentStep"
          :loading="state.isLoading"
          :selected-division="state.selectedDivision"
          :selected-union="state.selectedUnion"
          :selected-publisher="state.selectedPublisher"
          :selected-union-conference="state.selectedUnionConference"
          :unions-conference-list="state.unionsConferenceList"
          @clear-filter-options="clearFilterOptions"
          @fetch-divisions="getDivisions"
          @fetch-unions="getUnions"
          @fetch-publishers="getPublishers"
          @update-step="updateStep"
          @update-form-data="updateData"
          @update-filter="updateFilters"
        />
      </div>
    </div>
    <div class="new-project__footer">
      <div class="new-project__footer-inner">
        <button
          class="c-btn--ghost c-btn--red"
          :disabled="state.submittingData"
          @click.prevent="resetForm"
        >
          Reset
        </button>
        <button
          v-if="state.currentStep > 1"
          class="c-btn--ghost c-btn--primary"
          :disabled="state.submittingData"
          @click.prevent="prevStep"
        >
          Back
        </button>
        <button
          class="c-btn--dark c-btn--primary"
          :disabled="!isAdmin"
          @click.prevent="submitData"
        >
          <span v-if="state.currentStep === state.steps.length">
            <div
              v-if="state.submittingData"
              class="c-spinner c-spinner--small"
            ></div>
            <span v-else>Confirm</span>
          </span>
          <span v-else> Next </span>
        </button>
      </div>
    </div>
    <modal
      :open="isModalOpen"
      :custom-classes="'c-modal--project-creation c-modal--completion'"
    >
      <processing-modal v-if="state.submittingData" />
      <completion-modal
        v-else-if="state.bookCreated"
        :new-translation-link="state.newTranslationLink"
        :contributors-link="state.contributorsLink"
      />
      <error-modal
        v-else-if="state.error"
        resubmit
        @toggle-modal="() => (state.showModal = false)"
        @submit-approval="submitData"
      >
        <p v-if="state.errorMessage" class="u-mb-- info-text">
          {{ state.errorMessage }}
        </p>
        <p v-else class="u-mb-- info-text">
          Oops! Something went wrong and we were unable to process your request.
        </p>
        <p class="u-mb-- sub-info-text">Please try again later.</p>
      </error-modal>
    </modal>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';
import first from 'lodash/first';
import useVuelidate from '@vuelidate/core';
import { required, requiredIf } from '@vuelidate/validators';

import Modal from '~/components/structure/Modal';
import { useUserStore, userAlertStore } from '~/store';
import { fetchAPI, storeAPI } from '~/helpers/apiCore';
import ErrorModal from '~/components/modal-content/timeline/ErrorModal.vue';
import CompletionModal from '~/components/translate/new-project/CompletionModal.vue';
import ProcessingModal from '~/components/translate/new-project/ProcessingModal.vue';
import OriginalWorks from '~/components/translate/new-project/forms/OriginalWorks.vue';
import AdminsSelection from '~/components/translate/new-project/forms/AdminsSelection.vue';

const state = reactive({
  types: [],
  isLoading: false,
  currentStep: 1,
  originalWorks: [],
  languages: [],
  unavailableLanguages: [],
  isLanguageLoading: false,
  divisions: [],
  unions: [],
  publishers: [],
  translationFormData: {
    type: null,
    bookType: 'sentence',
    original: null,
    language: null,
    language_obj: null,
    title: null,
    abbreviation: null,
    division: null,
    union: null,
    publishing_house: null,
    apply_funding: false,
    translate: true,
    publish: false,
    ebook: false,
    audio_book: false,
    approver: null,
    continent: null,
    workType: null,
  },
  fetchCurrentlyAvailableLanguagesOnly: true,
  languageSearchLimit: 20,
  currentLanguagesLenth: 0,
  languageOptionsCount: 0,
  submittingData: false,
  showModal: false,
  bookCreated: false,
  error: false,
  errorMessage: null,
  newTranslationLink: null,
  contributorsLink: null,
  selectedOriginalWork: null,
  selectedLanguage: null,
  selectedUnavailableLanguage: null,
  selectedBook: null,
  selectedEditPurpose: 'translation',
  selectedBookType: 'sentence',
  selectedDivision: null,
  selectedUnion: null,
  selectedPublisher: null,
  selectedUnionConference: null,
  unionsConferenceList: [],
  steps: [
    {
      count: 1,
      label: 'Select a work',
    },
    {
      count: 2,
      label: 'Select Organization',
    },
  ],
  uniqueValidationObj: {
    isTitleValid: true,
    isAbbrValid: true,
    showTitleValidation: false,
    validatingTitle: false,
    validatingAbbr: false,
    showAbbrValidation: false,
    isWorkValid: true,
    validatingWork: false,
    showWorkValidation: false,
  },
});

const router = useRouter();

const userStore = useUserStore();
const { isAdmin } = storeToRefs(userStore);

const alertStore = userAlertStore();

const runtimeConfig = useRuntimeConfig();
const { cpanelUrl } = runtimeConfig.public;

const abbrAlreadyExists = () => {
  return state.uniqueValidationObj.isAbbrValid;
};

const titleAlreadyExists = () => {
  return state.uniqueValidationObj.isTitleValid;
};

const predefinedBookType = computed(() => {
  return router?.currentRoute.value?.query?.type;
});

const predefinedBookAbbr = computed(() => {
  return router?.currentRoute.value?.query?.abbr;
});

const rules = computed(() => ({
  translationFormData: {
    title: {
      required: requiredIf(function () {
        return state.selectedEditPurpose === 'translation';
      }),
      titleAlreadyExists,
    },
    abbreviation: {
      required: requiredIf(function () {
        return state.selectedEditPurpose === 'translation';
      }),
      abbrAlreadyExists,
    },
    type: { required },
    bookType: { required },
    original: { required },
    language_obj: {
      required: requiredIf(function () {
        return state.selectedEditPurpose === 'translation';
      }),
    },
    division: {
      required: requiredIf(function () {
        return state.currentStep === 2;
      }),
    },
  },
}));

const v$ = useVuelidate(rules, state);

provide('validation', v$);

// Getting the languages from the API and setting them to the languages variable.
const getLanguageOptions = async () => {
  state.isLanguageLoading = true;
  const searchLanugageAPIURL = state.translationFormData.continent?.name
    ? `languages-obj/?limit=${state.languageSearchLimit}&available=${
        state.fetchCurrentlyAvailableLanguagesOnly
      }&continent=${state.translationFormData.continent?.name.toLowerCase()}`
    : `languages-obj/?limit=${state.languageSearchLimit}&available=${state.fetchCurrentlyAvailableLanguagesOnly}`;
  const data = await fetchAPI(searchLanugageAPIURL);
  state.languageOptionsCount = data?.count;
  state.currentLanguagesLenth = data?.data?.length;
  const options = data?.data?.map((a) => {
    if (!a.slug) {
      a.slug = a.code;
    }
    return a;
  });
  if (state.fetchCurrentlyAvailableLanguagesOnly) {
    state.languages = options;
  } else {
    state.unavailableLanguages = options;
  }
  state.isLanguageLoading = false;
};

const getFilterOptions = async () => {
  const { data } = await fetchAPI('translations/filters/');
  state.types = data.types;
};

const clearFilterOptions = (type) => {
  switch (type) {
    case 'division':
      state.divisions = [];
      break;

    case 'unions':
      state.unions = [];
      break;

    case 'publishers':
      state.publishers = [];
      break;

    default:
      state.divisions = [];
      state.unions = [];
      state.publishers = [];
  }
};

const resetFormRelatedValue = () => {
  state.isLoading = false;
  state.originalWorks = [];
  state.languages = [];
  state.translationFormData = {
    type: null,
    bookType: 'sentence',
    original: null,
    language: null,
    language_obj: null,
    title: null,
    abbreviation: null,
    division: null,
    union: null,
    publishing_house: null,
    apply_funding: false,
    translate: false,
    publish: false,
    ebook: false,
    audio_book: false,
    approver: null,
  };
  state.submittingData = false;
  state.error = false;
  state.bookCreated = false;
  state.selectedOriginalWork = null;
  state.selectedLanguage = null;
  state.selectedBook = null;
  state.selectedEditPurpose = 'translation';
  state.selectedBookType = 'sentence';
  state.selectedDivision = null;
  state.selectedUnion = null;
  state.selectedPublisher = null;
  state.selectedUnionConference = null;
  state.unionsConferenceList = [];
  state.errorMessage = null;
  state.uniqueValidationObj = {
    isTitleValid: true,
    isAbbrValid: true,
    showTitleValidation: false,
    validatingTitle: false,
    validatingAbbr: false,
    showAbbrValidation: false,
    isWorkValid: true,
    validatingWork: false,
    showWorkValidation: false,
  };
};

const resetForm = () => {
  if (
    router?.currentRoute.value?.query?.abbr ||
    router?.currentRoute.value?.query?.type
  ) {
    router.push('/new-project');
  }
  state.currentStep = 1;
  resetFormRelatedValue();
};

const resetAllDatas = () => {
  state.currentStep = '';
  resetFormRelatedValue();
};

const isModalOpen = computed(() => {
  return state.showModal;
});

const disableSubmitAction = computed(() => {
  return (
    state.uniqueValidationObj.validatingAbbr ||
    state.uniqueValidationObj.validatingTitle ||
    !state.uniqueValidationObj.isAbbrValid ||
    !state.uniqueValidationObj.isTitleValid
  );
});

// Getting the original works from the API
// and setting it to the originalWorks variable.
const getOriginalWorksOptions = async (params) => {
  const data = await fetchAPI(`originals/`, {
    params: {
      type: params?.type,
      abbreviation: params?.abbr,
    },
  });
  const options = data?.results?.map((a) => {
    if (!a.slug) {
      a.slug = a.id;
    }
    a.name = a.title;
    return a;
  });
  if (params?.abbr) {
    state.originalWorks = [...state.originalWorks, ...options];
    return first(options);
  }
  state.originalWorks = options;
};

// This is a method that is used to get the divisions
// from the API and setting it to the divisions variable.
const getDivisions = async () => {
  state.isLoading = true;
  try {
    const { data } = await fetchAPI('admin/division/');

    const options = data?.map((a) => {
      if (!a.slug) {
        a.slug = a.domain;
      }
      a.name = `${a.domain} - ${a.name}`;

      return a;
    });
    state.divisions = options;
    state.isLoading = false;
  } catch (e) {
    state.isLoading = false;
  }
};

// This is a method that is used to get the unions
// from the API and setting it to the unions variable.
const getUnions = async (divisionId) => {
  state.isLoading = true;
  try {
    state.unions = [];
    const { data } = await fetchAPI(
      `admin/division/${divisionId}/union?limit=100`
    );
    const options = data?.map((a) => {
      if (!a.slug) {
        a.slug = a.domain;
      }
      a.name = `${a.domain} - ${a.name}`;

      return a;
    });
    state.unions = options;
    state.isLoading = false;
  } catch (e) {
    state.isLoading = false;
  }
};

// This is a method that is used to get the publishers
// from the API and setting it to the publishers variable.
const getPublishers = async (apiUrl) => {
  state.isLoading = true;
  try {
    state.publishers = [];
    const { data } = await fetchAPI(apiUrl);
    const options = data?.map((a) => {
      if (!a.slug) {
        a.slug = a.domain;
      }
      a.name = `${a.domain} - ${a.name}`;

      return a;
    });
    state.publishers = options;
    state.isLoading = false;
  } catch (e) {
    state.isLoading = false;
  }
};

const updateFetchCurrentlyAvailableLanguagesOnlyFlag = (status) => {
  state.fetchCurrentlyAvailableLanguagesOnly = status;
};

// Updating the translationFormData object with the key and value passed in.
const updateData = (key, value) => {
  state.translationFormData[key] = value;
  if (key === 'type') {
    if (value) {
      getOriginalWorksOptions({ type: value });
    } else {
      state.originalWorks = [];
    }
  }
};

const updateFilters = (key, value) => {
  state[key] = value;
};

const updateSearchLimit = (limit) => {
  state.languageSearchLimit = limit;
};

const updateUniqueChecker = (key, value) => {
  state.uniqueValidationObj[key] = value;
};

const updateStep = (currentStep) => {
  state.currentStep = currentStep;
  v$.value.$reset();
};

// A method that is called when the user clicks the submit button. It is validating the form data
// and then submitting it to the server.
const submitData = async () => {
  v$.value.$touch();

  if (v$.value.$invalid || disableSubmitAction.value) return;

  if (state.currentStep === state.steps.length) {
    state.submittingData = true;
    state.showModal = true;
    state.bookCreated = false;
    state.error = false;
    state.errorMessage = null;
    try {
      const response = await storeAPI('translations/', {
        ...state.translationFormData,
      });

      state.submittingData = false;

      if (response?.id) {
        state.bookCreated = true;
        state.newTranslationLink = `translate/${response?.language?.toLowerCase()}/${response?.abbreviation?.toLowerCase()}/chapter/1/`;
        state.contributorsLink = `${cpanelUrl}/admin/org/translations/edit/${response?.id}`;
      } else {
        state.bookCreated = false;
        state.error = true;
        state.errorMessage = response?.data?.message;
      }
    } catch (e) {
      state.submittingData = false;
      state.bookCreated = false;
      state.error = true;
    }
  } else {
    updateStep(state.currentStep + 1);
  }
};

const prevStep = () => {
  state.currentStep = state.currentStep - 1;
  v$.value.$reset();
};

/**
 * Set book type if there is optional query for book type in route
 * USE CASE - this case occurs if the user redirects to the project creation
 * page from the book library itself.
 * @param {string} workType
 */
const quickSelectBookTypeOnRouteQuery = (workType) => {
  const bookType = workType;
  updateFilters('selectedBook', bookType);
  updateData('type', bookType);
};

/**
 * Set original work if there is optional query for book abbr in route
 * USE CASE - this case occurs if the user redirects to the project creation
 * page from the book library itself.
 * @param {object} works
 * @param {string} abbr
 */
const quickSelectOriginalWorkOnRouteQuery = async (works, abbr) => {
  let filteredBook;
  const originalBooks = works;
  const bookAbbr = abbr;
  const book = originalBooks?.find(
    (book) => book?.abbreviation.toLowerCase() === bookAbbr.toLowerCase()
  );

  if (book?.id) {
    filteredBook = book;
  } else {
    filteredBook = await getOriginalWorksOptions({ abbr: bookAbbr });
  }

  if (filteredBook?.id) {
    updateFilters('selectedOriginalWork', filteredBook);
    updateData('original', filteredBook?.id);
  } else {
    alertStore.new({
      message:
        'We are unable to find the book in our database. Kindly verify your selection or consider choosing another book.',
      color: 'red',
      duration: 4000,
    });
  }
};

onBeforeMount(() => {
  if (isAdmin.value) {
    getLanguageOptions();
    getFilterOptions();
    state.currentStep = 1;
  } else {
    router.push('/dashboard');
  }
});

onMounted(() => {
  if (router?.currentRoute.value?.query?.type) {
    quickSelectBookTypeOnRouteQuery(router?.currentRoute.value?.query?.type);
  }
});

onUnmounted(() => {
  clearFilterOptions();
  resetAllDatas();
});

watch(
  () => [state.originalWorks, router?.currentRoute.value?.query?.abbr],
  (value) => {
    if (!isEmpty(value[0]) && value[1]) {
      quickSelectOriginalWorkOnRouteQuery(value[0], value[1]);
    }
  }
);

watch(
  () => [
    state.translationFormData.continent,
    state.fetchCurrentlyAvailableLanguagesOnly,
    state.languageSearchLimit,
  ],
  () => {
    getLanguageOptions();
  }
);
</script>

<style lang="scss">
.new-project {
  background: #f8f8f8;

  .common-info-text {
    color: rgba($color: #272727, $alpha: 0.8);
    font-weight: 400;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0.005em;
  }

  .new-project__header {
    padding: 50px 130px 0 130px;
    text-align: center;

    h1 {
      font-weight: 400;
      line-height: 135%;
      letter-spacing: -0.0075em;
      margin-bottom: 7px;
    }
  }

  .new-project__body {
    padding: 0 130px;
    margin-top: 64px;

    .new-project__stepper-nav {
      list-style: none;

      .stepper-nav__item {
        position: relative;

        .stepper-nav__item-count {
          height: 40px;
          width: 40px;
          border-radius: 50%;
          font-weight: 600;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          // margin-right: 16px;
          border: 1px solid #dbdbdb;

          .inner-circle {
            height: 12px;
            width: 12px;
            background-color: #dbdbdb;
            border-radius: 50%;
          }

          &.active {
            background-color: #e3f5e9;
            border: 1px dashed #31bf60;

            .inner-circle {
              background-color: #31bf60;
            }
          }

          &.finished {
            background-color: #e3f5e9;
            border: 1px solid #31bf60;
            cursor: pointer;

            .u-icon {
              color: #31bf60;
            }
          }
        }

        .stepper-nav__item-label {
          margin-top: 10px;
          font-size: 14px;
          font-weight: 400;
          line-height: 21px;
          letter-spacing: 0.0025em;
          color: #27272785;
          text-align: center;
          width: 100px;
        }

        &:not(:last-child) {
          margin-right: 190px;
        }

        &:not(:last-child):after {
          position: absolute;
          content: '';
          height: 2px;
          background: #d9d9d9;
          width: 250px;
          left: 70px;
          top: 20px;
        }

        &.finished {
          &:not(:last-child):after {
            background: #31bf60;
          }
        }
      }
    }

    .new-project__stepper {
      margin-top: 40px;

      .step {
        display: flex;
        justify-content: center;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 64px;
        position: relative;
        width: fit-content;

        .step-container {
          .step-form {
            width: 580px;
            padding: 50px;

            h5 {
              font-size: 24px;
              font-weight: 600;
              line-height: 34px;
              letter-spacing: 0em;
              color: rgba(39, 39, 39, 0.8);
            }

            .team-create-form {
              .form-item {
                min-width: 100%;
                padding-right: 0;
              }
            }
          }
        }

        &.funding-step {
          .step-container {
            .step-form {
              .form-row {
                &:not(:last-child) {
                  margin-bottom: 40px;
                }
              }
            }
          }
        }

        &.levels-step {
          &.dynamicHeight {
            &:not(:last-child)::before {
              width: 140px;
              top: 125px;
              left: -49px;
            }
          }
        }
      }
    }
  }

  .new-project__footer {
    padding: 15px 114px;
    background: #ffffff;
    display: flex;
    justify-content: flex-end;

    .new-project__footer-inner {
      width: 100%;
      max-width: 1900px;
      text-align: right;
      margin-left: auto;
      margin-right: auto;
    }

    .c-btn--ghost {
      margin-right: 15px;
      cursor: pointer;
      border-radius: 4px;
    }
  }
}

.new-project__footer,
.c-modal--project-creation__footer {
  display: flex;

  .c-header__link {
    color: $c-primary-6;
    transition: color $global-transition;
    margin-right: 24px;

    &.c-header__link-btn {
      border: 1px solid;
      border-color: $c-primary-6;
      border-radius: 4px;
      width: 78px;
      height: 49px;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.c-project-creation-filter {
  max-height: 300px;
}

.c-modal__body {
  padding: 12px 20px;
}

.c-modal--project-creation {
  width: 447px;

  .c-modal__header {
    display: none;
  }

  .c-modal--project-creation__header {
    text-align: right;

    .c-header__link {
      font-weight: 400 !important;
      font-size: 14px !important;
    }
  }

  .c-modal--project-creation__body {
    margin-top: 15px;

    .c-modal--project-creation__body--upper {
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;

      .mask-group-two {
        margin-top: auto;
      }

      .mask-group-one {
        margin-bottom: auto;
        margin-top: 10px;
      }
    }

    .c-modal--project-creation__body--lower {
      margin-bottom: 20px;

      p {
        text-align: center;
        font-weight: 400;
        font-size: 18px;
        line-height: 150%;
        color: #103d1f;
      }
    }
  }

  .c-modal--project-creation__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid rgba(223, 227, 229, 0.6);
    padding: 20px 0 8px 0;

    .c-header__link {
      color: #0d6d91;
      width: fit-content;
      border: none;
      margin-right: 8px;
    }

    .c-header__link,
    .c-btn--dark {
      font-weight: 400;
      font-size: 14px;
      line-height: 120%;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .c-btn--dark {
      color: white;
      width: fit-content;
    }
  }
}
</style>
