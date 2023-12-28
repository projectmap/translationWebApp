<script setup>
import isEmpty from 'lodash/isEmpty';
import { storeToRefs } from 'pinia';
import { Editor } from '@tiptap/vue-3';
import Link from '@tiptap/extension-link';
import { StarterKit } from '@tiptap/starter-kit';
import {
  WFormatAllCapsExtension,
  WFormatBoldExtension,
  WFormatItalicExtension,
  WFormatSmallCapsExtension,
  WFormatSubscriptExtension,
  WFormatSuperscriptExtension,
  WFormatUnderlineExtension,
  WParaExtension,
  WTextBlockExtension,
  WSentExtension,
  WHeadingExtension,
  WPageExtension,
  WLinkExtension,
  WAnchorExtension,
  WLangExtension,
  WNonEgwExtension,
  WEntityExtension,
  DisableEnter,
} from './extensions';
import {
  contentFormatterForParagraphType,
  contentFormatterForSentenceType,
  getInnerContentFromHTMLString,
  getWSentContentArray,
} from './utils';
import { stripHTML } from '~/helpers/Util';
import { wrap } from '~/plugins/filters';
import {
  useEditorStore,
  useEventStore,
  userAlertStore,
  useTranslationStore,
  useSentenceStore,
  useUserStore,
} from '~/store';
import draftImage from '~/assets/images/draft.png';
import { customTags, unsupportedTags } from '~/constants';
const root = ref(null);

const alertStore = userAlertStore();

const props = defineProps({
  showDoneAction: { type: Boolean, default: false },
  tag: {
    type: String,
    default: 'w-para',
  },
  placeholder: {
    type: String,
    default: null,
  },
  placeholderText: {
    type: String,
    default: '',
  },
  options: {
    type: Object,
    default: () => ({ static: false, hasButtons: true }),
  },
  autoSaveDuration: {
    type: Number,
    default: 5,
  },
  success: {
    type: Boolean,
  },
  error: {
    type: Boolean,
    default: false,
  },
  direction: {
    type: String,
    default: 'ltr',
  },
  height: {
    type: Number,
    default: 0,
  },
  iseditable: {
    type: Boolean,
    default: false,
  },
  segment: { type: Object, default: null },
  translation: { type: Object, default: null },
  content: { type: String, default: '' },
  multipleSentences: { type: Boolean, default: false },
  sentencePosition: { type: Number, default: null },
  sentences: { type: Array, default: () => [] },
  chapter: { type: Object, default: () => ({}) },
  segmentPosition: { type: Number, default: null },
  totalSegments: { type: Number, default: null },
});

const emits = defineEmits([
  'on-change-text',
  'on-close-segment',
  'vote',
  'complete-translation',
  'update-voting-status',
  'next-segment',
  'update-local-state',
]);

const state = reactive({
  initialContent: '',
  showEditor: false,
  unSaveContent: '',
  unSavedChanges: false,
  savedHTML: '',
  status: 'Save',
  autoSaveContent: false,
  markTranslationDone: false,
  extensions: [
    StarterKit,
    WFormatBoldExtension,
    WFormatItalicExtension,
    WFormatUnderlineExtension,
    WFormatAllCapsExtension,
    WFormatSmallCapsExtension,
    WFormatSubscriptExtension,
    WFormatSuperscriptExtension,
    WParaExtension,
    WTextBlockExtension,
    WSentExtension,
    WHeadingExtension,
    WPageExtension,
    WAnchorExtension,
    WLangExtension,
    WNonEgwExtension,
    WEntityExtension,
    DisableEnter,
  ],
  editor: null,
  disableSaveBtn: false,
  saveButtonStatus: 'Save',
  sentenceInSavingState: null,
  currentSentenceIndex: null,
  autoSwitchTrigger: false,
});
let timeout = null;

const userStore = useUserStore();
const { name: username, isAdmin, isGc } = storeToRefs(userStore);

const eventStore = useEventStore();
const { events } = storeToRefs(eventStore);

