import { defineStore, storeToRefs } from 'pinia';
import get from 'lodash/get';
import first from 'lodash/first';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';

import { useSegmentStore } from './segments';
import { keyInArray } from '~/helpers/Util';
import { fetchAPI, storeAPI } from '~/helpers/apiCore';

import { useAuthStore, useUserStore } from '~/store';
import {
  OFFLINE_BOOK,
  OFFLINE_TABLE_OF_CONTENT,
} from '~/service-worker/constants';
import { getLocalTranslationData } from '~/service-worker/db';

export const useTranslationStore = defineStore({
  id: 'translations-store',
  state: () => ({
    translation: null,
    currentSegment: null,
    priorSegment: null,
    currentRecord: null,
    opponentRecord: null,
    items: [],
    count: 0,
    next: null,
    previous: null,
    current: null, // index of items
    chapter: null, // index of items[current].tableOfContents
    filters: {
      originals: [],
      languages: [],
      types: [],
      tags: [],
      years: {},
      currentLanguage: null,
      currentType: null,
      currentTag: null,
      currentYear: null,
      inTranslation: true,
    },
    sorting: {
      options: [
        {
          name: 'Priority',
          param: 'priority,-reviewed,-translated,-pretranslated,title',
        },
        {
          name: 'Progress',
          param: '-reviewed,-translated,-pretranslated,title',
        },
        { name: 'Title (A-Z)', param: 'title' },
        { name: 'Title (Z-A)', param: '-title' },
        { name: 'Contributors', param: '-contributors' },
        { name: 'Recent Activity', param: '-last_activity' },
      ],
      currentParams: 'priority,-reviewed,-translated,-pretranslated,title',
    },
    lastRequestUrl: null,
    lastParams: null,
    pending: {
      request: false,
      requestOne: false,
      requestLanguages: false,
    },
    chaptersPending: false,
    chapterDownloadListError: false,
    languageStats: [],
    recentWork: {},
    chapterList: [],
    chapterInfo: [],
    downloadableChapterList: [],
    downloadingChapter: false,
    searchedLanguages: [],
    searchedUnavailableLanuguages: [],
    currentSentence: null,
    currentSentencePosition: null,
  }),

  getters: {
    getTranslation: (state) => state.translation,
    getDiff: (state) => ({
      new: state.currentRecord?.content || '',
      old: state.opponentRecord?.content || '',
    }),
    isPending: (state) => (key) => get(state.pending, key),

    isResolved: (state) => (key) => !get(state.pending, key),

    // Translations
    isSet: (state) => Boolean(state.items.length),
    get: (state) =>
      state.pending.request && state.items.length === 0
        ? Array(12).fill({ dummy: true })
        : state.items,
    getCount: (state) => state.count || state.items.length,
    nextUrl: (state) => state.next,
    previousUrl: (state) => state.previous,
    findTranslationKeyById(id) {
      return this.items.findIndex((item) => item.id === parseInt(id));
    },
    findTranslationKeyByAbbrAndLang({ abbreviation, language }) {
      return this.items.findIndex(
        (item) =>
          abbreviation.localeCompare(item.abbreviation, false, {
            sensitivity: 'base',
          }) === 0 && item.language.code === language
      );
    },
    // Current Translation
    hasCurrent(state) {
      return (
        this.isSet &&
        state.current !== null &&
        keyInArray(state.items, state.current)
      );
    },
    currentData(state) {
      return this.hasCurrent ? state.items[state.current] : null;
    },
    currentId() {
      return this.hasCurrent ? this.currentData.id : null;
    },
    tableOfContents() {
      return this.isSet && this.hasCurrent
        ? this.currentData.tableOfContents
        : [];
    },
    currentRtl() {
      return get(this.currentData, 'language.rtl', false);
    },
    // Chapters
    hasChapter(state) {
      return (
        this.isSet &&
        this.hasCurrent &&
        state.chapter !== null &&
        keyInArray(this.tableOfContents, state.chapter)
      );
    },
    getChapter(state) {
      return this.hasChapter ? this.tableOfContents[state.chapter] : null;
    },
    chapterUrl() {
      return get(this.chapter, 'url', null);
    },
    getChapterList: (state) => (workId) => {
      const chaptersByWorkId = state.chapterList?.find(
        (chapter) => chapter?.work === workId
      );

      if (chaptersByWorkId?.work) {
        return chaptersByWorkId;
      }

      return null;
    },
    getChapterInfoList: (state) => (workId) => {
      const chaptersByWorkId = state.chapterInfo?.find(
        (chapter) => chapter?.work === workId
      );

      if (chaptersByWorkId?.work) {
        return chaptersByWorkId;
      }

      return null;
    },
    // Filters
    getFilters: (state) => state.filters,
    languages: (state) => state.filters.languages || [],
    originalWorks: (state) => state.filters.originals || [],
    types: (state) => state.filters.types || [],
    tags: (state) => state.filters.tags || [],
    years: (state) => state.filters.years || {},
    currentLanguage: (state) => state.filters.currentLanguage || null,
    currentType: (state) => state.filters.currentType || null,
    currentTag: (state) => state.filters.currentTag || null,
    currentYear: (state) => state.filters.currentYear || null,
    inTranslation: (state) => state.filters.inTranslation,
    languageCode() {
      return get(this.filters.currentLanguage, 'code');
    },
    filterParams() {
      const params = {};
      // Language
      if (this.currentLanguage)
        params.language = get(this.currentLanguage, 'code');
      // Type
      if (this.currentType) params.type = get(this.currentType, 'slug');
      // Tag
      if (this.currentTag) params.tag = get(this.currentTag, 'slug');
      // inTranslation
      if (this.inTranslation) {
        params.is_authorized = 'false';
      } else {
        params.is_authorized = 'true';
      }
      params.protected = 'false';
      return params;
    },
    // Sorting
    getSorting: (state) => state.sorting.options,
    currentSorting: (state) =>
      state.sorting.options.find(
        (a) => a.param === state.sorting.currentParams
      ) || state.sorting.options[0],
    sortingParams() {
      return this.sorting.currentParams
        ? { ordering: this.sorting.currentParams }
        : {};
    },
    // Other
    requiredReviewers() {
      return get(this.currentData, 'requiredApprovals.reviewer', 1);
    },
    requiredTrustees() {
      return get(this.currentData, 'requiredApprovals.trustee', 1);
    },
  },
  actions: {
    setSelectedTranslation(translation) {
      this.translation = translation;
    },
    getLanguageStat(code) {
      return get(this.languageStats, code);
    },
    async getLanguageOptions() {
      try {
        const data = await fetchAPI('languages/');
        if (data?.statusCode === 200) {
          this.setLanguages(data?.data);
        }
      } catch (e) {
        console.error(e);
      }
      this.getFilterOptions();
    },
    /*
     * Test filter options:
     * const options = require("~/test/samples/translations-filters.json");
     */
    async getFilterOptions(languageObj, archive) {
      const code = languageObj?.code ? languageObj?.code : this.languageCode;
      try {
        const { data } = await fetchAPI('translations/filters/', {
          params: code ? { language: code, archive } : { archive },
        });
        this.filters.types = data.types;
        this.filters.tags = data.tags;
        this.filters.years = data.years;
      } catch (e) {
        console.error(e);
      }
    },
    async requestOne(params) {
      this.setPending('requestOne');
      const key = params.id
        ? this.findTranslationKeyById(params.id)
        : this.findTranslationKeyByAbbrAndLang(params);
      let response = true;

      if (key >= 0) {
        // if the translation is already in 'items', define 'current'
        this.current = parseInt(key);
      } else if (params.id) {
        try {
          response = await fetchAPI(`translations/${params.id}/`);
          this.setOne(response.data);
        } catch (e) {}
      } else {
        try {
          response = await fetchAPI(`translations/`, { params });
          this.setOne(first(response.data.results));
        } catch (e) {}
      }

      if (this.hasCurrent)
        this.setChapterByNumber(parseInt(get(params, 'chapter', 1)));

      this.setResolved('requestOne');
      return response;
    },
    async requestWithFiltersSorting(params) {
      await this.request({
        limit: 20,
        ...this.filterParams,
        ...this.sortingParams,
        ...params,
      });
    },
    async request(params) {
      if (isEqual(this.lastParams, params) && this.isSet) return;
      this.lastParams = params;
      this.setPending('request');
      try {
        const response = await fetchAPI('translations/', {
          params,
        });
        this.set(response.data);
      } catch (e) {
        console.error(e);
      }
      this.setResolved('request');
    },
    async fetchOriginalWorks() {
      try {
        const { data } = await fetchAPI('originals/');
        this.setOriginalWorks(data);
      } catch (e) {
        console.error(e);
      }
    },
    setChapterByNumber(number) {
      const segmentStore = useSegmentStore();

      const chapterKey = helpers.chapterIndexByNumber(
        this.tableOfContents,
        number
      );
      this.chapter = parseInt(chapterKey);
      segmentStore.unsetCurrent();
    },
    async fetchALLTableOfContents(translationId) {
      const toc = this.getChapterList(translationId);
      if (!isEmpty(toc)) {
        return toc.chapters;
      }
      this.chaptersPending = true;

      const authStore = useAuthStore();
      const { isOnline } = storeToRefs(authStore);

      try {
        if (isOnline.value) {
          const res = await fetchAPI(
            `translations/${translationId}/table-of-contents/`
          );
          if (res?.data) {
            this.setChapterList({
              work: translationId,
              chapters: res.data,
            });
            this.chaptersPending = false;
            return res.data;
          }
        } else {
          const offlineTOC = await getLocalTranslationData(
            `${translationId}_${OFFLINE_TABLE_OF_CONTENT}`
          );

          const offlineTOCWorkID = offlineTOC?.[0]?.work;

          if (offlineTOCWorkID === translationId) {
            this.setChapterList({
              work: translationId,
              chapters: offlineTOC,
            });
          }
          this.chaptersPending = false;
          return offlineTOC;
        }
      } catch (e) {
        console.error(e);
        this.chaptersPending = false;
      }
    },

    async fetchChapterInfo(work, nextUrl = null) {
      if (isEmpty(this.getChapterInfoList(work)) || nextUrl) {
        this.chaptersPending = true;
        this.chapterDownloadListError = false;

        const url = nextUrl || `translations/${work}/chapter-info/`;

        try {
          const { data, next } = await fetchAPI(url);

          if (data instanceof Array && !isEmpty(data)) {
            if (nextUrl) {
              this.patchChapterInfoList(work, {
                chapters: data,
                nextUrl: next,
              });
            } else {
              this.setChapterInfoList({
                work,
                chapters: data,
                nextUrl: next,
              });
            }
            this.chaptersPending = false;
            this.chapterDownloadListError = false;

            return data;
          }

          this.chapterDownloadListError = true;
          this.chaptersPending = false;
        } catch (e) {
          this.chaptersPending = false;
          this.chapterDownloadListError = true;
          console.error(e);
        }
      }
    },
    async fetchCurrentChapterContents(translationId, chapterNumber) {
      try {
        const result = await fetchAPI(
          `translations/${translationId}/table-of-contents/?chapter=${chapterNumber}`
        );

        if (!isEmpty(result?.data)) {
          return first(result?.data);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async fetchTranslation(language, abbreviation) {
      const userStore = useUserStore();
      const authStore = useAuthStore();
      const { isOnline } = storeToRefs(authStore);
      const { id: userId, userDownloadInfo } = storeToRefs(userStore);

      try {
        if (isOnline.value) {
          const result = await fetchAPI('translations/', {
            params: {
              language,
              abbreviation,
            },
          });

          if (result?.data) {
            const translationObj = first(result?.data);
            this.setSelectedTranslation(translationObj);
            return translationObj;
          }
        } else {
          if (!userId.value) return;
          await userStore.requestFullProfile();

          if (!userDownloadInfo.value?.workId) return;

          const data = await getLocalTranslationData(
            `${userDownloadInfo.value?.workId}_${OFFLINE_BOOK}`
          );

          return data;
        }

        return null;
      } catch (e) {}
    },

    /*
     * As we set the current segment, we also notify the backend that we switched
     * segments. Mainly so that the backend can update its locks.
     */
    async setCurrentSegment(segment) {
      if (this.currentSegment?.id === segment?.id) return;
      const authStore = useAuthStore();
      const { isOnline } = storeToRefs(authStore);

      this.priorSegment = this.currentSegment;
      this.currentSegment = isEmpty(segment) ? null : segment;

      if (isOnline.value) {
        try {
          const workId = segment?.work || this.priorSegment?.work;
          const { data } = await storeAPI(
            `translations/${workId}/switched-segments/`,
            {
              priorSegmentId: this.priorSegment?.id || null,
              currentSegmentId: segment?.id || null,
            }
          );

          return data;
        } catch (error) {
          return error;
        }
      }
    },
    setCurrentSentence(sentenceId) {
      if (this.currentSentence === sentenceId) return;
      this.currentSentence = sentenceId;
    },
    setCurrentSentencePosition(positionLevel) {
      if (this.currentSentencePosition === parseInt(positionLevel)) return;
      this.currentSentencePosition = parseInt(positionLevel);
    },
    setPriorSegment(value) {
      if (this.priorSegment?.id === value?.id) return;
      this.priorSegment = value;
    },

    setCurrentRecord(record) {
      this.currentRecord = isEmpty(record) ? null : record;
    },
    setOpponentRecord(record) {
      this.opponentRecord = isEmpty(record) ? null : record;
    },
    unsetRecords() {
      this.currentRecord = null;
      this.opponentRecord = null;
    },
    setResolved(key) {
      this.pending[key] = false;
    },
    setPending(key) {
      this.pending[key] = true;
    },
    // Translations
    set(data) {
      if (isArray(data)) {
        this.items = data;
      } else {
        this.items = data.results;
        this.count = data.count;
        this.next = data.next;
        this.previous = data.previous;
      }
    },
    setOne(item) {
      this.items = [item];
      this.current = 0;
    },
    // Filters
    setLanguages(items) {
      const newItems = items
        ? items?.map((a) => {
            if (!a.slug) a.slug = a.code;
            return a;
          })
        : [];
      this.filters.languages = newItems;
    },
    setOriginalWorks(items) {
      const newItems = items?.results.map((a) => {
        if (!a.slug) a.slug = a.abbreviation;
        return a;
      });
      this.filters.originals = newItems;
    },
    setCurrentLanguage(object) {
      if (object && !object.slug) object.slug = object.code;
      this.filters.currentLanguage = object;
    },
    async requestLanguageStats(code) {
      // Only request if code is defined and now stats are available yet
      if (!code || this.getLanguageStat(code) !== undefined) return;

      // set pending status
      this.languageStats[code] = 'pending';

      try {
        const data = await $fetch(
          `https://restcountries.eu/rest/v2/lang/${code}`,
          {
            progress: false,
            params: { fields: 'alpha2Code;flag;name;population' },
          }
        );

        if (isArray(data)) {
          this.languageStats[code] = data.sort(
            (a, b) => b.population - a.population
          );
        } else throw new Error('restcountries data not an array');
      } catch (e) {
        this.languageStats[code] = 'error';
      }
    },
    async fetchRecentTranslatedWork() {
      try {
        const result = await fetchAPI('recent-activities/');

        if (result?.data) {
          this.recentWork = result?.data;
        }
      } catch (e) {
        console.error(e);
      }
    },
    setChapterList(chapters) {
      this.chapterList.push(chapters);
    },
    setChapterInfoList(chapters) {
      this.chapterInfo.push(chapters);
    },
    patchChapterInfoList(work, data) {
      const chapter = this.chapterInfo?.findIndex((ct) => ct?.work === work);
      this.chapterInfo[chapter].chapters.push(...data?.chapters);
      this.chapterInfo[chapter].nextUrl = data.nextUrl;
    },
    // TODO: better way to make chapterInfo download:true
    patchChapterObjByWorkId(workId, chapterNumber, newData) {
      const chaptersListByWorkId = this.chapterInfo?.find(
        (chapter) => chapter?.work === workId
      )?.chapters;

      const chapterIndex = chaptersListByWorkId
        .map((item) => item?.chapterNumber)
        ?.indexOf(chapterNumber);

      if (chapterIndex > -1) {
        Object.assign(chaptersListByWorkId[chapterIndex], newData);
      }
    },
    removeChaptersByWorkId(workId) {
      this.chapterList = this.chapterList.filter(
        (chapter) => chapter?.work !== workId
      );
    },
    async restoreTranslation(workId) {
      try {
        const { data } = await storeAPI(`translations/${workId}/archive/`, {
          restore: true,
          archive: false,
        });

        return data;
      } catch (e) {
        console.error(e);
      }
    },
    async downloadChapter(
      workId,
      chapterId,
      mode = 'offline',
      offlineAction = null
    ) {
      this.downloadingChapter = true;
      try {
        const data = await fetchAPI(`translations/${workId}/segments/`, {
          params: {
            chapter: chapterId,
            mode,
            offline_action: offlineAction,
          },
        });

        this.downloadingChapter = false;
        return data;
      } catch (e) {
        this.downloadingChapter = false;
        console.error(e);
      }
    },
    async syncOfflineDataToRemoteDB(offlineData) {
      try {
        const data = await storeAPI('sync-segments/', offlineData);
        return data;
      } catch (e) {
        console.error(e);
      }
    },
    async fetchSearchedLanguage(
      searchedQuery,
      searchedContinent,
      searchAvailableLanguages
    ) {
      try {
        const result = await fetchAPI(
          `languages-obj/?limit=100&available=${searchAvailableLanguages}&continent=${searchedContinent.toLowerCase()}&name=${searchedQuery}`
        );

        if (result?.data) {
          if (searchAvailableLanguages) {
            this.searchedLanguages = result?.data.map((item) => ({
              item,
              matches: [],
            }));
          } else {
            this.searchedUnavailableLanuguages = result?.data.map((item) => ({
              item,
              matches: [],
            }));
          }

          return result.data;
        }
      } catch (e) {
        console.error(e);
      }
    },
    resetStore() {
      this.translation = null;
      this.currentSegment = null;
      this.currentRecord = null;
      this.items = [];
      this.chapter = null;
      this.chapterList = [];
      this.chapterInfo = [];
      this.downloadableChapterList = [];
      this.downloadingChapter = false;
    },
  },
});

/*
 * helpers
 ************************************/

const helpers = {
  chapterIndexByNumber: (toc, chapterNum) => {
    if (!Array.isArray(toc) || toc.length === 0) return null;
    let index = 0;
    toc.forEach((chapter, i) => {
      index = parseInt(chapter.number) === parseInt(chapterNum) ? i : index;
    });
    return index;
  },
};
