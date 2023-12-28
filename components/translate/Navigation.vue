<template>
  <div class="o-flex navigation">
    <nuxt-link
      class="c-btn c-btn--light c-btn--edgy"
      :class="{
        'c-btn--square': !labels,
        'u-half-width': labels,
        'width-fit-content': labelWidthNotHalf,
        'disabled-pagination': isPrevButtonDisabled,
      }"
      :to="isPrevButtonDisabled ? '' : chapterUrl(chapterNum, 'prev')"
    >
      <i class="u-icon" :class="{ 'u-icon++': !labels }">
        keyboard_arrow_left
      </i>
      <span v-if="labels">Prev</span>
    </nuxt-link>
    <div v-if="dropdown" class="u-grow">
      <dropdown custom-classes="chapters-dropdown" :open="open">
        <template #anchor>
          <button
            class="c-btn c-btn--light c-btn--edgy u-1/1"
            @click.prevent="loadTableOfContents"
          >
            <div class="o-flex o-flex--center">
              <span class="u-truncate">{{ dropdownLabel }}</span>
              <span class="u-icon u-icon++">arrow_drop_down</span>
            </div>
          </button>
        </template>
        <!-- item.number is used to differentiate between sections and chapters  -->
        <dropdown-item
          v-for="item in chapterList"
          :key="item.position"
          :type="item.number ? 'nuxt-link' : 'divider'"
          :url="chapterUrl(item.number)"
          no-prefetch
          @click="onChapterClick"
        >
          <!-- :active="item === chapter" -->
          <div class="o-flex o-flex--small o-flex--middle">
            <progress-stats
              v-if="item.number"
              :stats="item"
              class="navigation__progress u-mr--"
            />
            <div class="u-grow u-truncate" v-html="item.content"></div>
            <div class="u-muted">{{ item.segments }}</div>
          </div>
        </dropdown-item>
        <dropdown-item v-if="chaptersPending">
          <div class="c-spinner c-spinner--small"></div>
        </dropdown-item>
      </dropdown>
    </div>
    <button
      v-if="canBulkApproveChapter"
      class="c-btn c-btn--green c-btn--edgy width-fit-content o-flex approval-btn"
      @click="toggleModal"
    >
      <span v-if="state.inApproval" class="c-spinner c-spinner--small"></span>
      <span v-else>Approve</span>
    </button>
    <nuxt-link
      class="c-btn c-btn--light c-btn--edgy"
      :class="{
        'c-btn--square': !labels,
        'u-half-width': labels,
        'width-fit-content': labelWidthNotHalf,
        'disabled-pagination': isNextButtonDisabled,
      }"
      :to="isNextButtonDisabled ? '' : chapterUrl(chapterNum, 'next')"
    >
      <span v-if="labels">Next</span>
      <i class="u-icon" :class="{ 'u-icon++': !labels }">
        keyboard_arrow_right
      </i>
    </nuxt-link>

    <chapter-approval-modal
      v-if="state.isApprovalModalOpen"
      :open="state.isApprovalModalOpen"
      :completed="state.sentForApproval"
      :error="state.approvalError"
      :error-message="state.errorMessage"
      :processing="state.inApproval"
      @submit="approveChapter"
      @toggle-modal="toggleModal"
    />
  </div>
</template>

<script setup>
import get from 'lodash/get';
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import urlBuilder from '@/helpers/urlBuilder';
import { striptags } from '~/plugins/filters';
import Dropdown from '@/components/utilities/Dropdown';
import ProgressStats from '@/components/utilities/Progress';
import DropdownItem from '@/components/utilities/DropdownItem';
import {
  useAuthStore,
  useTranslationChaptersStore,
  useTranslationStore,
  useUserStore,
} from '~/store';
import { storeAPI } from '~/helpers/apiCore';
import ChapterApprovalModal from '@/components/modal-content/chapterApproval';

const props = defineProps({
  chapter: { type: Object, default: null },
  dropdown: Boolean,
  labels: Boolean,
  labelWidthNotHalf: { type: Boolean, default: false },
  translation: { type: Object, default: null },
});

