<script setup>
import get from 'lodash/get';
import { storeToRefs } from 'pinia';

import Votes from './votes/';
import SavedState from './SavedState';
import ThirdParty from './ThirdParty';
import SegmentAirline from './Airline';
import SegmentProgress from './Progress';
import TiptapEditor from './TiptapEditor.vue';
import SegmentStatus from './Status';
import { patchAPI, storeAPI } from '~/helpers/apiCore';
import { RECENT_ACTIVITIES } from '~/service-worker/constants';
import {
  diff,
  isElementPartiallyInViewport,
  stripHTML,
} from '~/helpers/Util.js';

import {
  useAuthStore,
  useEventStore,
  useTranslationStore,
  useUserStore,
  useSentenceStore,
} from '~/store';

import {
  saveTranslatedSegmentToLocalDb,
  saveSegmentVotesToLocalDb,
  saveTranslationToLocalDb,
} from '~/service-worker/db';
import { getWSentContentArray } from '~/components/editor/utils';
import { wrap } from '~/plugins/filters';

/*
 * Events:
 *  @select
 *  @close
 *  @previous
 *  @next
 *  @patch
 *  @request-segment-updates
 */

const props = defineProps({
  translation: { type: Object, default: null },
  segment: { type: Object, default: null },
  current: { type: Object, default: null },
  chapter: { type: Number, default: null },
  segmentPosition: { type: Number, default: null },
  totalSegments: { type: Number, default: null },
});

const emits = defineEmits([
  'select',
  'select-text',
  'close',
  'previous',
  'next',
  'request-segment-updates',
  'patch',
  'patch-stats-data',
]);

const source = ref(null);

// Template Refs
const segmentRef = ref(null);

const route = useRoute();

const userStore = useUserStore();
const translationStore = useTranslationStore();
const eventStore = useEventStore();
const authStore = useAuthStore();
const sentenceStore = useSentenceStore();

const { sentenceTranslationContent } = storeToRefs(sentenceStore);

const {
  currentRecord,
  getDiff: diffObject,
  currentSentence,
} = storeToRefs(translationStore);
const {
  id: userId,
  role: userRole,
  url: userUrl,
  username,
  thumbnail,
} = storeToRefs(userStore);

const { isOnline } = storeToRefs(authStore);

const state = reactive({
  touched: false,
  savedState: null,
  successStatus: false,
  errorStatus: false,
  localContent: '',
  editorFocus: false,
  editorEvents: {
    undo: false,
    redo: false,
  },
  sentencesArray: [],
  votingInProcess: false,
  isEditorEmpty: false,
});

const lockedFor = computed(() => {
  const lock = get(props.segment, 'lockedBy');
  const all = Boolean(lock && lock.id !== userId);
  return {
    all,
    translator: all || !get(props.segment, 'translatorCanEdit', true),
    reviewer: all || !get(props.segment, 'reviewerCanEdit', true),
  };
});

const segmentClasses = computed(() => {
  const classes = [
    'c-segment--' + props.segment.tag,
    {
      'is-current': isCurrent.value,
      'is-read': isRead.value,
      'is-edit': isEdit.value,
      'is-compare': isCompare.value,
      'is-locked': isLocked.value,
      'is-dummy': isDummy.value,
      'is-ai': isThirdParty.value,
    },
  ];
  return classes.concat(props.segment?.classes);
});

/******************
 *     States     *
 ******************/
const isCurrent = computed(() => {
  return props.segment?.id === props.current?.id;
});

const isRead = computed(() => {
  return !isCurrent.value;
});

const isEdit = computed(() => {
  return isCurrent.value && !currentRecord.value;
});

const isCompare = computed(() => {
  return Boolean(isCurrent.value && currentRecord.value);
});

const isDummy = computed(() => {
  return props.segment?.classes?.includes('is-dummy');
});

const isLocked = computed(() => {
  switch (userRole.value) {
    case 'Appointee':
      return lockedFor.trustee;
    case 'Reviewer':
      return lockedFor.reviewer;
    case 'Translator':
      return true;
    case 'Novice':
      return true;
    default:
      return lockedFor.translator;
  }
});

const isEditable = computed(() => {
  if (props.segment.glossarySegment) {
    return false;
  }
  return !isLocked.value && isEdit.value;
});

/******************
 * 3rd Party Text *
 ******************/
const thirdPartyText = computed(() => {
  return props.segment?.ai?.content || '';
});

