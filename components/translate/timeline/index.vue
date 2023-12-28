<template>
  <ul class="c-timeline">
    <li v-if="state.pending" class="c-timeline__item">
      <div class="c-node">
        <span class="c-spinner c-spinner--tiny"></span>
      </div>
      <strong class="u-muted">Loading ...</strong>
    </li>

    <li v-else-if="!datedItems.length" class="c-timeline__item">
      <div class="c-node">
        <span class="u-icon">edit</span>
      </div>
      <strong class="u-muted">No history</strong>
    </li>

    <component
      :is="resolveComponent(ucFirst(item.type))"
      v-for="(item, index) in datedItems"
      :key="item.type + item.id + item.date"
      class="c-timeline__item"
      :class="{ 'is-user': item.user && item.user.id === userId }"
      :item="item"
      :base-url="url"
      @update:item="updateItem"
      @select="selectRecord"
      @restore="restoreRecord($event, index)"
      @undo="restoreRecord($event, index, true)"
    />

    <li class="c-timeline__form">
      <comment-form @height-update="scrollToBottom" @submit="createComment" />
    </li>
  </ul>
</template>

<script setup>
import last from 'lodash/last';
import { storeToRefs } from 'pinia';
import addMinutes from 'date-fns/addMinutes';
import isEmpty from 'lodash/isEmpty';

import { cleanerUrl } from '~/helpers/Util';
import { ucfirst } from '~/plugins/filters';
import isHotRecord from '~/helpers/isHotRecord';
import CommentForm from '~/components/comments/Form';
import addDatesToList from '~/helpers/addDatesToList';
import { fetchAPI, storeAPI } from '~/helpers/apiCore';
import { useEventStore, useTranslationStore, useUserStore } from '~/store';

const props = defineProps({
  chapter: { type: Object, default: null },
  currentSegment: { type: Object, default: null },
});

const instance = getCurrentInstance();

const state = reactive({
  pending: false,
  error: false,
  items: [],
  timelineData: [],
});

const translationStore = useTranslationStore();
const userStore = useUserStore();
const eventStore = useEventStore();

const {
  currentRecord: currentRecordState,
  opponentRecord: opponentRecordState,
  currentSegment: currentSegmentState,
  currentSentencePosition,
} = storeToRefs(translationStore);

const { id: userId, getUser: user } = storeToRefs(userStore);

const currentRecord = computed({
  get() {
    return currentRecordState.value;
  },
  set(record) {
    translationStore.setCurrentRecord(record);
  },
});

const opponentRecord = computed({
  get() {
    return opponentRecordState.value;
  },
  set(record) {
    translationStore.setOpponentRecord(record);
  },
});

const datedItems = computed(() => {
  const itemsArray = state.items
    ?.slice()
    ?.map((item) => ({ ...item, date: item?.date || item?.created }));

  return addDatesToList(itemsArray, 'date', true);
});

const url = computed(() => {
  const position = props.currentSegment?.position;
  if (props.currentSegment?.glossarySegment) {
    return `${cleanerUrl(props.chapter?.url)}`;
  } else {
    return `${cleanerUrl(props.chapter?.url)}${position}/`;
  }
});

const timelineItemEvent = computed(() => {
  return eventStore.getEvent('TIMELINE_ITEM');
});

const segmentEditEvent = computed(() => {
  return eventStore.getEvent('SEGMENT_EDIT');
});

const requestItems = async (url) => {
  state.pending = true;
  state.error = null;
  let items = [];

  try {
    items = await fetchAPI(url);
  } catch (error) {
    state.error = error;
  }
  state.pending = false;
  return items;
};