const editorStore = useEditorStore();
const { options: editorOptions } = storeToRefs(editorStore);

const sentenceStore = useSentenceStore();

const translationStore = useTranslationStore();
const { currentSegment, currentSentence, priorSegment } =
  storeToRefs(translationStore);

/**
 * This function is used to check if the translation is translated by the logged in user
 */
const checkIfLoggedInUserIsTransaltor = () => {
  return props.segment.translatedUser === username.value;
};

const canEditAsAssignee = computed(() => {
  if (checkIfLoggedInUserIsTransaltor()) {
    return Boolean(props.segment.translatorCanEdit);
  }
  return isAdmin.value && Boolean(props.segment?.assigneeCanEdit);
});

const canEditAsEditor = computed(() => {
  if (checkIfLoggedInUserIsTransaltor()) {
    return Boolean(props.segment.translatorCanEdit);
  }
  return Boolean(
    userStore.userRoleByWorkId(props.translation.id).includes('editor') &&
      props.segment?.editorCanEdit
  );
});

const canEditAsReviewer = computed(() => {
  if (checkIfLoggedInUserIsTransaltor()) {
    return Boolean(props.segment.translatorCanEdit);
  }
  return Boolean(
    userStore.userRoleByWorkId(props.translation.id).includes('reviewer') &&
      props.segment?.reviewerCanEdit
  );
});

const canEditAsTranslator = computed(() => {
  return Boolean(
    (userStore.userRoleByWorkId(props.translation.id).includes('translator') ||
      isGc.value ||
      isAdmin.value) &&
      props.segment?.translatorCanEdit
  );
});

const translationHasTranslator = computed(
  () => props.translation?.roleCounts?.translator > 0
);
const getSuccessStatus = computed(() => {
  return props.success;
});

const getErrorStatus = computed(() => {
  return props.error;
});

const showPlaceholder = computed(() => {
  return !state.savedHTML && props.placeholder && !state.showEditor;
});

const righToLeftTyping = computed(() => {
  return props.direction === 'rtl';
});

const newContentLength = computed(() => {
  return stripHTML(state.unSaveContent).trim().length;
});

const canSaveContent = computed(() => {
  const newContent = stripHTML(state.unSaveContent).trim();
  const initialContent = stripHTML(state.initialContent).trim();

  return (
    (newContent !== '' &&
      (initialContent !== newContent || state.unSavedChanges)) ||
    isSaveDisabled.value
  );
});

// Triggers only if mouse click event is initiated in the segments
// This will be ignored on Enter/ Tab key events
const handleMouseClick = (event) => {
  if (event.pointerId > -1) {
    if (props.multipleSentences) {
      translationStore.setCurrentSentence(
        `editor-${props.segment?.id}-${props.sentencePosition}`
      );
    } else {
      translationStore.setCurrentSentence(`editor-${props.segment?.id}`);
    }
    translationStore.setPriorSegment(null);
    state.currentSentenceIndex = null;
  }
};

/**
 * This function handles the processes to be triggered when any segment is clicked/selected
 * for translation.
 * Used to initialized the pell editor and display it in the UI
 */
const handleEditor = (event) => {
  if (isChapterDownloadedByAnotherUser.value || !translationHasTranslator.value)
    return;

  if (
    canEditAsTranslator.value ||
    canEditAsReviewer.value ||
    canEditAsEditor.value ||
    canEditAsAssignee.value
  ) {
    state.showEditor = true;
  } else {
    return;
  }

  if (props.options.static === true) {
    return;
  }

  handleMouseClick(event);

  if (props.translation.bookType === 'paragraph') {
    state.extensions.push(WLinkExtension);
  } else {
    state.extensions.push(
      Link.configure({
        openOnClick: false,
      })
    );
  }

  /**
   * Initialize Text Editor
   */
  initializeTextEditor();
};

/**
 * Set content to tiptap editor manually on specific action trigger
 * @param {string} content
 */