const isThirdParty = computed(() => {
  return (
    thirdPartyText && thirdPartyText === targetText && !props.segment?.content
  );
});

const isTranslationTypeOriginal = computed(() => {
  return props.translation.workType === 'original';
});

const sourceText = computed(() => {
  if (props.segment.glossarySegment) {
    return props.segment.content;
  }
  return props.segment.original;
});

const getTargetText = (segment) => {
  if (segment.glossarySegment) {
    return segment.description;
  }

  return segment.content || segment?.ai?.content || '';
};

const hasMultipleSentences = computed(() => {
  const wsentArray = getWSentContentArray(sourceText.value);

  if (wsentArray?.length > 1) {
    state.sentencesArray = wsentArray?.map((sent) => `${sent}`);
  }

  return wsentArray?.length > 1;
});

const getSentenceTag = (sentence) => {
  const firstClosingTagIndex = sentence.indexOf('>');
  const firstTag = sentence.substring(0, firstClosingTagIndex + 1);
  const sentenceTag = firstTag.replace(/>|</g, '');
  return sentenceTag;
};

const getSentenceContent = (position) => {
  /* eslint-disable */
  let sentArray;

  if (sentenceTranslationContent.value?.segmentId === props.segment?.id) {
    sentArray = getWSentContentArray(
      sentenceTranslationContent.value?.content?.content
    );
  } else {
    sentArray = getWSentContentArray(props.segment?.content);
  }

  if (sentArray?.length > 0 && sentArray[position]) {
    return sentArray[position];
  }
};

const targetText = computed(() => {
  return isCompare.value ? diffState : getTargetText(props.segment);
});

const diffState = computed(() => {
  return diff(diffObject.value.old, diffObject.value.new);
});

const rtl = computed(() => {
  return get(props.translation, 'language.rtl', false);
});

const currentSentenceValue = computed(() => state.currentSentence);

const updateLocalState = (key, value) => {
  state[key] = value;
};

const isDoneBtnDisabled = computed(
  () => state.votingInProcess || state.isEditorEmpty
);

/******************
 * Event Handlers *
 ******************/

function findPositionLevel(element) {
  // Check if the current element has a 'position-level' attribute
  if (element.hasAttribute('position-level')) {
    const positionLevel = element.getAttribute('position-level');
    translationStore.setCurrentSentencePosition(positionLevel);
  }

  const childElements = element.children;
  for (const childElement of childElements) {
    findPositionLevel(childElement);
  }
}

const selectSegment = () => {
  emits('select', props.segment);
  emits('select-text', false);
  state.editorFocus = true;
};

const selectSentence = (e) => {
  findPositionLevel(e.target);
};

const closeSegment = () => {
  emits('close', props.segment);
  state.editorFocus = false;
};

const selectText = (event) => {
  if (event.target.localName !== 'glossary-entry') {
    emits('select-text', true);
  }
};

const previousSegment = (event) => {
  emits('previous', { event, segment: props.segment });
};

const nextSegment = (event) => {
  emits('next', { event, segment: props.segment });
};

