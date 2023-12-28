<template>
  <div class="contributors">
    <div class="contributors__header o-flex o-flex--column">
      <n-link :to="translationLink" class="c-header__link u-small">
        <i class="u-icon u-icon--lmove">keyboard_arrow_left</i> Go to
        translation
      </n-link>
      <div class="o-flex o-flex--middle">
        <div class="o-flex book-cover">
          <book :number="egwBookNumber" :egw-api="egwApi" />
        </div>

        <div class="o-flex__item contributors__header-title">
          <h2 class="u-large u-mb0 o-flex o-flex--middle">
            <strong v-if="title">{{ title }}</strong>
            <span v-else class="u-blind-text">Lorem ipsum dolor sit amet</span>
          </h2>

          <div class="u-small u-muted header--layer-two o-flex o-flex--middle">
            <span v-if="author">{{ author }}</span>
            <span v-else class="u-blind-text">Lorem ipsum</span>
            <div class="language-info">
              <language
                v-if="translation.language"
                class="u-shrink0 u-relative u-z10 u-mr"
                :language="translation.language"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="contributors__body">
      <div class="translation-info">
        <div class="translation-info__header">
          <h4>Add Contributors</h4>
          <p class="common-info-text">
            Choose contributors to help you with your translation projects
          </p>
        </div>
        <div v-if="canShowUsersList" class="users-list">
          <h6>Assigned users</h6>
          <div class="list">
            <p
              v-for="(user, index) in state.assignedUsersByWorkId"
              :key="user.id"
            >
              {{ index + 1 }}. <strong>{{ user.role }}</strong> -
              {{ user.username }}
            </p>
          </div>
        </div>
      </div>
      <contributors
        :users="users"
        :roles="roles"
        :can-choose-translator="canChooseTranslator"
        @update-form-data="updateData"
      />
    </div>
    <div class="contributors__footer">
      <n-link
        to="/new-project/"
        class="c-header__link c-header__link-btn u-ml-"
      >
        Back
      </n-link>
      <button
        class="c-btn--dark c-btn--primary"
        :disabled="!isAdmin"
        @click.prevent="submitData"
      >
        <div
          v-if="state.submittingData"
          class="c-spinner c-spinner--small"
        ></div>
        <span v-else>Confirm</span>
      </button>
    </div>
    <modal
      :open="isModalOpen"
      custom-classes="c-modal--project-creation"
      @update:open="toggleModal"
    >
      <processing-modal message="Processing, Please wait." />
    </modal>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';
import useVuelidate from '@vuelidate/core';
import { requiredIf } from '@vuelidate/validators';

import { fetchAPI } from '~/helpers/apiCore';
import Modal from '~/components/structure/Modal';
import Book from '~/components/project-list/project/Book';
import { useTranslationStore, useUserStore } from '~/store';
import Language from '~/components/project-list/project/Language.vue';
import ProcessingModal from '~/components/translate/new-project/ProcessingModal';
import Contributors from '~/components/translate/new-project/forms/Contributors.vue';

// NOTE: WILL NEED THIS FOR LATER

const userStore = useUserStore();
const translationStore = useTranslationStore();

const { isAdmin } = storeToRefs(userStore);
const { getTranslation } = storeToRefs(translationStore);

const route = useRoute();
const router = useRouter();

const runtimeConfig = useRuntimeConfig();
const { egwApi } = runtimeConfig.public;

definePageMeta({
  layout: 'fullwidth',
});

const state = reactive({
  users: [],
  roles: [
    {
      slug: 'editor',
      code: 'editor',
      name: 'Editor',
    },
    {
      slug: 'reviewer',
      code: 'reviewer',
      name: 'Reviewer',
    },
  ],
  assignedUsersByWorkId: [],
  contributorsFormData: {
    editor: {
      role: null,
      work_id: null,
      user_id: null,
    },
    translator: {
      role: null,
      work_id: null,
      user_id: null,
    },
    reviewer: {
      role: null,
      work_id: null,
      user_id: null,
    },
    others: [
      {
        role: null,
        work_id: null,
        user_id: null,
      },
    ],
  },
  submittingData: false,
  showModal: false,
});

const isEditorRequired = computed(() => {
  return !state.assignedUsersByWorkId?.find(
    (user) => user?.role.toLowerCase() === 'editor'
  );
});

const rules = computed(() => ({
  contributorsFormData: {
    editor: {
      role: {
        required: requiredIf(function () {
          return isEditorRequired.value;
        }),
      },
      work_id: {
        required: requiredIf(function () {
          return isEditorRequired.value;
        }),
      },
      user_id: {
        required: requiredIf(function () {
          return isEditorRequired.value;
        }),
      },
    },
    translator: {
      role: {
        required: requiredIf(function () {
          return this.canChooseTranslator;
        }),
      },
      work_id: {
        required: requiredIf(function () {
          return this.canChooseTranslator;
        }),
      },
      user_id: {
        required: requiredIf(function () {
          return this.canChooseTranslator;
        }),
      },
    },
  },
}));