const setEditorDataManually = (content) => {
  // wrap content with custom tags of the segment
  const formatContent = wrap({
    tag: props.tag,
    content,
    subType: props.segment?.subType,
    subValue: editorOptions.value.headingLevel ?? props.segment?.subValue,
  });

  // set html to editor
  state.editor.commands.setContent(formatContent);

  // save content
  onChangeText(formatContent);
};

const dynamicSentencePosition = computed(() => {
  if (props.multipleSentences && props.sentencePosition > -1) {
    return `editor-${props.segment?.id}-${props.sentencePosition}`;
  } else {
    return `editor-${props.segment?.id}`;
  }
});

const isCurrentSentence = computed(() => {
  if (props.multipleSentences) {
    return (
      currentSentence.value ===
      `editor-${props.segment.id}-${props.sentencePosition}`
    );
  } else {
    return currentSentence.value === `editor-${props.segment.id}`;
  }
});

const updatedRoot = computed(() => {
  if (currentSentence.value) {
    const idSyllabus = currentSentence.value.split('-');
    if (idSyllabus.length === 3) {
      return document.querySelector(
        `[data-position='${currentSentence.value}']`
      );
    } else {
      return document.getElementById(currentSentence.value);
    }
  }
});

const isLastSegment = computed(() => {
  return props.segmentPosition === props.totalSegments;
});

const markTranslationDoneOnSegmentSwitch = () => {
  const segmentToMark = isLastSegment.value
    ? currentSegment.value
    : priorSegment.value;

  if (props.multipleSentences) {
    if (parseInt(state.currentSentenceIndex) === props.sentences.length - 1) {
      const translatedContentArray = getWSentContentArray(
        segmentToMark?.content
      );

      const hasEmptySentence = translatedContentArray?.find(
        (item) => stripHTML(item).trim() === ''
      );

      if (!hasEmptySentence) {
        saveAndMarkAsDone();
        translationStore.setPriorSegment(null);
      }
      translationStore.setPriorSegment(null);
      state.currentSentenceIndex = null;
    }
  } else {
    if (stripHTML(segmentToMark?.content).trim() !== '') {
      saveAndMarkAsDone();
      translationStore.setPriorSegment(null);
    }
    translationStore.setPriorSegment(null);
    state.currentSentenceIndex = null;
  }
};

/** OPERATIONS RELATED TO ENTER KEY SHORTCUT STARTS */

const handleSegmentSwitchShortcuts = (e) => {
  // Close current editor
  _closeEditor(e, 'switch-trigger');

  // Set next segment as current, handle for both multiple sentences and single sentences scenario
  if (
    props.multipleSentences &&
    props.sentencePosition !== props.sentences.length - 1
  ) {
    state.autoSwitchTrigger = true;
    translationStore.setCurrentSentence(
      `editor-${props.segment.id}-${props.sentencePosition + 1}`
    );
  } else {
    state.autoSwitchTrigger = true;
    state.currentSentenceIndex =
      currentSentence.value?.split('-')[
        currentSentence.value?.split('-').length - 1
      ];

    translationStore.setCurrentSentence(null);
    emits('next-segment');
  }

  // // Open new editor instance in new root after some delay
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    const slot = updatedRoot.value.querySelector('#slot');
    if (slot) {
      slot.click();
    }
  }, 100);
};

/** OPERATIONS RELATED TO ENTER KEY SHORTCUT ENDS */

/**
 * Reset content to segment's custom tag when editor has no content
 * USE CASE - When there is no data in the editor and user tries to delete content <using backspace>
 * then the editor tends to put <p> tag instead of our custom tag, so we implemented this function
 * to reset the content to segment's custom tag.
 * @param {object} e
 */
const resetToWFormatTagOnBackspace = (e) => {
  const innerContent = newContentLength.value;
  if (
    (innerContent < 1 || innerContent === 1) &&
    state.editor.isEmpty &&
    e.key === 'Backspace'
  ) {
    e.preventDefault();
    setEditorDataManually('');
  }

  if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    handleSegmentSwitchShortcuts(e);
  }
};

const isChapterDownloadedByAnotherUser = computed(() => {
  return props.chapter?.downloaded && !props.chapter?.currentUser;
});

