<template>
  <div>
    <command-button
      command-name="Link"
      command-icon="link"
      action-name="Toggle link"
      :disabled="!isTextSelected"
      :type="type"
      :editor-instance="editorInstance"
      @command-function="toggleLinkPopUp"
    />

    <div v-if="state.linkPopUp" class="link-popup">
      <div
        v-if="state.showBibleListPopUP && !state.showBibleDetailPopUp"
        class="link-popup bible-list"
      >
        <input
          v-model="search"
          class="c-search__input u-border0 u-shadow-2"
          type="text"
          placeholder="Search for bibles..."
          @keyup.enter="onSubmit"
          @keyup.esc="onClear"
        />
        <h6 class="list-heading">Recommended Bible</h6>
        <div class="bible-list-container">
          <div class="bible-img-name">
            <div
              class="bible-img"
              :style="{
                backgroundImage: `url(${egwApi}/covers/${127}?type=small)`,
              }"
            ></div>
            <div class="bible-name-verse">
              <h6 class="bible-name">{{ state.bibleLists[0].name }}</h6>
              <h6 class="bible name bible-verse">
                {{ state.bibleLists[0].abbreviation }}
              </h6>
            </div>
          </div>
          <div
            class="view-link"
            @click="() => openBibleDetailPopUp(state.bibleLists[0])"
          >
            View
          </div>
        </div>

        <hr class="divider-list" />
        <h6 class="list-heading">Other Bible</h6>
        <div class="bible-list-wrapper hide-scroll-bar">
          <div
            v-for="bible in state.bibleLists"
            :key="bible.id"
            class="bible-list-container"
          >
            <div class="bible-img-name">
              <div
                class="bible-img"
                :style="{
                  backgroundImage: `url(${egwApi}/covers/${127}?type=small)`,
                }"
              ></div>
              <div class="bible-name-verse align-center">
                <h6 class="bible-name">{{ bible?.name }}</h6>
                <h6 class="bible name bible-verse">{{ bible?.description }}</h6>
              </div>
            </div>
            <div class="view-link" @click="() => openBibleDetailPopUp(bible)">
              View
            </div>
          </div>
        </div>
      </div>
      <div v-if="state.showBibleDetailPopUp" class="link-popup bible-list">
        <div class="back-bible-details" @click="closeBibleDetailPopUp">
          <span class="u-icon">arrow_back</span>
        </div>
        <div class="bible-list-container">
          <div class="bible-img-name">
            <div
              class="bible-img"
              :style="{
                backgroundImage: `url(${egwApi}/covers/${127}?type=small)`,
              }"
            ></div>
            <div class="bible-name-verse">
              <h6 class="bible-name">{{ state.currentBibleDetail.name }}</h6>
            </div>
          </div>
        </div>

        <input
          v-model="searchVerses"
          class="c-search__input u-border0 u-shadow-2"
          type="text"
          placeholder="Search for verses..."
          @keyup.enter="onSubmitSearchVerses"
          @keyup.esc="onClearSearchVerses"
        />
        <hr class="divider-list" />

        <div>
          <h6 v-if="searchVerses" class="list-heading">Verses</h6>
          <div class="loader-container">
            <div
              v-if="state.isVersesLoading"
              class="c-spinner c-spinner--small"
            ></div>
          </div>

          <p
            v-if="state.dataNotFound && !state.isVersesLoading && searchVerses"
            class="error-msg"
          >
            Sorry no verses found!
          </p>
          <div class="bible-list-wrapper hide-scroll-bar">
            <div
              v-for="bible in state.currentlySearchedVerses"
              :key="bible.id"
              class="bible-list-container"
            >
              <div class="bible-img-name">
                <div class="bible-name-verse">
                  <h6 class="bible-name bible-test-clamp">{{ bible?.text }}</h6>
                  <h6 class="bible name bible-verse">
                    <a :href="bible.url">{{ bible?.verseId }}</a>
                  </h6>
                </div>
              </div>
              <div class="view-link"><a :href="bible.url">Link</a></div>
            </div>
          </div>
        </div>
      </div>
      <div class="header o-flex o-flex--between o-flex--middle">
        <span>Insert wLink Attributes</span>
        <i class="u-icon" @click.prevent="toggleLinkPopUp">close</i>
      </div>
      <div class="link-tabs">
        <div
          v-for="option in state.linkOptions"
          :key="option.id"
          class="link-tab-item"
          @click.prevent="setLinkDomain(option)"
        >
          <button
            class="c-btn c-btn--ghost c-btn--primary"
            :class="{ 'is-active': option.id === state.activeLinkDomain.id }"
          >
            {{ option.title }}
          </button>
        </div>
      </div>
      <div
        v-if="!isEmpty(state.translatedLinks) && canShowTranslatedLinks"
        class="preTranslatedLinks"
      >
        <label>Pre Translated Links</label>

        <ul class="preTranslatedLink-list">
          <li
            v-for="(link, index) in state.translatedLinks"
            :key="link.translations.refcodeShort"
            class="preTranslatedLink-item"
          >
            {{ `${index + 1}.  ${link.translations.link}` }}
            <button
              class="c-btn c-btn-- c-btn--primary c-btn--ghost"
              @click.prevent="getActiveDomain(link.translations.link)"
            >
              Use Link
            </button>
          </li>
        </ul>
      </div>
      <form class="link__form">
        <dl class="o-layout__item">
          <dt>
            <label> Url </label>
          </dt>
          <dd>
            <div class="url-wrapper">
              <span class="domain">
                {{ state.activeLinkDomain.link }}
              </span>
              <input
                id="url"
                v-model="state.url"
                class="link-input"
                type="text"
                name="url"
                placeholder="Enter book link or id here"
                @input="(e) => formatUrl(e.target.value)"
              />
            </div>
          </dd>
        </dl>
        <dl v-if="contentType === 'paragraph'" class="o-layout__item">
          <dt>
            <label> Title </label>
          </dt>
          <dd>
            <input
              id="title"
              v-model="state.title"
              class="title-input"
              type="text"
              name="title"
              placeholder="Enter link title here"
            />
          </dd>
        </dl>

        <div class="action-container">
          <button
            class="c-btn c-btn--primary c-btn--- link-btn text-white"
            type="submit"
            @click.prevent="command"
          >
            Set WLink
          </button>
          <button
            class="c-btn c-btn--ghost c-btn--primary c-btn--- link-btn"
            type="submit"
            @click.prevent="resetForm"
          >
            Reset Form
          </button>
          <button
            class="c-btn c-btn--ghost c-btn--red c-btn--- link-btn"
            type="submit"
            @click.prevent="removeLink"
          >
            Remove Link
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import { storeToRefs } from 'pinia';
import CommandButton from './CommandButton.vue';
import { fetchAPI } from '~/helpers/apiCore';
import { useAuthStore, userAlertStore } from '~/store';

