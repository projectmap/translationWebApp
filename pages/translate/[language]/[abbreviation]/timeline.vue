<template>
  <div class="translation-detail">
    <div class="translation-detail__header o-flex o-flex--column">
      <nuxt-link :to="translationLink" class="c-header__link u-small">
        <i class="u-icon u-icon--lmove">keyboard_arrow_left</i> Go to
        translation
      </nuxt-link>

      <div class="o-flex o-flex--middle">
        <div class="o-flex book-cover">
          <book :number="egwBookNumber" :egw-api="egwApi" />
        </div>

        <div class="o-flex__item translation-detail__header-title">
          <h2 class="u-large u-mb0 o-flex o-flex--middle">
            <strong v-if="title">{{ title }}</strong>
            <span v-else class="u-blind-text">Lorem ipsum dolor sit amet</span>
          </h2>

          <div class="u-small u-muted header--layer-two o-flex o-flex--middle">
            <span v-if="author">{{ author }}</span>
            <span v-else class="u-blind-text">Lorem ipsum</span>
            <div v-if="translation" class="language-info">
              <language
                v-if="translation.language"
                class="u-shrink0 u-relative u-z10 u-mr"
                :language="translation.languageObj"
              />
            </div>
          </div>
        </div>
        <button
          v-if="showApproveAction"
          class="c-btn--dark c-btn--primary approve-btn"
          @click.prevent="toggleModal('approve')"
        >
          Approve
        </button>
      </div>

      <div
        v-if="!isEmpty(approvalTimeline) && showApproveAction"
        class="role-info"
      >
        Action being performed as {{ getRoleText }}.
      </div>
    </div>
    <div class="translation-detail__body">
      <div class="project-timeline">
        <div class="project-timeline__header">
          <h4>Project Timeline</h4>
        </div>
        <div class="project-timeline__body">
          <ul v-if="isPending" class="c-timeline">
            <li
              v-for="(_item, index) in [1, 2, 3]"
              :key="index"
              class="c-timeline__item"
            >
              <div class="c-timeline__info">
                <span
                  class="c-timeline-date"
                  :class="{ 'u-blind-text is-loading': true }"
                  >00/00/0000</span
                >
                <h6
                  class="c-timeline-title"
                  :class="{ 'u-blind-text is-loading': true }"
                >
                  Lorem Ipsum Dolor
                </h6>
              </div>
            </li>
          </ul>

          <ul v-else class="c-timeline">
            <li
              v-for="(item, index) in approvalTimeline"
              :key="index"
              class="c-timeline__item"
            >
              <div class="c-node">
                <img
                  v-if="item.action === 'approved'"
                  src="~/assets/images/send-circle.png"
                />
                <img
                  v-else-if="item.action === 'revoked'"
                  src="~/assets/images/cross-circle.png"
                />
                <img v-else src="~/assets/images/calendar-check-circle.png" />
              </div>
              <div class="c-timeline__info">
                <span class="c-timeline-date">{{ item.date }}</span>
                <span v-if="item.action === 'approved'">
                  <h6 class="c-timeline-title">
                    Project Submission Request<span>has been sent to</span
                    >{{ item.assignToGroup }}
                  </h6>

                  <p class="c-timeline-text">
                    <strong>You</strong> will be notified once your request has
                    been <strong>accepted</strong>
                  </p>

                  <button
                    v-if="showRevokeOption(item, index)"
                    class="c-revoke-btn"
                    @click.prevent="toggleModal('revoke')"
                  >
                    Revoke Request
                  </button>
                </span>
                <span v-else-if="item.action === 'revoked'">
                  <h6 class="c-timeline-title">
                    Project Submission Request<span>has been revoked</span
                    ><strong>by {{ item.username }}</strong>
                  </h6>

                  <button
                    v-if="showRevokeOption(item, index)"
                    class="c-submit-approval-btn"
                    @click.prevent="toggleModal('approve')"
                  >
                    Submit for approval
                  </button>
                </span>

                <h6 v-else class="c-timeline-title">
                  Project Submission Request<span>has been approved by</span
                  >{{ item.assignToGroup }}
                </h6>
              </div>
            </li>
            <li v-if="translationEndDate" class="c-timeline__item">
              <div class="c-node">
                <img src="~/assets/images/calendar-check-circle.png" />
              </div>
              <div class="c-timeline__info">
                <span class="c-timeline-date">{{ translationEndDate }}</span>
                <h6 class="c-timeline-title">Translation Completed</h6>
                <p class="c-timeline-text">
                  Translation for this project has been completed
                </p>
              </div>
            </li>
            <li v-if="translationStartDate" class="c-timeline__item">
              <div class="c-node">
                <img src="~/assets/images/star-circle.png" />
              </div>
              <div class="c-timeline__info">
                <span class="c-timeline-date">{{ translationStartDate }}</span>
                <h6 class="c-timeline-title">Translation Started</h6>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <modal
      :open="isModalOpen"
      custom-classes="c-modal--completion"
      @update:open="toggleModal"
    >
      <processing-modal v-if="state.sendingForApproval" />
      <div v-else-if="state.sentForApproval">
        <completion-modal @toggle-modal="toggleModal">
          <span v-if="state.action === 'revoke'">
            <p class="u-mb-- info-text">
              Book approval request has been revoked.
            </p>
          </span>
          <span v-else>
            <p class="u-mb-- info-text">
              Book has been approved
              <span v-if="!isAdmin"> and sent for further approval. </span>
            </p>
            <p v-if="!isAdmin" class="u-mb-- sub-info-text">
              You will be notified once your request has been approved.
            </p>
          </span>
        </completion-modal>
      </div>
      <div v-else-if="state.approvalError">
        <error-modal
          resubmit
          @toggle-modal="toggleModal"
          @submit-approval="approveTranslation"
        >
          <p v-if="state.errorMessage" class="u-mb-- info-text">
            {{ state.errorMessage }}
          </p>
          <p v-else class="u-mb-- info-text">
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
          @toggle-modal="toggleModal"
          @submit-approval="approveTranslation"
        >
          <p class="u-mb-- info-text">
            Are you sure you want to {{ state.action }} this book ?
          </p>
        </confirmation-modal>
      </div>
    </modal>
  </div>
