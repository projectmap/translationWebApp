<script setup>
import isEmpty from 'lodash/isEmpty';
import { storeToRefs } from 'pinia';

import TranslatorMain from './Main';
import TranslatorAside from './Aside';
import TranslatorHeader from './Header';
import Navigation from './Navigation.vue';
import StickyHeader from './StickyHeader.vue';
import { getLocalTranslationData } from '~/service-worker/db';
import Alert from '@/components/utilities/Alert';
import { fetchAPI } from '~/helpers/apiCore';
import SyncModal from '~/components/modal-content/syncModal/index.vue';
import TranslatorValidationModal from '~/components/modal-content/translatorValidationModal/index.vue';
import {
  useAuthStore,
  useTranslationStore,
  useUserStore,
  useTranslationChaptersStore,
} from '~/store';
import { checkSyncedDataForCurrentChapter } from '~/components/modal-content/syncModal/helper';

const props = defineProps({
  chapterNum: { type: Number, default: 1 },
  translation: { type: Object, default: null },
  focusParagraph: { type: Number, default: 0 },
});

const router = useRouter();
const route = useRoute();

const state = reactive({
  syncModal: false,
  syncComplete: false,
  unsynchedSegments: [],
  unsynchedVotes: [],
  validationModal: false,
});

const stickyInstance = ref(null);
const translationObj = ref(null);
const translationChapter = ref(null);
const translationStats = ref({});

const translationStore = useTranslationStore();
const authStore = useAuthStore();
const userStore = useUserStore();
const translationChaptersStore = useTranslationChaptersStore();

const { isOnline } = storeToRefs(authStore);
const { userDownloadInfo } = storeToRefs(userStore);
const { currentSegment } = storeToRefs(translationStore);
const { cachedChapters } = storeToRefs(translationChaptersStore);

const runtimeConfig = useRuntimeConfig();
const { cpanelUrl } = runtimeConfig.public;

// Template Ref
const headerRef = ref(null);
const footerRef = ref(null);

const showSidebar = ref(false);

const contentWidthPercentage = computed(() => {
  if (isOnline.value) return showSidebar.value ? `76%` : `100%`;
  return '100%';
});