const props = defineProps({
  segment: { type: Object, default: () => {} },
  contentType: { type: String, default: '' },
  isTextSelected: { type: Boolean, default: false },
  editorInstance: { type: Object, default: () => {} },
});

const alertStore = userAlertStore();
const authStore = useAuthStore();
const { isOnline } = storeToRefs(authStore);

const runTimeConfig = useRuntimeConfig();
const { egwApi } = runTimeConfig.public;

const search = ref('');
const searchVerses = ref('');

const state = reactive({
  showBibleListPopUP: false,
  showBibleDetailPopUp: false,
  currentBibleDetail: {},
  currentlySearchedVerses: [],
  dataNotFound: false,
  isVersesLoading: false,
  bibleLists: [],
  linkPopUp: false,
  url: null,
  title: null,
  linkOptions: [
    {
      title: 'egw book',
      id: 'book',
      link: 'egw://book/',
    },
    {
      title: 'bible',
      id: 'bible',
      link: 'egw://bible/',
    },
    {
      title: 'https',
      id: 'https',
      link: 'https://',
    },
    {
      title: 'http',
      id: 'http',
      link: 'http://',
    },
  ],
  linkType: null,
  activeLinkDomain: {},
  translatedLinks: [],
});

const type = computed(() => {
  if (props.contentType === 'paragraph') {
    return 'wLink';
  } else {
    return 'link';
  }
});

const canShowTranslatedLinks = computed(() => {
  return !isEmpty(
    state.translatedLinks?.filter((item) => item?.translations?.link)
  );
});

const fetchTranslatedLinks = async () => {
  const workId = props.segment?.work;
  const segmentPosition = props.segment?.position;
  const { data } = await fetchAPI(
    `/translations/${workId}/segments/${segmentPosition}/egw_links/`
  );

  if (!isEmpty(data)) {
    state.translatedLinks = data;
  }
};

const fetchBibleLists = async () => {
  const { data } = await fetchAPI('/bible-version/');
  state.bibleLists = data;
};

const onSubmit = () => {};

const onSubmitSearchVerses = () => {};

const onClear = () => {
  search.value = '';
  nextTick(() => {
    onSubmit('');
  });
};

const onClearSearchVerses = () => {
  searchVerses.value = '';
  nextTick(() => {
    onSubmitSearchVerses('');
  });
};

