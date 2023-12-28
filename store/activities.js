import get from 'lodash/get';
import { defineStore } from 'pinia';
import isArray from 'lodash/isArray';

import { fetchAPI } from '~/helpers/apiCore';
import sortListByDate from '~/helpers/sortListByDate';
import addDatesToList from '~/helpers/addDatesToList';

export const useActivitiesStore = defineStore({
  id: 'activities-store',
  state: () => ({
    items: [],
    pending: {
      request: false,
    },
  }),
  getters: {
    isSet: (state) => Boolean(state.items.length),
    isPending: (state) => (key) => get(state.pending, key),
    isResolved: (state) => (key) => !get(state.pending, key),
    get: (state) => state.items,
    getSorted: (state) => sortListByDate(state.items, 'date'),
    getLabeled: (state) => addDatesToList(state.items, 'date'),
  },
  actions: {
    async request(params) {
      this.pending('request');
      try {
        const data = await fetchAPI('user/last-activities/', {
          params,
        });

        if (data?.statusCode === 200) {
          this.setData(
            helpers.apiAdapter([
              ...data?.data?.votes,
              ...data?.data?.comments,
              ...data?.data?.segments,
            ])
          );
        }
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        this.resolved('request');
      }
    },
    pending(key) {
      this.$state.pending[key] = true;
    },
    resolved(key) {
      this.$state.pending[key] = false;
    },
    setData(items) {
      this.items = items;
    },
  },
});

/*
 * helpers
 ************************************/
export const helpers = {
  /*
   * Take the array returned by the 'user/last-activities' endpoint and bring
   * the different object types into a unified form
   */
  apiAdapter(list) {
    if (!isArray(list)) throw new Error('apiAdapter: list is not an array');

    const copy = [];
    list.forEach((item) => {
      const newItem = {};

      if (item.position) {
        // edit
        Object.assign(newItem, item);
        newItem.date = item.lastModified;
        newItem.type = 'edit';
        delete newItem.ai;
      } else if (item.comment) {
        // comment
        Object.assign(newItem, item.comment);
        newItem.date = item.comment.lastModified;
        newItem.segment = item.segment;
        newItem.reference = get(item.segment, 'reference', null);
        delete newItem.user;
      } else if (item.vote) {
        // vote
        Object.assign(newItem, item.vote);
        newItem.segment = item.segment;
        newItem.reference = get(item.segment, 'reference', null);
        if (newItem.role === 'reviewer') newItem.type = 'review';
        if (newItem.role === 'trunstee') newItem.type = 'authorization';
        delete newItem.user;
      }

      copy.push(newItem);
    });

    return copy;
  },
};
