<template>
  <dropdown
    placement="bottom"
    :disabled="!isOptionAvailable"
    :search-limit="props.searchLimit"
    :options-count="props.optionsCount"
    :current-option-length="props.currentLanguagesLenth"
    @open="onOpen"
    @update-search-limit="updateSearchLimit"
  >
    <template #anchor>
      <input
        v-if="props.inputWithDropdown"
        v-model="state.inputTextWithDropdown"
        class="lang-add-input"
        type="text"
        placeholder="Type language name here.."
      />
      <button
        v-if="!props.inputWithDropdown"
        class="c-btn c-btn--light c-btn- c-btn--dropdown c-btn--baseline u-nowrap u-1/1"
        :class="{
          'c-btn--shadow': shadow,
          'c-input--outline': outline,
          'c-btn--dropdown--clearable': clearable && current !== null,
          'c-btn--dropdown--loader': showLoader,
          'c-input--outline-error': error,
        }"
        :disabled="!isOptionAvailable"
      >
        <span v-if="icon" class="u-icon u-mr--@tablet">{{ icon }}</span>
        <span :class="{ 'u-hidden-until@tablet': !nonResponsive }">
          {{ filterLabel }}
        </span>
        <span v-if="showLoader" class="c-spinner c-spinner--tiny"></span>
        <span
          v-if="!showLoader && clearable && current"
          class="u-icon"
          @click.prevent="
            (e) => {
              e.stopPropagation();
              clear();
            }
          "
          >close</span
        >
      </button>
    </template>

    <template v-if="isOptionAvailable && search" #header>
      <input
        v-if="search"
        ref="searchRef"
        v-model="state.searchquery"
        class="c-dropdown__search"
        style="min-width: 200px"
        placeholder="Search ..."
        @keydown.down="onUpDown"
        @keydown.esc="closeMe"
        @click.capture.stop
      />
    </template>
    <div
      ref="listRef"
      :class="{ 'c-project-creation-filter': module === 'project-creation' }"
      @keydown.up.down.capture="onUpDown"
      @keydown.esc="closeMe"
    >
      <dropdown-item
        v-if="allowAll"
        key="null"
        type="button"
        :active="current === null"
        @click="choose(null)"
      >
        <div class="o-flex o-flex--between o-flex--middle w-100">
          <span>All</span>
          <span v-if="total" class="c-badge c-badge--soft c-badge- u-normal">
            {{ total.toLocaleString('en') }}
          </span>
        </div>
      </dropdown-item>
      <dropdown-item
        v-for="(a, i) in list"
        :key="get(a.item, 'slug', i)"
        type="button"
        :active="get(a.item, 'slug') === get(current, 'slug')"
        @click="choose(a.item)"
      >
        <div class="o-flex o-flex--between o-flex--middle w-100">
          <span
            v-if="a.matches.length"
            class="c-dropndown__highlight u-normal"
            v-html="matches2html(a.matches)"
          ></span>
          <span v-else>{{ a.item.name }}</span>

          <span
            v-if="a.item.count && module !== 'project-creation'"
            class="c-badge c-badge--soft c-badge- u-normal"
          >
            {{ a.item.count.toLocaleString('en') }}
          </span>
        </div>
      </dropdown-item>
      <div
        v-if="props.isLanguageLoading && searchLimit"
        class="lazy-loader-container"
      >
        <div class="spinner-container">
          <div class="c-spinner c-spinner--small"></div>
        </div>
      </div>
      <template v-if="!isEmpty(state.searchedLanguagesList) && languageModule">
        <dropdown-item
          v-for="(a, i) in state.searchedLanguagesList"
          :key="get(a.item, 'slug', i)"
          type="button"
          :active="get(a.item, 'slug') === get(current, 'slug')"
          @click="choose(a.item)"
        >
          <div class="o-flex o-flex--between o-flex--middle w-100">
            <span>{{ a.item.name }}</span>
          </div>
        </dropdown-item>
      </template>

      <div v-if="!list.length" class="u-text-center u-mv-- u-muted">
        No results
      </div>
    </div>
  </dropdown>
</template>

<script setup>
import get from 'lodash/get';
import Fuse from 'fuse.js';
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import { useTranslationStore } from '~/store';
import { limitNameWithLength } from '~/helpers/Util';
import Dropdown from '~/components/utilities/Dropdown';
import DropdownItem from '~/components/utilities/DropdownItem';

const translationStore = useTranslationStore();

const { searchedLanguages, searchedUnavailableLanuguages } =
  storeToRefs(translationStore);

const fuseOptions = {
  shouldSort: true,
  includeMatches: true,
  threshold: 0.5,
  location: 0,
  distance: 10,
  maxPatternLength: 16,
  minMatchCharLength: 1,
  keys: ['name'],
};

