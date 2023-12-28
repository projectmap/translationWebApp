<template>
  <div class="library">
    <div class="library__header">
      <h3>E4All Books Library</h3>
      <div class="library__header-actions">
        <!-- Search box -->

        <search
          class="o-flex__item u-shrink"
          :debounce="true"
          :interval="500"
          @submit="onUpdate($event)"
        />

        <!-- Import button -->
        <!-- NOTE: MIGHT NEED THIS FOR LATER USE IF BULK IMPORT IS ALLOWED -->
        <!-- <button class="c-btn c-btn--dark c-btn--primary c-btn-- c-btn--import">
          Import All
        </button> -->

        <!-- Layout toggle -->
        <layout-buttons
          class="o-flex__item u-shrink0 import-list-layout-btn"
          :layout="state.layout"
          page="library"
          @update:layout="updateLayout"
        />
      </div>
    </div>

    <div class="library__body">
      <!-- List of books -->
      <overlay-loader
        :active="state.isLoading"
        message="Fetching Books, Please Wait..."
      >
        <template v-if="!isEmpty(state.downloaded_books)">
          <h4>Downloads in progress</h4>
          <div class="library__list">
            <book-item
              v-for="book in state.downloaded_books"
              :key="book.link"
              :layout="state.layout"
              :book="book"
              :available-books="state.available_books"
              :in-downloads="true"
              @start-progress-updates="startProgressUpdates"
            />
          </div>
        </template>
        <h4>Available Books</h4>
        <div class="library__list">
          <template v-if="!isEmpty(state.sanitized_book)">
            <book-item
              v-for="book in state.sanitized_book"
              :key="book.link"
              :layout="state.layout"
              :book="book"
              :available-books="state.available_books"
              @start-progress-updates="startProgressUpdates"
              @get-book-in-download-process="getBookInDownloadProcess"
              @update-downloads-data="updateDownloadsData"
            />
          </template>

          <book-item
            v-for="book in state.available_books"
            v-else
            :key="book.key"
            :layout="state.layout"
            :book="book"
            :available-books="state.available_books"
          />
        </div>
      </overlay-loader>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import { useAuthStore } from '~/store';
import { fetchAPI } from '~/helpers/apiCore';
import Search from '~/components/project-list/Search.vue';
import OverlayLoader from '~/components/OverlayLoader.vue';
import BookItem from '~/components/book-library/BookItem.vue';
import LayoutButtons from '~/components/project-list/LayoutButtons.vue';

const state = reactive({
  egw_books: [],
  downloaded_books: [],
  available_books: [],
  sanitized_book: [],
  book_name: '',
  interval_id: null,
  layout: 'compact',
  isLoading: false,
});

const authStore = useAuthStore();
const { accessToken } = storeToRefs(authStore);

const runTimeConfig = useRuntimeConfig();
const { egwApi } = runTimeConfig.public;

const fetchEgwBooks = async () => {
  const token = accessToken.value;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  state.isLoading = true;

  const res = await fetch(`${egwApi}/content/books/abbreviations`, {
    method: 'GET',
    headers,
  });
  const data = await res.json();

  state.isLoading = false;

  state.egw_books = data.egw;
  return data.egw;
};

const fetchDownloadedBooks = async (status = 'available') => {
  const res = await fetchAPI(`book/progress/?status=${status}/`);
  return res.data.bookList;
};

const getAvailableBooks = async () => {
  const res = await fetchDownloadedBooks();

  if (!isEmpty(res)) {
    state.available_books = res?.filter((book) => book.available);
  }
};

const getBookInDownloadProcess = async () => {
  const res = await fetchDownloadedBooks('in_download');

  if (!isEmpty(res)) {
    state.downloaded_books = res?.filter((book) => book.progress < 100);
  }
};

const searchBooks = (value) => {
  const bookName = value.toLowerCase();
  let santized = [];

  if (bookName.length > 0) {
    const abbreviationArray = state.available_books.map(
      (item) => item.abbreviation
    );
    // remove books available in our system from the egw books array
    const downloadableEGWBooks = state.egw_books.filter(
      (item) => !abbreviationArray.includes(item.abbreviations[0])
    );

    const allBooks = [...state.available_books, ...downloadableEGWBooks];

    santized = allBooks.filter((val) =>
      val.title.toLowerCase().includes(bookName)
    );
  }

  state.sanitized_book = santized;
};