const translationStore = useTranslationStore();
const { chaptersPending } = storeToRefs(translationStore);

const authStore = useAuthStore();
const { isOnline } = storeToRefs(authStore);

const userStore = useUserStore();
const { userDownloadInfo } = storeToRefs(userStore);

const translationChaptersStore = useTranslationChaptersStore();
const { cachedChapters } = storeToRefs(translationChaptersStore);

/* eslint-disable */ // TODO: fix lint
let open = ref(false);

const state = reactive({
  inApproval: false,
  sentForApproval: false,
  approvalError: false,
  isApprovalModalOpen: false,
  errorMessage: null,
});

const route = useRoute();

const emits = defineEmits(['fetch-chapters', 'patch-chapter-stats']);

const chapterNum = computed(() => {
  return parseInt(route.params?.chapter);
});
const dropdownLabel = computed(() => {
  return striptags(props.chapter?.content || '[Unknown]');
});
const lastChapterNum = computed(() => {
  return props.translation?.totalChapters || null;
});

const translationId = computed(() => {
  if (isOnline.value) {
    return props.chapter?.work;
  } else {
    return userDownloadInfo.value?.workId;
  }
});

const toggleModal = () => {
  state.isApprovalModalOpen = !state.isApprovalModalOpen;
  state.inApproval = false;
  state.sentForApproval = false;
  state.approvalError = false;
};

const buildChapterUrl = (chapterNum) => {
  return urlBuilder(
    get(route, 'params.language'),
    get(route, 'params.abbreviation'),
    chapterNum
  );
};

const chapterUrl = (chapter, action) => {
  const indexOfChapterNumber = userDownloadInfo.value.chapters
    ?.sort()
    ?.findIndex((cnum) => cnum === chapter);

  switch (action) {
    case 'prev': {
      const prevChapter = isOnline.value
        ? chapter - 1
        : userDownloadInfo.value.chapters[indexOfChapterNumber - 1];

      return buildChapterUrl(prevChapter);
    }

    case 'next': {
      const nextChapter = isOnline.value
        ? chapter + 1
        : userDownloadInfo.value.chapters[indexOfChapterNumber + 1];

      return buildChapterUrl(nextChapter);
    }

    default:
      return buildChapterUrl(chapter);
  }
};

const onChapterClick = () => {
  open.value = false;
};

const chapterList = ref(null);

const loadTableOfContents = async () => {
  const data = await translationStore.fetchALLTableOfContents(
    translationId.value
  );

  if (isOnline.value) {
    chapterList.value = data;
  } else {
    const onlyDownload = data?.filter((al) =>
      userDownloadInfo.value.chapters.includes(al.number)
    );

    chapterList.value = onlyDownload;
  }
};

const disableNavigationOffline = (chapterNumber, action) => {
  const indexOfChapterNumber = userDownloadInfo.value.chapters?.findIndex(
    (cnum) => cnum === chapterNumber
  );
  if (
    !isOnline.value &&
    !isEmpty(userDownloadInfo.value.chapters) &&
    indexOfChapterNumber > -1
  ) {
    switch (action) {
      case 'prev': {
        const prevChapterNum =
          userDownloadInfo.value.chapters[indexOfChapterNumber - 1];
        return !prevChapterNum;
      }

      case 'next': {
        const nextChapterNum =
          userDownloadInfo.value.chapters[indexOfChapterNumber + 1];
        return !nextChapterNum;
      }

      default:
        break;
    }
  }

  return false;
};

const isNextButtonDisabled = computed(() => {
  return (
    isNaN(chapterNum.value) ||
    chapterNum.value > lastChapterNum.value ||
    chapterNum.value === lastChapterNum.value ||
    disableNavigationOffline(chapterNum.value, 'next')
  );
});

const isPrevButtonDisabled = computed(() => {
  return (
    isNaN(chapterNum.value) ||
    chapterNum.value < 1 ||
    chapterNum.value === 1 ||
    disableNavigationOffline(chapterNum.value, 'prev')
  );
});