/**
 * This function handles the initialization of the text editor
 */

const initializeTextEditor = () => {
  let focusTimeOut;

  const initialState = getInitialContentForEditor();

  const editor = root.value.querySelector('#editor');

  if (state.editor) return;

  state.editor = new Editor({
    element: editor,
    extensions: state.extensions,
    content: initialState,
    editable: true,
    editorProps: {
      tag: props.tag,
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate(editorInstance) {
      const { editor, transaction } = editorInstance;

      state.unSavedChanges =
        transaction.docChanged && editor.getText().trim() !== '';

      const isEditorEmpty = editor.getText().trim() === '';
      emits('update-local-state', 'isEditorEmpty', isEditorEmpty);
      onChangeText(editor.getHTML());
    },

    onCreate({ editor }) {
      const { state } = editor;

      // Set data to editor store
      editorStore.setEditorOptions('isTextSelected', !state.selection.empty);
      editorStore.setEditorOptions(
        'isHeading',
        props.segment?.tag === 'w-heading'
      );
      editorStore.setEditorInstance(editor);

      // Set focus cursor to editor
      focusTimeOut = setTimeout(() => {
        setFocusToEditor();
      }, 50);
    },
    onSelectionUpdate({ editor }) {
      const { state } = editor;
      editorStore.setEditorOptions('isTextSelected', !state.selection.empty);
    },

    onDestroy() {
      // Remove data from editor store
      editorStore.setEditorOptions('isTextSelected', false);
      editorStore.setEditorOptions('isHeading', false);
      editorStore.setEditorOptions('pageBreak', null);
      editorStore.setEditorInstance({});

      // Clear time out for focus editor
      clearTimeout(focusTimeOut);
    },
  });

  // Add event listener to listen to shortcut keys combination
  if (process.client) {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', _closeEditor);
    if (editor) {
      editor.addEventListener('paste', handleEditorOnPasteEvent);
      editor.addEventListener('keydown', resetToWFormatTagOnBackspace);
    }
  }
};

/**
 * This function handles the onpaste event where the pasted data's html elements are stripped
 * and the applications custom tags are added instead.
 * @param {object} event
 */
const handleEditorOnPasteEvent = (event) => {
  // check if the pasted content contains html or not
  const editorData = state.editor.getHTML();
  const regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
  const contentHasHTML = regexForHTML.test(editorData);
  const bookContentType = props.translation.bookType;

  // check if the existing tags are of the system itself and can be used
  const hasSystemTags = customTags.filter((tag) =>
    editorData.includes(`<${tag}`)
  );
  const hasUnsupportedTags = unsupportedTags.filter((tag) =>
    editorData.includes(tag)
  );

  if (
    contentHasHTML &&
    (isEmpty(hasSystemTags) ||
      (bookContentType === 'sentence' && !isEmpty(hasUnsupportedTags)))
  ) {
    // automatically strips all html and gives sanitized string
    const clipboardData = event.clipboardData.getData('text');
    setEditorDataManually(clipboardData);
  }
};

const saveAndMarkAsDone = () => {
  if (state.unSaveContent) {
    saveChanges();
    state.markTranslationDone = true;
  } else {
    finishTranslation();
  }
};
/**
 * This functions handles the actions to be peformed on short cut keys combinations
 * Combitions -
 * 1. CTRL+S = Save content (CMD+S for Mac)
 * 2. CTRL+SHIFT+S = Save content and mark translation as done (CMD+SHIFT+S for Mac)
 * @param {object} event
 * @param {string} inputKey
 */
const handleShortcutEvent = (event, inputKey) => {
  if (event[inputKey] && event.key === 's' && !event.shiftKey) {
    event.preventDefault();
    saveChanges();
  } else if (event[inputKey] && event.shiftKey && event.key === 's') {
    saveAndMarkAsDone();
  } else {
    console.info('No action performed');
  }
};

/**
 * This function handles the listening to short cut keys combinations
 * @param {object} event
 */
const handleKeyDown = (event) => {
  if (event.view.navigator.userAgent.includes('Mac')) {
    handleShortcutEvent(event, 'metaKey');
  } else {
    handleShortcutEvent(event, 'ctrlKey');
  }
};

/**
 * This function is used to retrieve the initial translation content if
 * there is already any translated text in the segment.
 */
const getInitialContentForEditor = () => {
  const slot = getSlotElement();
  state.initialContent = slot.innerHTML;
  return slot.innerHTML;
};

/**
 * This function is used to focus cursor on the editor when the
 * editor is initiated.
 */
const setFocusToEditor = () => {
  const node = root.value.querySelectorAll('.ProseMirror')[0];

  if (node) {
    if (props.direction) {
      node.style.direction = props.direction;
    }

    if (window.innerWidth <= 576) {
      node.style.maxHeight = '200px';
    }
    if (props.height !== 0) {
      node.style.height = `${props.height}px`;
    }

    node.focus();

    const lastNode = node.lastChild;

    let textNode;

    if (lastNode?.firstChild?.nodeType === Node.ELEMENT_NODE) {
      textNode = lastNode.firstChild;
    } else {
      textNode = lastNode;
    }

    if (!props.placeholder && textNode) {
      const caret = 1; // insert caret after the 10th character say
      const range = document.createRange();
      range.setStart(textNode, caret);
      range.setEnd(textNode, caret);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
};

const updateHeadingLevelToContent = (content) => {
  if (editorOptions.value.headingLevel) {
    return (
      '<w-heading level="' +
      editorOptions.value.headingLevel +
      `">${content.substring(content.indexOf('>') + 1)}`
    );
  }
};

const { sentenceTranslationContent } = storeToRefs(sentenceStore);

const segmentContent = computed(() => {
  if (sentenceTranslationContent.value?.segmentId === props.segment?.id) {
    return sentenceTranslationContent.value?.content?.content;
  }
  return props.segment?.content;
});

/**
 * Contents the logic to save the new translation text
 * @param {string} content
 */
const saveText = (content) => {
  const pureContentText = stripHTML(content);
  const initialContent = stripHTML(state.initialContent);

  if (
    pureContentText.trim() !== '' &&
    (state.unSavedChanges || initialContent.trim() !== pureContentText.trim())
  ) {
    let htmlContent = content;
    const originalContent = props.segment?.original;
    const parentTag = props.segment?.tag;
    const bookContentType = props.translation.bookType;

    if (bookContentType === 'paragraph') {
      htmlContent = contentFormatterForParagraphType({
        originalContent,
        translatedContent: getInnerContentFromHTMLString(htmlContent),
      });
    } else {
      const { formattedContent } = contentFormatterForSentenceType({
        tag: props.tag,
        originalContent,
        parentTag,
        content: htmlContent,
        sentences: props.sentences,
        multipleSentences: props.multipleSentences,
        segmentContent: props.multipleSentences
          ? segmentContent.value
          : props.segment?.content,
        sentencePosition: props.sentencePosition,
      });

      htmlContent = formattedContent;
    }

    if (editorOptions.value.headingLevel) {
      htmlContent = updateHeadingLevelToContent(htmlContent);
      editorOptions.value.headingLevel = null;
    }

    state.savedHTML = content;

    if (props.multipleSentences) {
      sentenceStore.setSentenceTranslationContent({
        segmentId: props.segment?.id,
        content: {
          content: htmlContent,
          isSentence: props.multipleSentences,
          sentencePosition: props.sentencePosition,
        },
      });
    }

    emits('on-change-text', {
      cancelable: true,
      detail: {
        html: htmlContent,
        pureText: pureContentText,
        rawHtml: content,
        isSentence: props.multipleSentences,
        sentencePosition: props.sentencePosition,
      },
      bubbles: true,
      composed: true,
    });
    updateSaveButtonStatus('saving');
  }
};

/**
 * This function is triggered when the SAVE button is clicked in the editor.
 * It is used to save the new content.
 */
const saveChanges = () => {
  clearTimeout(timeout);

  if (state.unSaveContent) {
    const textContent = stripHTML(state.unSaveContent);
    if (textContent.trim() === '') {
      alertStore.new({
        message:
          'Unable to save empty content. Please make at least one new update before saving.',
        color: 'red',
        duration: 2000,
      });

      return;
    }

    state.sentenceInSavingState = props.sentencePosition;
    updateSaveButtonStatus('save');
    saveText(state.unSaveContent);
  } else {
    alertStore.new({
      message:
        'Unable to save data. Please make at least one new update before saving.',
      color: 'blue',
      duration: 2000,
    });
  }
};
/**
 * This function is automatically triggered when any new content
 * is written in the editor.
 * This also handles the autosave logic.
 * @param {string} html
 */
const onChangeText = (html) => {
  updateSaveButtonStatus('save');
  state.unSaveContent = html;
  if (props.autoSaveDuration > 0 && state.unSaveContent) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      saveText(state.unSaveContent);
    }, props.autoSaveDuration * 1000);
  }
};
/**
 * This function handles the closing of the pell editor if the user clicks
 * outside the editor element.
 * @param {object} event
 */
