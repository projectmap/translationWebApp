<script setup>
import { storeToRefs } from 'pinia';
import isObject from 'lodash/isObject';
import last from 'lodash/last';
import isEmpty from 'lodash/isEmpty';

import Segment from './segment';
import { fetchAPI } from '~/helpers/apiCore';
import { parseParameter, cleanUrl } from '~/helpers/Util';
import { createDummyArray } from '~/helpers/createDummies';
import {
  useAuthStore,
  useEventStore,
  userAlertStore,
  useSentenceStore,
  useTranslationStore,
  useTranslationChaptersStore,
} from '~/store';
import { getLocalTranslatedSegmentsData } from '~/service-worker/db';
const props = defineProps({
  translation: { type: Object, default: null },
  chapter: { type: Object, default: null },
  focusParagraph: { type: Number, default: 0 },
  hasTranslator: { type: Boolean, default: false },
  syncTrigger: { type: Boolean, default: false },
});

const state = reactive({
  pending: true,
  showModal: false,
  markedText: '',
  isError: null,
  segments: [],
  timeLastUpdate: new Date(),
  delayUpdate: 0,
  apiCallTriggerSegmentId: null,
});

const route = useRoute();

const authStore = useAuthStore();
const eventStore = useEventStore();
const alertStore = userAlertStore();
const translationStore = useTranslationStore();
const sentenceStore = useSentenceStore();

const { sentenceTranslationContent } = storeToRefs(sentenceStore);
const { isOnline } = storeToRefs(authStore);
const { events } = storeToRefs(eventStore);

const { currentSegment: currentSegmentState, currentRecord } =
  storeToRefs(translationStore);

const translationCacheStore = useTranslationChaptersStore();
const { cachedChapters } = storeToRefs(translationCacheStore);

const emit = defineEmits([
  'patch-stats',
  'height-changed',
  'toggle-validation-modal',
]);

const currentSegment = computed({
  get() {
    return currentSegmentState.value;
  },
  async set(segment) {
    if (isOnline.value) {
      const data = await translationStore.setCurrentSegment(segment);
      if (data && isObject(data.prior)) patchSegment(data.prior);
      if (data && isObject(data.current)) patchSegment(data.current);
    } else {
      translationStore.setCurrentSegment(segment);
    }
  },
});

const url = computed(() => {
  return props.chapter?.url || '';
});
const position = computed(() => {
  return parseParameter('position', url.value);
});
const limit = computed(() => {
  return parseParameter('limit', url.value);
});
const dummies = computed(() => {
  return createDummyArray(position.value, Math.min(limit.value, 5));
});

const interval = computed(() => {
  return eventStore.getEvent('INTERVAL');
});

const currentCachedChapterData = computed(() => {
  const cachedSegments = cachedChapters.value.find(
    (obj) => obj.chapter.number === props.chapter.number
  );

  return cachedSegments;
});

const nextOffsetUrl = computed(() => {
  if (!currentCachedChapterData.value?.chapter?.nextUrl) return;

  return currentCachedChapterData.value?.chapter?.nextUrl;
});

const handleParagraphSelection = () => {
  // focus on specific paragraph if parameter was provided
  const segment = state.segments?.[props.focusParagraph - 1];
  if (segment) {
    selectSegment(segment);
  } else {
    alertStore.new({
      message: `Paragraph ${props.focusParagraph} doesn't exist in this chapter.`,
      color: 'blue',
    });
  }
};

const requestSegments = async (url, lazyLoading = false) => {
  state.pending = true;
  state.isError = null;
  let results = [];
  if (lazyLoading) {
    translationCacheStore.patchCachedChapterData(props.chapter.number, {
      nextUrl: null,
    });
  }
  if (isOnline.value) {
    try {
      if (
        !lazyLoading &&
        !props.syncTrigger &&
        currentCachedChapterData.value?.segments
      ) {
        results = currentCachedChapterData.value?.segments;
      } else {
        const data = await fetchAPI(url);
        if (data?.data) {
          translationCacheStore.insertSegmentToChapter(
            props.chapter.number,
            data?.data
          );
          results = data?.data;
        }
        if (data?.next) {
          if (!isEmpty(currentCachedChapterData.value)) {
            translationCacheStore.patchCachedChapterData(props.chapter.number, {
              nextUrl: data?.next,
            });
          }
        }
      }
    } catch (error) {
      state.isError = error;
    }
    state.pending = false;
    return results;
  } else {
    try {
      results = await getLocalTranslatedSegmentsData({
        workId: props.translation?.id,
        chapterNumber: route.params.chapter,
      });
    } catch (error) {
      state.isError = error;
    }
    state.pending = false;
    return results;
  }
};

