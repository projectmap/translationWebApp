<script setup>
import get from 'lodash/get';
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import Modal from '../structure/Modal.vue';
import ErrorModal from '../modal-content/timeline/ErrorModal.vue';
import ProcessingModal from '../translate/new-project/ProcessingModal.vue';
import CompletionModal from '../modal-content/timeline/CompletionModal.vue';
import ConfirmationModal from '../modal-content/timeline/ConfirmationModal.vue';

import Project from './project';
import Book from './project/Book.vue';
import Pagination from './Pagination';
import Language from './project/Language.vue';
import ProjectListHeader from './ProjectListHeader.vue';
import ProjectListSubHeader from './ProjectListSubHeader.vue';
import Ctooltip from '~/components/utilities/Ctooltip.vue';
import { checkSyncedDataForCurrentChapter } from '~/components/modal-content/syncModal/helper';
import SyncModal from '~/components/modal-content/syncModal/index.vue';

import Alert from '@/components/utilities/Alert';
import Async from '@/components/renderless/Async';

import {
  OFFLINE_BOOK,
  OFFLINE_TABLE_OF_CONTENT,
} from '~/service-worker/constants';
import {
  saveTranslationToLocalDb,
  getLocalTranslationData,
  removeDataFromIndexDB,
} from '~/service-worker/db';
import {
  useAuthStore,
  useTranslationStore,
  useUserStore,
  userAlertStore,
} from '~/store';

const props = defineProps({
  title: { type: String, default: '' },
  layout: { type: String, default: 'compact' },
  hide: { type: Array, default: () => [] },
  defaultParams: { type: Object, default: () => ({}) },
  seamless: Boolean,
  bookSubmitted: { type: Boolean, default: false },
  offlineRecentWork: { type: Object, default: () => ({}) },
  offlineBook: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  'emit-click',
  'update-layout',
  'get-selected-translation',
  'handle-approval-modal',
]);

/*
 * Options for the ordering filter
 */
const orderingOptions = [
  {
    name: 'Priority',
    param: 'priority,-reviewed,-translated,-pretranslated,title',
  },
  { name: 'Progress', param: '-reviewed,-translated,-pretranslated,title' },
  { name: 'Title (A-Z)', param: 'title' },
  { name: 'Title (Z-A)', param: '-title' },
  { name: 'Contributors', param: '-contributors' },
  { name: 'Recent Activity', param: '-last_activity' },
];

const state = reactive({
  options: {
    language: [],
    type: [],
    tag: [],
    year: [],
    ordering: orderingOptions,
  },
  params: {
    limit: 15,
    offset: 0,
    is_authorized: false,
    protected: false,
    ordering: null,
    language: null,
    type: null,
    tag: null,
    year: null,
    search: null,
    domain: null,
    archive: false,
  },
  isRestoreModal: false,
  pending: false,
  success: false,
  error: false,
  errorMessage: null,
  selectedTranslation: null,
  isDownloadModelOpen: false,
  selectedChapters: [],
  downloadingChapterID: null,
  downloadedChapters: 0,
  downloadingChapterIDs: [],
  removingChapterID: null,
  syncModal: false,
  syncComplete: false,
  chapterRestoreComplete: false,
  unsynchedSegments: [],
  unsynchedVotes: [],
  selectedChapterToRemove: null,
  deleteConfirmationModal: false,
  viewDownloadInfo: false,
  selectedChapter: null,
});

const runtimeConfig = useRuntimeConfig();
const { egwApi } = runtimeConfig.public;

const userStore = useUserStore();
const translationStore = useTranslationStore();
const authStore = useAuthStore();
const alertStore = userAlertStore();

const { isOnline } = storeToRefs(authStore);
const { languageCode } = storeToRefs(userStore);
const { chaptersPending, downloadingChapter, chapterDownloadListError } =
  storeToRefs(translationStore);

onBeforeMount(() => {
  state.params.language = languageCode.value;

  // overwrite with default-params
  if (props.defaultParams) {
    Object.assign(state.params, props.defaultParams);
  }
});

const egwBookNumber = computed(() => {
  return parseInt(get(state.selectedTranslation, 'original.key'));
});

const chapterInfoNextURL = computed(() => {
  return translationStore.getChapterInfoList(state.selectedTranslation?.id)
    ?.nextUrl;
});

