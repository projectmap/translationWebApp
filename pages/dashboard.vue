<template>
  <pane>
    <template #aside>
      <!-- User -->
      <div class="o-flex o-flex--middle u-mb">
        <img class="u-1/4 u-rounded" :src="getAvatar" />
        <User class="u-ml-" :user="userInfo" points role />
      </div>

      <hr />

      <!-- recent activities -->
      <h2 class="u-h2-alt u-mb-">Recent Activities</h2>
      <span v-if="!isEmpty(activities)">
        <activities-list class="u-mb-" :items="activities" />
        <nuxt-link to="/activities/" class="c-btn c-btn--ghost c-btn--">
          Show more
        </nuxt-link>
      </span>
      <strong v-else class="u-muted">No activities</strong>
    </template>

    <!-- Main -->
    <template #main>
      <header class="o-flex o-flex--between o-flex--middle c-pane__header">
        <h1 class="u-mb0 u-mr">Translation Projects</h1>
        <div class="o-flex">
          <button
            v-if="canSyncData"
            class="c-btn c-btn--primary c-btn--"
            @click.prevent="toggleSyncModal"
          >
            <span class="u-icon">refresh</span>
            Sync offline data
          </button>
          <button
            v-if="hasRecentWork"
            class="c-btn c-btn--yellow c-btn--"
            style="margin-left: 10px"
            @click.prevent="goToRecentWork"
          >
            Resume previous work
            <span class="u-icon u-icon--move u-icon-left-u"
              >keyboard_arrow_right</span
            >
          </button>
        </div>
      </header>

      <!-- Project list -->
      <project-list
        class="u-mb+"
        :layout="layout"
        :default-params="defaultParams"
        :book-submitted="state.sentForApproval"
        :offline-recent-work="state.recentSegment"
        :offline-book="state.offlineBook"
        :hide="!isOnline ? ['pagination'] : []"
        @handle-approval-modal="toggleModal"
        @get-selected-translation="getSelectedTranslation"
        @update-layout="updateLayout"
      />

      <p v-if="isOnline" class="u-text-right u-muted u-m0">
        <i class="u-icon">info_outline</i>
        You can view your information on your
        <nuxt-link :to="`${cpanelUrl}/accounts/profile`">profile page</nuxt-link
        >.
      </p>

      <modal
        title="Book Approval"
        :open="state.isApprovalModalOpen"
        custom-classes="c-modal--completion"
        @update:open="toggleModal"
      >
        <processing-modal v-if="state.sendingForApproval" />
        <div v-else-if="state.sentForApproval">
          <completion-modal
            :timeline-link="timelineLink"
            @toggle-modal="toggleModal"
          >
            <p class="u-mb-- info-text">
              Book
              <span v-if="selectedTranslationTitle">
                {{ selectedTranslationTitle }}</span
              >
              has been sent for approval.
            </p>
            <p class="u-mb-- sub-info-text">
              You will be notified once your request has been approved.
            </p>
          </completion-modal>
        </div>
        <div v-else-if="state.approvalError">
          <error-modal
            resubmit
            @toggle-modal="toggleModal"
            @submit-approval="sendBookForApproval"
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
            @submit-approval="sendBookForApproval"
          >
            <p class="u-mb-- info-text">
              Are you sure you want to send this book
              <span v-if="selectedTranslationTitle">
                {{ selectedTranslationTitle }}</span
              >
              for approval?
            </p>
            <p class="u-mb-- sub-info-text">
              Once sent, you will not be able to make any further changes.
            </p>
          </confirmation-modal>
        </div>
      </modal>

      <sync-modal
        v-if="state.syncModal"
        :open="state.syncModal"
        :completed="state.syncComplete"
        :offline-book="state.offlineBook"
        :offline-segments="state.offlineSegments"
        :offline-votes="state.offlineVotes"
        :unsynched-changes="totalUnsynchedChanges"
        @toggle-sync-modal="toggleSyncModal"
        @update-state="updateState"
        @get-offline-datas-from-indexdb="getOfflineDatasFromIndexDB"
      />
    </template>
  </pane>
</template>

<script setup>
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { storeToRefs } from 'pinia';