const onEdit = (content) => {
  state.savedState = null;
  state.successStatus = false;
  state.errorStatus = false;
  state.touched = true;

  let timeout;

  /*
   * The timeout will prevent this.checkDiscount() from being called on
   * every keystroke, but only if the user stopped typing for 400ms
   */
  clearTimeout(timeout);
  // NOTE - THE FOLLOWING CODE HANDLES SAVING OF TRANSLATIONS.
  timeout = setTimeout(async () => {
    try {
      let url = '';
      url = props.segment.glossarySegment
        ? `glossaries/${props.chapter}/`
        : `translations/${props.translation?.id}/segments/${props.segment?.position}/`;
      let contentModifer = {};
      contentModifer = props.segment.glossarySegment
        ? {
            description: content?.content,
            lastModified: props.segment?.lastModified,
          }
        : {
            content: content?.content,
            lastModified: props.segment?.lastModified,
          };

      let data = {};

      if (isOnline.value) {
        data = await patchAPI(url, contentModifer);

        if (!data?.id) {
          state.savedState = 'error';
          state.errorStatus = true;
          return;
        }
      } else {
        const updatedSegment = {
          ...contentModifer,
          id: props.segment?.id,
          work: props.segment?.work,
          chapter: props.segment?.chapter,
          lastModified: new Date(),
          position: props.segment?.position,
          reference: props.segment?.reference,
          translatorCanVote: true,
          statistics: {
            translators: {
              vote: props.segment?.statistics?.translators?.vote,
              user: props.segment?.statistics?.translators?.user,
            },
            reviewers: {
              vote: props.segment?.statistics?.reviewers?.vote,
              user: props.segment?.statistics?.reviewers?.user,
            },
            editors: {
              vote: props.segment?.statistics?.editors?.vote,
              user: props.segment?.statistics?.editors?.user,
            },
          },
        };

        data = await saveTranslatedSegmentToLocalDb({
          data: updatedSegment,
          work: props.segment?.work,
          chapter: props.segment?.chapter,
          segment: props.segment?.position,
          key: `${props.segment?.work}_${props.segment?.chapter}_${props.segment?.position}`,
          userInfo: {
            url: userUrl.value,
            id: userId.value,
            username: username.value,
            thumbnail: thumbnail.value,
          },
        });

        if (data?.id) {
          await saveTranslationToLocalDb({
            data: props.segment,
            key: `${props.segment?.work}_${RECENT_ACTIVITIES}`,
          });
        }
      }

      // notify timeline
      eventStore.new({
        name: 'SEGMENT_EDIT',
        payload: data,
      });

      // notify parent
      if (isOnline.value) {
        if (content?.isSentence) {
          let payload = { ...data };
          delete payload.content;
          payload.content = content?.content;
          Object.assign(payload, content);
          emits('patch', payload);
        } else {
          emits('patch', data);
          emits('request-segment-updates');
        }
      } else {
        emits('patch', data);
        emits('request-segment-updates');
      }

      state.successStatus = true;
      state.savedState = 'success';
      state.touched = false;
    } catch (error) {
      state.savedState = 'error';
      state.errorStatus = true;
    }
  }, 400);
};

const voted = async (vote) => {
  state.errorStatus = false;
  state.successStatus = false;

  try {
    let data = {};
    if (isOnline.value) {
      const result = props.segment.glossarySegment
        ? await storeAPI(`glossaries/${route.params.chapter}/vote/`, {
            role: vote.role,
            setTo: 1,
            timestamp: props.segment?.lastModified,
          })
        : await storeAPI(
            `translations/${props.translation?.id}/segments/${props.segment?.position}/vote/`,
            {
              role: vote.role,
              setTo: vote.setTo,
              timestamp: props.segment?.lastModified,
            }
          );

      if (result?.data) {
        data = result?.data;
      }
    } else {
      const offlineVotePayload = {
        type: 'vote',
        role: vote?.role,
        action: vote?.setTo === 1 ? 'approved' : 'revoked approval',
        date: new Date(),
        assessment: vote?.setTo,
        segment: props.segment?.id,
        chapter: props.segment?.chapter,
        work: props.segment?.work,
      };

      data = await saveSegmentVotesToLocalDb({
        data: offlineVotePayload,
        work: props.segment?.work,
        chapter: props.segment?.chapter,
        segment: props.segment,
        key: `${props.segment?.work}_${props.segment?.chapter}_${props.segment?.position}`,
        userInfo: {
          url: userUrl.value,
          id: userId.value,
          username: username.value,
          thumbnail: thumbnail.value,
        },
      });
    }

    emits('patch', data.segment);
    // TODO: REMOVE AFTER SUCCESSFUL QA
    // emits('request-segment-updates');
    if (data.vote) {
      state.successStatus = true;
      eventStore.new({
        name: 'SEGMENT_EDIT',
        payload: data,
        translatorRevoked:
          (vote?.role === 'translator' && vote?.setTo === 0) || false,
      });
    } else {
      state.errorStatus = true;
    }

    /**
     * Update statistics data chatper wise and translation wise
     */
    updateChapterStats();

    if (data.workStats) {
      emits('patch-stats-data', data.workStats, 'translation');
    }
  } catch (e) {
    state.errorStatus = true;
  }
};

/******************
 * 3rd Party Text *
 ******************/
const updateThirdParty = (payload) => {
  state.localContent = payload;
  nextTick(() => (state.editorFocus = true));
};

const applyThirdParty = (payload) => {
  state.localContent = payload;
  onEdit(payload);
};

/**********************
 *  Helper Functions  *
 **********************/

const updateChapterStats = () => {
  if (isOnline.value) {
    translationStore
      .fetchCurrentChapterContents(props.translation?.id, route.params.chapter)
      .then((response) => {
        emits('patch-stats-data', response, 'chapter');
      });
  }
};

