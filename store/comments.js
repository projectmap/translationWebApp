import { defineStore } from 'pinia';
import isEqual from 'lodash/isEqual';
import { useUserStore } from './users';
import { cleanUrl } from '@/helpers/Util';
import { fetchAPI, patchAPI, storeAPI, updateAPI } from '@/helpers/apiCore';

export const useCommentsStore = defineStore({
  id: 'comments-store',
  state: () => ({
    items: [],
    url: null,
    loading: false,
    error: false,
  }),
  getters: {
    url: (state) => state.url,
    getItems: (state) => state.items,
    getCount: (state) =>
      state.items.filter((item) => item.toDelete === null).length,
    has() {
      return Boolean(this.getCount);
    },
  },
  actions: {
    async request(config) {
      if (!config.url) return;
      config.url = cleanUrl(config.url);
      this.setUrl(config.url);
      this.requestPending();

      try {
        const { data } = await fetchAPI(config.url, config);
        this.requestSuccess();
        this.setAll(data.results.reverse());
      } catch (error) {
        this.requestError(error);
      }
    },
    async requestUpdate(config) {
      try {
        const { data } = await fetchAPI(this.url, config);
        const newItems = data.results.reverse();
        const oldItems = this.getItems;
        for (let i = 0; i < newItems.length; i++) {
          if (i >= oldItems.length) {
            this.addOne(newItems[i]);
          } else if (!isEqual(newItems[i], oldItems[i])) {
            this.updateOne(newItems[i]);
          }
        }
      } catch (e) {}
    },
    async create(content) {
      const userStore = useUserStore();
      const newComment = {
        content,
        created: new Date().toISOString(),
        user: userStore.getUser,
        saved: false,
        deleted: false,
      };
      // add comment object to comments
      this.addOne(newComment);
      try {
        const { data } = await storeAPI(this.url, { content });
        this.updateLast({ ...data, saved: true });
      } catch (e) {}
    },
    async update(comment) {
      this.patchOne({ ...comment, saved: false });
      try {
        const { data } = await updateAPI(this.url + comment.id + '/', {
          content: comment.content,
        });
        this.updateOne({ ...data, saved: true });
      } catch (e) {}
    },
    async delete(comment) {
      this.patchOne({ ...comment, toDelete: new Date().toISOString() });
      try {
        const { data } = await patchAPI(this.url + comment.id + '/', {
          delete: true,
        });
        this.updateOne({ ...data, saved: true });
      } catch (e) {}
    },
    undelete(_, comment) {
      this.patchOne({ ...comment, toDelete: null });

      try {
        patchAPI(this.url + comment.id + '/', { delete: false });
      } catch (e) {}
    },
    setUrl(url) {
      this.url = url;
    },
    requestPending() {
      this.loading = true;
    },
    requestSuccess() {
      this.loading = false;
    },
    requestError() {
      this.loading = false;
    },
    setAll(comments) {
      comments.forEach((item) => (item.saved = true));
      this.items = comments;
    },
    removeAll() {
      this.items = [];
      this.current = null;
    },
    addOne(comment) {
      this.items.push(comment);
    },
    updateOne(comment) {
      const i = comment.i || helpers.findIndexById(this.items, comment.id);
      if (i < 0) return;
      Vue.set(this.items, i, comment);
    },
    updateLast(comment) {
      Vue.set(this.items, this.items.length - 1, comment);
    },
    patchOne(patch) {
      const i = patch.i || helpers.findIndexById(this.items, patch.id);
      if (i < 0) return;
      Vue.set(this.items, i, { ...this.items[i], ...patch });
    },
  },
});

/*
 * helpers
 ************************************/

const helpers = {
  findIndexById: (items, id) =>
    items.findIndex((item) => item.id === Number(id)),
};