/**
 * Temporarily add the book to downloads array to show in UI with progress 0%
 * until new data is not updated from the Backend API.
 * @param {object} book
 */
const updateDownloadsData = (book) => {
  const bookToDownload = book;
  bookToDownload.progress = 0;
  state.downloaded_books.push(bookToDownload);

  state.sanitized_book = state.sanitized_book.filter(
    (val) => val.title.toLowerCase() !== bookToDownload?.title.toLowerCase()
  );
};

// Function to stop the progress updates
const stopProgressUpdates = () => {
  clearInterval(state.interval_id);
};

// Function to start the progress updates
const startProgressUpdates = () => {
  stopProgressUpdates();
  state.interval_id = setInterval(getBookInDownloadProcess, 5000); // Poll every 10 seconds
};

const updateLayout = (layout) => {
  state.layout = layout;
};

const onUpdate = (bookName) => {
  searchBooks(bookName);
};

onMounted(async () => {
  await fetchEgwBooks();
  await getAvailableBooks();
  await getBookInDownloadProcess();
});

onUnmounted(() => {
  stopProgressUpdates();
});

/** If the downloads array is empty, stop further updates and update the available
 * books list */
watch(
  () => state.downloaded_books,
  (newValue) => {
    if (isEmpty(newValue)) {
      stopProgressUpdates();
      getAvailableBooks();
    }
  }
);

/**
 * If there are books in downloads array but the interval id is missing then
 * restart the interval and set new id
 * USE CASE - This is generally needed when if the user refreshes the page or
 * moves to another page and comes back while books are in download.
 * Goal - When the page is revisited/refresed, if there are books in download then
 * reinitiate the interval to fetch the download progress in every 5 seconds
 */
watch(
  () => state.downloaded_books,
  (newValue) => {
    if (!isEmpty(newValue) && !state.interval_id) {
      startProgressUpdates();
    }
  }
);

/**
 * Update the downloads array which latest data, when there are more than 1 books
 * queued for download.
 */
watch(
  () => state.downloaded_books,
  (newValue, oldValue) => {
    if (newValue.length !== oldValue.length && !isEmpty(oldValue.length)) {
      getBookInDownloadProcess();
      getAvailableBooks();
    }
  }
);
</script>
<style lang="scss" scoped>
.library {
  padding: 50px;
  background: #f5f7fa;
  max-width: 1900px;
  margin: auto;
}

.library .library__header {
  .library__header-actions {
    display: flex;
    align-items: center;

    .c-btn--import {
      margin-left: auto;
      width: 118px;
      height: 39px;
      border-radius: 4px;
      margin-right: 20px;
    }

    .import-list-layout-btn {
      margin-left: auto;
    }
  }
}

.library .library__body {
  margin-top: 50px;
  .library__list {
    display: flex;
    flex-wrap: wrap;
    overflow: auto;
  }
}

.search-component {
  position: relative;

  .search-box {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border: 0.5px solid black;
    background: white;
    border: 1px solid hsl(211, 16%, 82%) !important;
    border-radius: 5px !important;
    width: 370px;
    .search-input {
      border: none !important;
      outline: none !important;
      padding: 0px !important;
    }
    .search-input::placeholder {
      color: #555;
    }

    .search-btn {
      background: transparent;
      border: 0;
      outline: 0;
    }
    .search-btn .u-icon {
      width: 25px;
      color: #555;
      font-size: 22px;
      cursor: pointer;
    }
  }
}

.result-box {
  position: absolute;
  border-top: 1px solid #999;
  padding: 15px 10px;
  height: 400px;
  overflow: scroll;
  overflow-x: hidden;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.125);
}
.result-box ul li {
  list-style: none;
  border-radius: 3px;
  padding: 15px 10px;
  cursor: pointer;
}
.result-box ul li:hover {
  background: #e9f3ff;
}
.book-list {
  display: flex;
  justify-content: space-between;
  transition: background-color 0.2s ease;
}
.book-container {
  flex: 1;
}
.book-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.book-list {
  margin-top: 50px;
  display: block;
}
.book-list ul li {
  list-style: none;
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 0.25rem;
  padding: 10px 10px;
}
</style>