const v$ = useVuelidate(rules, state);

provide('validation', v$);

const translation = computed(() => {
  return getTranslation.value;
});

/** Title of translation */
const title = computed(() => {
  return translation.value?.title || '';
});
/** Author name of original book */
const author = computed(() => {
  return translation.value?.author || '';
});
/** Id of the book cover of the original book */
const egwBookNumber = computed(() => {
  return parseInt(translation.value?.original.key);
});

/** Check if assigned users list can be shown */
const canShowUsersList = computed(() => {
  return !isEmpty(state.assignedUsersByWorkId);
});

// NOTE: WILL NEED THIS FOR LATER
// /** Check whether the user can add translator the the translation or not  */
const canChooseTranslator = computed(() => {
  return !state.assignedUsersByWorkId?.find(
    (user) => user?.role.toLowerCase() === 'translator'
  );
});

// /** Value to open/close the modal */
const isModalOpen = computed(() => {
  return state.showModal;
});

/** Link to the translation page of the current translation */
const translationLink = computed(() => {
  return `/translate/${route.params.language}/${route.params.abbreviation}/chapter/1/`;
});

/** Keep watch on the user data, and if there is any data in the users list then fetch the
 * user assigned list by work id to filter and display assgined user list in the UI
 */
watch(state.users, (value) => {
  if (value) {
    getUsersAssignedListByWorkId();
  }
});

/**
 * This function is used to fetch the list of user all users in the system
 */
const getUsersList = () => {
  userStore
    .retrieveUsersListBySearchType({
      search_type: 'work',
      values: translation.value.id,
    })
    .then((response) => {
      if (response?.status === 200) {
        const options = response.data.data?.map((a) => {
          if (!a.slug) {
            a.slug = a.id;
          }
          a.name = a.username;
          return a;
        });
        state.users = options;
      }
    });
};

onBeforeMount(() => {
  if (isAdmin.value) {
    translationStore.fetchTranslation(
      route.params.language,
      route.params.abbreviation
    );
    getUsersList();
  } else {
    router.push('/dashboard');
  }
});

/**
 * This function is used to clear all the data to default value
 */
const resetAllDatas = () => {
  state.users = [];
  state.assignedUsersByWorkId = [];
  state.contributorsFormData = {
    editor: {
      role: null,
      work_id: null,
      user_id: null,
    },
    translator: {
      role: null,
      work_id: null,
      user_id: null,
    },
    reviewer: {
      role: null,
      work_id: null,
      user_id: null,
    },
    others: [
      {
        role: null,
        work_id: null,
        user_id: null,
      },
    ],
  };
  state.submittingData = false;
  state.showModal = false;
};

onUnmounted(() => {
  resetAllDatas();
});

/**
 * This function is used to fetch the list of user assigned by the given work id
 */
const getUsersAssignedListByWorkId = async () => {
  const data = await fetchAPI(`user-roles/?work=${translation.value.id}`);

  if (data?.results) {
    state.assignedUsersByWorkId = data?.results;
  }
};

// NOTE: WILL NEED THIS FOR LATER
/**
 * This function is used to update the data inside the contributorsFormData object.
 * @param {string} key => This represents the key by which we can access date inside the object
 * @param {string} value => This represents the value of the key
 * @param {number} valueIndex => This represents the position at which the key-value pair exists (only applicable when extra contributors are added)
 * @param {string} valueType => This represents the type of value that is to being sent (only applicable when extra contributors are added)
 * @param {string} action => This represents the the action that need to be performed, i.e add or remove contributors (only applicable when extra contributors are added)
 */
const updateData = (
  key,
  value,
  valueIndex = null,
  valueType = null,
  action = null
) => {
  if (key === 'others') {
    if (action) {
      switch (action) {
        case 'add':
          // to add a new data object
          state.contributorsFormData.others.push({
            role: null,
            work_id: null,
            user_id: null,
          });

          break;

        case 'remove':
          // to remove data object
          state.contributorsFormData.others.splice(valueIndex, 1);

          break;
      }
    } else {
      /* eslint-disable */
      if (valueType === 'role') {
        state.contributorsFormData.others[valueIndex].role = value?.code;
      } else {
        /* eslint-disable */
        state.contributorsFormData.others[valueIndex].work_id =
          translation.value?.id;
        state.contributorsFormData.others[valueIndex].user_id = value?.id;
      }
    }
  } else {
    state.contributorsFormData[key].role = key;
    state.contributorsFormData[key].work_id = translation.value?.id;
    state.contributorsFormData[key].user_id = value?.id;
  }
};

const toggleModal = () => {
  state.showModal = !state.showModal;
};