</template>

<script setup>
import { format } from 'date-fns';
import { storeToRefs } from 'pinia';
import first from 'lodash/first';
import isEmpty from 'lodash/isEmpty';

import { fetchAPI, storeAPI } from '~/helpers/apiCore';
import Modal from '~/components/structure/Modal';
import Book from '~/components/project-list/project/Book';
import { useTranslationStore, useUserStore } from '~/store';
import Language from '~/components/project-list/project/Language.vue';
import ErrorModal from '~/components/modal-content/timeline/ErrorModal.vue';
import ProcessingModal from '~/components/translate/new-project/ProcessingModal.vue';
import CompletionModal from '~/components/modal-content/timeline/CompletionModal.vue';
import ConfirmationModal from '~/components/modal-content/timeline/ConfirmationModal.vue';

definePageMeta({
  layout: 'fullwidth',
});

const state = reactive({
  timeline: null,
  showModal: false,
  sendingForApproval: false,
  sentForApproval: false,
  approvalError: false,
  action: '',
  translation: null,
  errorMessage: '',
});

const route = useRoute();

const runtimeConfig = useRuntimeConfig();
const { egwApi } = runtimeConfig.public;

const userStore = useUserStore();
const translationStore = useTranslationStore();

const { isAdmin, name: username, isGc } = storeToRefs(userStore);
const { translation } = storeToRefs(translationStore);