const _closeEditor = (event, trigger) => {
  const doneButtonElement = document.getElementById('translationDone');
  const toolbarElement = document.getElementById('editor-toolbar');
  const saveButton = document.getElementById('saveStatus');

  if (
    (!doneButtonElement?.contains(event.target) &&
      !toolbarElement?.contains(event.target) &&
      !root.value?.contains(event.target) &&
      !saveButton?.contains(event.target) &&
      props.options.hasButtons) ||
    trigger === 'switch-trigger'
  ) {
    if (state.unSavedChanges && !getErrorStatus.value) {
      state.autoSaveContent = true;
      saveChanges();
      return;
    }

    closeSegment('closeFunc');
  }
};
/**
 * This function handles the processes to close any segment in translation.
 */
const closeSegment = (parentFunction = '') => {
  const editorElement = root.value?.querySelector('#editor');

  // This line of validation will preserve the open state of editor on enter click
  // If previous sentence is in saving state, after save only the saving sentence editor
  // will be closed and current sentence editor will remain open if already open
  if (parentFunction !== 'closeFunc' && state.editor?.isFocused) return;

  if (state.unSavedChanges) {
    state.unSavedChanges = false;
  }
  state.showEditor = false;
  if (state.editor) {
    state.editor?.destroy();
    state.editor = null;
  }
  if (editorElement) {
    editorElement.innerHTML = '';
  }
  emits('update-local-state', 'isEditorEmpty', false);
  // Remove event listener to listen to shortcut keys combination
  if (process.client) {
    window.removeEventListener('keydown', handleKeyDown);
    if (editorElement) {
      editorElement.removeEventListener('paste', handleEditorOnPasteEvent);
      editorElement.addEventListener('keydown', resetToWFormatTagOnBackspace);
    }
  }
};