const chapterInfo = computed(() => {
  return translationStore.getChapterInfoList(state.selectedTranslation?.id)
    ?.chapters;
});

const totalDownloadedChapters = computed(() => {
  if (!isEmpty(chapterInfo.value)) {
    return chapterInfo.value?.filter((item) => item.downloaded).length;
  }
  return 0;
});

const canDownloadChapters = (chapter) => {
  if (chapter?.canReview) {
    return (
      chapter?.canReview &&
      state.selectedChapters.length + totalDownloadedChapters.value < 10
    );
  } else if (chapter?.canEdit) {
    return (
      chapter?.canEdit &&
      state.selectedChapters.length + totalDownloadedChapters.value < 10
    );
  } else {
    return (
      chapter?.canDownload &&
      state.selectedChapters.length + totalDownloadedChapters.value < 10
    );
  }
};

const totalChapters = computed(() => {
  return chapterInfo.value?.length;
});

const bulkDownloadEnable = computed(() => {
  return state.selectedChapters?.length > 1;
});

const toggleSyncModal = () => {
  state.syncModal = !state.syncModal;

  if (!state.syncModal) {
    state.syncComplete = false;
  }
};

watch(
  () => props.defaultParams,
  (val) => {
    if (val) Object.assign(state.params, props.defaultParams);
  }
);

watch(
  () => chapterDownloadListError.value,
  (val) => {
    if (val) {
      state.isDownloadModelOpen = false;
    }
  }
);

/*
 * Remove all filters except ordering
 */
const removeFilters = () => {
  state.params.offset = 0;
  state.params.language = null;
  state.params.type = null;
  state.params.tag = null;
  state.params.year = null;
  state.params.search = null;
  state.params.archive = false;

  userStore.setLanguage({
    code: '',
    name: '',
  });
  userStore.setFilterLanguage(null);
  updateLayout('detail');
};

/*
 * Request an array of objects for the language filter
 */

const emitClick = () => {
  emit('emit-click');
};

const updateLayout = (layout) => {
  emit('update-layout', layout);
};

const toggleApprovalModal = () => {
  emit('handle-approval-modal');
};

const setTranslation = (translation) => {
  emit('get-selected-translation', translation);
  state.selectedTranslation = translation;
  if (state.isDownloadModelOpen) {
    translationStore.fetchChapterInfo(translation?.id);
  }
};

/*
 * Update this.params with a key-value pair
 * The value may be an object with a "slug" key which is then used instead
 */
const onUpdate = (key, value) => {
  state.params.offset = 0; // reset to page 1 on filter change
  state.params[key] = get(value, 'slug', value);

  if (key === 'archive') {
    translationStore.getFilterOptions({}, value);
  }
  // update filter options
  if (key === 'language') {
    translationStore.getFilterOptions(value);
    userStore.setFilterLanguage(value);
    userStore.setLanguage(value);
  }

  if (key === 'type') {
    userStore.setFilterType(value);
  }
};

const toggleModal = () => {
  state.isRestoreModal = !state.isRestoreModal;
  state.pending = false;
  state.error = false;
  state.success = false;
  state.errorMessage = null;
};

const restoreTranslation = (e) => {
  e.stopPropagation();
  state.pending = true;
  state.success = false;
  state.error = false;

  translationStore
    .restoreTranslation(state.selectedTranslation?.id)
    .then((response) => {
      if (response?.id) {
        state.pending = false;
        state.success = true;
        state.error = false;
      } else {
        state.pending = false;
        state.success = false;
        state.error = true;
        state.errorMessage = response?.message;
      }
    })
    .catch(() => {
      state.pending = false;
      state.success = false;
      state.error = true;
    });
};

// Chapter download operations handler

const toggleDownloadModal = () => {
  state.isDownloadModelOpen = !state.isDownloadModelOpen;
  state.selectedChapters = [];
  state.viewDownloadInfo = false;
  state.selectedChapter = null;
};

const isChapterTranslatedEditedOrReviewed = (chapter) => {
  if (chapter.canEdit) {
    return chapter.approveCompleted;
  } else if (chapter.canReview) {
    return chapter.reviewCompleted;
  } else {
    return chapter.translationCompleted;
  }
};

const isChapterSelectedForDownload = (chapterItem) => {
  return !isEmpty(
    state.selectedChapters?.find(
      (item) => item?.chapterNumber === chapterItem?.chapterNumber
    )
  );
};