onBeforeMount(() => {
  translationStore.fetchTranslation(
    route.params.language,
    route.params.abbreviation
  );
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

/** Link to the translation page of the current translation */
const translationLink = computed(() => {
  return `/translate/${route.params.language}/${route.params.abbreviation}/chapter/1/`;
});

const formattedDate = (dateToFormat) => {
  return format(new Date(dateToFormat), 'dd MMM yyyy');
};

/** Get Start Date of translation */
const translationStartDate = computed(() => {
  if (state.timeline) {
    return formattedDate(state.timeline.workCreated);
  }
  return null;
});

/** Get End Date of translation */
const translationEndDate = computed(() => {
  if (state.timeline?.workCompleted) {
    return formattedDate(state.timeline?.workCompleted);
  }
  return null;
});

/** Formats the time line to show the sent for approval and approved by timeline in the UI */
const getFormattedTimeline = () => {
  state.timeline.approvalTimeline.forEach((element, index) => {
    if (
      state.timeline.approvalTimeline[index + 1] &&
      state.timeline.approvalTimeline[index].action === 'approved' &&
      state.timeline.approvalTimeline[index + 1].action !== 'revoked'
    ) {
      state.timeline.approvalTimeline.splice(index + 1, 0, {
        ...element,
        action: 'approved-by',
      });
    }
  });

  return state.timeline.approvalTimeline
    .filter((item) => item.assigneeRole !== item.assignToRole)
    .reverse();
};

/** Returns the formatted project timeline */
const approvalTimeline = computed(() => {
  if (state.timeline?.approvalTimeline) {
    return getFormattedTimeline();
  }
  return [];
});

/**
 * Get the current progress of the book
 */
const bookProgress = computed(() => {
  return translation.value?.bookProgress;
});

/**
 * Is true if the timeline data is empty
 */
const isPending = computed(() => {
  return isEmpty(state.timeline);
});

const isApprovedByGC = computed(() => {
  return (
    approvalTimeline.value[0]?.assignToRole === 'general_conference' &&
    approvalTimeline.value[0]?.action === 'approved-by'
  );
});

/**
 * Checks if the current book is in approval process or not
 */
const isBookInApprovalProcess = computed(() => {
  return bookProgress.value > 1 && bookProgress.value < 11;
});

const getUserRoleByWorkId = () => {
  return userStore.userRoleByWorkId(translation.value?.id);
};

const checkIfloggedInUserIsAssigned = (roles) => {
  const latestUpdate = first(approvalTimeline.value);

  if (
    (latestUpdate?.assignToRole === 'general_conference' && isGc.value) ||
    latestUpdate?.assignToGroup === username.value ||
    roles.includes(latestUpdate?.assignToRole)
  ) {
    return latestUpdate;
  }
};

/**
 * Checks if the approve button can be shown or not
 */
const showApproveAction = computed(() => {
  const userRole = getUserRoleByWorkId();
  const approvedByData = checkIfloggedInUserIsAssigned(userRole);

  if (approvedByData) {
    return (
      approvedByData?.action === 'approved' &&
      translationEndDate.value &&
      !isEmpty(approvalTimeline.value) &&
      isBookInApprovalProcess.value
    );
  } else if (isGc.value && isBookInApprovalProcess.value) {
    return !isApprovedByGC.value;
  }
  return false;
});

/** Value to open/close the modal */
const isModalOpen = computed(() => {
  return state.showModal;
});

watch(bookProgress, (newValue) => {
  return newValue;
});

watch(translation, (newValue) => {
  if (newValue?.id) {
    fetchTranslationTimeline();
  }
});

const fetchTranslationTimeline = async () => {
  const { data } = await fetchAPI(
    `translations/${translation.value.id}/timeline/`
  );

  state.timeline = data;
  if (!isEmpty(data?.approvalTimeline))
    state.timeline.approvalTimeline = data.approvalTimeline?.map((item) => ({
      ...item,
      date: formattedDate(item.date),
    }));
};

const getRoleValue = computed(() => {
  const userRole = getUserRoleByWorkId();
  const approvedByData = checkIfloggedInUserIsAssigned(userRole);

  const assigneeRole = approvedByData
    ? approvedByData?.assignToRole
    : isGc.value
    ? 'general_conference'
    : 'editor';

  return assigneeRole;
});

const getRoleText = computed(() => {
  switch (getRoleValue.value) {
    case 'general_conference':
      return 'General Conference';

    case 'approver':
      return 'Approver';

    case 'editor':
      return 'Editor';

    default:
      return getRoleValue.value;
  }
});

const approveTranslation = (e) => {
  e.stopPropagation();
  state.sendingForApproval = true;
  state.sentForApproval = false;
  state.approvalError = false;

  const formData =
    state.action === 'revoke'
      ? {
          assigneeRole: first(approvalTimeline.value)?.assigneeRole,
          setTo: 0,
          timestamp: new Date(),
        }
      : {
          assigneeRole: getRoleValue.value,
          setTo: 1,
          timestamp: new Date(),
        };

  storeAPI(`/translations/${translation.value.id}/vote/`, formData)
    .then((res) => {
      if (
        (res?.statusCode === 200 || res?.statusCode === 201) &&
        res?.data?.bookapprove?.id
      ) {
        state.sendingForApproval = false;
        state.sentForApproval = true;
        state.approvalError = false;
        state.timeline = [];
        fetchTranslationTimeline();
      } else {
        state.sendingForApproval = false;
        state.sentForApproval = false;
        state.approvalError = true;
        state.errorMessage = res?.data?.message;
      }
    })
    .catch(() => {
      state.sendingForApproval = false;
      state.sentForApproval = false;
      state.approvalError = true;
    });
};

const showRevokeOption = (currentItem, currentIndex) => {
  return currentIndex === 0 && username.value === currentItem?.username;
};

const toggleModal = (action = '') => {
  state.showModal = !state.showModal;
  state.sendingForApproval = false;
  state.sentForApproval = false;
  state.approvalError = false;
  state.action = action;
};
</script>

<style lang="scss">
.translation-detail {
  background: #f8f8f8;

  .translation-detail__header {
    padding: 50px 130px 0 130px;

    .c-header__link {
      margin-bottom: 25px;
    }
    .book-cover {
      margin-right: 20px;
    }
    .approve-btn {
      height: fit-content;
      width: fit-content;
      padding: 5px 12px;
      margin-bottom: auto;
      margin-left: 15px;
      margin-top: 8px;
      font-size: 13px;
    }

    .translation-detail__header-title {
      .language-info {
        margin-left: 10px;
      }

      .header--layer-two {
        margin-top: 5px;
      }
    }

    .role-info {
      border: 1px solid $c-yellow-4;
      width: fit-content;
      margin-top: 20px;
      padding: 5px 10px;
      border-radius: 8px;
      background-color: $c-yellow-2;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .translation-detail__body {
    padding: 0 130px;
    margin-top: 25px;
    display: flex;
    margin-bottom: 64px;

    .project-timeline {
      .project-timeline__header {
        padding: 7px 0;

        h4 {
          margin-bottom: 16px;
          font-weight: 400;
          font-size: 24px;
          line-height: 140%;
        }
        p {
          width: 350px;
        }
      }

      .project-timeline__body {
        margin-top: 20px;
        .c-timeline {
          .c-timeline__item {
            background: unset;
            padding: 0 12px 12px 64px;
            min-height: 100px;
            max-height: fit-content;
            margin-bottom: 20px;
            .c-node {
              height: 40px;
              width: 40px;
              left: 4px;
              top: 0;
              background-color: unset;
              border: none;
              img {
                width: 100%;
              }
            }

            .c-timeline__info {
              .c-timeline-date {
                font-weight: 600;
                font-size: 12px;
                line-height: 130%;
                letter-spacing: 0.03em;
                text-transform: uppercase;
                color: rgba(39, 39, 39, 0.52);
              }

              .c-timeline-title {
                font-weight: 600;
                font-size: 16px;
                color: #272727;
                margin-top: 8px;
                margin-bottom: 8px;
                span {
                  margin-left: 5px;
                  margin-right: 5px;
                  font-weight: 500;
                  color: rgba(39, 39, 39, 0.52);
                }

                &.is-loading {
                  width: 300px;
                }
              }

              .c-timeline-text {
                font-weight: 400;
                font-size: 14px;
                line-height: 150%;
                color: rgba(39, 39, 39, 0.8);
                margin-bottom: 8px;
              }

              .c-revoke-btn,
              .c-submit-approval-btn {
                font-weight: 400;
                font-size: 14px;
                line-height: 120%;
                margin-top: 0px;
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                transition: color 0.2s ease-in;
              }
              .c-revoke-btn {
                color: #fb7878;

                &:hover {
                  color: #f81e1e;
                }
              }
              .c-submit-approval-btn {
                color: $c-primary-5;

                &:hover {
                  color: $c-primary-7;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