const moveTo = () => {
  if (process.client) {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
};

const getNewTranslationObject = (tableOfContents) => {
  return { ...props.translation, tableOfContents };
};

// Generate a dynamic url to fetch the list of segments for the given chapter
const generateSegmentsURL = (chapter) => {
  const workId = chapter?.work;
  const chapterNumber = chapter?.number;
  const fetchLimit = 5;

  return `/translations/${workId}/segments/?chapter=${chapterNumber}&limit=${fetchLimit}`;
};

const getLocallyCachedChapters = (chapterNumber = props.chapterNum) => {
  return cachedChapters.value.find(
    (obj) =>
      obj.chapter.number === chapterNumber &&
      obj.chapter.work === props.translation?.id
  );
};

const handleTranslationDataChanges = async (trigger) => {
  const cachedCurrentChapter =
    trigger !== 'synctrigger' ? getLocallyCachedChapters() : null;

  if (trigger === 'synctrigger') {
    translationChaptersStore.deleteCachedChapterSegmentData(props.chapterNum);
  }

  if (isOnline.value) {
    const currentChapter =
      cachedCurrentChapter?.chapter ??
      (await translationStore.fetchCurrentChapterContents(
        props.translation?.id,
        props.chapterNum
      ));

    if (!isEmpty(currentChapter)) {
      currentChapter.url = generateSegmentsURL(currentChapter);

      translationObj.value = getNewTranslationObject(currentChapter);
      translationChapter.value = currentChapter;

      !cachedCurrentChapter &&
        translationChaptersStore.cacheChapters({ chapter: currentChapter });
    } else {
      translationChapter.value = null;
    }
  } else {
    // Get chapter data from Index DB if offline
    const query = `${props.translation?.id}_${props.chapterNum}`;
    const chapterFromIndexDB = await getLocalTranslationData(query);

    if (!isEmpty(chapterFromIndexDB)) {
      const firstSegmentOriginalContent = chapterFromIndexDB[0]?.original;
      const chapterContent = {
        content: firstSegmentOriginalContent,
      };
      translationObj.value = getNewTranslationObject(chapterContent);
      translationChapter.value = chapterContent;
    } else {
      translationChapter.value = null;
    }
  }
};

/* Operations to sync index DB data to remote DB */
const totalUnsynchedChanges = computed(() => {
  if (state.syncComplete) {
    return state.unsynchedSegments?.length + state.unsynchedVotes?.length;
  }

  return state.offlineSegments?.length + state.offlineVotes?.length;
});

const contributorsLink = computed(() => {
  return `${cpanelUrl}/admin/org/translations/edit/${props.translation?.id}`;
});

const toggleSyncModal = () => {
  state.syncModal = !state.syncModal;

  if (!state.syncModal) {
    state.syncComplete = false;
  }
};

const toggleValidationModal = () => {
  state.validationModal = !state.validationModal;
};

const updateState = (key, value) => {
  if (!key) return;
  state[key] = value;
};

const checkForUnsyncedData = async () => {
  const { chapter } = route?.params;

  const chapterObj = {
    chapterNumber: chapter,
    work: props.translation?.id,
  };

  const { segments, votes } = await checkSyncedDataForCurrentChapter(
    chapterObj
  );

  state.unsynchedSegments = segments;

  state.unsynchedVotes = votes;

  if (!isEmpty(segments) || !isEmpty(votes)) {
    state.syncModal = true;
  }
};

const asideHandler = () => {
  showSidebar.value = !showSidebar.value;
};

const updateStickyInstance = () => {
  moveTo();
  if (stickyInstance.value) stickyInstance.value.update();
};

const onFocusPrevious = () => {
  headerRef.value.focus();
};
const onFocusNext = () => {
  footerRef.value.focus();
};
/**
 * Update the data of stats object content
 * @param {object} statsData
 */
const patchStatistics = (statsData, type) => {
  switch (type) {
    case 'chapter':
      Object.assign(translationChapter.value, statsData);
      break;

    case 'translation': {
      const updatedTranslationStats = {
        ...translationStats.value,
        ...statsData,
      };
      Object.assign(translationStats.value, updatedTranslationStats);
      break;
    }
  }
};

const patchTranslation = (updatedTranslation) => {
  Object.assign(translationObj.value, updatedTranslation);
};

const handleOfflineTranslationRedirect = () => {
  router.replace(`/dashboard`);
};

onBeforeMount(() => {
  if (!getLocallyCachedChapters()) {
    translationChaptersStore.$reset();
  }

  /**
   * translationChapter and translationStats are temporary object to store the chapter and translation stats obj
   * respectively.
   * This is done so that we can update the data within the component it self
   * or else we will need to emit a custom event to update the chapter data incoming from the parent component.
   */
  translationObj.value = props.translation;
  translationStats.value = props.translation?.statistics;
  translationChapter.value = {};
});

const fetchChaptersAndSegmentsData = async (chapterNumber) => {
  const currentChapter = await translationStore.fetchCurrentChapterContents(
    props.translation?.id,
    chapterNumber
  );
  if (!isEmpty(currentChapter)) {
    const cachePayload = {
      chapter: currentChapter,
      segments: [],
    };
    currentChapter.url = generateSegmentsURL(currentChapter);

    const data = await fetchAPI(currentChapter.url);

    if (data?.data) {
      cachePayload.segments = data?.data;
    }
    if (data?.next) {
      cachePayload.chapter.nextUrl = data?.next;
    }
    translationChaptersStore.cacheChapters(cachePayload);
  }
};

const handleCacheChapters = () => {
  const totalNextPrevChaptersToCache = 1;
  const totalChaptersToCache = 2 * totalNextPrevChaptersToCache + 1;
  if (isOnline.value) {
    if (props.chapterNum === 1) {
      for (let i = 1; i < totalChaptersToCache + 1; i++) {
        if (!getLocallyCachedChapters(i)) {
          if (i !== props.chapterNum) {
            fetchChaptersAndSegmentsData(i);
          }
        }
      }
    } else if (
      props.chapterNum + totalNextPrevChaptersToCache >
      translationObj.value.totalChapters
    ) {
      const startingPoint =
        translationObj.value.totalChapters - 2 * totalNextPrevChaptersToCache;
      for (
        let i = startingPoint;
        i < translationObj.value.totalChapters + 1;
        i++
      ) {
        if (!getLocallyCachedChapters(i)) {
          if (i !== props.chapterNum) {
            fetchChaptersAndSegmentsData(i);
          }
        }
      }
    } else {
      for (let i = 1; i < totalChaptersToCache + 1; i++) {
        let diff = props.chapterNum - totalNextPrevChaptersToCache;
        const dynamicChapterNo = diff - 1 + i;

        if (getLocallyCachedChapters(dynamicChapterNo)) {
          diff++;
        } else {
          if (dynamicChapterNo !== props.chapterNum) {
            fetchChaptersAndSegmentsData(dynamicChapterNo);
          }

          diff++;
        }
      }
    }

    if (cachedChapters?.value.length > totalChaptersToCache) {
      translationChaptersStore.optimizeChapters(
        props.chapterNum,
        totalNextPrevChaptersToCache
      );
    }
  }
};

const resetCachedChapterBasedOnRoute = (to, from) => {
  const prevAbbr = from.params?.abbreviation;
  const nextAbbr = to.params?.abbreviation;
  if (prevAbbr !== nextAbbr) {
    translationChaptersStore.$reset();
  }
};

const hasTranslator = computed(
  () => props.translation?.roleCounts?.translator > 0
);

const checkIfTranslatonHasTranslator = () => {
  if (!hasTranslator.value) {
    toggleValidationModal();
  }
};

let cacheTimeout = null;

onMounted(() => {
  handleTranslationDataChanges();
  checkIfTranslatonHasTranslator();
  if (isOnline.value) {
    checkForUnsyncedData();
    clearTimeout(cacheTimeout);
    cacheTimeout = setTimeout(() => {
      handleCacheChapters();
    }, 2000);
  }
});

onBeforeRouteLeave((to, from) => {
  resetCachedChapterBasedOnRoute(to, from);
});

onBeforeRouteUpdate((to, from) => {
  resetCachedChapterBasedOnRoute(to, from);
});

watch(() => isOnline.value, handleOfflineTranslationRedirect);

watch(
  () => [isOnline.value, props.translation?.id, userDownloadInfo.value?.workId],
  (value) => {
    if (value[0] && value[1] === value[2]) {
      checkForUnsyncedData();
    }
  }
);

watch(
  () => [state.syncComplete],
  (value) => {
    if (value) {
      handleTranslationDataChanges('synctrigger');
    }
  }
);
</script>

<template>
  <div class="translator">
    <!-- Translator Header -->
    <translator-header
      :chapter="translationChapter"
      :translation="translationObj"
      :translation-stats="translationStats"
      @patch-translation="patchTranslation"
    />

    <!-- Sticky header section -->
    <sticky-header
      :translation="translationObj"
      :chapter="translationChapter"
      :segment="currentSegment"
      :content-width="contentWidthPercentage"
      @patch-stats="patchStatistics"
    />

    <!-- Translator Main -->
    <div class="o-flex o-flex--stretch">
      <section
        ref="main"
        class="translator__main content_width_percent"
        :style="{ width: contentWidthPercentage }"
      >
        <div class="translator__main-body">
          <translator-main
            v-if="translationChapter"
            :translation="translationObj"
            :chapter="translationChapter"
            :focus-paragraph="focusParagraph"
            :has-translator="hasTranslator"
            :sync-trigger="state.syncComplete"
            @height-changed="updateStickyInstance"
            @previous="onFocusPrevious"
            @next="onFocusNext"
            @patch-stats="patchStatistics"
            @toggle-validation-modal="toggleValidationModal"
          />
          <div v-else class="u-text-center u-p++">
            <alert color="red">This chapter doesn't exist</alert>
          </div>
        </div>

        <footer ref="footerRef" class="translator__main-footer">
          <navigation :chapter="translationChapter" labels />
        </footer>

        <div
          v-if="isOnline && !showSidebar"
          class="translator__grabbar"
          @click="asideHandler"
        >
          <div>&middot;&middot;&middot;</div>
        </div>
      </section>
      <!-- Translator Aside  -->
      <aside
        v-if="showSidebar"
        ref="aside"
        class="translator__aside"
        :style="{ width: showSidebar ? '24%' : '0' }"
      >
        <div id="aside-sticky" class="translator__aside-sticky">
          <translator-aside
            class="translator__aside-inner"
            :translation="translationObj"
            :chapter="translationChapter"
          />

          <div class="translator__grabdots" @click.prevent="asideHandler">
            <div>&middot;&middot;&middot;</div>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <sync-modal
    v-if="state.syncModal"
    :open="state.syncModal"
    :completed="state.syncComplete"
    :offline-book="translation"
    :offline-segments="state.unsynchedSegments"
    :offline-votes="state.unsynchedVotes"
    :unsynched-changes="totalUnsynchedChanges"
    view="chapter"
    @toggle-sync-modal="toggleSyncModal"
    @update-state="updateState"
    @get-offline-datas-from-indexdb="checkForUnsyncedData"
  />

  <translator-validation-modal
    v-if="state.validationModal"
    :open="state.validationModal"
    :contributors-link="contributorsLink"
    @toggle-validation-modal="toggleValidationModal"
  />
</template>

<style lang="scss" scoped>
.cbar-chat--icon {
  position: fixed;
  right: 20px;
  bottom: 30px;
  z-index: 5;
}
cbar-chat-client {
  --matrix-box-height: 350px;
  padding: 0;
}

/*
 * 1. for the grabber
 */
.translator__main {
  z-index: 3;
  background-color: $c-gray-1;
  border-right: 1px solid $c-border;
  position: relative; /* 1 */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.translator__aside {
  z-index: 6;
  background-color: $c-white;
  position: sticky;
  top: 56px;
  min-height: 100vh;
  max-height: 100%;
  height: 100%;
  margin-top: -105px;
}

/*
 * 1. just a little slower than .c-segment to avoid funny effects
 */
.translator__main-body {
  flex-grow: 2;
  background: white;
  position: relative; /* 1 */
  position: sticky;
  top: 0;
}

.translator__main-footer {
  border-top: 1px solid $c-border;
}

/*
 * 1. for the grab indicator
 */
.translator__aside-sticky {
  position: relative; /* 1 */
  position: sticky;
  top: 0;
}

.translator__aside-inner {
  height: 100vh;
}

.translator__aside-btn {
  position: absolute;
  z-index: 1;
  width: 100%;
  padding-right: $unit;
}

.translator__grabbar {
  position: fixed;
  cursor: pointer;
  top: calc(50% - #{$unit-large/2});
  right: 10px;
  width: 10px;
  height: $unit-large;
  border: solid $c-border;
  border-width: 1px 0 0 1px;
  border-radius: $unit 0 0 $unit;
  background-color: $c-white;
  overflow: hidden;

  > div {
    font-size: 1.6em;
    color: $c-gray-5;
    line-height: $unit-large;
    width: $unit-large;
    text-align: center;
    transform: rotate(90deg);
    margin-left: -$line-height + 4px;
  }

  &.is-dragging {
    background-color: rgba($c-primary-7, 0.5);
  }
}

.content_width_percent {
  width: 76%;
}

.width-full {
  width: 100% !important;
}

@media (max-width: 576px) {
  .translator__aside {
    display: none;
  }
  .content_width_percent {
    width: 100%;
  }
}

.translator__grabdots {
  position: absolute;
  cursor: pointer;
  top: calc(50% - #{$unit-large/2});
  width: 10px;
  height: $unit-large;
  border: solid $c-border;
  border-width: 1px 1px 1px 0;
  border-radius: 0 $unit $unit 0;
  background-color: $c-white;
  overflow: hidden;

  > div {
    font-size: 1.6em;
    color: $c-gray-5;
    line-height: $unit-large;
    width: $unit-large;
    text-align: center;
    transform: rotate(90deg);
    margin-left: -$line-height + 4px;
  }
}
</style>