import {
  useActivitiesStore,
  useAuthStore,
  useTranslationStore,
  useUserStore,
} from '~/store';
import {
  getLocalSegmentVotesByWorkData,
  getLocalTranslatedSegmentByWorkData,
  getLocalTranslationByWorkData,
  getLocalTranslationData,
  saveTranslationToLocalDb,
} from '~/service-worker/db';
import {
  OFFLINE_BOOK,
  OFFLINE_TABLE_OF_CONTENT,
  RECENT_ACTIVITIES,
} from '~/service-worker/constants';

import User from '@/components/utilities/User.vue';
import Pane from '@/components/structure/Pane.vue';
import Modal from '~/components/structure/Modal.vue';
import { fetchAPI, storeAPI } from '~/helpers/apiCore';
import ActivitiesList from '@/components/activities/List';
import ProjectList from '@/components/project-list/index.vue';
import SyncModal from '~/components/modal-content/syncModal/index.vue';
import ErrorModal from '~/components/modal-content/timeline/ErrorModal.vue';
import ProcessingModal from '~/components/translate/new-project/ProcessingModal.vue';
import CompletionModal from '~/components/modal-content/timeline/CompletionModal.vue';
import ConfirmationModal from '~/components/modal-content/timeline/ConfirmationModal.vue';

definePageMeta({
  offline: true,
});

useHead({
  title: 'Dashboard',
});
const router = useRouter();

const user = useUserStore();
const activitiesStore = useActivitiesStore();
const translationStore = useTranslationStore();
const authStore = useAuthStore();

const selectedTranslation = ref('');
const layout = ref('detail');
const defaultParams = ref({
  language: null,
});

const state = reactive({
  isApprovalModalOpen: false,
  sendingForApproval: false,
  sentForApproval: false,
  approvalError: false,
  errorMessage: '',
  offlineSegments: [],
  offlineVotes: [],
  syncModal: false,
  unsynchedSegments: [],
  unsynchedVotes: {},
  syncComplete: false,
  offlineBook: {},
  recentSegment: {},
});

const { isOnline } = storeToRefs(authStore);
const { recentWork } = storeToRefs(translationStore);
const { getUser, userDownloadInfo } = storeToRefs(user);
const { getSorted: activities } = storeToRefs(activitiesStore);

const runtimeConfig = useRuntimeConfig();
const { cpanelUrl } = runtimeConfig.public;

const syncOfflineOriginalData = async () => {
  const work = userDownloadInfo.value.workId;
  const chapters = userDownloadInfo.value.chapters;

  if (!work) return;

  // OFFLINE TOC
  const offlineTOC = await getLocalTranslationData(
    `${work}_${OFFLINE_TABLE_OF_CONTENT}`
  );

  if (!offlineTOC) {
    const data = await translationStore.fetchALLTableOfContents(work);

    await saveTranslationToLocalDb({
      data,
      key: `${work}_${OFFLINE_TABLE_OF_CONTENT}`,
    });
  }

  // OFFLINE BOOK INFO
  const offlineBook = await getLocalTranslationData(`${work}_${OFFLINE_BOOK}`);

  if (!offlineBook) {
    const { data } = await fetchAPI(`/translations/${work}`);
    await saveTranslationToLocalDb({
      data,
      key: `${work}_${OFFLINE_BOOK}`,
    });
  }

  const alreadyOffline = (await getLocalTranslationByWorkData(work))
    ?.map((chap) => chap?.[0]?.chapter)
    .filter(Boolean);

  const toSyncOflineChapters =
    alreadyOffline && alreadyOffline.length > 0
      ? chapters.filter((chap) => !alreadyOffline.includes(chap))
      : chapters;

  if (!toSyncOflineChapters.length) return;

  const segmentsPromise = toSyncOflineChapters?.map((chap) =>
    translationStore.downloadChapter(work, chap, 'fetch')
  );

  const segmentsStorePromise = (await Promise.allSettled(segmentsPromise))
    .map((chap) => {
      if (chap.status === 'fulfilled') {
        const { data } = chap.value;
        const chapter = data?.[0]?.chapter;

        if (!chapter) return null;

        return saveTranslationToLocalDb({
          data,
          work,
          chapter,
          key: `${work}_${chapter}`,
        });
      }

      return null;
    })
    .filter(Boolean);

  Promise.allSettled(segmentsStorePromise);
};

const hasRecentWork = computed(() => {
  if (isOnline.value) {
    return Boolean(recentWork.value?.recentWork?.id);
  } else {
    return Boolean(state.recentSegment?.id);
  }
});