const bulkDownload = () => {
  state.downloadingChapterIDs = state.selectedChapters.map(
    (item) => item?.chapterNumber
  );
  state.selectedChapters.map((item) => downloadChapter(item));
};

const showLoader = (chapterItem) => {
  return (
    state.downloadingChapterID === chapterItem?.chapterNumber ||
    state.downloadingChapterIDs.includes(chapterItem?.chapterNumber)
  );
};

const showDeleteLoader = (chapterItem) => {
  return state.removingChapterID === chapterItem?.chapterNumber;
};

const removeChapterFromQueue = (chapterItem) => {
  state.selectedChapters = state.selectedChapters?.filter(
    (item) => item?.chapterNumber !== chapterItem?.chapterNumber
  );
  state.downloadingChapterIDs = state.downloadingChapterIDs?.filter(
    (item) => item !== chapterItem?.chapterNumber
  );
};

const addChapterToDownloadQueue = (event, chapterItem) => {
  event.preventDefault();
  if (isChapterSelectedForDownload(chapterItem)) {
    removeChapterFromQueue(chapterItem);
  } else {
    state.selectedChapters.push(chapterItem);
  }
};

const downloadChapter = async (chapterItem) => {
  state.downloadingChapterID = chapterItem?.chapterNumber;
  const offlineTranslation = await getLocalTranslationData(
    `${state.selectedTranslation?.id}_${OFFLINE_BOOK}`
  );

  const offlineChapters = await getLocalTranslationData(
    `${state.selectedTranslation?.id}_${OFFLINE_TABLE_OF_CONTENT}`
  );

  const offlineAction = chapterItem?.canReview
    ? 'review'
    : chapterItem?.canEdit
    ? 'edit'
    : null;

  try {
    const data = await translationStore.downloadChapter(
      chapterItem?.work,
      chapterItem?.chapterNumber,
      'offline',
      offlineAction
    );

    if (data?.statusCode === 200) {
      translationStore.patchChapterObjByWorkId(
        state.selectedTranslation?.id,
        chapterItem?.chapterNumber,
        { downloaded: true, canRevoke: true }
      );
      state.downloadingChapterID = null;
      if (!isEmpty(state.selectedChapters)) {
        removeChapterFromQueue(chapterItem);
      }
      userStore.requestFullProfile();
      // Segment Save in index db
      await saveTranslationToLocalDb({
        data: data.data,
        work: chapterItem?.work,
        chapter: chapterItem?.chapterNumber,
        key: `${chapterItem?.work}_${chapterItem?.chapterNumber}`,
      });

      // book info Save in index db
      if (offlineTranslation?.id !== state.selectedTranslation?.id) {
        await saveTranslationToLocalDb({
          data: state.selectedTranslation,
          key: `${state.selectedTranslation?.id}_${OFFLINE_BOOK}`,
        });
      }

      // chapter list save in index db

      let chapterList = translationStore.getChapterList(
        chapterItem?.work
      )?.chapters;

      const offlineTOCWorkID = offlineChapters?.[0]?.work;
      const currentTOCWorkId = chapterList?.[0]?.work;

      if (!chapterList.length && offlineTOCWorkID !== currentTOCWorkId) {
        chapterList = await translationStore.fetchALLTableOfContents(
          chapterItem?.id
        );
      }

      if (offlineTOCWorkID !== currentTOCWorkId) {
        await saveTranslationToLocalDb({
          data: chapterList,
          key: `${state.selectedTranslation?.id}_${OFFLINE_TABLE_OF_CONTENT}`,
        });
      }
    } else {
      state.downloadingChapterID = null;
      if (!isEmpty(state.selectedChapters)) {
        removeChapterFromQueue(chapterItem);
      }
      translationStore.patchChapterObjByWorkId(
        state.selectedTranslation?.id,
        chapterItem?.chapterNumber,
        { error: true, errorMessage: data.data.message }
      );
    }
  } catch (e) {
    state.downloadingChapterID = null;
    if (!isEmpty(state.selectedChapters)) {
      removeChapterFromQueue(chapterItem);
    }
  }
};

