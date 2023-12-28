<template>
  <header class="head">
    <breadcrumbs
      class="head__breadcrumbs"
      :language="language"
      :translation="translation"
      :chapter="chapter"
    />
    <div class="u-p">
      <div class="o-flex o-flex--unit o-flex--middle c-header--mobile">
        <div class="o-flex__item">
          <book :number="egwBookNumber" :egw-api="egwApi" />
        </div>

        <div class="o-flex__item">
          <h2 class="u-large u-mb0">
            <strong v-if="title" class="u-truncate">{{ title }}</strong>
            <span v-else class="u-blind-text">Lorem ipsum dolor sit amet</span>
          </h2>

          <div class="u-small u-muted u-mb--">
            <span v-if="author">{{ author }}</span>
            <span v-else class="u-blind-text">Lorem ipsum</span>
          </div>

          <progress-comp v-if="stats" :stats="stats" :tooltip="true" />
        </div>

        <button
          v-if="isGc"
          class="c-btn c-btn--ghost c-btn--primary c-btn---"
          @click.prevent="toggleEditModal"
        >
          <span class="u-icon">edit</span> Edit
        </button>
        <div class="o-flex__spacer"></div>

        <button
          v-if="hasRecentWork"
          class="c-btn c-btn--yellow c-btn--"
          @click.prevent="goToRecentWork"
        >
          Resume previous work
          <span class="u-icon u-icon--move u-icon-left-u"
            >keyboard_arrow_right</span
          >
        </button>
        <div class="o-flex__item u-small u-muted">
          <div v-if="getUserRoleByWorkId" class="u-text-center u-mb--">
            <strong
              v-for="(roleItem, index) in getUserRoleByWorkId"
              :key="index"
              class="u-green"
              style="
                 {
                  text-transform: uppercase;
                }
              "
              >{{ `${index > 0 ? '/ ' : ''} ${roleItem} ` }}</strong
            >
            <ctooltip
              :show="getUserRoleByWorkId"
              text="Your role for this translation"
            />
          </div>
          <div v-if="isOnline" class="c-btn-group">
            <a
              v-if="isAdmin"
              class="c-btn c-btn--ghost c-btn-"
              :href="contributorsLink"
              title="Add contributors to translation"
              target="_blank"
            >
              Contributors
            </a>
            <nuxt-link
              v-if="showTimeline"
              class="c-btn c-btn--ghost c-btn-"
              :to="timelinkeLink"
              title="View translation timeline"
            >
              Timeline
            </nuxt-link>

            <!-- NOTE: WILL NEED THIS BLOCK FOR LATER USE -->
            <!-- <nuxt-link
              class="c-btn c-btn--ghost c-btn-"
              to="/translator-faq/"
              title="Frequently asked questions of translators"
            >
              FAQ
            </nuxt-link> -->

            <button
              v-if="!state.downloadedBook?.id && isGc && !isProjectSubmitted"
              class="c-btn c-btn--ghost c-btn--- delete-action"
              title="Archive"
              @click="toggleModal"
            >
              <i class="u-icon">archive</i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <modal
      :open="state.isEditModalOpen"
      custom-classes="c-modal--completion"
      @update:open="toggleEditModal"
    >
      <processing-modal v-if="state.pending" />
      <div v-else-if="state.error">
        <error-modal
          resubmit
          @toggle-modal="() => (state.isEditModalOpen = false)"
          @submit-approval="deleteTranslation"
        >
          <p class="u-mb-- info-text">
            Oops! Something went wrong and we were unable to process your
            request.
          </p>
          <p class="u-mb-- sub-info-text">Please try again later.</p>
        </error-modal>
      </div>
      <div v-else>
        <h4>Edit Translation</h4>
        <original-works
          :title="state.translationFormData.title"
          :abbreviation="state.translationFormData.abbreviation"
          :is-title-valid="state.uniqueValidationObj.isTitleValid"
          :is-abbr-valid="state.uniqueValidationObj.isAbbrValid"
          :show-title-validation="state.uniqueValidationObj.showTitleValidation"
          :validating-title="state.uniqueValidationObj.validatingTitle"
          :validating-abbr="state.uniqueValidationObj.validatingAbbr"
          :show-abbr-validation="state.uniqueValidationObj.showAbbrValidation"
          action="edit"
          @update-form-data="updateData"
          @update-unique-checker="updateUniqueChecker"
        />
        <div class="edit-form--footer">
          <button
            class="c-btn--ghost c-btn--primary"
            @click.prevent="closeEditModal"
          >
            Cancel
          </button>
          <button
            class="c-btn--dark c-btn--primary"
            :disabled="!isGc"
            @click.prevent="submitData"
          >
            <span>Sumit</span>
          </button>
        </div>
      </div>
    </modal>

    <modal
      :open="state.isModalOpen"
      custom-classes="c-modal--completion"
      @update:open="toggleModal"
    >
      <processing-modal v-if="state.pending" />
      <div v-else-if="state.error">
        <error-modal
          resubmit
          @toggle-modal="() => (state.isModalOpen = false)"
          @submit-approval="deleteTranslation"
        >
          <p class="u-mb-- info-text">
            Oops! Something went wrong and we were unable to process your
            request.
          </p>
          <p class="u-mb-- sub-info-text">Please try again later.</p>
        </error-modal>
      </div>
      <div v-else>
        <confirmation-modal
          confirm-btn-label="Yes"
          deny-btn-label="No"
          resubmit
          @toggle-modal="() => (state.isModalOpen = false)"
          @submit-approval="deleteTranslation"
        >
          <p class="u-mb-- info-text">
            Are you sure you want to archive this book ?
          </p>
          <p class="u-mb-- sub-info-text">
            Please note that you can restore the book within the next 7 days.
          </p>
          <p class="u-mb-- sub-info-text">
            After this period, the book will be permanently deleted and cannot
            be recovered.
          </p>
        </confirmation-modal>
      </div>
    </modal>
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';

