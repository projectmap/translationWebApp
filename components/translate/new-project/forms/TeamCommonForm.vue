<template>
  <div>
    <overlay-loader
      :active="isLoading || globalLoader"
      message="Please Wait..."
    >
      <div class="step">
        <div class="step-container">
          <div class="step-form">
            <div class="form-row o-flex">
              <div class="form-item form-item--full-width">
                <p class="form-label">
                  Would you like to add contributors to the project now ?
                </p>
                <div class="o-flex">
                  <!-- NOTE: MIGHT NEED FOR FUTURE USE -->
                  <!-- <label class="o-flex o-flex--middle radio-btn">
                    <input
                      type="radio"
                      :value="true"
                      v-model="addContributors"
                      @input="
                        () => {
                          $emit('can-add-contributors', true);
                        }
                      "
                    />
                    Yes
                  </label>

                  <label class="o-flex o-flex--middle radio-btn">
                    <input
                      type="radio"
                      :value="false"
                      v-model="addContributors"
                      @input="
                        () => {
                          $emit('can-add-contributors', false);
                        }
                      "
                    />
                    No
                  </label> -->
                </div>
              </div>
            </div>
            <div class="team-create-form">
              <div
                v-if="view === 'create-project'"
                class="form-row o-flex o-flex--column"
              >
                <div class="form-item">
                  <p class="u-muted u-mb-- o-flex o-flex--middle">
                    Approver
                    <span class="u-icon" @click="getApproversList"
                      >refresh</span
                    >
                  </p>
                  <div class="o-flex o-flex--middle o-flex--between">
                    <filter-component
                      label="Add an Approver"
                      :shadow="false"
                      :outline="true"
                      :options="addContributors ? approvers : []"
                      :current="selectedApprover"
                      :limit-label="false"
                      search
                      clearable
                      module="project-creation"
                      @update:current="onUpdate('approver', $event)"
                    />
                    <!-- <button
              class="add-new-icon"
              @click.prevent="openNewUserModal"
            >
              <tooltip text="Add New User" placement="top">
                <span class="u-icon">add</span>
              </tooltip>
            </button> -->
                  </div>
                </div>
              </div>
              <div class="form-row o-flex o-flex--column">
                <div class="form-item">
                  <p class="u-muted u-mb-- o-flex o-flex--middle">
                    Translator
                    <span class="u-icon" @click="getUsersList">refresh</span>
                  </p>
                  <div class="o-flex o-flex--middle o-flex--between">
                    <filter-component
                      label="Add a Translator"
                      :shadow="false"
                      :outline="true"
                      :options="users"
                      :current="selectedTranslator"
                      :limit-label="false"
                      search
                      clearable
                      module="project-creation"
                      @update:current="onUpdate('translator', $event)"
                    />
                    <!-- <button
              class="add-new-icon"
              @click.prevent="openNewUserModal"
            >
              <tooltip text="Add New User" placement="top">
                <span class="u-icon">add</span>
              </tooltip>
            </button> -->
                  </div>
                  <p
                    v-if="
                      validation.$dirty &&
                      validation.teamsFormData.translator.$invalid
                    "
                    class="c-form__error--small"
                  >
                    Translator is required
                  </p>
                </div>
              </div>
              <div class="form-row o-flex o-flex--column">
                <div class="form-item">
                  <p class="u-muted u-mb-- o-flex o-flex--middle">
                    Editor
                    <span class="u-icon" @click="getUsersList">refresh</span>
                  </p>
                  <div class="o-flex o-flex--middle o-flex--between">
                    <filter-component
                      label="Add an Editor"
                      :shadow="false"
                      :outline="true"
                      :options="users"
                      :current="selectedEditor"
                      :limit-label="false"
                      search
                      clearable
                      module="project-creation"
                      @update:current="onUpdate('editor', $event)"
                    />
                    <!-- <button
              class="add-new-icon"
              @click.prevent="openNewUserModal"
            >
              <tooltip text="Add New User" placement="top">
                <span class="u-icon">add</span>
              </tooltip>
            </button> -->
                  </div>
                  <p
                    v-if="
                      validation.$dirty &&
                      validation.teamsFormData.editor.$invalid
                    "
                    class="c-form__error--small"
                  >
                    Editor is required
                  </p>
                </div>
              </div>
              <div class="form-row o-flex o-flex--column">
                <div class="form-item">
                  <p class="u-muted u-mb-- o-flex o-flex--middle">
                    Reviewer <span>(optional) </span>
                    <span class="u-icon" @click="getUsersList">refresh</span>
                  </p>
                  <div class="o-flex o-flex--middle o-flex--between">
                    <filter-component
                      label="Add a reviewer"
                      :shadow="false"
                      :outline="true"
                      :options="users"
                      :current="selectedReviewer"
                      :limit-label="false"
                      search
                      clearable
                      module="project-creation"
                      @update:current="onUpdate('reviewer', $event)"
                    />
                    <!-- <button
              class="add-new-icon"
              @click.prevent="openNewUserModal"
            >
              <tooltip text="Add New User" placement="top">
                <span class="u-icon">add</span>
              </tooltip>
            </button> -->
                  </div>
                </div>
              </div>

              <div class="form-row o-flex o-flex--column">
                <div class="form-item o-flex o-flex--center">
                  <button
                    class="add-new-user c-btn c-btn--primary o-flex o-flex--middle"
                    :disabled="!addContributors"
                    @click.prevent="openNewUserModal"
                  >
                    <span class="u-icon">add</span> Create New User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </overlay-loader>
    <modal
      :open="newUserModalOpen"
      custom-classes="c-modal--user-creation c-modal--completion"
      @update:open="openNewUserModal"
    >
      <processing-modal v-if="isSubmitting" />
      <div v-else-if="userCreated">
        <completion-modal @toggle-modal="closeNewUserModal">
          <p class="u-mb-- info-text">User has been created successfully.</p>
          <!-- <p class="u-mb-- sub-info-text">
            You will be notified once your request has been approved.
          </p> -->
        </completion-modal>
      </div>
      <div v-else-if="isError">
        <error-modal
          resubmit
          @toggle-modal="closeNewUserModal"
          @submit-approval="reSubmit"
        >
          <p class="u-mb-- info-text">
            Oops! Something went wrong and we were unable to process your
            request.
          </p>
          <p class="u-mb-- sub-info-text">Please try again later.</p>
        </error-modal>
      </div>
      <div v-else class="new-user-form">
        <h5>New user</h5>
        <div>
          <div class="form-row">
            <div class="form-item form-item--full-width">
              <p class="u-muted u-mb-- u-small">First Name <span>*</span></p>
              <input
                v-model.trim="firstname"
                class="c-input c-input--outline"
                type="text"
              />
              <p
                v-if="v$.$dirty && v$.firstname.$invalid"
                class="c-form__error--small"
              >
                First Name is required
              </p>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item form-item--full-width">
              <p class="u-muted u-mb-- u-small">Last Name <span>*</span></p>
              <input
                v-model.trim="lastname"
                class="c-input c-input--outline"
                type="text"
              />
              <p
                v-if="v$.$dirty && v$.lastname.$invalid"
                class="c-form__error--small"
              >
                Last Name is required
              </p>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item form-item--full-width">
              <p class="u-muted u-mb-- u-small">Email <span>*</span></p>
              <input
                v-model.trim="email"
                class="c-input c-input--outline"
                type="email"
              />
              <p
                v-if="v$.$dirty && v$.email.$invalid"
                class="c-form__error--small"
              >
                Email is required
              </p>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item form-item--full-width">
              <label class="o-flex o-flex--middle check-box">
                <input
                  type="checkbox"
                  :value="assignToOrg"
                  @input="
                    (e) => {
                      assignToOrg = e.target.checked;
                    }
                  "
                />
                Assign to organization ?
              </label>
            </div>
          </div>

          <div class="form-row">
            <div
              class="form-item form-item--full-width o-flex o-flex--right o-flex--middle"
            >
              <button
                class="c-btn--ghost c-btn--cancel c-btn--primary"
                @click.prevent="closeNewUserModal"
              >
                Cancel
              </button>
              <button
                class="c-btn--dark c-btn--submit c-btn--primary"
                @click.prevent="createUser"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </modal>
  </div>
