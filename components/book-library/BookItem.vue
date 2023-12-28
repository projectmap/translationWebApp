<script setup>
import get from 'lodash/get';

import { userAlertStore } from '~/store';
import { storeAPI } from '~/helpers/apiCore';
import Book from '~/components/project-list/project/Book.vue';

const props = defineProps({
  book: { type: Object, default: () => {} },
  layout: { type: String, default: 'compact' },
  availableBooks: { type: Array, default: () => [] },
  inDownloads: { type: Boolean, default: false },
});

const emit = defineEmits([
  'start-progress-updates',
  'get-book-in-download-process',
  'update-downloads-data',
]);

const router = useRouter();

const runTimeConfig = useRuntimeConfig();
const { egwApi } = runTimeConfig.public;

const alertStore = userAlertStore();

const state = reactive({
  downloading: false,
});

const egwBookNumber = (project) => {
  if (project?.link) {
    return parseInt(get(project, 'link'));
  } else {
    return parseInt(get(project, 'key'));
  }
};

const isBookAvailable = computed(() => {
  if (props.inDownloads) {
    return props.book?.available;
  }
  return props.availableBooks.some(
    (availableBook) =>
      availableBook?.title.toLowerCase() === props.book?.title.toLowerCase()
  );
});

const isDownloading = computed(() => {
  return state.downloading || props.book?.progress < 100;
});

const downloadBook = async () => {
  const bookAbbr = props.book?.abbreviations[0];
  const bookFormat = 'paragraph';
  state.downloading = true;

  const res = await storeAPI('book/download/', {
    abb: bookAbbr,
    format: bookFormat,
  });

  if (res?.statusCode === 200) {
    alertStore.new({
      message: res?.message,
      color: 'green',
      duration: 2000,
    });

    emit('start-progress-updates');

    emit('update-downloads-data', props.book);
  }

  state.downloading = false;
};

const translateBook = () => {
  const bookType = props.book?.type;
  const bookAbbr = props.book?.abbreviation;
  router.push(`/new-project?type=${bookType}&abbr=${bookAbbr}`);
};
</script>

<template>
  <div class="library__item" :class="layout">
    <book :number="egwBookNumber(book)" :egw-api="egwApi" :tooltip="false" />

    <h5 v-if="layout === 'detail'" class="u-truncate">{{ book.title }}</h5>

    <button
      v-if="isBookAvailable"
      class="c-btn c-btn--ghost c-btn--primary translate-btn c-btn-- o-flex o-flex--center"
      @click.prevent="translateBook"
    >
      Translate <i class="u-icon">translate</i>
    </button>

    <template v-else>
      <div v-if="layout === 'detail' && isDownloading" class="progres-wrapper">
        <span v-if="book.progress < 0"> Downloading </span>
        <div v-if="book.progress > -1" class="progress-percentage">
          {{ parseInt(book.progress) }}%
        </div>
        <div v-if="book.progress > -1" class="progress-bar">
          <div
            class="progress"
            :style="{ width: `${parseInt(book.progress)}%` }"
          ></div>
        </div>
      </div>

      <button
        v-else
        class="c-btn c-btn--ghost c-btn--primary c-btn-- translate-btn o-flex o-flex--center"
        @click.prevent="downloadBook"
      >
        <span
          v-if="isDownloading"
          class="o-flex o-flex--middle o-flex--center downloading-status"
        >
          Downloading
          <span v-if="book.progress > -1" class="progress-count"
            >{{ parseInt(book.progress) }}%</span
          >
        </span>

        <span v-else>
          Download
          <i class="u-icon">file_download</i>
        </span>
      </button>
    </template>
  </div>
</template>

<style lang="scss">
.library__item {
  &.compact {
    width: 150px;
    height: fit-content;
    margin-right: 35px;
    margin-bottom: 30px;
    // background: white;
    .c-book {
      height: fit-content;
      --width: 150px;
      .c-book__cover {
        width: 100% !important;
      }
    }

    h5 {
      margin-top: 10px;
    }

    .translate-btn {
      width: 100%;
      margin-top: 10px;
      min-height: 30px;

      .downloading-status {
        font-size: 14px;
        display: flex;

        .progress-count {
          margin-left: auto;
        }
      }
    }
  }

  &.detail {
    width: 100%;
    height: 95px;
    display: flex;
    align-items: center;
    box-shadow: 0px 2px 10px 0px #00000014;
    margin-bottom: 20px;
    padding: 16px;
    background: white;
    border-radius: 5px;

    .c-book {
      width: fit-content;
    }

    h5 {
      margin-bottom: 0px;
      margin-left: 15px;
      width: 50%;
    }
    .translate-btn {
      margin-left: auto;
    }

    .progres-wrapper {
      margin: 0 0 0 auto;
      text-align: right;
    }

    /* Style for the progress bar container */
    .progress-bar {
      background-color: #ddd;
      height: 8px;
      border-radius: 5px;
      overflow: hidden;
      width: 250px;
    }

    /* Style for the progress bar itself */
    .progress {
      background-color: $c-primary-5;
      height: 100%;
      color: #fff;
      text-align: center;
      line-height: 15px;
    }
  }

  .translate-btn {
    .c-spinner {
      width: 15px;
      height: 15px;
      border-width: 2px;
      margin: 0;
    }
  }
}
</style>