import Modal from '../structure/Modal.vue';
import Ctooltip from '../utilities/Ctooltip.vue';
import ErrorModal from '../modal-content/timeline/ErrorModal.vue';
import ConfirmationModal from '../modal-content/timeline/ConfirmationModal.vue';
import ProcessingModal from './new-project/ProcessingModal.vue';
import OriginalWorks from './new-project/forms/OriginalWorks.vue';
import {
  useTranslationStore,
  useUserStore,
  userAlertStore,
  useAuthStore,
} from '~/store';
import { camelCase } from '~/helpers/Util';
import { patchAPI, storeAPI } from '~/helpers/apiCore';
import Book from '~/components/project-list/project/Book';
import ProgressComp from '~/components/utilities/Progress';
import Breadcrumbs from '~/components/translate/Breadcrumbs';
import { getLocalTranslationData } from '~/service-worker/db';
import { RECENT_ACTIVITIES, OFFLINE_BOOK } from '~/service-worker/constants';

const router = useRouter();
const route = useRoute();

const props = defineProps({
  chapter: { type: Object, default: null },
  translation: { type: Object, default: null },
  translationStats: { type: Object, default: null },
});

const emits = defineEmits(['patch-translation']);

const state = reactive({
  downloadedBook: {},
  isModalOpen: false,
  pending: false,
  error: false,
  isEditModalOpen: false,
  translationFormData: {
    title: props.translation?.title || null,
    abbreviation: props.translation?.abbreviation || null,
  },
  uniqueValidationObj: {
    isTitleValid: true,
    isAbbrValid: true,
    showTitleValidation: false,
    validatingTitle: false,
    validatingAbbr: false,
    showAbbrValidation: false,
  },
  recentSegment: {},
});

// const headerNavigation = ref(null);

const userStore = useUserStore();
const alertStore = userAlertStore();
const authStore = useAuthStore();
const translationStore = useTranslationStore();
const { recentWork } = storeToRefs(translationStore);

const { isAdmin, isGc, userDownloadInfo } = storeToRefs(userStore);
const { isOnline } = storeToRefs(authStore);

const runtimeConfig = useRuntimeConfig();
const { egwApi, cpanelUrl } = runtimeConfig.public;

const rules = computed(() => ({
  translationFormData: {
    title: { required },
    abbreviation: { required },
  },
}));

const v$ = useVuelidate(rules, state);

provide('validation', v$);

const getUserRoleByWorkId = computed(() => {
  return userStore
    .userRoleByWorkId(props.translation.id)
    ?.map((role) => camelCase(role));
});
const title = computed(() => {
  return props.translation?.title || '';
});
const author = computed(() => {
  return props.translation?.author || '';
});
const egwBookNumber = computed(() => {
  return parseInt(props.translation?.original?.key);
});

const contributorsLink = computed(() => {
  return `${cpanelUrl}/admin/org/translations/edit/${props.translation?.id}`;
});
const timelinkeLink = computed(() => {
  return `/translate/${route.params.language}/${route.params.abbreviation}/timeline/`;
});

const language = computed(() => {
  return props.translation?.languageObj || {};
});
const stats = computed(() => {
  return props.translationStats || {};
});
const showTimeline = computed(() => {
  return (
    props.translation.bookProgress > 1 || props.translation.bookProgress === 1
  );
});

const getRecentOfflineWork = async () => {
  state.recentSegment = await getLocalTranslationData(
    `${userDownloadInfo.value.workId}_${RECENT_ACTIVITIES}`
  );
};