const toggleLinkPopUp = () => {
  state.linkPopUp = !state.linkPopUp;
};

const resetForm = () => {
  state.url = null;
  state.activeLinkDomain = state.linkOptions[0];
};

const command = () => {
  if (props.contentType === 'paragraph') {
    if (state.url) {
      props.editorInstance
        .chain()
        .focus()
        .setWLink({
          class: `egwlink egwlink_${state.activeLinkDomain?.id}`,
          'data-link': state.url,
          title: state.title,
        })
        .run();

      toggleLinkPopUp();
      resetForm();
    } else {
      alertStore.new({
        message: 'Invalid link, please enter correct link or book id',
        color: 'red',
        duration: 2000,
      });
    }
  } else {
    const previousUrl = props.editorInstance.getAttributes('link').href;
    let url;

    if (state.url && state.activeLinkDomain?.id) {
      const domain = state.activeLinkDomain?.link;
      url = domain + state.url;
    } else {
      url = previousUrl;
    }

    // cancelled
    if (url === null) {
      return;
    }
    // empty
    if (url === '') {
      props.editorInstance
        .chain()
        .focus()
        .extendMarkRange('link')
        .unsetLink()
        .run();
      return;
    }
    // update link
    props.editorInstance
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();

    toggleLinkPopUp();
    resetForm();
  }
};

const removeLink = () => {
  if (props.contentType === 'paragraph') {
    props.editorInstance.chain().focus().unsetWLink().run();
  } else {
    props.editorInstance
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run();
  }
  toggleLinkPopUp();
  resetForm();
};

const setLinkDomain = (domain) => {
  // currently bible list feature is commented for future use
  // if (domain.id === 'bible') {
  //   state.showBibleListPopUP = !state.showBibleListPopUP;
  // }
  state.activeLinkDomain = domain;
};

const openBibleDetailPopUp = (bible) => {
  state.showBibleDetailPopUp = true;
  state.currentBibleDetail = bible;
};

const closeBibleDetailPopUp = () => {
  state.showBibleDetailPopUp = false;
  searchVerses.value = '';
};

const formatUrl = (urlInput) => {
  if (urlInput && state.activeLinkDomain?.id) {
    const domain = state.activeLinkDomain?.link;
    const inputLink = urlInput;

    /* eslint-disable */
    const validUrlRegex =
      /^(http(s):\/\/.|egw:\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g;

    if (validUrlRegex.test(urlInput) || urlInput.includes('egw://')) {
      if (inputLink.includes(domain)) {
        const domainCharLength = domain.length;
        state.url = inputLink.substring(
          inputLink.indexOf(domain) + domainCharLength
        );
      } else {
        getActiveDomain(inputLink);
      }
    } else {
      state.url = urlInput;
    }
  }
};

const getActiveDomain = (url) => {
  state.activeLinkDomain = state.linkOptions?.find((domain) =>
    url.includes(domain?.link)
  );

  formatUrl(url);
};

onMounted(() => {
  state.activeLinkDomain = state.linkOptions[0];
});

watch(
  () => state.linkPopUp,
  (newValue) => {
    if (newValue) {
      const prevUrl = props.editorInstance.getAttributes('link').href;
      if (prevUrl) {
        getActiveDomain(prevUrl);
      }
    } else {
      state.url = null;
      state.title = null;
      state.activeLinkDomain = state.linkOptions[0];
    }
  }
);

watch(
  () => [state.linkPopUp, isOnline.value],
  (value) => {
    if (value[0] && value[1]) {
      fetchTranslatedLinks();
    }
  }
);

watch(
  () => state.showBibleListPopUP,
  () => {
    if (state.showBibleListPopUP) {
      fetchBibleLists();
    }
  }
);

const fetchSearchedVerses = async (searchquery) => {
  state.currentlySearchedVerses = [];
  state.isVersesLoading = true;
  const { data } = await fetchAPI(
    `/bible-version/${state.currentBibleDetail.id}/verse/?search=${searchquery}`
  );
  state.currentlySearchedVerses = data.verseObj;
  if (data?.verseObj.length === 0) {
    state.dataNotFound = true;
  } else {
    state.dataNotFound = false;
  }
  state.isVersesLoading = false;
};

let timeout = null;

watch(
  () => searchVerses.value,
  () => {
    if (searchVerses.value.length > 1) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fetchSearchedVerses(searchVerses.value), 300);
    } else {
      state.currentlySearchedVerses = [];
    }
  }
);
</script>