/**
 * This function is used to check if the translated user exists of not
 * This indicates that if translated user is not equals to none then
 * the translation is already translated by the corresponding user.
 */
const checkIfTranslatedUserExists = () => {
  return props.segment?.translatedUser?.toLowerCase() !== 'none';
};

/**
 * This function is used to check if the translation is translated by the logged in user
 */
const checkIfLoggedInUserIsTransaltor = () => {
  return props.segment?.translatedUser === username.value;
};

const canVoteAsTranslator = computed(() => {
  if (
    (!checkIfTranslatedUserExists() || checkIfLoggedInUserIsTransaltor()) &&
    Boolean(props.segment.lockedBy)
  ) {
    return Boolean(
      props.segment.lockedBy.username === username.value &&
        props.segment.progress <= 2 &&
        props.segment?.translatorCanVote
    );
  } else {
    return Boolean(
      userStore.userRoleByWorkId(props.translation.id).includes('translator') &&
        props.segment?.translatorCanVote
    );
  }
});

// Updating the status of the button.
const updateDoneButtonStatus = (isLoading) => {
  state.votingInProcess = isLoading;
};

/**
 * A method that is called when the user clicks the "Done" button.
 * It updates the status of the button and triggers the custom event to add vote
 */
const finishTranslation = () => {
  if (!canVoteAsTranslator.value) return;
  updateDoneButtonStatus(true);
  voted({ role: 'translator', setTo: 1 });
};

const showDoneAction = computed(() => {
  if (canVoteAsTranslator.value && props.segment.progress < 2) {
    return true;
  } else {
    return false;
  }
});

watch(
  () => props.segment,
  (newSegment) => {
    if (!newSegment) return;
    state.localContent = getTargetText(newSegment);
  },
  {
    deep: true,
  }
);

watch(
  () => props.current,
  (newSegment) => {
    if (!newSegment) state.editorFocus = false;
  }
);

watch(
  () => isCurrent.value,
  (value) => {
    if (value && !isElementPartiallyInViewport(segmentRef.value))
      segmentRef.value.scrollIntoView({ block: 'center' });
  }
);

watch(state.editorFocus, (newState) => {
  if (newState && !isCurrent.value) selectSegment();
});

onMounted(() => {
  if (props.segment) {
    state.localContent = getTargetText(props.segment);
  }
});
</script>