/**
 * This function is used to display status in the save button.
 * Messages -> Save, Saving..., Saved.
 * @param {string} type
 */
const updateSaveButtonStatus = (type) => {
  if (!canSaveContent.value) {
    return;
  }

  if (
    props.multipleSentences &&
    state.sentenceInSavingState !== props.sentencePosition
  )
    return;

  switch (type) {
    case 'saved': {
      state.disableSaveBtn = true;
      state.saveButtonStatus = 'Saved';

      state.unSavedChanges = false;
      state.unSaveContent = '';
      /**
       * Sets new content to the segment after the
       * editor is closed.
       * This allows the new content to be shown until page refresh or api call
       * to fetch new data.
       */

      const slotEl = getSlotElement();

      if (slotEl) {
        slotEl.innerHTML = state.savedHTML;
      }
      break;
    }

    case 'saving':
      state.disableSaveBtn = true;
      state.saveButtonStatus = 'Saving...';

      break;

    case 'save':
      state.disableSaveBtn = false;
      state.saveButtonStatus = 'Save';

      break;

    default:
      break;
  }
};

// Updating the status of the button.
const updateDoneButtonStatus = (isLoading) => {
  emits('update-voting-status', isLoading);
};

const isSaveDisabled = computed(() => {
  return state.disableSaveBtn;
});

