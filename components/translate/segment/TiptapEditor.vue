<script setup>
import isEmpty from 'lodash/isEmpty';
import TextEditor from '~/components/editor';
import { stripHTML } from '~/helpers/Util';
import { wrap } from '~/plugins/filters';

const props = defineProps({
  content: { type: String, default: '' },
  diff: { type: String, default: '' },
  tag: { type: String, default: 'w-para' },
  focus: Boolean,
  editable: { type: Boolean, default: true },
  isOpen: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  background: { type: Boolean, default: true },
  successStatus: { type: Boolean, default: false },
  errorStatus: { type: Boolean, default: false },
  translation: { type: Object, default: () => ({}) },
  segment: { type: Object, default: null },
  currentSegment: { type: Object, default: null },
  multipleSentences: { type: Boolean, default: false },
  sentencePosition: { type: Number, default: null },
  sentences: { type: Array, default: () => [] },
  showDoneAction: { type: Boolean, default: false },
  chapter: { type: Object, default: () => ({}) },
  segmentPosition: { type: Number, default: null },
  totalSegments: { type: Number, default: null },
});

const emits = defineEmits([
  'update:content',
  'close',
  'vote',
  'complete-translation',
  'update-voting-status',
  'next-segment',
  'update-local-state',
]);

const state = reactive({
  isEditable: false,
  editorData: '',
});

const hasContent = computed(() => {
  if (props.content) {
    return !isEmpty(stripHTML(props.content)?.trim());
  }
  return false;
});

const getPlaceholder = computed(() => {
  if (!hasContent.value && props.placeholder) {
    return props.placeholder;
  }
  return false;
});

const selectedSegmentData = computed(() => {
  if (props.currentSegment) {
    return props.currentSegment;
  } else {
    return props.segment;
  }
});

const updateEditorHtml = (html) => {
  state.editorData = html;
};

const onUpdate = (event) => {
  const contentPayload = {
    content: event.detail.html,
    isSentence: event.detail.isSentence,
    sentencePosition: event.detail.sentencePosition,
  };
  emits('update:content', contentPayload);
  updateEditorHtml(event.detail.rawHtml);
};

const focusMe = () => {
  state.isEditable = true;
};

const closeSegment = () => {
  emits('close');
};

const voteTranslation = (vote) => {
  emits('vote', vote);
};

const finishTranslation = () => {
  emits('complete-translation');
};

const updateVotingStatus = (value) => {
  emits('update-voting-status', value);
};

const nextSegment = () => {
  emits('next-segment');
};

const setEditorData = () => {
  if (props.content === '') {
    const wrapperHTML = props.tag;
    const parentWrapperHTML = selectedSegmentData.value?.tag;
    const htmlAttribute = selectedSegmentData.value?.subType;
    const attributeValue = selectedSegmentData.value?.subValue;
    const isMultipleSentence = props.multipleSentences;
    const content = props.content;

    if (content?.trim() === '' || isMultipleSentence) {
      updateEditorHtml(
        wrap({
          tag: wrapperHTML,
          content,
          subType: htmlAttribute,
          subValue: attributeValue,
        })
      );

      if (isMultipleSentence && parentWrapperHTML === 'w-heading') {
        updateEditorHtml(
          wrap({
            tag: parentWrapperHTML,
            content: state.editorData,
            subType: htmlAttribute,
            subValue: attributeValue,
          })
        );
      }
    } else {
      updateEditorHtml(content);
    }
  } else {
    updateEditorHtml(props.content);
  }
};

const updateParentState = (key, value) => {
  emits('update-local-state', key, value);
};

onMounted(() => {
  state.isEditable = props.editable;
  setEditorData();
});

watch(
  () => [
    props.content,
    props.multipleSentences,
    props.tag,
    selectedSegmentData.value?.tag,
  ],
  () => {
    setEditorData();
  }
);

watch(
  () => props.focus,
  (newState) => {
    if (newState) focusMe();
    else state.isEditable = false;
  }
);

watch(
  () => props.editable,
  (newState) => {
    state.isEditable = newState;
  }
);
</script>

<template>
  <text-editor
    :iseditable="state.isEditable"
    :autosaveduration="3"
    :success="successStatus"
    :error="errorStatus"
    :tag="tag"
    :placeholder="getPlaceholder"
    :content="content"
    placeholder-text="Click to start translation"
    :direction="
      translation &&
      (translation.language === 'ar' ||
        translation.language === 'fa' ||
        translation.language === 'ckb')
        ? 'rtl'
        : 'ltr'
    "
    :chapter="chapter"
    :segment="segment"
    :translation="translation"
    :current-segment="currentSegment"
    :multiple-sentences="multipleSentences"
    :sentence-position="sentencePosition"
    :sentences="sentences"
    :show-done-action="showDoneAction"
    :total-segments="totalSegments"
    :segment-position="segmentPosition"
    @update-local-state="updateParentState"
    @update-voting-status="updateVotingStatus"
    @complete-translation="finishTranslation"
    @on-change-text="onUpdate"
    @on-close-segment="closeSegment"
    @vote="voteTranslation"
    @next-segment="nextSegment"
  >
    <div v-html="state.editorData"></div
  ></text-editor>
</template>