const canBulkApproveChapter = computed(() => {
  return props.chapter?.canReviewChapter || props.chapter?.canEditChapter;
});

/**
 * Structure the updated payload as per role
 * Roles can be either editor or reviewer
 * @param {string} action
 * @param {object} segmentStats
 */
const structurePayloadAsPerRole = (action = null, segmentStats = null) => {
  if (props.chapter?.canReviewChapter) {
    switch (action) {
      case 'update-stats': {
        return {
          reviewers: {
            vote: segmentStats?.reviewers?.vote + 1,
            user: props.translation?.roleCounts?.reviewer,
          },
        };
      }

      default:
        return {
          progress: 4,
          reviewerCanEdit: false,
          editorCanEdit: true,
          translatorCanVote: false,
          editorCanVote: true,
        };
    }
  } else if (props.chapter?.canEditChapter) {
    switch (action) {
      case 'update-stats': {
        return {
          editors: {
            vote: segmentStats?.editors?.vote + 1,
            user: props.translation?.roleCounts?.editor,
          },
        };
      }

      default:
        return {
          progress: 6,
          editorCanEdit: false,
          reviewerCanVote: false,
        };
    }
  } else {
    return null;
  }
};

/**
 * Bulk approve chapter
 */
const approveChapter = async () => {
  state.inApproval = true;
  state.sentForApproval = false;
  state.approvalError = false;
  state.errorMessage = null;

  try {
    const data = await storeAPI(
      `translations/${translationId.value}/approve-chapter/`,
      {
        chapter: chapterNum.value,
      }
    );

    if (data?.statusCode === 200) {
      updateChapterStats();
      const syncedVotes = data?.data?.syncedVotes;

      const cachedContent = cachedChapters.value?.find(
        (item) => item?.chapter?.number === chapterNum.value
      );

      const approvalPayload = structurePayloadAsPerRole();

      cachedContent?.segments?.forEach((element, index) => {
        const indexOfSyncedSegment = syncedVotes.indexOf(element?.id);

        if (indexOfSyncedSegment > -1 && indexOfSyncedSegment === index) {
          const segmentStats = cachedContent?.segments[index]?.statistics;

          const statsPayload = structurePayloadAsPerRole(
            'update-stats',
            segmentStats
          );

          approvalPayload.statistics = {
            ...segmentStats,
            ...statsPayload,
          };
          Object.assign(cachedContent?.segments[index], approvalPayload);
        }
      });
      state.inApproval = false;
      state.sentForApproval = true;
      state.approvalError = false;
      state.errorMessage = null;
    } else {
      state.inApproval = false;
      state.sentForApproval = false;
      state.approvalError = true;
      state.errorMessage = data?.data?.message;
    }
  } catch {
    state.inApproval = false;
    state.sentForApproval = false;
    state.approvalError = true;
  }
};

const updateChapterStats = () => {
  if (isOnline.value) {
    translationStore
      .fetchCurrentChapterContents(translationId.value, chapterNum.value)
      .then((response) => {
        emits('patch-chapter-stats', response);
      });
  }
};
</script>

<style lang="scss">
.navigation > *:not(:first-child) {
  border-left: 1px solid $c-border;
}

.navigation__progress {
  display: inline-flex;
  vertical-align: 15%;
}

.u-half-width {
  width: 50%;
}

.width-fit-content {
  width: fit-content;
}

.c-btn {
  &.disabled-pagination {
    color: $c-gray-3;
    cursor: not-allowed;
    &:hover {
      background-color: unset;
    }
  }
}

.chapters-dropdown {
  display: flex !important;
  justify-content: center !important;
  .v-overlay__content {
    min-width: 570px !important;
    left: unset !important;

    .c-dropdown__inner {
      .c-dropdown__scrollable {
        a {
          min-height: 42px;
        }
      }
    }
  }
}

.approval-btn {
  height: 48px;
  width: 108px;
  .c-spinner {
    height: 18px;
    width: 18px;
    border-width: 2px;
  }
}
</style>