// Check for unsynced data in the local storage and remove from index db after the chapter is removed from downloads
const removeSegmentsAndVotesFromIndexDB = () => {
  if (!isEmpty(state.unsynchedSegments)) {
    state.unsynchedSegments.forEach((cs) => {
      removeDataFromIndexDB(
        `${cs?.work}_${cs?.chapter}_${cs?.position}`,
        'segments'
      );
    });
  }

  if (!isEmpty(state.unsynchedVotes)) {
    state.unsynchedVotes.forEach((cs) => {
      removeDataFromIndexDB(cs?.key, 'votes');
    });
  }
};

// Remove chapters from downloads
const chapterRemoveHandler = async () => {
  state.deleteConfirmationModal = false;
  const chapterItem = state.selectedChapterToRemove;
  state.removingChapterID = chapterItem?.chapterNumber;
  state.chapterRestoreComplete = false;
  try {
    const data = await translationStore.downloadChapter(
      chapterItem?.work,
      chapterItem?.chapterNumber,
      'revoke-download'
    );

    if (data?.statusCode === 200) {
      await removeDataFromIndexDB(
        `${chapterItem?.work}_${chapterItem?.chapterNumber}`,
        'translation'
      );

      translationStore.patchChapterObjByWorkId(
        state.selectedTranslation?.id,
        chapterItem?.chapterNumber,
        { downloaded: false, canDownload: true, user: null }
      );

      removeSegmentsAndVotesFromIndexDB(chapterItem);
      state.removingChapterID = null;
      state.chapterRestoreComplete = true;
      userStore.requestFullProfile();
      alertStore.new({
        message: 'Chapter has been successfully removed from downloads',
        color: 'green',
        duration: 2000,
      });
    }
  } catch (e) {
    state.removingChapterID = null;
    state.chapterRestoreComplete = false;
  }
};

const toggleConfirmationModal = () => {
  state.deleteConfirmationModal = !state.deleteConfirmationModal;
};

// Sync modal operation handlers

const totalUnsynchedChanges = computed(() => {
  return state.unsynchedSegments?.length + state.unsynchedVotes?.length;
});

const manualRefreshTranslationApi = computed(() => {
  return props.bookSubmitted || state.success || state.chapterRestoreComplete;
});

const updateState = (key, value) => {
  if (!key) return;
  state[key] = value;

  if (key === 'syncComplete' && value) {
    chapterRemoveHandler();
  }
};

const checkForUnsyncedData = async (chapterItem) => {
  state.selectedChapterToRemove = chapterItem;

  const { segments, votes } = await checkSyncedDataForCurrentChapter(
    chapterItem
  );

  state.unsynchedSegments = segments;

  state.unsynchedVotes = votes;

  if (!isEmpty(segments) || !isEmpty(votes)) {
    state.syncModal = true;
  } else if (!state.syncModal) {
    state.deleteConfirmationModal = true;
  }
};

const toggleDownloadInfo = (e, chapterNumber) => {
  e.stopPropagation();
  if (state.selectedChapter) {
    state.selectedChapter = null;
  } else {
    state.selectedChapter = chapterNumber;
  }
  state.viewDownloadInfo = !state.viewDownloadInfo;
};

const loadMoreChapters = () => {
  const workId = state.selectedTranslation?.id;
  if (workId && chapterInfoNextURL.value) {
    translationStore.fetchChapterInfo(workId, chapterInfoNextURL.value);
  }
};
</script>