const selectRecord = (item) => {
  if (currentRecord.value === item) {
    currentRecord.value = null;
    opponentRecord.value = null;
  } else {
    currentRecord.value = item;
    if (currentRecord.value !== null)
      currentRecord.value.attachedSegment = currentSegmentState.value;

    const opponent =
      item.relativeId <= 1
        ? null
        : state.items.find((x) => x.relativeId === item.relativeId - 1);
    opponentRecord.value = opponent;
    if (opponentRecord.value !== null)
      opponentRecord.attachedSegment = currentSegmentState.value;
  }
};
const restoreRecord = async (item, _index, undo = false) => {
  try {
    const { data } = await storeAPI(`${url.value}restore/`, {
      relativeId: undo ? item.relativeId - 1 || null : item.relativeId,
    });

    // update current segment
    if (data.segment)
      eventStore.new({
        name: 'SEGMENT_UPDATE',
        payload: data.segment,
      });

    if (data.deletedRelativeId) {
      // delete record
      const i = state.items.findIndex(
        (x) => x?.relativeId === data.deletedRelativeId
      );

      state.items = state.items?.filter((_x, index) => index !== i);
    }

    // add record
    if (data.record) state.items.push(data.record);
  } catch (e) {}
};

const updateItem = (item) => {
  const index = state.timelineData.findIndex(
    (x) => x.id === item?.id && x.type === item?.type
  );
  state.timelineData[index] = item;
};

const addHotRecord = (segment) => {
  const relativeId =
    Math.max.apply(
      Math,
      state.items.map((x) => x?.relativeId || 0)
    ) + 1;
  state.items.push({
    id: `hot${relativeId}`,
    relativeId,
    date: new Date().toISOString(),
    expires: addMinutes(new Date(), 30).toISOString(),
    type: 'record',
    changeReason: 'Edit translation',
    user: user.value,
    content: segment?.content || '',
    votes: [],
  });
};

const updateHotRecord = (segment) => {
  const lastRecord = last(state.items);
  if (lastRecord.content) lastRecord.content = segment?.content || '';
};

const createComment = async (content) => {
  const dataToSubmit = {
    content,
    sentence_position: currentSentencePosition.value,
  };
  state.pending = true;
  try {
    const { data } = await storeAPI(`${url.value}comments/`, dataToSubmit);

    if (props.currentSegment.glossarySegment) {
      data.type = 'comment';
      if (data.content) {
        state.items.push(data);
      }
    } else if (data.comment) {
      state.timelineData.push(data.comment);
    }
    state.pending = false;
  } catch (e) {
    state.pending = false;
  }
};

const setTimelineData = (data) => {
  state.timelineData = data;
  if (currentSentencePosition.value) {
    const commentsOnly = data?.filter((tm) => tm?.type === 'comment');
    const dataWithoutComments = data?.filter((tm) => tm?.type !== 'comment');
    const commentsBySentencePosition = commentsOnly?.filter(
      (cm) => cm?.sentencePosition === currentSentencePosition.value
    );
    const structuredData = [
      ...dataWithoutComments,
      ...commentsBySentencePosition,
    ];
    state.items = structuredData;
  } else {
    state.items = data;
  }
};

const scrollToBottom = () => {
  instance.parent.emit('scrollToBottom');
};

const ucFirst = (string) => {
  return ucfirst(string);
};

watch(
  () => props.currentSegment,
  async () => {
    state.timelineData = [];
    state.items = [];
    const { data } = await requestItems(`${url.value}timeline/`);
    if (data instanceof Array && !isEmpty(data)) {
      setTimelineData(data);
    }

    scrollToBottom();
  }
);

watch(
  () => [currentSentencePosition.value, state.timelineData],
  () => {
    state.items = [];
    if (state.timelineData instanceof Array && !isEmpty(state.timelineData)) {
      setTimelineData(state.timelineData);
    }
  },
  {
    deep: true,
  }
);

watch(timelineItemEvent, ({ payload }) => {
  state.timelineData.push(payload);
  instance.parent.emit('scrollToBottom');
});

watch(segmentEditEvent, ({ payload }) => {
  // if last item is not a hot record, then add one
  const lastRecord = last(state.timelineData);
  if (!isHotRecord(lastRecord) || lastRecord?.user?.id !== userId.value)
    addHotRecord(payload);
  else updateHotRecord(payload);
});

onBeforeMount(async () => {
  const { data } = await requestItems(`${url.value}timeline/`);

  if (data instanceof Array && !isEmpty(data)) {
    setTimelineData(data);
  }

  scrollToBottom();
});

onUnmounted(() => {
  state.items = [];
  state.timelineData = [];
});
</script>