const goToRecentWork = () => {
  let chapterNum = null;
  let abbr = null;
  let lang = null;
  if (isOnline.value) {
    chapterNum = recentWork.value?.recentSegment?.chapter;
    abbr = recentWork.value?.recentWork?.abbreviation;
    lang = recentWork.value?.recentWork?.language;
  } else {
    chapterNum = state.recentSegment?.chapter;
    abbr = state.offlineBook?.abbreviation?.toLowerCase();
    lang = state.offlineBook?.language?.code?.toLowerCase();
  }

  if (chapterNum && lang && abbr) {
    router.push(`/translate/${lang}/${abbr}/chapter/${chapterNum}`);
  }
};

const userInfo = computed(() => getUser.value);

const getSelectedTranslation = (translation) => {
  selectedTranslation.value = translation;
  translationStore.setSelectedTranslation(translation);
};

const getAvatar = computed(() => {
  return get(getUser.value, 'thumbnail');
});

const selectedTranslationTitle = computed(() => {
  return selectedTranslation.value?.title;
});

const updateLayout = (newLayout) => {
  layout.value = newLayout;
};

const toggleModal = () => {
  state.isApprovalModalOpen = !state.isApprovalModalOpen;
  state.sendingForApproval = false;
  state.sentForApproval = false;
  state.approvalError = false;
};

const sendBookForApproval = (e) => {
  e.stopPropagation();
  state.sendingForApproval = true;
  state.sentForApproval = false;
  state.approvalError = false;

  const formData = {
    assigneeRole: 'editor',
    setTo: 1,
    timestamp: new Date(),
  };
  storeAPI(`/translations/${selectedTranslation.value?.id}/vote/`, formData)
    .then((res) => {
      if (
        (res?.statusCode === 200 || res?.statusCode === 201) &&
        res?.data?.bookapprove?.id
      ) {
        state.sendingForApproval = false;
        state.sentForApproval = true;
        state.approvalError = false;
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

/* Operations to sync index DB data to remote DB */
const totalUnsynchedChanges = computed(() => {
  if (state.syncComplete) {
    return state.unsynchedSegments?.length + state.unsynchedVotes?.length;
  }

  return state.offlineSegments?.length + state.offlineVotes?.length;
});

const canSyncData = computed(
  () =>
    isOnline.value &&
    !isEmpty(state.offlineBook) &&
    totalUnsynchedChanges.value > 0
);

const toggleSyncModal = () => {
  state.syncModal = !state.syncModal;

  if (!state.syncModal) {
    state.syncComplete = false;
  }
};

const updateState = (key, value) => {
  if (!key) return;
  state[key] = value;
};

const getOfflineDatasFromIndexDB = async () => {
  const work = userDownloadInfo.value.workId;

  state.offlineSegments = await getLocalTranslatedSegmentByWorkData(
    0,
    'synced'
  );
  state.offlineVotes = await getLocalSegmentVotesByWorkData(0, 'synced');

  state.offlineBook = await getLocalTranslationData(`${work}_${OFFLINE_BOOK}`);
};

/* Operations to sync index DB data to remote DB end */

const getRecentOfflineWork = async () => {
  state.recentSegment = await getLocalTranslationData(
    `${userDownloadInfo.value.workId}_${RECENT_ACTIVITIES}`
  );
};

watch(() => userDownloadInfo.value.workId, syncOfflineOriginalData);

watch(
  () => [isOnline.value, userDownloadInfo.value.workId, state.syncComplete],
  getOfflineDatasFromIndexDB
);

watch(
  () => [!isOnline.value, userDownloadInfo.value.workId],
  getRecentOfflineWork
);

onMounted(async () => {
  await activitiesStore.request({ limit: 3 });
  getOfflineDatasFromIndexDB();

  if (!isOnline.value) {
    getRecentOfflineWork();
  }
});

onBeforeMount(() => {
  if (getUser.value?.language?.code) {
    defaultParams.value = {
      language: getUser.value?.language?.code,
    };
  }

  translationStore.fetchRecentTranslatedWork();
});
</script>

<style lang="scss">
.c-tutorial {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  color: $c-muted;
}

.c-tutorial__text {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0 $unit-tiny;
}

.c-tutorial__arrow {
  width: $unit-large;
  opacity: 0.4;
  margin-bottom: $unit-tiny;
}
</style>