<template>
  <section class="c-projects" :class="{ 'c-projects--seamless': seamless }">
    <!-- header -->
    <project-list-header
      v-show="isOnline"
      :title="title"
      :seamless="seamless"
      :hide="hide"
      :layout="layout"
      :archive="state.params.archive"
      @update-options="onUpdate"
      @update-layout="updateLayout"
    />

    <!-- sub header -->

    <project-list-sub-header
      v-show="isOnline"
      :hide="hide"
      :archive="state.params.archive"
      :search="state.params.search"
      :ordering="state.options.ordering"
      :params="{
        language: state.params.language,
        type: state.params.type,
        tag: state.params.tag,
        ordering: state.params.ordering,
        is_authorized: state.params.is_authorized,
      }"
      @update-options="onUpdate"
      @remove-filters="removeFilters"
    />

    <async
      url="translations/"
      :params="state.params"
      :manual-refresh="manualRefreshTranslationApi"
    >
      <template #default="{ pending, error, data, pagination }">
        <ul v-if="pending && !data" class="c-projects__list u-mb0">
          <li v-for="n in 5" :key="n" class="c-projects__li">
            <project class="c-projects__item" :layout="layout" />
          </li>
        </ul>
        <alert v-else-if="error || !data" color="red" class="u-mb-">
          <div
            v-if="isOnline"
            class="o-flex o-flex--unit o-flex--center o-flex--middle"
          >
            <img src="/img/illustration-bug.svg" style="max-width: 100px" />
            <span>
              An error occured ...
              <br />It's probably not you, but try pushing some other buttons.
            </span>
          </div>
          <div v-else class="o-flex o-flex--unit o-flex--center o-flex--middle">
            <span> We could not find any downloaded books. </span>
          </div>
        </alert>
        <div v-else>
          <ul class="c-projects__list u-mb0">
            <li v-if="!data.length" class="c-projects__empty">
              <div class="u-muted u-text-center">
                <img
                  class="u-mb-"
                  src="/img/illustration-empty.svg"
                  style="max-width: 200px"
                />
                <p class="u-bold u-mb0">We couldn't find any books ...</p>
              </div>
            </li>
            <li
              v-for="item in data"
              v-else
              :key="item.id"
              class="c-projects__li"
              @click="emitClick()"
            >
              <project
                class="c-projects__item"
                :item="item"
                :layout="layout"
                :offline-recent-work="offlineRecentWork"
                :offline-book="offlineBook"
                @open-modal="toggleApprovalModal"
                @select-translation="setTranslation"
                @open-restore-modal="toggleModal"
                @toggle-download-modal="toggleDownloadModal"
              />
            </li>
          </ul>

          <pagination
            v-if="!hide.includes('pagination')"
            class="u-mt"
            :count="pagination.count"
            :next="pagination.next"
            :previous="pagination.previous"
            @update:page="onUpdate('offset', $event.offset)"
          />
        </div>
      </template>
    </async>

    <footer v-if="$slots.footer" class="c-projects__footer">
      <slot name="footer" />
    </footer>
    <modal
      title="Book Restore"
      :open="state.isRestoreModal"
      custom-classes="c-modal--completion"
      @update:open="toggleModal"
    >
      <processing-modal v-if="state.pending" />
      <div v-else-if="state.success">
        <completion-modal @toggle-modal="toggleModal">
          <p class="u-mb-- info-text">
            Book
            <span v-if="state.selectedTranslation">
              {{ state.selectedTranslation.title }}</span
            >
            has been restored.
          </p>
          <p class="u-mb-- sub-info-text">
            You can now make changes to the translation.
          </p>
        </completion-modal>
      </div>
      <div v-else-if="state.error">
        <error-modal
          resubmit
          @toggle-modal="toggleModal"
          @submit-approval="restoreTranslation"
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
          resubmit
          @toggle-modal="toggleModal"
          @submit-approval="restoreTranslation"
        >
          <p class="u-mb-- info-text">
            Are you sure you want to restore book
            <span v-if="state.selectedTranslation">
              {{ state.selectedTranslation.title }}</span
            >
            ?
          </p>
          <p class="u-mb-- sub-info-text">
            You will be able to make changes to this book once you restore this
            book.
          </p>
        </confirmation-modal>
      </div>
    </modal>

    <!-- Chapter Download Modal -->
    <modal
      title="Download Chapters"
      :open="state.isDownloadModelOpen"
      custom-classes="c-modal--completion c-modal--downloads"
    >
      <div class="header o-flex o-flex--middle">
        <div class="o-flex book-cover">
          <book :number="egwBookNumber" :egw-api="egwApi" />
        </div>
        <div class="o-flex o-flex--column book-info">
          <language
            v-if="state.selectedTranslation.languageObj"
            class="u-shrink0 u-relative u-z10 u-mr language"
            :language="state.selectedTranslation.languageObj"
          />
          <h2>
            {{ state.selectedTranslation.title }}
          </h2>
        </div>
        <button class="close-btn" @click.prevent="toggleDownloadModal">
          <i class="u-icon">close</i>
        </button>
      </div>
      <div class="body">
        <div class="top o-flex o-flex--middle o-flex--between">
          <div class="chapter-count">
            <h6>{{ totalChapters }} Chapters</h6>
            <span v-if="totalDownloadedChapters > 0"
              >{{ totalDownloadedChapters }} out of 10 chapters have been
              downloaded.</span
            >
            <span v-else>You can save 10 chapters at any time</span>
          </div>
          <button
            v-if="bulkDownloadEnable"
            class="c-download__btn block c-btn c-btn- c-btn--light c-btn--dark c-btn--primary"
            @click.stop.prevent="bulkDownload"
          >
            <div
              v-if="downloadingChapter"
              class="c-spinner c-spinner--small"
            ></div>
            <i v-else class="u-icon">file_download</i> Download
            <span> ({{ state.selectedChapters.length }}) </span>
          </button>
        </div>
        <div class="chapter-list">
          <ul>
            <li
              v-if="isEmpty(chapterInfo) && chaptersPending"
              class="o-flex o-flex--between"
            >
              <div class="c-spinner c-spinner--small"></div>
            </li>
            <li
              v-for="chapter in chapterInfo"
              v-else
              :key="`${chapter.chapter}-${chapter.work}`"
              class="chapter-item o-flex o-flex--middle o-flex--between"
              :class="{
                disabled:
                  !canDownloadChapters(chapter) &&
                  !isChapterSelectedForDownload(chapter),
              }"
            >
              <div class="chapter-item__left o-flex o-flex--middle">
                <div v-if="chapter.downloaded" class="chapter-status">
                  <i class="u-icon green">check</i>
                </div>
                <div
                  v-if="
                    !chapter.downloaded &&
                    !chapter.canDownload &&
                    !canDownloadChapters(chapter) &&
                    !isChapterSelectedForDownload(chapter)
                  "
                  class="chapter-status"
                >
                  <i class="u-icon red">block</i>
                </div>
                <input
                  v-show="
                    !isChapterTranslatedEditedOrReviewed(chapter) &&
                    !chapter.downloaded &&
                    chapter.canDownload
                  "
                  type="checkbox"
                  :disabled="
                    !canDownloadChapters(chapter) &&
                    !isChapterSelectedForDownload(chapter)
                  "
                  :checked="isChapterSelectedForDownload(chapter)"
                  @input="
                    (e) => {
                      addChapterToDownloadQueue(e, chapter);
                    }
                  "
                />
                <p class="chapter-title__info o-flex o-flex--middle">
                  <span class="chapter-title u-truncate">
                    {{ chapter.chapterName }}
                  </span>
                </p>
              </div>

              <div class="chapter-item__right o-flex o-flex--middle">
                <div
                  v-if="
                    chapter.downloaded &&
                    !isChapterTranslatedEditedOrReviewed(chapter) &&
                    chapter.canRevoke
                  "
                  class="chapter-status"
                >
                  <button
                    class="c-download__btn c-btn c-btn- c-btn--ghost c-btn--yellow"
                    @click.stop.prevent="checkForUnsyncedData(chapter)"
                  >
                    <div
                      v-if="showDeleteLoader(chapter)"
                      class="c-spinner c-spinner--small"
                    ></div>
                    <div v-else><i class="u-icon">refresh</i> Return</div>
                  </button>
                </div>
                <div
                  v-if="isChapterTranslatedEditedOrReviewed(chapter)"
                  class="chapter-status"
                >
                  <i class="u-icon green">check</i> Completed
                </div>

                <button
                  v-if="
                    !isChapterTranslatedEditedOrReviewed(chapter) &&
                    !chapter.downloaded &&
                    !chapter?.user
                  "
                  class="c-download__btn c-btn c-btn-"
                  :class="{
                    'c-btn--ghost c-btn--red': chapter.error,
                    'c-btn--light c-btn--dark c-btn--primary small':
                      !chapter.error,
                  }"
                  :disabled="
                    !canDownloadChapters(chapter) &&
                    !isChapterSelectedForDownload(chapter)
                  "
                  @click.stop.prevent="downloadChapter(chapter)"
                >
                  <div
                    v-if="showLoader(chapter)"
                    class="c-spinner c-spinner--small"
                  ></div>
                  <div v-else-if="chapter.error">
                    <i class="u-icon">refresh</i> Try again
                  </div>
                  <i v-else class="u-icon">file_download</i>
                </button>
                <div v-if="chapter.error" class="chapter-status">
                  <i class="u-icon error-red">help_outline</i>
                  <ctooltip :show="chapter.errorMessage">
                    {{ chapter.errorMessage }}
                  </ctooltip>
                </div>

                <div
                  v-if="!chapter.downloaded && chapter.user"
                  class="download-info"
                >
                  <button
                    class="c-download__btn c-btn c-btn- c-btn--info small"
                    @click="(e) => toggleDownloadInfo(e, chapter.chapterNumber)"
                  >
                    <span
                      v-if="
                        state.viewDownloadInfo &&
                        state.selectedChapter === chapter.chapterNumber
                      "
                      class="u-icon info-icon"
                      >close</span
                    >
                    <span v-else class="u-icon info-icon"> info_outline</span>
                  </button>

                  <div
                    v-if="
                      state.viewDownloadInfo &&
                      state.selectedChapter === chapter.chapterNumber
                    "
                    class="download-info-popup"
                  >
                    <h6>Downloaded by</h6>
                    <p class="chapter-role-username">
                      {{ chapter?.user?.username }} ({{
                        chapter?.user?.role ?? ''
                      }})
                    </p>
                  </div>
                </div>
              </div>
            </li>
            <div
              v-if="chapterInfoNextURL"
              class="load-more-container o-flex o-flex--center"
            >
              <button
                class="c-btn c-btn--primary c-btn--ghost c-btn-"
                @click="loadMoreChapters"
              >
                <template v-if="!isEmpty(chapterInfo) && chaptersPending">
                  <div class="c-spinner c-spinner--small"></div>
                  <span>Loading...</span>
                </template>
                <template v-else>
                  <span>Load More Chapters</span>
                </template>
              </button>
            </div>
          </ul>
        </div>
      </div>
    </modal>

    <!-- Sync modal -->
    <sync-modal
      v-if="state.syncModal"
      :open="state.syncModal"
      :completed="state.syncComplete"
      :offline-book="offlineBook"
      :offline-segments="state.unsynchedSegments"
      :offline-votes="state.unsynchedVotes"
      :unsynched-changes="totalUnsynchedChanges"
      view="chapter"
      @toggle-sync-modal="toggleSyncModal"
      @update-state="updateState"
      @get-offline-datas-from-indexdb="checkForUnsyncedData"
    />

    <!-- Delete confirmation modal -->
    <modal
      title="Remove From downloads"
      :open="state.deleteConfirmationModal"
      custom-classes="c-modal--completion"
      @update:open="toggleConfirmationModal"
    >
      <confirmation-modal
        resubmit
        @toggle-modal="toggleConfirmationModal"
        @submit-approval="chapterRemoveHandler"
      >
        <p class="u-mb-- info-text">
          Are you sure you want to remove chapter
          <span v-if="state.selectedChapterToRemove">
            {{ state.selectedChapterToRemove.chapterName }}</span
          >
          from downloads ?
        </p>
        <p class="u-mb-- sub-info-text">
          You won't be able to access this chapter in offline mode if removed
          from downloads.
        </p>
      </confirmation-modal>
    </modal>
  </section>