const getRecentOfflineBook = async () => {
  state.downloadedBook = await getLocalTranslationData(
    `${props.translation.id}_${OFFLINE_BOOK}`
  );
};

const hasRecentWork = computed(() => {
  if (isOnline.value) {
    return (
      props.translation?.id === recentWork.value?.recentWork?.id &&
      parseInt(route?.params?.chapter) !==
        props.translation?.recentChapter?.chapter
    );
  } else {
    return Boolean(
      state.recentSegment?.id &&
        props.translation?.id === state.recentSegment?.work &&
        parseInt(route?.params?.chapter) !== state.recentSegment?.chapter
    );
  }
});

const goToRecentWork = () => {
  let chapterToRedirect = null;
  if (isOnline.value) {
    chapterToRedirect = recentWork.value?.recentSegment?.chapter;
  } else {
    chapterToRedirect = state.recentSegment?.chapter;
  }
  if (chapterToRedirect) {
    router.push(
      `/translate/${route.params.language}/${route.params.abbreviation}/chapter/${chapterToRedirect}`
    );
  }
};

const isProjectSubmitted = computed(() => {
  return props.translation.bookProgress === 8;
});

const disableSubmitAction = computed(() => {
  return (
    state.uniqueValidationObj.validatingAbbr ||
    state.uniqueValidationObj.validatingTitle ||
    !state.uniqueValidationObj.isAbbrValid ||
    !state.uniqueValidationObj.isTitleValid
  );
});

const toggleModal = () => {
  state.isModalOpen = true;
};
const toggleEditModal = () => {
  state.isEditModalOpen = true;
};
const closeEditModal = () => {
  state.isEditModalOpen = false;
  state.translationFormData = {
    title: props.translation?.title || null,
    abbreviation: props.translation?.abbreviation || null,
  };
  state.uniqueValidationObj = {
    isTitleValid: true,
    isAbbrValid: true,
    showTitleValidation: false,
    validatingTitle: false,
    validatingAbbr: false,
    showAbbrValidation: false,
  };
};

const deleteTranslation = async () => {
  state.pending = true;
  state.error = false;
  try {
    const data = await storeAPI(
      `/translations/${props.translation.id}/archive/`,
      {
        archive: true,
      }
    );

    if (data?.data?.id) {
      state.isModalOpen = false;
      alertStore.new({
        message: 'Translation is deleted successfully.',
        color: 'green',
        duration: 2000,
      });
      router.replace('/dashboard');
    } else {
      state.error = true;
    }

    state.pending = false;
  } catch (e) {
    state.pending = false;
    state.error = true;
  }
};

const updateData = (key, value) => {
  state.translationFormData[key] = value;
};

const updateUniqueChecker = (key, value) => {
  state.uniqueValidationObj[key] = value;
};

const submitData = () => {
  v$.value.$touch();

  if (v$.value.$invalid || disableSubmitAction.value) return;

  state.pending = true;
  state.error = false;

  patchAPI(`/translations/${props.translation.id}/`, {
    ...state.translationFormData,
  })
    .then((res) => {
      if (res?.id) {
        state.pending = false;
        emits('patch-translation', res);
        router.replace(
          `/translate/${
            route.params.language
          }/${res?.abbreviation.toLowerCase()}/chapter/${route.params.chapter}/`
        );
        closeEditModal();
      }
    })
    .catch(() => {
      state.pending = false;
      state.error = true;
    });
};

watch(
  () => [!isOnline.value, userDownloadInfo.value?.workId],
  getRecentOfflineWork
);

onMounted(() => {
  if (!isOnline.value) {
    getRecentOfflineWork();
  }

  getRecentOfflineBook();
});
</script>

<style lang="scss">
.head {
  position: relative;
  background-color: $c-white;
}

.head__breadcrumbs {
  position: absolute;
  top: $unit;
  width: 50vw;
  left: calc(50% - 25vw);
}

.delete-action {
  .u-icon {
    font-size: 20px;
    color: red;
    transition: color 0.1s ease-in;
  }

  &:hover {
    .u-icon {
      color: white;
    }
  }
}
@media (max-width: 576px) {
  .c-header--mobile {
    display: flex;
    flex-direction: column;
    margin-top: 20px;
  }
}

.c-modal {
  background-color: white !important;

  h4 {
    margin-bottom: 20px;
    color: rgba(39, 39, 39, 0.8);
  }
  .step {
    width: 100% !important;
    margin-bottom: 0px;
    .step-container {
      width: 100%;
      .step-form {
        width: 100%;
        padding: 0;
      }
    }
  }

  .edit-form--footer {
    margin-top: 24px;
    text-align: right;
    button {
      width: 80px;
      height: 40px;
      padding: 0px;
      border-radius: 4px;
      cursor: pointer;

      &:nth-child(2) {
        margin-left: 10px;
      }
    }
  }
}
</style>
