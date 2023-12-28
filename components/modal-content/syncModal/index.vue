<script setup>
import isEmpty from 'lodash/isEmpty';

import { storeToRefs } from 'pinia';
import BookInfoHeader from './Header.vue';
import { useTranslationStore, useUserStore } from '~/store';
import Modal from '~/components/structure/Modal.vue';
import {
  getLocalTranslationData,
  getLocalTranslatedSegmentByWorkData,
  getLocalSegmentVotesByWorkData,
  saveTranslatedSegmentToLocalDb,
  removeDataFromIndexDB,
  saveSegmentVotesToLocalDb,
} from '~/service-worker/db';
import ProcessingModal from '~/components/translate/new-project/ProcessingModal.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  offlineBook: { type: Object, default: () => {} },
  offlineSegments: { type: Array, default: () => [] },
  offlineVotes: { type: Array, default: () => [] },
  unsynchedChanges: { type: Number, default: 0 },
  view: { type: String, default: '' },
});

const emit = defineEmits([
  'toggle-sync-modal',
  'update-state',
  'get-offline-datas-from-indexdb',
]);

const translationStore = useTranslationStore();

const userStore = useUserStore();
const { userDownloadInfo } = storeToRefs(userStore);

const state = reactive({
  syncing: false,
  syncError: false,
  syncedSegments: [],
  syncedVotes: [],
});

const isModuleChapter = computed(() => {
  return props.view === 'chapter';
});

const toggleModal = () => {
  emit('toggle-sync-modal');
  if (!props.open) {
    state.syncError = false;
  }
};

const getOfflineDatasFromIndexDB = () => {
  emit('get-offline-datas-from-indexdb');
};

const totalSyncedChanges = computed(
  () => state.syncedSegments?.length + state.syncedVotes?.length
);

const formatSegmentsToSync = async (segments) => {
  const result = await segments.map((item) => ({
    id: item?.id,
    last_modified: item?.lastModified,
    content: item?.content,
    work: item?.work,
  }));

  return result;
};

let syncTimeout;

const removeSyncedData = async () => {
  const offlineChapers = userDownloadInfo.value.chapters;
  const chapterArr = [...new Set(offlineChapers)];
  const offlineBookId = props.offlineBook?.id;

  const allSyncedSegments = await getLocalTranslatedSegmentByWorkData(
    1,
    'synced'
  );

  const allSyncedVotes = await getLocalSegmentVotesByWorkData(1, 'synced');

  chapterArr.forEach(async (ch) => {
    const key = `${offlineBookId}_${ch}`;

    const originalSegmentsByChapter = await getLocalTranslationData(key);

    const syncedSegmentsByChapter = allSyncedSegments.filter(
      (item) => item?.chapter === ch
    );

    const syncedSegmentVotesByChapter = allSyncedVotes.filter(
      (item) => item?.chapter === ch
    );

    if (originalSegmentsByChapter.length === syncedSegmentsByChapter.length) {
      syncedSegmentsByChapter.forEach((cs) => {
        removeDataFromIndexDB(
          `${cs?.work}_${cs?.chapter}_${cs?.position}`,
          'segments'
        );
      });

      syncedSegmentVotesByChapter.forEach((cs) => {
        removeDataFromIndexDB(cs?.key, 'votes');
      });
    }
  });

  clearTimeout(syncTimeout);
  translationStore.fetchChapterInfo(offlineBookId);
};

const syncData = async () => {
  state.syncing = true;
  state.syncError = false;
  updateState('syncComplete', false);

  const formattedSegments = await formatSegmentsToSync(props.offlineSegments);

  const payload = {
    segments: formattedSegments,
    votes: props.offlineVotes,
  };

  const results = await translationStore.syncOfflineDataToRemoteDB(payload);

  if (results?.statusCode === 200) {
    state.syncedSegments = results?.data?.syncedSegments;
    state.syncedVotes = results?.data?.syncedApprovals;

    updateState('unsynchedSegments', results?.data?.unsycedSegments);
    updateState('unsynchedVotes', results?.data?.unsyncedApprovals);

    const syncedSegmentsArr = props.offlineSegments.filter((sg) =>
      state.syncedSegments.includes(sg?.id)
    );
    const syncedVotesArr = props.offlineVotes.filter((sg) =>
      state.syncedVotes.includes(sg?.segment)
    );

    syncedSegmentsArr.forEach((cs) => {
      saveTranslatedSegmentToLocalDb({
        data: cs,
        work: cs?.work,
        chapter: cs?.chapter,
        segment: cs?.position,
        key: `${cs?.work}_${cs?.chapter}_${cs?.position}`,
        synced: 1,
      });
    });

    syncedVotesArr.forEach((cs) => {
      saveSegmentVotesToLocalDb({
        data: cs,
        segment: cs?.segment,
        key: cs?.key,
        synced: 1,
      });
    });

    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      removeSyncedData();
    }, 500);

    state.syncing = false;
    state.syncError = false;
    updateState('syncComplete', true);

    if (
      !isEmpty(results?.data?.unsycedSegments) ||
      !isEmpty(results?.data?.unsyncedApprovals)
    ) {
      getOfflineDatasFromIndexDB();
    }
  } else {
    state.syncing = false;
    state.syncError = true;
    updateState('syncComplete', false);
  }
};