<style lang="scss">
.link-popup {
  border: 1px solid #cad1d9;
  position: absolute;
  inset: 0px auto auto 0px;
  margin: 0px;
  top: 65px;
  left: auto;
  right: auto;
  background-color: white;
  z-index: 5;
  width: 400px;
  min-height: 100px;
  max-height: fit-content;
  border-radius: 5px;

  .header {
    padding: 10px;
    border-bottom: 1px solid #cad1d9;

    .u-icon {
      cursor: pointer;
    }
  }

  .link-tabs {
    display: flex;
    padding: 10px;

    .link-tab-item {
      width: fit-content;

      button {
        padding: 3px 6px;
        border: 1px solid;
        text-transform: uppercase;
        font-size: 14px;

        &:hover {
          border-color: hsl(198, 53%, 49%);
        }
        &:focus {
          border-color: hsl(198, 53%, 49%);
        }

        &.is-active {
          border-color: hsl(198, 53%, 49%);
        }
      }

      &:first-child {
        button {
          border-top-left-radius: 5px;
          border-bottom-left-radius: 5px;
          border-top-right-radius: 0px;
          border-bottom-right-radius: 0px;
        }
      }

      &:last-child {
        button {
          border-top-right-radius: 5px !important;
          border-bottom-right-radius: 5px !important;
          border-top-left-radius: 0px;
          border-bottom-left-radius: 0px;
        }
      }

      &:not(:first-child) {
        button {
          border-left: 0px !important;
          border-radius: 0px;
        }
      }
    }
  }

  .preTranslatedLinks {
    padding: 10px;

    label {
      font-size: 13px;
      color: $c-gray-5;
    }

    .preTranslatedLink-list {
      margin-bottom: 15px;
      list-style: none;
      margin-left: 0px;
      .preTranslatedLink-item {
        display: flex;
        align-items: center;
        font-size: 14px;
        align-items: center;

        &:not(:last-child) {
          margin-bottom: 10px;
        }
        button {
          font-size: 12px;
          padding: 1px 3px;
          margin-left: auto;
        }
      }
    }
  }

  .link__form {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 0 10px 10px 10px;

    .o-layout__item {
      padding: 0px;
      margin-bottom: 10px;

      label {
        font-size: 13px;
        font-weight: 400;
      }

      dd {
        margin: 5px 0 0 0;
      }

      input::placeholder {
        color: $c-gray-4;
        font-size: 14px;
      }

      .url-wrapper {
        display: flex;
        align-items: center;
        border: 1px solid hsl(211, 16%, 82%);
        border-radius: 3px;
        background-color: $c-gray-2;

        .domain {
          padding: 0px 10px 0px 12px;
          font-size: 14px;
          display: flex;
        }

        input {
          outline: none !important;
          border: none !important;
          border-top-left-radius: 0px !important;
          border-bottom-left-radius: 0px !important;
        }
      }
    }

    .action-container {
      margin-top: auto;
      text-align: end;
      margin-top: 15px;

      .link-btn {
        padding: 5px 10px;
        font-size: 14px;
        text-transform: uppercase;
        margin-left: 10px;
      }
    }
  }
}
.bible-list {
  top: 0;
  left: 110%;
  padding: 16px;
  input {
    margin-bottom: 16px;
  }
  h6 {
    margin: 0;
  }
  .bible-img {
    height: 70px;
    width: 40px;
    background-size: contain;
  }
  .list-heading {
    color: rgba(39, 39, 39, 0.88);
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 150%; /* 21px */
    letter-spacing: 0.028px;
  }

  .bible-name {
    color: #272727;
    /* Body/B1 */
    font-family: Source Sans Pro;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 150%; /* 24px */
    letter-spacing: 0.08px;
  }
  .bible-test-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .bible-verse {
    font-weight: 600;
    line-height: 150%; /* 24px */
    letter-spacing: 0.064px;
    text-decoration-line: underline;
    a {
      color: #272727;
    }
  }
  .view-link {
    color: #2538e5;
    cursor: pointer;
    font-family: Source Sans Pro;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 150%; /* 21px */
    letter-spacing: 0.056px;
  }
  .bible-img-name {
    display: flex;
  }

  .bible-list-wrapper {
    max-height: 275px;
    overflow-y: scroll;
    :first-child {
      margin-top: 0;
    }
  }
  .bible-list-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
  }
  .bible-name-verse {
    margin-left: 8px;
  }
  .align-center {
    display: flex;
    align-items: center;
  }
  .loader-container {
    display: flex;
    justify-content: center;
  }
  .divider-list {
    height: 1px;
    background: rgba(0, 0, 0, 0.15);
    margin: 12px 0;
  }

  .back-bible-details {
    cursor: pointer;
  }
}
</style>