/**
 * This function is used to submit the final data to the respective API
 */
const submitData = () => {
  v$.value.$touch();

  if (v$.value.$invalid) return;

  state.submittingData = true;
  toggleModal();

  const formData = [
    state.contributorsFormData.editor,
    state.contributorsFormData.reviewer,
    state.contributorsFormData.translator,
    ...state.contributorsFormData.others,
  ];

  storeAPI(
    '/user-roles/',
    formData?.filter((data) => data?.user_id !== null)
  )
    .then((res) => {
      if (res?.status === 201 || res?.status === 200) {
        state.submittingData = false;
        toggleModal();
        formData = [];
        router.push(
          `/translate/${route.params.language}/${route.params.abbreviation}/chapter/1/`
        );
      }
    })
    .catch((e) => {
      state.submittingData = false;
      toggleModal();
    });
};
</script>

<style lang="scss">
.contributors {
  background: #f8f8f8;

  .common-info-text {
    color: rgba($color: #272727, $alpha: 0.8);
    font-weight: 400;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0.005em;
  }
  .contributors__header {
    padding: 50px 130px 0 130px;

    .c-header__link {
      margin-bottom: 25px;
    }

    .book-cover {
      margin-right: 20px;
    }

    .contributors__header-title {
      .language-info {
        margin-left: 15px;
      }

      .header--layer-two {
        margin-top: 5px;
      }
    }
  }

  .contributors__body {
    padding: 0 130px;
    margin-top: 64px;
    display: flex;
    margin-bottom: 64px;

    .translation-info {
      .translation-info__header {
        padding: 7px 0;

        h4 {
          margin-bottom: 16px;
        }
        p {
          width: 350px;
        }
      }

      .users-list {
        margin-top: 10px;
        h6 {
          margin-bottom: 10px;
        }
        .list {
          height: 230px;
          overflow-y: auto;
          margin-right: 40px;
          p {
            margin-bottom: 5px;
            strong {
              text-transform: uppercase;
              color: #0d6d91;
            }
          }

          &::-webkit-scrollbar {
            width: 8px;
          }

          /* Track */
          &::-webkit-scrollbar-track {
            border-radius: 10px;
          }

          /* Handle */
          &::-webkit-scrollbar-thumb {
            background-color: darkgray;
            border-radius: 5px;
          }
        }
      }
    }

    .contributors-form {
      width: 736px;
      background: white;
      padding: 32px;
      border-radius: 4px;

      .form-row {
        flex-wrap: wrap;
        &:not(:last-child) {
          margin-bottom: 24px;
        }
        .form-item {
          min-width: 300px;
          max-width: fit-content;
          margin-right: 36px;

          .v-popover {
            width: 100%;
            .trigger {
              width: 100%;

              button {
                &.c-btn {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  height: 38px;
                }
              }
            }
          }

          .c-input {
            height: 38px;
          }

          .check-box,
          .radio-btn {
            color: rgba(39, 39, 39, 0.8);
            letter-spacing: 0.005em;
            font-weight: 400;
          }

          .check-box {
            margin-right: 40px;

            input {
              height: 18px;
              width: 18px;
              margin-right: 10px;
            }
          }

          .radio-btn {
            margin-right: 36px;

            input {
              height: 16px;
              width: 16px;
              margin-right: 10px;
            }
          }

          .form-label {
            margin-bottom: 16px;
          }

          &.form-item--full-width {
            min-width: 100%;
            padding-right: 38px;
          }

          &.role-filter {
            min-width: 150px;
          }
        }
      }
    }
  }

  .contributors__footer {
    padding: 15px 114px;
    background: #ffffff;
  }
}

.contributors__footer,
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
@media only screen and (max-width: 1400px) {
  .contributors {
    .contributors__header {
      padding: 50px 80px 0 80px;
    }
    .contributors__body {
      padding: 0 80px;
    }
  }
}

@media only screen and (max-width: 1200px) {
  .contributors {
    .contributors__header {
      padding: 50px 60px 0 60px;
    }
    .contributors__body {
      padding: 0 60px;
    }
  }
}

@media only screen and (max-width: 1163px) {
  .contributors {
    .contributors__body {
      .contributors-form {
        .extra-contributors {
          .remove--btn {
            margin-top: 10px;
          }
        }
      }
    }
  }
}

@media only screen and (max-width: 1092px) {
  .contributors {
    .contributors__header {
      padding: 50px 40px 0 40px;
    }

    .contributors__body {
      padding: 0 40px;
    }
  }
}

@media only screen and (max-width: 1053px) {
  .contributors {
    .contributors__body {
      width: 100%;
      .contributors-form {
        .extra-contributors {
          .role-filter {
            margin-top: 10px;
          }
          .remove--btn {
            margin-top: 10px;
          }
        }
      }
    }
  }
}
</style>