const updateState = (key, value) => {
  emit('update-state', key, value);
};
</script>

<template>
  <modal
    title="Sync Approval"
    :open="open"
    custom-classes="c-modal--completion sync-modal"
  >
    <div
      v-if="isModuleChapter && !completed"
      class="sync-header sync-header--warning o-flex o-flex--middle"
    >
      <i class="u-icon">warning</i>

      You have unsynced offline data for current chapter.

      <button class="close-btn" @click.prevent="toggleModal">
        <i class="u-icon">close</i>
      </button>
    </div>
    <div v-else class="sync-header sync-header--info o-flex o-flex--middle">
      <i class="u-icon">cloud_upload</i>

      Keep your work in sync
    </div>

    <processing-modal
      v-if="state.syncing"
      message="Sync in progress, Please wait"
    />
    <template v-else-if="completed">
      <div class="sync-body">
        <div class="sync-changes__header o-flex o-flex--between o-flex--middle">
          <book-info-header :offline-book="offlineBook" />
        </div>

        <ul class="sync-changes__list results">
          <li class="title">Sync Results</li>

          <li class="sync-item o-flex">
            <div class="sync-item__info top">
              <div class="sync-item__info-inner o-flex o-flex--middle">
                <h6 for="refrence">Total Synced:</h6>
                <p>{{ totalSyncedChanges }}</p>
              </div>
            </div>
          </li>
          <li class="sync-item o-flex o-flex--middle">
            <div class="sync-item__info top">
              <div class="sync-item__info-inner o-flex">
                <h6 for="refrence">Total Unsynced:</h6>
                <p>{{ unsynchedChanges }}</p>
              </div>
            </div>
            <button
              v-if="unsynchedChanges > 0"
              class="c-link c-link--primary"
              @click.prevent="syncData"
            >
              <i class="u-icon">refresh</i> Try again
            </button>
          </li>
        </ul>
      </div>

      <div class="sync-footer">
        <button class="c-btn--primary" @click.prevent="toggleModal">
          Close
        </button>
      </div>
    </template>

    <template v-else>
      <div class="sync-body">
        <div class="sync-changes__header o-flex o-flex--between o-flex--middle">
          <book-info-header :offline-book="offlineBook" />

          <div class="unsynced-info">
            <p v-if="!isEmpty(offlineSegments)">
              Segment Changes - {{ offlineSegments.length }}
            </p>
            <p v-if="!isEmpty(offlineVotes)">
              Vote Changes - {{ offlineVotes.length }}
            </p>
          </div>
        </div>

        <ul v-if="!isEmpty(offlineSegments)" class="sync-changes__list">
          <li class="title">Updated Segments</li>
          <li
            v-for="(segment, index) in offlineSegments"
            :key="segment.id"
            class="sync-item o-flex"
          >
            <div class="sync-item__left">{{ index + 1 }}.</div>
            <div class="sync-item__center">
              <div class="sync-item__info top">
                <div class="sync-item__info-inner o-flex">
                  <h6 for="refrence">Segment Refrence:</h6>
                  <p>{{ segment.reference }}</p>
                </div>
              </div>

              <div class="sync-item__info bottom o-flex o-flex--middle">
                <div class="sync-item__info-inner o-flex o-flex--middle">
                  <label for="chapter">Chapter:</label>
                  <p>{{ segment.chapter }}</p>
                </div>
                <div class="sync-item__info-inner o-flex o-flex--middle">
                  <label for="chapter">Position:</label>
                  <p>{{ segment.position }}</p>
                </div>
              </div>
            </div>

            <div class="sync-item__right o-flex o-flex--middle">
              <i class="u-icon">cloud_off</i> Not Synced
            </div>
          </li>
        </ul>
      </div>
      <div v-if="isModuleChapter" class="sync-footer">
        <button class="c-btn--dark c-btn--primary" @click.prevent="syncData">
          Sync data & continue
        </button>
      </div>
      <div v-else class="sync-footer">
        <button
          class="c-btn--ghost c-btn--primary"
          @click.prevent="toggleModal"
        >
          Cancel
        </button>

        <button class="c-btn--dark c-btn--primary" @click.prevent="syncData">
          Sync data
        </button>
      </div>
    </template>
  </modal>