const selectText = (bool) => {
  let text = '';
  state.showModal = bool;
  if (window.getSelection) {
    text = window.getSelection().toString();
    if (!text) {
      state.showModal = false;
    }
  } else if (document.selection && document.selection.type !== 'Control') {
    text = document.selection.createRange().text;
  }

  state.markedText = text;

  return text;
};

/*
 * Request periodic updates for modified segments and patch them in place
 */
const requestUpdates = async () => {
  if (!isOnline.value || state.delayUpdate-- > 0) return;
  const timestamp = encodeURIComponent(state.timeLastUpdate.toISOString());
  state.timeLastUpdate = new Date();
  const { data: results } = await fetchAPI(
    `${cleanUrl(props.chapter?.url)}&last_modified__gte=${timestamp}`,
    { progress: false, interval: true }
  );

  if (!results.length) state.delayUpdate = 3;
  else results.forEach((segment) => patchSegment(segment));
};

// Apply a lazy load function.
const lazyLoadNewSegments = async () => {
  if (nextOffsetUrl.value) {
    applySegments(dummies.value, 'dummy');

    const data = await requestSegments(cleanUrl(nextOffsetUrl.value), true);

    if (data) {
      applySegments(data);
    }
  }
};

// Create an observer instance, to listen to the last segement only once when it comes to view port.
const DOMListener = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // Call the function when the element is in the viewport
      lazyLoadNewSegments();
      // Unobserve the element to ensure the function is called only once
      observer.unobserve(entry.target);
    }
  });
});

let timeout = null;
const setLastContentToListener = (lastElementId) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    if (lastElementId) {
      const element = document.getElementById(lastElementId);
      if (element) {
        DOMListener.observe(element);
      }
    }
  }, 1000);
};

// Append Dummy content at the end of the array for loader effect
const appendDummyContent = (
  segmentArrIndex,
  inputArrIndex,
  inputArr,
  segmentsArr,
  segmentArrLength
) => {
  while (segmentArrIndex < segmentArrLength) {
    if (inputArr[inputArrIndex]) {
      segmentsArr.push(inputArr[inputArrIndex]);
    }
    segmentArrIndex++;
    inputArrIndex++;
  }
};

// Append new content to already existing arrays of segments or to empty array
const appendNewSegments = (
  segmentArrIndex,
  inputArrIndex,
  inputArr,
  segmentsArr,
  segmentArrLength
) => {
  const removeDummyContent = segmentsArr?.filter(
    (item) => item?.type !== 'isDummy'
  );

  if (!isEmpty(removeDummyContent)) {
    segmentArrIndex = removeDummyContent.length;
  }

  while (segmentArrIndex < segmentArrLength) {
    if (
      segmentsArr
        .map((item) => item?.id)
        ?.indexOf(inputArr[inputArrIndex]?.id) < 0
    ) {
      if (inputArr[inputArrIndex]) {
        segmentsArr.splice(segmentArrIndex, 1, inputArr[inputArrIndex]);
      } else {
        segmentsArr.pop();
      }
    }
    segmentArrIndex++;
    inputArrIndex++;
  }
};

/*
 * Add segments one at a time to avoid blocking the runtime */
const applySegments = (array, contentType = 'segment') => {
  if (array?.length > 0) {
    const segmentArrIndex = 0;
    const inputArrIndex = 0;

    // Segments Array Length
    const length = Math.max(state.segments?.length, array?.length);

    // Find id of the last content to set for listener
    const lastArrayItem = last(array);
    if (lastArrayItem?.type !== 'isDummy') {
      state.apiCallTriggerSegmentId = lastArrayItem?.id;
    }

    // Set contents
    if (contentType === 'dummy') {
      appendDummyContent(
        segmentArrIndex,
        inputArrIndex,
        array,
        state.segments,
        length
      );
    } else {
      appendNewSegments(
        segmentArrIndex,
        inputArrIndex,
        array,
        state.segments,
        length
      );
    }
  } else {
    state.segments = [];
  }
};