</template>

<script setup>
import useVuelidate from '@vuelidate/core';
import ProcessingModal from '../ProcessingModal.vue';
import Modal from '@/components/structure/Modal.vue';
import { fetchAPI, storeAPI } from '~/helpers/apiCore';
import OverlayLoader from '@/components/OverlayLoader.vue';
import FilterComponent from '@/components/project-list/Filter';
import ErrorModal from '@/components/modal-content/timeline/ErrorModal.vue';
import CompletionModal from '@/components/modal-content/timeline/CompletionModal.vue';

const props = defineProps({
  approvers: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
  roles: { type: Array, default: () => [] },
  canChooseTranslator: { type: Boolean },
  view: { type: String, default: '' },
  addContributors: { type: Boolean },
  orgToAssign: { type: String, default: null },
  selectedTranslator: { type: Array, default: () => {} },
  selectedReviewer: { type: Array, default: () => {} },
  selectedEditor: { type: Array, default: () => {} },
  selectedApprover: { type: Array, default: () => {} },
  globalLoader: { type: Boolean },
});

const emits = defineEmits([
  'update-filter',
  'can-add-contributors',
  'update-form-data',
  'updateTeamData',
  'get-approvers-list',
]);

const validation = inject('validation');

const state = reactive({
  newUserModalOpen: false,
  firstname: '',
  lastname: '',
  email: '',
  domain: '',
  isLoading: false,
  isSubmitting: false,
  userCreated: false,
  isError: false,
  assignToOrg: false,
});