const saveButtonStatus = computed(() => {
  return state.saveButtonStatus;
});

/**
 * This function is exectued when any error occurs during translation.
 */
const errorChange = () => {
  updateSaveButtonStatus('save');
};

const getSlotElement = () => {
  return root.value.querySelector('#slot').children[0];
};

/**
 * A method that is called when the user clicks the "Done" button.
 */
const finishTranslation = () => {
  emits('complete-translation');
};

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('mousedown', (e) => {
      _closeEditor(e);
    });
  }
});

watch(
  () => [
    getSuccessStatus.value,
    props.showDoneAction,
    state.autoSwitchTrigger,
    state.unSaveContent,
  ],
  (value) => {
    if (
      value[0] &&
      value[1] &&
      value[2] &&
      !value[3] &&
      (priorSegment.value || isLastSegment.value)
    ) {
      markTranslationDoneOnSegmentSwitch();
      state.autoSwitchTrigger = false;
    }
  }
);

/**
 * This watcher watches on the success value change
 * and triggers the updateSaveButtonStatus function if the currValue is true
 * currValue ==> new value
 * @param {boolean} currValue
 */
watch(
  () => getSuccessStatus.value,
  (currValue) => {
    if (currValue) {
      if (state.unSaveContent) {
        updateSaveButtonStatus('saved');
        state.sentenceInSavingState = null;
        /**
         * The following if logic handles the autosaving of content if the user
         * clicks outside the text editor
         */
        if (state.autoSaveContent) {
          closeSegment();
          state.autoSaveContent = false;
        }
        /**
         * The following logic handles the marking of translation to translation done after
         * saving the content if the shortcut CTRL+SHIFT+S is used.
         */
        if (state.markTranslationDone) {
          setTimeout(() => {
            finishTranslation();
            state.markTranslationDone = false;
          }, 200);
        }
      } else {
        updateDoneButtonStatus(false);
        if (!events?.value?.translatorRevoked) {
          closeSegment();
        }
      }
    }
  }
);

/**
 * This watcher watches on the error value change
 * and triggers the errorChange function if the currValue is true
 * currValue ==> new value
 * @param {boolean} currValue
 */
watch(
  () => getErrorStatus.value,
  (currValue) => {
    if (currValue) {
      if (state.unSavedChanges) {
        errorChange();
      } else {
        updateDoneButtonStatus(false);
      }
    }
  }
);

watch(
  () => currentSegment.value,
  (value) => {
    if (value?.id === props.segment?.id) {
      if (props.multipleSentences) {
        translationStore.setCurrentSentence(
          currentSentence.value ?? `editor-${props.segment?.id}-0`
        );
      } else {
        translationStore.setCurrentSentence(`editor-${props.segment?.id}`);
      }
    }
  },
  {
    deep: true,
  }
);
</script>

<template>
  <div>
    <section
      :id="'editor-' + segment.id"
      ref="root"
      :data-position="dynamicSentencePosition"
      :data-index="sentencePosition"
      class="editor-wrapper"
      :class="{ 'is-current-sentence': isCurrentSentence }"
    >
      <div
        v-show="!state.showEditor"
        id="slot"
        :class="{ 'height-fit': showPlaceholder }"
        :style="{ position: showPlaceholder ? 'absolute' : 'unset' }"
        @click.prevent="handleEditor"
      >
        <slot></slot>
      </div>
      <div
        v-if="showPlaceholder"
        id="placeholder"
        @click.prevent="handleEditor"
      >
        <span class="placeholderText">{{ placeholderText }}</span>
        {{ placeholder }}
      </div>

      <div
        v-show="state.showEditor"
        id="editor"
        :class="{ 'rtl-translation': righToLeftTyping }"
      ></div>
      <button
        v-if="canSaveContent"
        id="saveStatus"
        class="save-icon-btn-container"
        :class="{
          'saving-done': saveButtonStatus === 'Saved',
        }"
        :disabled="isSaveDisabled"
        @click="saveChanges"
      >
        <template v-if="saveButtonStatus === 'Saved'">
          <img class="img-draft-icon" :src="draftImage" />
        </template>
        <template v-if="saveButtonStatus === 'Save'">
          <i class="u-icon">check</i>
        </template>
        <div v-if="saveButtonStatus === 'Saving...'" class="spinner-container">
          <div class="c-spinner c-spinner--ultrasmall"></div>
        </div>
      </button>
    </section>
  </div>