<template>
  <div
    :id="segment.id"
    ref="segmentRef"
    class="c-segment"
    :class="segmentClasses"
    @keydown.esc="closeSegment"
  >
    <div class="c-segment__header o-flex o-flex--middle o-flex--between">
      <segment-status :reference="segment.reference" position="header-left" />
      <segment-status
        :statistics="segment.statistics"
        :reference="segment.reference"
        position="header-right"
      />
    </div>

    <!-- Progress -->
    <div class="c-segment__progress">
      <segment-progress
        :progress="segment.progress"
        :third-party="isThirdParty"
      />
    </div>

    <div class="c-segment__content">
      <div
        v-if="!hasMultipleSentences"
        class="c-segment__content-inner"
        :class="{
          '--single-panel': isTranslationTypeOriginal,
        }"
        @click="selectSentence"
      >
        <template v-if="!isTranslationTypeOriginal">
          <div
            class="c-source__text u-content"
            ref="source"
            :class="segment.classes"
          >
            <span
              :class="{ 'u-blind-text is-loading': isDummy }"
              @mouseup="selectText"
              v-html="sourceText"
            ></span>
          </div>
          <div class="line-divider"></div>
        </template>

        <div
          class="c-translation__text"
          :class="{ 'u-rtl': rtl }"
          @click="selectSegment"
          @keyup.esc="closeSegment"
        >
          <div v-if="isDummy">
            <span
              class="u-blind-text"
              :class="{ 'is-loading': isDummy }"
              v-html="sourceText"
            >
            </span>
          </div>

          <tiptap-editor
            v-if="!isDummy"
            class="c-translation__editor"
            :class="{ 'u-muted': isThirdParty }"
            :chapter="chapter"
            :tag="segment.tag"
            :segment="segment"
            :current-segment="current"
            :content="state.localContent"
            :focus="state.editorFocus"
            :background="isEditable"
            :placeholder="stripHTML(sourceText)"
            :editable="isEditable"
            :isopen="state.editorFocus"
            :translation="translation"
            :success-status="state.successStatus"
            :error-status="state.errorStatus"
            :diff="isCompare ? diffState : ''"
            :total-segments="totalSegments"
            :segment-position="segmentPosition"
            :showDoneAction="showDoneAction"
            @update-local-state="updateLocalState"
            @update-voting-status="updateDoneButtonStatus"
            @complete-translation="finishTranslation"
            @close="closeSegment"
            @update:content="onEdit"
            @next-segment="nextSegment"
            @vote="voted"
          />
        </div>
      </div>

      <div
        v-else
        v-for="(sentence, position) in state.sentencesArray"
        :key="`${sentence}--${position}`"
        class="c-segment__content-inner --sentence-content"
        :class="{
          'is-current-sentence':
            currentSentence === `editor-${segment.id}-${position}`,
          '--single-panel': isTranslationTypeOriginal,
        }"
        @click="selectSentence"
      >
        <template v-if="!isTranslationTypeOriginal">
          <div
            class="c-source__text u-content"
            ref="source"
            :class="segment.classes"
          >
            <span
              :class="{ 'u-blind-text is-loading': isDummy }"
              @mouseup="selectText"
              v-html="
                wrap({
                  tag: segment.tag,
                  content: sentence,
                  subType: segment?.subType,
                  subValue: segment?.subValue,
                })
              "
            >
            </span>
          </div>
          <div class="line-divider"></div>
        </template>
        <div
          class="c-translation__text"
          :class="{ 'u-rtl': rtl }"
          @click="selectSegment"
          @keyup.esc="closeSegment"
        >
          <div v-if="isDummy">
            <span
              class="u-blind-text"
              :class="{ 'is-loading': isDummy }"
              v-html="sentence"
            >
            </span>
          </div>
          <tiptap-editor
            v-if="!isDummy"
            class="c-translation__editor"
            :class="{ 'u-muted': isThirdParty }"
            :chapter="chapter"
            :tag="getSentenceTag(sentence)"
            :segment="segment"
            :sentence-position="position"
            :sentences="state.sentencesArray"
            :current-segment="current"
            :content="getSentenceContent(position)"
            :focus="state.editorFocus"
            :background="isEditable"
            :placeholder="stripHTML(sentence)"
            :editable="isEditable"
            :isopen="state.editorFocus"
            :translation="translation"
            :success-status="state.successStatus"
            :error-status="state.errorStatus"
            :diff="isCompare ? diffState : ''"
            :multiple-sentences="hasMultipleSentences"
            :showDoneAction="showDoneAction"
            :total-segments="totalSegments"
            :segment-position="segmentPosition"
            @update-local-state="updateLocalState"
            @update-voting-status="updateDoneButtonStatus"
            @complete-translation="finishTranslation"
            @close="closeSegment"
            @update:content="onEdit"
            @next-segment="nextSegment"
            @vote="voted"
          />
        </div>
      </div>
    </div>
    <!-- Airline -->
    <segment-airline
      :segment="segment"
      :is-locked="isLocked"
      :locked-for="lockedFor"
    >
      <template #default>
        <saved-state :touched="state.touched" :state="state.savedState" />
      </template>

      <template #right>
        <third-party
          v-if="isThirdParty"
          :segment="segment"
          :local-content="state.localContent"
          :is-edit="isEdit"
          :is-editable="isEditable"
          @update="updateThirdParty"
          @apply="applyThirdParty"
        />
        <votes :translation="translation" :segment="segment" @vote="voted" />
        <div v-if="showDoneAction" class="translation-done-button-container">
          <button
            id="translationDone"
            class="c-btn c-btn--primary c-btn---"
            :disabled="isDoneBtnDisabled"
            @click="finishTranslation"
          >
            <div
              v-if="state.votingInProcess"
              class="c-spinner c-spinner--tiny"
            ></div>

            <span v-else>
              <div class="u-icon">verified_user</div>
              Done
            </span>
          </button>
        </div>
      </template>
    </segment-airline>
  </div>
</template>

<style lang="scss" scoped src="~/assets/scss/scoped/segments.scss" />
<style src="@/components/editor/style.css" />

<style lang="scss">
.sentence {
  margin-bottom: 20px;
}

#translationDone {
  background-color: #0d6d91;
  font-size: 14px;
  padding: 4px 8px;
}

.translation-done-button-container {
  margin-left: 24px;
}
</style>