</template>

<style lang="scss">
.sync-modal {
  width: 550px !important;
  border-top-left-radius: 5px !important;
  border-top-right-radius: 5px !important;
  .c-modal__header {
    display: none;
  }

  .c-modal__body {
    padding: 0px !important;
    .sync-header {
      padding: 15px;
      color: white;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      font-size: 18px;
      .u-icon {
        font-size: 40px;
        margin-right: 15px;
      }

      &--info {
        background-color: #2383a6;
      }

      &--warning {
        background-color: $c-red-4;
      }

      .close-btn {
        margin-left: auto;
        margin-bottom: auto;

        .u-icon {
          font-size: 20px;
        }
      }
    }

    .sync-body {
      .sync-changes__header {
        border-bottom: 1px solid hsl(211, 16%, 82%);
        padding: 20px 15px 12px 15px;

        .book-info {
          margin-left: 16px;

          .language {
            margin-bottom: 8px;
          }

          h2 {
            max-width: 250px;
            font-size: 24px;
            font-weight: 600;
            line-height: 34px;
            letter-spacing: 0em;
            text-align: left;
            margin-bottom: 0px;
          }
        }
        .unsynced-info {
          text-align: right;
          p {
            margin-bottom: 2px;
            font-size: 15px;
            font-weight: 400;

            &:last-child {
              margin-bottom: 0px;
            }
          }
        }
      }

      .sync-changes__warning {
        padding: 20px 15px 12px 15px;
        text-align: center;
        font-size: 18px;

        img {
          width: 80px;
          margin-bottom: 8px;
        }
      }

      .c-link {
        margin-left: 15px;
        font-weight: 600;
        font-size: 14px;

        &:hover,
        &:focus {
          color: currentColor;
          border-bottom: 0px;
        }
      }

      .sync-changes__list {
        padding: 10px 15px 20px 15px;
        list-style: none;
        margin-left: 0px;
        margin-bottom: 0px;
        max-height: 400px;
        overflow-y: auto;

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

        .title {
          margin-bottom: 12px;
          font-size: 15px;
          font-weight: 300;
          letter-spacing: 0.5px;
          color: #6a6a6a;
        }
        .sync-item {
          &:not(:last-child) {
            padding-bottom: 12px;
            border-bottom: 1px solid hsl(211, 16%, 82%);
            margin-bottom: 12px;
          }

          .sync-item__left {
            margin-right: 5px;
            font-size: 16px;
          }

          .sync-item__info {
            label,
            h6 {
              margin-right: 5px;
            }
            &.top {
              margin-bottom: 3px;

              h6 {
                margin-bottom: 0px;
                color: #3692b4;
              }
              label {
                font-size: 17px;
                font-weight: 600;
              }
              p {
                margin-bottom: 0px;
                font-size: 15px;
              }
            }

            &.bottom {
              .sync-item__info-inner {
                margin-right: 10px;
                color: rgba(39, 39, 39, 0.8);
              }
              label {
                font-size: 13px;
                color: #6a6a6a;
              }
              p {
                margin-bottom: 0px;
                font-size: 13px;
              }
            }
          }

          .sync-item__right {
            margin: auto 0 auto auto;
            font-size: 12px;
            font-style: italic;

            .u-icon {
              margin-right: 5px;
              color: #3692b4;
            }
          }
        }

        &.results {
          .sync-item {
            border-bottom: 0px;
            padding-bottom: 0px;
            margin-bottom: 5px;

            .sync-item__info {
              &.top {
                margin-bottom: 0px;
              }
            }
            h6 {
              font-size: 15px;
            }
          }
        }
      }
    }

    .sync-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      border-top: 1px solid rgba(223, 227, 229, 0.6);
      padding: 10px 15px;
      button {
        padding: 7px 15px;
        height: fit-content;
        width: fit-content;
        cursor: pointer;
        &:last-child {
          margin-left: 10px;
          border-radius: 4px;
        }
      }
    }
  }

  .c-modal--completion__footer {
    padding: 10px 15px !important;
  }
}
</style>