</template>

<style lang="scss">
#svg_image {
  pointer-events: none;
}

#svg_image svg {
  width: 15px;
}

.undo_redo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pell {
  border: 1px solid rgba(10, 10, 10, 0.1);
  box-sizing: border-box;
}

.pell-content {
  box-sizing: border-box;
  outline: 0;
  overflow-y: auto;
  color: black !important;
  line-height: 1.5;
  padding: 10px;
}

.pell-content * {
  margin: 0 !important;
}

#slot {
  height: 100%;
  width: 90%;
  cursor: pointer;
}

.height-fit {
  height: fit-content !important;
}

[title='Save'],
[title='Saving...'],
[title='Saved'],
[title='Done'] {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

[title='Save'],
[title='Saving...'],
[title='Saved'] {
  right: 30px;
  border: 1px solid #cad1d8 !important;
  width: 63px !important;
  border-radius: 4px !important;
  font-size: 14px;
  background-color: #f5f7fa !important;
  height: 25px !important;
}

[title='Done'] {
  right: 100px;
  border: 1px solid #cad1d8 !important;
  width: fit-content !important;
  border-radius: 4px !important;
  font-size: 14px;
  background-color: #f5f7fa !important;
  height: 25px !important;
}

#cancelStatus svg {
  width: 20px;
}

[title='Close'] {
  position: absolute;
  right: 0px;
}

.pell-actionbar {
  background-color: #fff;
  align-items: center;
  border-bottom: 1px solid rgba(10, 10, 10, 0.1);
}

.pell-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  height: 30px;
  outline: 0;
  width: 30px;
  vertical-align: bottom;
}

.pell-button-selected {
  background-color: #f0f0f0;
}

p {
  margin: 0px;
}

#placeholder {
  background: #cad1d8;
  color: transparent;
  display: inline;
  line-height: 1.3;
  cursor: pointer;
  border-radius: 5px;
  padding: 5px;
  width: 90%;
}

.--single-panel {
  .c-translation__text {
    .c-translation__editor {
      .editor-wrapper {
        #slot {
          width: 100% !important;
        }
        #placeholder {
          width: 100%;
        }
      }
    }
  }
}

.placeholderText {
  color: black;
  position: absolute;
}

.rtl-translation > .pell-content {
  text-align: right;
}

.editor-menubar {
  display: flex;
  align-items: center;
  padding: 0 0;
  border-bottom: 1px solid hsla(0, 0%, 4%, 0.1);
}

.ProseMirror {
  padding: 10px;
  background: white;
  border-radius: 4px;
}

.save-btn {
  position: absolute;
  right: 15px;
  bottom: 10px;
}

.save-icon-btn-container {
  // position: absolute;
  // bottom: 0;
  // right: 15px;
  border: 2px solid #31bf60;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    opacity: 0.3;
  }
}
.saving-done {
  border: 1px solid $c-yellow-5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 20px;
  color: black;

  cursor: not-allowed;
  &:disabled {
    opacity: 0.6;
  }
  .u-icon {
    color: white;
  }
  .img-draft-icon {
    width: 16px;
    height: 16px;
  }
}

#editor {
  width: 90%;
}

.editor-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.spinner-container {
  height: 24px;
  width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  .c-spinner--ultrasmall {
    height: 10px;
    width: 10px;
    border-width: 2px;
  }
}
</style>