const rules = computed(() => ({
  firstname: {
    required: requiredIf(function () {
      return state.newUserModalOpen;
    }),
  },
  lastname: {
    required: requiredIf(function () {
      return state.newUserModalOpen;
    }),
  },
  email: {
    required: requiredIf(function () {
      return state.newUserModalOpen;
    }),
  },
}));

const v$ = useVuelidate(rules, state);
/**
 * This function is used to fetch the list of user all users in the system
 */
const getUsersList = async () => {
  if (props.addContributors) {
    state.isLoading = true;
    try {
      const data = await fetchAPI('users');

      const options = data?.results?.map((a) => {
        if (!a.slug) {
          a.slug = a.id;
        }
        a.name = `${a.username} ${a.email ? `(${a.email})` : ''} `;
        return a;
      });
      emits('update-filter', 'users', options);

      state.isLoading = false;
    } catch (e) {
      state.isLoading = false;
    }
  }
};

watch(
  () => props.addContributors,
  (newValue) => {
    if (newValue) {
      getUsersList();
    } else {
      emits('update-filter', 'users', []);
    }
  }
);

onUnmounted(() => {
  if (!props.selectedEditor || !props.selectedTranslator) {
    emits('can-add-contributors', false);
    emits('update-filter', 'users', []);
  }
});

const resetNewUserForm = () => {
  state.firstname = '';
  state.lastname = '';
  state.email = '';
  state.domain = '';
  state.isLoading = false;
  state.isSubmitting = false;
  state.userCreated = false;
  state.isError = false;
  state.assignToOrg = false;
};

const openNewUserModal = () => {
  state.newUserModalOpen = true;
};

const closeNewUserModal = () => {
  state.newUserModalOpen = false;
  resetNewUserForm();
  v$.value.$reset();
};

/** Handles updating the values in the parent and current component */
const onUpdate = (key, value) => {
  switch (key) {
    case 'translator':
      emits('update-filter', 'selectedTranslator', value);
      emits('updateTeamData', 'translator', value);
      break;

    case 'reviewer':
      emits('update-filter', 'selectedReviewer', value);

      emits('updateTeamData', 'reviewer', value);
      break;

    case 'editor':
      emits('update-filter', 'selectedEditor', value);

      emits('updateTeamData', 'editor', value);
      break;

    case 'approver':
      emits('update-filter', 'selectedApprover', value);

      if (value?.id) {
        emits('update-form-data', 'approver', value?.id);
      } else {
        emits('update-form-data', 'approver', null);
      }
  }
};

const createUser = async () => {
  v$.value.$touch();

  if (v$.value.$invalid) return;

  state.isSubmitting = true;
  state.userCreated = false;
  state.isError = false;

  try {
    const data = await storeAPI('egw/create-user/', {
      firstName: state.firstname,
      lastName: state.lastname,
      email: state.email,
      domain: state.assignToOrg ? props.orgToAssign?.domain : null,
    });

    if (data?.status === 200) {
      state.firstname = '';
      state.lastname = '';
      state.email = '';
      state.domain = '';
      state.userCreated = true;
      getUsersList();
    }
    state.isSubmitting = false;
    state.isError = false;
  } catch (e) {
    state.isSubmitting = false;
    state.isError = true;
    state.userCreated = false;
  }
};

const reSubmit = () => {
  state.isSubmitting = false;
  state.isError = false;
  state.userCreated = false;
};

const getApproversList = () => {
  if (props.addContributors) {
    emits('get-approvers-list', props.orgToAssign);
  }
};
</script>

<style lang="scss">
.team-create-form {
  .form-row {
    .form-item {
      p {
        span {
          margin-left: 5px;
        }

        .u-icon {
          color: green;
          cursor: pointer;
        }
      }
      .v-popover {
        width: 90%;

        &.c-tooltip-anchor {
          cursor: pointer;
        }
      }

      .add-new-icon {
        background: transparent;
        border: none;
        padding: 0;
        margin-left: 5px;
        cursor: pointer;
        border: 1px dashed #a9adaf;
        border-radius: 50%;
        height: 30px;
        width: 30px;
        margin-left: 10px;
        .u-icon {
          color: #8d8d8d;
          font-size: 20px;
        }

        &:hover {
          border: 1px dashed #31bf60;
          background: #e3f5e9;

          .u-icon {
            color: #103d1f;
          }
        }
      }
    }
  }
}

.c-modal--user-creation {
  width: 447px;

  .c-modal__body {
    background: white;

    p {
      span {
        color: red;
      }
    }

    .c-btn--cancel {
      margin-right: 10px;
      cursor: pointer;
    }

    .c-btn--cancel,
    .c-btn--submit {
      width: 75px;
      height: 40px;
      padding: 0;
      border-radius: 5px;
    }

    .new-user-form {
      .form-row {
        &:not(:last-child) {
          margin-bottom: 10px !important;
        }

        &:last-child {
          margin-top: 24px;
        }
      }
    }
  }
}

.add-new-user {
  width: 100%;
}
</style>