</template>

<style lang="scss">
.c-projects__list {
  list-style: none;
  margin-left: 0;
}

.c-projects__empty {
  padding: $unit-large;
  border-radius: $global-radius;
  box-shadow: $global-shadow-3;
  background-color: $c-white;
}

.c-projects__li {
  padding: $unit-tiny 0;

  .c-projects--seamless & {
    border-top: 1px solid $c-border;
  }
}

.c-projects__item {
  box-shadow: $global-shadow-3;
  transition: box-shadow $global-transition;

  &:hover {
    box-shadow: $global-shadow-2;
  }

  .c-projects--seamless & {
    box-shadow: none;

    &:hover {
      box-shadow: none;
    }
  }
}

.filters-container {
  position: relative;
  display: flex;

  & > div {
    margin-right: 10px;
  }
  .domain-filters {
    position: absolute;
    left: -200px;
    top: 50px;
    padding: 15px 15px 0 15px;
    z-index: 15;
    border-radius: 5px;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px,
      rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
    background: white;
    width: 640px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;

    .arrow {
      position: absolute;
      border-width: 0 3px 3px 0;
      display: inline-block;
      padding: 5px;
      transform: rotate(-135deg);
      -webkit-transform: rotate(-135deg);
      top: -5px;
      right: 96px;
      background: white;
      z-index: 0;
    }

    .c-btn {
      width: 200px !important;
      justify-content: space-between;
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
  }
}

.download-info {
  position: relative;
  cursor: pointer;
  margin-left: 10px;
  .info-icon {
    font-size: 18px;
  }
  .download-info-popup {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 32px;
    right: 0;
    background: white;
    box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    min-height: fit-content;
    max-height: 200px;
    width: fit-content;
    padding: 8px 14px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 10;

    h6 {
      color: rgba(39, 39, 39, 0.52);
      font-size: 14px;
      font-weight: 400;
      margin-bottom: 3px;
    }

    .chapter-role-username {
      margin-bottom: 0;
      font-size: 13px;
      line-height: 21px;
      font-weight: 400;
      letter-spacing: 0.0025em;
      display: flex;
      width: 230px;
      word-wrap: break-word;
      white-space: normal;
    }
  }
}

.c-projects__footer {
  padding: $unit-small $unit;
  border-top: 1px solid $c-border;
}

.c-btn-archive {
  margin-left: 10px;
  margin-right: 10px;
}

.c-modal--downloads {
  width: 700px;
  .c-modal__body {
    padding: 0;
  }
  .header {
    border-bottom: 1px solid $c-border;
    padding: 20px 30px;
    .book-info {
      margin-left: 16px;
      .language {
        margin-bottom: 8px;
      }

      h2 {
        font-size: 24px;
        font-weight: 600;
        line-height: 34px;
        letter-spacing: 0em;
        text-align: left;
        margin-bottom: 0px;
      }
    }

    .close-btn {
      margin-left: auto;
      margin-bottom: auto;
      font-size: 20px;
    }
  }

  .body {
    padding: 20px 0;

    .c-download__btn {
      width: fit-content;
      height: fit-content;
      padding: 3px 5px;
      font-size: 14px;
      display: flex;
      align-content: center;
      justify-content: center;

      &.block {
        span {
          margin-left: 5px;
        }

        .u-icon {
          margin-right: 5px;
        }
        .c-spinner--small {
          height: 15px;
          width: 15px;
          border-width: 1px;
          margin-right: 5px;
        }
      }

      &.small {
        padding: 0;
        height: 30px;
        width: 30px;

        .u-icon {
          margin-right: 0px;
        }
      }

      &.small,
      &.c-btn--red,
      &.c-btn--yellow {
        .c-spinner--small {
          height: 15px;
          width: 15px;
          border-width: 1px;
        }
      }
    }
    .top {
      margin-bottom: 28px;
      padding: 0 30px;
      .chapter-count {
        h6 {
          margin-bottom: 2px;
        }
        span {
          font-size: 13px;
          font-weight: 400;
          line-height: 21px;
          letter-spacing: 0.0025em;
          text-align: left;
          color: rgba($color: $c-black-1, $alpha: 0.8);
        }
      }
    }

    .chapter-list {
      padding: 0 5px 0 0;

      ul {
        padding: 0 30px;
        list-style: none;
        margin-left: 0px;
        max-height: 400px;
        overflow-y: auto;
        li {
          border-bottom: 1px solid $c-border;
          min-height: 60px;

          &.disabled {
            cursor: not-allowed;

            input[type='checkbox'] {
              cursor: not-allowed;
            }
          }
          .chapter-item__left {
            input[type='checkbox'] {
              margin: 0px 10px 0 0;
              width: unset !important;
            }
          }
          .chapter-title__info {
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
            letter-spacing: 0.005em;
            text-align: left;
            color: $c-black-1;
            width: 300px;

            .chapter-count {
              margin-right: 4px;
            }
          }

          .chapter-item__left {
            .u-icon {
              &.green,
              &.red {
                margin-right: 10px;
              }
            }
          }
          .chapter-item__left,
          .chapter-item__right {
            .chapter-status {
              font-size: 13px;

              .u-icon {
                &.green {
                  color: green;
                }
                &.red {
                  color: red;
                }

                &.error-red {
                  color: $c-gray-6;
                  font-size: 17px;
                  margin-left: 8px;
                  cursor: pointer;
                }
              }
            }
          }
        }

        &::-webkit-scrollbar {
          width: 5px;
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

      .load-more-container {
        margin-top: 15px;

        button {
          width: 50%;
          font-size: 15px;
          display: flex;
          justify-content: center;
          align-items: center;

          .c-spinner--small {
            width: 15px;
            height: 15px;
            border-width: 2px;
            margin: 0px;
          }

          span {
            margin-left: 10px;
            width: fit-content;
          }
        }
      }
    }
  }
}
</style>
