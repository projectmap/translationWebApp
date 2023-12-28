<template>
  <div class="c-project" :class="rootClass">
    <div class="c-project__main">
      <nuxt-link
        v-if="!isDummy && !isPlaceholder"
        :to="!isArchived && bookUrl(1)"
        class="c-project__link"
        @click="selectTranslation(item)"
      ></nuxt-link>

      <div class="c-project__book">
        <book
          :size="isCompact ? 'small' : 'default'"
          :appearance="isDummy ? 'dummy' : ''"
          :number="egwBookNumber"
          :egw-api="egwApi"
          :dummy="isDummy"
        />
      </div>

      <div class="o-flex o-flex--middle c-project__flex">
        <!-- Title and Author -->
        <div class="c-project__head">
          <h3
            class="c-project__title u-truncate"
            :class="{ 'u-blind-text is-loading': isDummy }"
          >
            {{ !isDummy ? item.title : 'Lorem Ipsum Dolor' }}
          </h3>

          <div
            v-if="item.divisionObj || item.unionObj || item.publishingHouseObj"
            class="c-project__admins"
            :class="{ 'u-blind-text is-loading': isDummy }"
          >
            <div v-if="item.divisionObj">
              <span class="level">Division</span>
              <span class="title">{{ item.divisionObj.domain }}</span>
            </div>
            <div v-if="item.unionObj">
              <span class="level">Union</span>
              <span class="title">{{ item.unionObj.domain }}</span>
            </div>
            <div v-if="item.publishingHouseObj">
              <span class="level">Publisher</span>
              <span class="title">{{ item.publishingHouseObj.domain }}</span>
            </div>
          </div>

          <div
            v-else
            class="c-project__author"
            :class="{ 'u-blind-text is-loading': isDummy }"
          >
            {{ !isDummy ? item.author : 'Lorem Ipsum' }}
            <small v-if="hasCopyright" class="u-green u-ml--">
              <i class="u-icon">copyright</i> White Estate
            </small>
          </div>
        </div>
        <!-- Language -->
        <language
          v-if="language"
          class="u-shrink0 u-relative u-z10 u-mr"
          :language="language"
        />
        <!-- Badges -->
        <div v-if="!isCompact" class="o-flex__item u-relative u-z10 u-mr-">
          <u-tooltip
            v-if="exists && hasCopyright"
            class="u-ml--"
            text="This book has a finished translation. Feel free to edit it if you find errors or have improvements."
          >
            <span class="c-badge c-badge--green c-badge--soft">
              <i class="u-icon">check</i>
            </span>
          </u-tooltip>
          <u-tooltip
            v-else-if="exists"
            class="u-ml--"
            :text="`We know this book exists in ${languageName} and we are working to secure the copyrights. Please get in touch if you can help us.`"
          >
            <span class="c-badge c-badge--blue c-badge--soft">
              <i class="u-icon">copyright</i>
            </span>
          </u-tooltip>
        </div>

        <!-- Priority -->
        <div class="u-relative u-z10 u-mr-">
          <u-tooltip
            v-if="isPriority"
            text="It is currently our priority to finish the translation of this book"
            display="block"
          >
            <badge color="green" circle size="---">
              <i class="u-icon">priority_high</i>
            </badge>
          </u-tooltip>
        </div>

        <!-- Tags and Progress -->
        <div class="c-project__meta">
          <div class="c-project__meta-inner">
            <div v-if="tags.length" class="c-project__tags u-truncate">
              <i class="u-icon">label</i>
              <span v-for="(tag, i) in tags" :key="i" class="c-project__tag">
                {{ tag }}
              </span>
            </div>
            <div
              v-if="item.roleCounts"
              class="c-project__contrib u-bold o-flex o-flex--middle"
              @click="handleShowExtrainfoPopup"
            >
              <span>
                {{
                  singularPlural(
                    item.roleCounts.workerCount,
                    'Contributor',
                    'Contributors'
                  )
                }}
              </span>

              <div class="stats-extra-info-btns o-flex o-flex--middle">
                <div
                  v-if="item.downloadedObj?.length"
                  class="chapter-extra-info-btn"
                >
                  <span class="u-icon info-icon"> info</span>

                  <div
                    v-if="showExtraInfoPopUp"
                    class="chapter-extra-info-popup hide-scroll-bar"
                  >
                    <h6 class="extra-info-heading">
                      Users who have downloaded this book
                    </h6>
                    <div v-for="(item, idx) in item.downloadedObj" :key="idx">
                      <div class="extra-info-item">
                        <h6 class="extra-info-title">
                          {{ idx + 1 + '. ' }}{{ item.username }}
                        </h6>
                        <p class="extra-info-chapter-name">
                          {{ item.chapterName }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ctooltip :show="item.statistics && !showExtraInfoPopUp">
                <stats v-if="item.statistics" :stats="item.statistics"
                  ><slot
                /></stats>
                <span v-else>Statistics are not available</span>
              </ctooltip>
            </div>
          </div>

          <div class="c-project__stats">
            <progress-component :stats="item.statistics" :tooltip="!isDummy" />
          </div>
        </div>

        <button
          v-if="isArchived"
          class="c-project__btn c-btn c-btn- c-btn--light c-btn--dark c-btn--primary c-btn--restore"
          title="Restore Book"
          @click.prevent="handleTranslationRestore"
        >
          <i class="u-icon">restore</i> Restore
        </button>
        <button
          v-else-if="canSubmitForApproval"
          class="c-project__btn c-btn c-btn- c-btn--light c-btn--dark c-btn--primary"
          title="Send Book For Approval"
          @click.prevent="openApprovalModal"
        >
          Submit
        </button>
        <div v-else style="margin-left: auto" class="o-flex">
          <span
            v-if="!isPlaceholder && !isDummy && canTranslate"
            class="o-flex"
          >
            <button
              v-if="isOnline && canDownloadChapters"
              class="c-project__btn c-btn c-btn- c-btn--light c-btn--dark c-btn--primary"
              style="margin-right: 10px"
              @click="toggleDownloadModal(item)"
            >
              <span v-if="layout === 'detail'">
                Download <i class="u-icon">file_download</i>
              </span>
              <span v-else>
                <i class="u-icon">file_download</i>
              </span>
            </button>
            <nuxt-link
              class="c-project__btn c-btn c-btn- c-btn--light c-btn--dark c-btn--primary"
              :to="bookUrl(1)"
              @click="$emit('select-translation', item)"
            >
              <span v-if="layout === 'detail'">
                Translate
                <i class="u-icon u-icon--move">keyboard_arrow_right</i>
              </span>
              <span v-else>
                <i class="u-icon">edit</i>
              </span>
            </nuxt-link>
          </span>

          <div v-else-if="inApprovalProcess" class="c-project__btn">
            <i class="u-icon u-icon--green">check</i>In Approval
          </div>

          <div v-else-if="approvalComplete" class="c-project__btn">
            <i class="u-icon u-icon--green">check</i> Approved
          </div>

          <div v-else class="c-project__btn"></div>

          <button
            v-if="inApprovalProcess || approvalComplete"
            class="c-project__btn c-btn c-btn- c-btn--light c-btn--dark c-btn--primary"
            @click.stop="goToTimeline"
          >
            Timeline

            <i class="u-icon u-icon--move">keyboard_arrow_right</i>
          </button>
        </div>
      </div>
      <div
        v-if="!isCompact && !hideChapters && !isPlaceholder && !isDummy"
        class="c-project__expand"
      >
        <button
          class="c-btn c-btn--expand"
          :class="{ 'c-btn--minimal': !expanded }"
          @click="expandProjectContent"
        >
          <i v-if="expanded" class="u-icon">keyboard_arrow_up</i>
          <i v-else class="u-icon">keyboard_arrow_down</i>
        </button>
      </div>
    </div>
    <!-- Chapter Slideout -->
    <div v-if="!hideChapters" v-show="expanded" class="c-project__slideout">
      <ul class="c-project__chapters">
        <li v-if="chaptersPending" class="o-flex o-flex--center">
          <div class="c-spinner c-spinner--small"></div>
        </li>
        <li v-for="entry in chapterList" v-else :key="entry.position">
          <chapter-heading
            v-if="entry.number"
            :item="entry"
            :url="bookUrl(entry.number, 'dropdown-chapter-url')"
          />
          <section-heading v-else :item="entry" />
        </li>
      </ul>

      <div class="u-text-center">
        <button class="c-btn c-btn--collapse" @click="expanded = false">
          <i class="u-icon">keyboard_arrow_up</i>
        </button>
      </div>
    </div>

    <div
      v-if="showExtraInfoPopUp"
      class="backdrop-for-popup"
      @click="handleShowExtrainfoPopup"
    ></div>
  </div>
</template>

<script setup>
import get from 'lodash/get';
import without from 'lodash/without';
import isEmpty from 'lodash/isEmpty';

// NOTE: MIGHT NEED THIS FOR LATER USE
import { storeToRefs } from 'pinia';
import ChapterHeading from './ChapterHeading';
import SectionHeading from './SectionHeading';
import Book from './Book';
import { useAuthStore, useTranslationStore, useUserStore } from '~/store';
import { singularPlural } from '~/helpers/Util';
import Badge from '~/components/structure/Badge';
import uTooltip from '~/components/utilities/Tooltip';
import ProgressComponent from '~/components/utilities/Progress';
import Ctooltip from '~/components/utilities/Ctooltip.vue';
import Stats from '~/components/utilities/Stats.vue';

const runtimeConfig = useRuntimeConfig();
const { egwApi } = runtimeConfig.public;

const props = defineProps({
  item: {
    type: Object,
    default: () => ({
      title: 'Tile placeholder',
      author: 'author',
      language: { code: '', name: 'Loading ...' },
      tags: [],
      tableOfContents: [],
      stats: null,
      dummy: true,
    }),
  },
  layout: { type: String, default: 'detail' }, // detail | compact
  hideChapters: Boolean,
  offlineRecentWork: { type: Object, default: () => ({}) },
  offlineBook: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  'open-modal',
  'select-translation',
  'open-restore-modal',
  'toggle-download-modal',
]);

const router = useRouter();

const userStore = useUserStore();
const { userDownloadInfo } = storeToRefs(userStore);

const translationStore = useTranslationStore();
const { chaptersPending } = storeToRefs(translationStore);

const authStore = useAuthStore();
const { isOnline } = storeToRefs(authStore);

const expanded = ref(false);

const rootClass = computed(() => {
  return [
    `c-project--${props.layout}`,
    {
      'is-dummy': isDummy.value,
      'is-placeholder': isPlaceholder.value,
      'is-collapsed': !expanded.value,
      'is-expanded': expanded.value,
      'is-priority': isPriority.value,
    },
  ];
});

const tags = computed(() => {
  return without(
    get(props.item, 'tags', []),
    'priority',
    'exists',
    'copyright'
  );
});

const egwBookNumber = computed(() => {
  return parseInt(get(props.item, 'original.key'));
});

const language = computed(() => {
  return get(props.item, 'language');
});
const languageName = computed(() => {
  return get(props.item, 'languageObj.name');
});
const isDummy = computed(() => {
  return get(props.item, 'dummy', false);
});
const isPlaceholder = computed(() => {
  return get(props.item, 'protected', false);
});
const isPriority = computed(() => {
  return get(props.item, 'tags', []).includes('priority');
});
const isCompact = computed(() => {
  return props.layout === 'compact';
});
const exists = computed(() => {
  return get(props.item, 'tags', []).includes('exists');
});
const hasCopyright = computed(() => {
  return get(props.item, 'tags', []).includes('copyright');
});
const canSubmitForApproval = computed(() => {
  const isEditor = userStore
    .userRoleByWorkId(props.item?.id)
    .includes('editor');

  return Boolean(isEditor && props.item.bookProgress === 1);
});
const canTranslate = computed(() => {
  return props.item.bookProgress === 0;
});
const inApprovalProcess = computed(() => {
  return (
    (props.item.bookProgress > 1 && props.item.bookProgress < 11) ||
    props.item.bookProgress === 1
  );
});
const approvalComplete = computed(() => {
  return props.item.bookProgress === 11;
});

const chapterList = ref(null);

const isArchived = computed(() => {
  return props.item.archive;
});

const goToTimeline = (e) => {
  e.stopPropagation();
  const url = bookUrl(1, 'timelineUrl');
  router.push(url);
};

const bookUrl = (chapterNumber, type = 'chapterUrl') => {
  let lang = null;
  let abbr = null;
  if (isOnline.value) {
    lang = get(props.item, 'language', '');
    abbr = get(props.item, 'abbreviation', '').toLowerCase();

    switch (type) {
      case 'timelineUrl': {
        return `/translate/${lang}/${abbr}/timeline/`;
      }

      case 'dropdown-chapter-url': {
        if (!chapterNumber) return '';
        return `/translate/${lang}/${abbr}/chapter/${chapterNumber}/`;
      }

      default: {
        if (props.item?.recentChapter?.chapter) {
          const chapter = props.item?.recentChapter?.chapter;
          return `/translate/${lang}/${abbr}/chapter/${chapter}/`;
        } else {
          if (!chapterNumber) return '';
          return `/translate/${lang}/${abbr}/chapter/${chapterNumber}/`;
        }
      }
    }
  } else {
    let chapterNum = null;
    abbr = props.offlineBook?.abbreviation?.toLowerCase();
    lang = props.offlineBook?.language?.code?.toLowerCase();

    if (!isEmpty(props.offlineRecentWork)) {
      chapterNum = props.offlineRecentWork?.chapter;
    } else {
      if (isEmpty(userDownloadInfo.value.chapters)) return;

      chapterNum =
        userDownloadInfo.value.chapters[
          userDownloadInfo.value.chapters?.length - 1
        ];
    }

    return `/translate/${lang}/${abbr}/chapter/${chapterNum}/`;
  }
};
const openApprovalModal = (e) => {
  e.stopPropagation();
  emit('open-modal');
  emit('select-translation', props.item);
};

const expandProjectContent = async () => {
  expanded.value = !expanded.value;

  if (expanded.value) {
    const data = await translationStore.fetchALLTableOfContents(props.item?.id);

    if (isOnline.value) {
      chapterList.value = data;
    } else {
      const onlyDownload = data.filter((al) =>
        userDownloadInfo.value.chapters.includes(al.number)
      );

      chapterList.value = onlyDownload;
    }
  }
};

const selectTranslation = (translation) => {
  if (!isArchived.value) {
    emit('select-translation', translation);
  }
};

const handleTranslationRestore = () => {
  emit('open-restore-modal');
  emit('select-translation', props.item);
};

const toggleDownloadModal = (translation) => {
  emit('toggle-download-modal');
  emit('select-translation', translation);
};

const canDownloadChapters = computed(() => props?.item?.canDownload);

const showExtraInfoPopUp = ref(false);
const handleShowExtrainfoPopup = (e) => {
  e.stopPropagation();
  e.preventDefault();
  showExtraInfoPopUp.value = !showExtraInfoPopUp.value;
};
</script>

<style lang="scss" scoped>
/*
 * 1. 'min-with' is crucial for flexbox to actually truncate the tags
 */

.c-project {
  border-radius: $global-radius;
  background-color: $c-gray-2;
}

.c-project__main,
.c-project__slideout {
  border-radius: $global-radius;
}

.c-project__main {
  position: relative;
  display: flex;
  align-items: center;
  padding: $unit;
  padding-left: $unit - 3px;
  background-color: $c-white;

  .is-placeholder & {
    background-color: $c-gray-2;
  }

  .c-project--compact & {
    padding: $unit-3 $unit-3 $unit-3 $unit-5;
  }

  .is-expanded & {
    border-bottom: 1px solid $c-border;
  }
}

/* Level 2 */

.c-project__link {
  display: block;
  position: absolute;
  z-index: 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.c-project__badges,
.c-project__btn,
.c-project__expand,
.c-project__slideout {
  position: relative;
  z-index: 1;
}

.c-project__book {
  margin-right: $unit;
  flex-shrink: 0;
}

.c-project__flex {
  flex-grow: 1;
  white-space: nowrap;
  flex-wrap: wrap;
  min-width: 0; /* 1 */

  .c-project--compact & {
    @include mq($from: tablet) {
      flex-wrap: nowrap;
    }
  }
}

.c-btn--expand,
.c-btn--collapse {
  border-radius: $global-radius $global-radius 0 0;
  padding: 0 $unit;
  height: $unit;
  line-height: 0;

  // .is-expanded & {
  //   opacity: 1;
  // }
}

.c-btn--expand {
  border: 1px solid transparent;
  border-bottom-width: 0;

  .c-project:not(:hover) {
    background-color: transparent;
  }

  // .c-project:hover & {
  //   // background-color: inherit;
  // }

  .is-expanded & {
    border-color: $c-border;
    box-shadow: 0 1px 0 $c-gray-2;
  }
}

.c-project__expand {
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
  margin-left: -$unit;

  // .c-btn {
  //   border: 1px solid transparent;
  //   border-bottom-width: 0;
  // }

  // .c-project:hover & .c-btn {
  //   background-color: $c-gray-2;
  //   border-color: $c-border;
  // }

  // .is-expanded & .c-btn.c-btn {
  //   background-color: $c-gray-2;
  //   border-color: $c-border;
  //   box-shadow: 0 1px 0 $c-gray-2;
  // }
}

/* Level 3 */

.c-project__head {
  flex-grow: 2;
  flex-shrink: 1;
  margin-right: $unit;
  text-align: left;

  .c-project--detail & {
    max-width: calc(100% - #{$unit * 14});
  }
}

.c-project__badges {
  flex-shrink: 0;
  margin-right: $unit;
}

.c-project__badges {
  @include font-size($font-size-tiny, 1);
  flex-grow: 1;
  text-align: right;
}

.c-project__meta {
  flex: 0 0 100%;
  margin: $unit-4 0 0;
  order: 99;
  position: relative;
  margin-top: 25px;
  .c-project--compact & {
    @include mq($from: tablet) {
      flex: 0 0 40%;
      min-width: $unit * 5; /* 1 */
      margin: 0;
      margin-right: $unit-small;
      order: initial;
    }
  }
}

.c-project__btn {
  flex-shrink: 0;
  min-width: $unit-6;

  display: flex;
  align-items: center;
  padding: 0 10px;
  height: 35px;
  width: fit-content;
  font-size: 14px;
  margin-left: auto;
  .c-project--default & {
    opacity: 0;
    transition: opacity $global-transition;
    align-self: flex-start;
  }

  .c-project--default:hover & {
    opacity: 1;
  }
}

/* Level 4 */

.c-project__title {
  @include font-size($font-size-large, 1.2);
  font-weight: bold;
  margin-bottom: $unit-0;
  max-width: 250px;
  .c-project--compact & {
    @include font-size($font-size, 1.2);
  }
}

.c-project__author {
  @include font-size($font-size-small, 1);
  color: $c-muted;

  .c-project--compact & {
    @include font-size($font-size-tiny, 1);
  }
}

.c-project__admins {
  color: $c-muted;
  display: flex;
  margin-top: 10px;
  div {
    display: flex;
    flex-direction: column;
    margin-right: 18px;

    .level {
      @include font-size($font-size-tinier, 1);
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 4px;
      letter-spacing: 0.035em;
      color: rgba(39, 39, 39, 0.52);
    }
    .title {
      @include font-size($font-size-tiny, 1);
      font-weight: 400;
      letter-spacing: 0.0025em;
      color: rgba(39, 39, 39, 0.8);
    }
  }
}
.c-project__meta-inner {
  @include font-size($font-size-tiny, 1.3);
  color: $c-muted;
  margin-bottom: $unit-0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  > :only-child {
    margin-left: auto;
  }
}

.c-project__tags {
  flex-shrink: 1;
  min-width: 0;
}

.c-project__contrib {
  flex-shrink: 0;
  position: absolute;
  right: 0;
  cursor: pointer;
}

.c-project__tag:not(:last-child)::after {
  content: ', ';
}

.c-project__stats {
  @include font-size($font-size-tiny, 1);
  position: relative;
  margin-bottom: $unit-0;
}

/* Slideout */

.c-project__h4 {
  @include font-size($font-size, 1);
  color: $c-muted;
  padding: $unit $unit $unit-small $unit * 2;
  font-weight: bold;
}

.c-project__chapters {
  list-style: none;
  margin: $unit 0 0;
  padding: 0;
}

.u-icon--green {
  margin-right: 2px;
}

.c-btn--restore {
  i {
    margin-right: 5px;
  }
}

.chapter-extra-info-btn {
  position: relative;
  background: white;
  cursor: pointer;

  .info-icon {
    font-size: 15px;
  }
  .chapter-stats-info-popup {
    position: absolute;
    top: 0;
    left: 0;
    width: fit-content;
    height: fit-content;
    background: white;
    filter: drop-shadow(0px 10px 40px rgba(13, 24, 41, 0.1));
  }

  .chapter-extra-info-popup {
    position: absolute;
    top: 28px;
    right: 0;
    width: 340px;
    overflow-x: scroll;
    background: white;
    box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    z-index: 99999;
    min-height: fit-content;
    max-height: 200px;
    border: 1px solid rgba(0, 0, 0, 0.1);

    .extra-info-item {
      padding: 8px 16px;
      border-bottom: 2px solid rgba(223, 227, 229, 0.6);
    }
    .extra-info-heading {
      position: sticky;
      top: 0;
      background-color: white;
      color: rgba(39, 39, 39, 0.52);
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 21px;
      letter-spacing: 0.035px;
      margin-bottom: 0px;
      padding: 16px 16px 12px 16px;
      border-bottom: 2px solid rgba(223, 227, 229, 0.6);
    }
    .extra-info-title {
      margin-bottom: 8px;
      color: #272727;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 21px;
      letter-spacing: 0.035px;
    }
  }
}

.stats-extra-info-btns {
  background: white;
  position: relative;
  margin-left: 10px;
}
.extra-info-chapter-name {
  margin: 0 0 4px 8px;
  color: rgba(39, 39, 39, 0.86);
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%; /* 16.5px */
  letter-spacing: 0.028px;
  word-break: break-all;
  white-space: normal;
}

.extra-info-icon {
  cursor: pointer;
}
.backdrop-for-popup {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 99998;
  left: 0;
  top: 0;
}
</style>
