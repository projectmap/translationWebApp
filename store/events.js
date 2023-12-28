import { defineStore } from 'pinia';
import get from 'lodash/get';
import keys from 'lodash/keys';
import maxBy from 'lodash/maxBy';

export const useEventStore = defineStore({
  id: 'events-store',
  state: () => ({
    events: {},
  }),
  getters: {
    getEvent: (state) => (name) => {
      return get(state.events, name);
    },
    getAny() {
      return get(
        this.events,
        maxBy(keys(this.events), (e) => this.events[e].id)
      );
    },
    getLastId() {
      return get(this.getAny, 'id', 0);
    },
  },
  actions: {
    new(event) {
      const defaults = {
        id: this.getLastId + 1,
        name: 'DEFAULT',
        payload: null,
      };
      Object.assign(this.events, { ...defaults, ...event });
    },
  },
});