const props = defineProps({
  icon: { type: String, default: '' },
  inputWithDropdown: { type: Boolean, default: false },
  label: { type: String, default: 'Filter ...' },
  shadow: { type: Boolean, default: true },
  outline: { type: Boolean, default: false },
  limitLabel: { type: Boolean, default: true },
  options: {
    type: Array,
    default: () => [],
    validator: (array) =>
      array.every((obj) => obj.slug !== undefined && obj.name !== undefined),
  },
  current: { type: Object, default: null },
  search: Boolean,
  allowAll: Boolean,
  nonResponsive: Boolean,
  module: { type: String, default: '' },
  clearable: { type: Boolean, default: false },
  showLoader: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  languageModule: { type: Boolean, default: false },
  selectedContinent: { type: String, default: 'asia' },
  fetchAvailableLanguages: { type: Boolean, default: true },
  searchLimit: { type: Number },
  optionsCount: { type: Number },
  currentOptionLenth: { type: Number },
  isLanguageLoading: { type: Boolean },
});

const emit = defineEmits([
  'update:current',
  'update-search-limit',
  'update-custom-added-language',
]);

const updateSearchLimit = (limit) => {
  emit('update-search-limit', limit);
};

const state = reactive({
  fuse: null,
  searchquery: '',
  open: false,
  searchedLanguagesList: [],
  inputTextWithDropdown: '',
});

const updateCustomAddedLanguage = () => {
  emit('update-custom-added-language', state.inputTextWithDropdown);
};

// Template ref
const searchRef = ref(null);
const listRef = ref(null);

const isOptionAvailable = computed(() => {
  return !isEmpty(props.options);
});

const filterLabel = computed(() => {
  if (props.module === 'project-creation' && !isOptionAvailable.value) {
    return 'Not Available';
  } else if (props.current) {
    return props.limitLabel
      ? limitNameWithLength(props.current?.name, 15)
      : props.current?.name;
  } else {
    return props.limitLabel
      ? limitNameWithLength(props.label, 15)
      : props.label;
  }
});

const list = computed(() => {
  return state.searchquery
    ? state.fuse.search(state.searchquery)
    : props.options.map((item) => ({ item, matches: [] }));
});

const total = computed(() => {
  return props.options.reduce(
    (total, item) => total + get(item, 'count', 0),
    0
  );
});

onMounted(() => {
  state.fuse = new Fuse(props.options, fuseOptions);
  if (props.fetchAvailableLanguages) {
    state.searchedLanguagesList = searchedLanguages;
  } else {
    state.searchedLanguagesList = searchedUnavailableLanuguages;
  }
});

watch(
  () => props.options,
  (list) => {
    state.fuse = new Fuse(list, fuseOptions);
  }
);

let timeout;

const fetchSearchedLanguage = (searchedName) => {
  translationStore.fetchSearchedLanguage(
    searchedName,
    props.selectedContinent,
    props.fetchAvailableLanguages
  );
};

watch(
  () => [state.searchquery, props.languageModule],
  (value) => {
    if (value[0] && value[1]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fetchSearchedLanguage(value[0]), 300);
    }
  }
);

watch(
  () => props.current,
  () => {
    if (props.current) {
      state.inputTextWithDropdown = props.current.name;
    }
  }
);

watch(
  () => state.inputTextWithDropdown,
  () => {
    updateCustomAddedLanguage();
  }
);

const closeMe = () => {
  state.open = false;
};

const choose = (option) => {
  emit('update:current', option);
  state.searchquery = '';
  closeMe();
};

const clear = () => {
  emit('update:current', null);
};

const onOpen = () => {
  setTimeout(() => {
    if (searchRef.value) searchRef.value.focus();
    else listRef.value.firstChild.focus();
  }, 300);
};

const onUpDown = () => {
  let el =
    event.keyCode === 40
      ? document.activeElement.nextElementSibling
      : document.activeElement.previousElementSibling;
  if (!el) el = listRef.value.children[0];
  if (el) {
    el.focus();
    event.preventDefault();
  }
};

const matches2html = (matches) => {
  const match = matches[0];
  let str = '';

  let start = 0;
  match.indices.forEach((indices) => {
    str +=
      match.value.substring(start, indices[0]) +
      '<b>' +
      match.value.substring(indices[0], indices[1] + 1) +
      '</b>';
    start = indices[1] + 1;
  });
  return str + match.value.substring(start);
};
</script>

<style>
.lazy-loader-container {
  display: flex;
  justify-content: center;
}
.lang-add-input::placeholder {
  color: black;
  opacity: 0.3;
}
</style>