const toggleTranslatorValidationModal = () => {
  emit('toggle-validation-modal');
};

const selectSegment = (segment) => {
  if (!props.hasTranslator) {
    toggleTranslatorValidationModal();
    return;
  }

  currentSegment.value = segment;
  if (sentenceTranslationContent.value?.segmentId !== segment.id)
    sentenceStore.$reset();

  if (segment.id !== currentRecord.value?.attachedSegment.id)
    translationStore.unsetRecords();
};

const closeSegment = () => {
  currentSegment.value = null;
  translationStore.unsetRecords();
};
const previousSegment = (index) => {
  if (index < 0) return;
  const segment = state.segments[index - 1];
  if (segment) selectSegment(segment);
};
const nextSegment = (index) => {
  if (index === state.segments.length) return;
  const segment = state.segments[index + 1];
  if (segment) selectSegment(segment);
};
const patchSegment = (data, index = null) => {
  if (!index) {
    index = state.segments.findIndex((item) => item.id === data?.id);
  }
  if (index > -1 && state.segments[index]) {
    Object.assign(state.segments[index], data);
    applySegments(state.segments);
    if (isOnline.value) {
      // Patch updated data to cached content
      translationCacheStore.patchCachedChapterSegmentData(
        props.chapter?.number,
        data
      );
    }
  }
};
/**
 * Update the data of stats object content
 * @param {object} data
 * @param {string} type */

const patchStatistics = (data, type) => {
  emit('patch-stats', data, type);
};

const totalSegments = computed(() => {
  return state.segments.length - 1;
});

onBeforeMount(() => {
  state.pending = true;
  applySegments(dummies.value, 'dummy');
});

onMounted(async () => {
  if (!isOnline.value) {
    const data = await requestSegments(cleanUrl(url.value));

    if (data) {
      applySegments(data);
    }
  }
});

onUnmounted(() => {
  sentenceStore.$reset();
});

watch(
  () => [url.value, props.syncTrigger],
  async (value) => {
    if (value[0] || value[1]) {
      state.segments = [];
      currentSegment.value = null;
      applySegments(dummies.value, 'dummy');
      const data = await requestSegments(cleanUrl(value[0]));

      if (data) {
        applySegments(data);
      }
      if (props.focusParagraph > 0) {
        handleParagraphSelection();
      }
    } else {
      state.pending = false;
      applySegments([]);
    }
  }
);

watch(
  () => state.apiCallTriggerSegmentId,
  (value) => {
    setLastContentToListener(value);
  }
);

// TODO : REMOVE AFTER SUCCESSFULL QA
// watch(
//   () => props.chapter,
//   async (chapter) => {
//     if (chapter?.url) {
//       currentSegment.value = null;
//       applySegments(dummies.value, 'dummy');
//       applySegments(await requestSegments(cleanUrl(chapter.url)));
//       if (props.focusParagraph > 0) {
//         handleParagraphSelection();
//       }
//     } else {
//       state.pending = false;
//       applySegments([]);
//     }
//   },
//   {
//     deep: true,
//   }
// );

watch(interval, () => {
  requestUpdates();
});

watch(
  events,
  (event) => {
    if (event.name === 'SEGMENT_UPDATE' && event?.payload) {
      const updatedPayload = { ...event?.payload };
      patchSegment(updatedPayload);
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="translation-section">
    <ul class="o-list-bare u-m0 translation-section__body">
      <li
        v-for="(item, index) in state.segments"
        :key="`${item.id}-${item.key}`"
      >
        <segment
          :translation="translation"
          :segment="item"
          :segment-position="index"
          :current="currentSegment"
          :chapter="chapter"
          :total-segments="totalSegments"
          @select="selectSegment"
          @select-text="selectText"
          @close="closeSegment"
          @previous="previousSegment(index)"
          @next="nextSegment(index)"
          @patch="patchSegment($event, index)"
          @patch-stats-data="patchStatistics"
          @request-segment-updates="requestUpdates"
        />
        <hr />
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
hr {
  display: none;
}
@media (max-width: 576px) {
  hr {
    display: block;
  }
}

.translation-section {
  .translation-section__body {
    padding: 24px;
  }
}
</style>
