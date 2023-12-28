import { defineStore, storeToRefs } from 'pinia';
import unionWith from 'lodash/unionWith';
import min from 'lodash/min';
import get from 'lodash/get';
import head from 'lodash/head';
import pickBy from 'lodash/pickBy';
import isUndefined from 'lodash/isUndefined';
import { compareAsc, isAfter } from 'date-fns';

import { useEventStore } from './events';
import { useTranslationStore } from './translations';
import { parseParameter, cleanUrl } from '~/helpers/Util';
import { fetchAPI, patchAPI, storeAPI } from '~/helpers/apiCore';

export const useSegmentStore = defineStore({
  id: 'segment-store',
  state: () => ({
    items: [] /* 1 */,
    patches: [] /* 2 */,
    phases: {} /* 3 */,
    current: null /* 4 */,
    skipUpdates: 0,
    timeLastUpdate: new Date(),
  }),
  getters: {
    /* without argument */
    isSet: (state) => Boolean(state.items.length),
    get: (state) => state.items,
    hasCurrent() {
      return this.isSet && this.current !== null;
    },
    getCurrent() {
      return this.hasCurrent ? this.items[this.current] : null;
    },
    getCurrentId() {
      return this.hasCurrent ? this.items[this.current].id : null;
    },
    getCurrentPosition() {
      return this.hasCurrent ? this.items[this.current].position : null;
    },
    getCurrentContent() {
      return this.hasCurrent ? this.items[this.current].content : '';
    },
    hasPatches: (state) => Boolean(state.patches.length),
    getPatches: (state) => state.patches,
    getNextPatch() {
      return head(this.patches);
    },
    getLastModified: (state) => {
      const segment = state.items
        .slice()
        .sort((a, b) =>
          compareAsc(getIso(a, 'lastModified'), getIso(b, 'lastModified'))
        )
        .pop();
      return segment && segment.lastModified ? segment : null;
    },

    /* with argument */
    phase: (state) => (segmentId) => state.phases[segmentId],
    // getById: state => id =>
    //     state.items.filter(item => item.id === id).pop() || null,
    getByPosition: (state) => (position) =>
      state.items
        .slice()
        .filter((item) => item.position === position)
        .pop() || null,
    isCurrent(segment) {
      return (
        this.hasCurrent && segment && segment.id === this.items[this.current].id
      );
    },
  },
  actions: {
    currentIdGetter() {
      const translationStore = useTranslationStore();
      const { currentId } = storeToRefs(translationStore);

      return currentId.value;
    },
    async request(requestUrl) {
      if (!requestUrl) return;
      requestUrl = cleanUrl(requestUrl);

      // parse the url to know how many segments were requested
      const limit = parseParameter('limit', requestUrl);
      const position = parseParameter('position', requestUrl);

      // reset segments and create dummies
      this.unsetCurrent();
      this.setMany(helpers.createDummyArray(position, min([limit, 9])));

      try {
        const data = await fetchAPI(requestUrl);
        this.setMany(data.results);
      } catch (e) {}
    },
    async requestUpdates(requestUrl) {
      if (!requestUrl) return;
      requestUrl = cleanUrl(requestUrl);

      // bail if requestUpdatesPostpone is not zero
      if (this.skipUpdates > 0) {
        this.skipUpdates--;
        return;
      }

      // get the timestamp
      // %Y-%m-%dT%H:%M:%S.%fZ, e.g. 2017-12-20T12:00:00.0000Z
      const timestamp = encodeURIComponent(this.timeLastUpdate.toISOString());
      this.timeLastUpdate = new Date();

      try {
        const data = await fetchAPI(
          requestUrl + '&last_modified__gte=' + timestamp,
          { interval: true, progress: false }
        );
        if (data.results.length === 0) {
          // slow down request interval if there are no changes
          this.setSkipUpdates(6);
        } else {
          // patch segments
          data.results.forEach((segment) => {
            if (this.getCurrentId === segment.id) return;
            this.patchOne(segment);
          });
        }
      } catch (e) {
        this.setSkipUpdates(6);
      }
    },
    addDummies(amount = 10) {
      this.setMany(helpers.createDummyArray(2, amount));
    },
    edited(segment) {
      const eventStore = useEventStore();

      this.addPatch(segment);
      this.phases[segment.id] = 'edited';

      // dispatch new event
      eventStore.new({ name: 'SEGMENT_EDITED', payload: segment.id });
    },
    async applyPatch() {
      // get first segment from pipe
      const patch = this.getNextPatch;
      if (!patch) return;
      this.removePatch(patch);
      this.phases[patch.id] = 'pending';

      const tId = this.currentIdGetter();

      try {
        const { data } = await patchAPI(
          `translations/${tId}/segments/${patch.position}/`,
          { content: patch.content, lastModified: patch.lastModified }
        );
        this.phases[patch.id] = 'saved';

        // patch segment
        this.patchOne({ ...patch, ...pickBy(data) });
      } catch (error) {
        this.phases[patch.id] = 'error';

        if (error.segment) {
          this.patchOne(error.segment);
        }
      }
    },
    async setCurrent(segment) {
      // bail if segment is the same as current
      if (segment.id === this.getCurrentId) return;

      const priorSegmentId = this.getCurrentId;
      this.setCurrentData(segment);

      const tId = this.currentIdGetter();

      try {
        const { data } = await storeAPI(
          `translations/${tId}/switched-segments/`,
          {
            priorSegmentId,
            currentSegmentId: segment.id || null,
          }
        );

        if (data.current.id)
          this.patchOne({
            ...data.current,
            force: true,
          });

        if (data.prior.id) this.patchOne({ ...data.prior, force: true });
      } catch (e) {}
    },
    async unsetCurrent() {
      if (!this.hasCurrent) return;

      const priorSegmentId = this.getCurrentId;

      this.current = null;

      const id = this.currentIdGetter();

      try {
        const { data } = await storeAPI(
          `translations/${id}/switched-segments/`,
          {
            priorSegmentId,
            currentId: null,
          }
        );
        if (data.current.id) this.patchOne(data.current);
        if (data.prior.id) this.patchOne(data.prior);
      } catch (e) {}
    },
    async vote(vote) {
      helpers.checkMissing(vote, ['position', 'role', 'setTo']);

      // set timestamp
      vote.timestamp = new Date();

      // notify backend
      const tId = this.currentIdGetter();

      try {
        const { data } = await storeAPI(
          `translations/${tId}/segments/${vote.position}/vote/`,
          vote
        );
        if (data.segment) this.patchOne(data.segment);
      } catch (e) {}
    },
    setMany(segments) {
      this.items = segments;
    },
    addMany(segments) {
      this.items = unionWith(
        segments,
        this.items,
        (a, b) => a.position === b.position
      ).sort((a, b) => a.position >= b.position);
    },
    removeAll() {
      this.items = [];
      this.current = null;
    },
    patchOne(patch) {
      const i = this.items.findIndex((item) => item.id === patch.id);
      if (i < 0) return;
      // patch only if 'lastModified' is newer
      if (
        isAfter(
          getIso(this.items[i], 'lastModified'),
          getIso(patch, 'lastModified')
        ) ||
        get(patch, 'force', false)
      ) {
        this.items[i] = { ...state.items[i], ...patch };
      }
    },
    setSkipUpdates(num) {
      this.skipUpdates = num;
    },
    timeLastUpdate() {
      this.timeLastUpdate = new Date();
    },
    setCurrentData(segment) {
      const i = this.items.findIndex((item) => item.id === segment.id);
      this.current = i >= 0 ? i : null;
    },
    addPatch(patch) {
      if ('dummy' in patch) return;
      const i = this.patches.findIndex((item) => item.id === patch.id);
      if (i < 0) {
        this.patches.push(patch);
      } else {
        this.patches[i] = patch;
      }
    },
    removePatch(patch) {
      const i = this.patches.findIndex((item) => item.id === patch.id);
      if (i < 0) return;
      this.patches.splice(i, 1);
    },
  },
});

/*
 * helpers
 ************************************/

const helpers = {
  createDummy(position = 1) {
    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.';

    return {
      classes: ['is-dummy'],
      content: lorem,
      created: 0,
      id: position,
      lastModified: 0,
      lockedBy: null,
      original: lorem,
      page: '',
      position,
      reference: 'Loading ...',
      tag: 'p',
      work: null,
    };
  },
  createDummyArray(startPosition, limit = 10) {
    startPosition = parseInt(startPosition);
    limit = parseInt(limit);
    if (isNaN(startPosition) || isNaN(limit)) return [];
    const array = [];
    for (let i = startPosition; i < startPosition + limit; i++) {
      array.push(this.createDummy(i));
    }
    return array;
  },
  checkMissing(payload = {}, array = []) {
    array.forEach((key) => {
      if (isUndefined(payload[key]))
        throw new Error(`payload is missing '${key}'`);
    });
  },
};
