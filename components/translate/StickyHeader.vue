<script setup>
import get from 'lodash/get';

import Navigation from './Navigation.vue';
import EditorToolbar from '~/components/editor/toolbar/EditorToolbar.vue';
import ProgressComp from '~/components/utilities/Progress';
import { striptags } from '~/plugins/filters';

const props = defineProps({
  translation: { type: Object, default: null },
  chapter: { type: Object, default: null },
  segment: { type: Object, default: null },
  contentWidth: { type: String, default: null },
});

const emits = defineEmits(['patch-stats']);

const targetLanguage = computed(() => {
  return get(props.translation, 'languageObj.name', '&mdash;');
});

const stripContent = computed(() => {
  return striptags(props.chapter?.content || '[Unknown]');
});

const patchChapterStats = (data) => {
  emits('patch-stats', data, 'chapter');
};

/**
 * Checks if the current chapter is downloaded by another user or not
 */
const isChapterAlreadyDownloaded = computed(() => {
  return props.chapter?.downloaded && !props.chapter?.currentUser;
});
</script>

<template>
  <div class="sticky-header">
    <div class="sticky-header__section--upper">
      <div class="head__nav">
        <navigation
          :chapter="chapter"
          :translation="translation"
          dropdown
          labels
          :label-width-not-half="true"
          @patch-chapter-stats="patchChapterStats"
        />
      </div>

      <div class="c-head__progress">
        <progress-comp :stats="chapter" tooltip edgy wide>
          <span v-if="chapter">
            Statistics about
            <strong>{{ stripContent }}</strong>
          </span>
        </progress-comp>
      </div>
    </div>

    <div class="sticky-header__section--lower" :style="{ width: contentWidth }">
      <header ref="headerRef" class="translator__main-header u-pv-">
        <template v-if="translation.workType === 'original'">
          <div class="o-flex w-100 o-flex--center">
            Work Language: <strong>English</strong>
          </div>
        </template>
        <template v-else>
          <div class="u-1/2">Original: <strong>English</strong></div>
          <div class="line-divider"></div>
          <div class="u-1/2">
            Translation: <strong>{{ targetLanguage }}</strong>
          </div>
        </template>
      </header>
      <div id="editor-toolbar" class="editor-menubar">
        <editor-toolbar
          :segment="segment"
          :content-type="translation.bookType"
        />
      </div>
      <div
        v-if="isChapterAlreadyDownloaded"
        class="warning-message o-flex o-flex--middle"
      >
        <div class="icon-display o-flex o-flex--middle">
          <i class="u-icon">warning</i>
        </div>
        <strong>Alert!</strong>Current chapter is downloaded by another user &
        translation is not available.
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 5;

  .sticky-header__section--upper {
    height: 56px;

    .head__nav {
      line-height: $line-height;
      border-top: 1px solid $c-border;
    }
  }

  .sticky-header__section--lower {
    border-right: 1px solid hsl(211, 16%, 82%);

    .translator__main-header {
      display: flex;
      color: $c-muted;
      text-align: center;
      border-bottom: 1px solid $c-border;
      background: white;
      height: 50px;

      strong {
        color: #0e6a8f;
      }
    }

    .editor-menubar {
      background: #ffff;
      box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
      height: 55px;
      position: relative;
    }

    .warning-message {
      box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
        rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
      width: fit-content;
      margin: 20px auto 0 auto;
      border-radius: 5px;
      padding-right: 10px;
      background: #fcfcfc;
      strong {
        margin-right: 5px;
        color: red;
      }
      .icon-display {
        padding: 0px 10px;
        background: red;
        color: white;
        font-size: 25px;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        min-height: 40px;
        margin-right: 10px;
      }
    }
  }
}
</style>
