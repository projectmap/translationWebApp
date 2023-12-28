import last from 'lodash/last';
import { defineStore, storeToRefs } from 'pinia';
import { useAuthStore } from './auth';
import {
  fetchAPI,
  getDataFromLocalStorage,
  setDataToLocalStorage,
} from '~/helpers/apiCore';

export const userAlertStore = defineStore({
  id: 'alert-store',
  state: () => ({
    queue: [],
    seen: [],
    current: null,
    notificationsPending: false,
    notificationsError: null,
    notificationPayload: [],
    unreadNotificationCount: 0,
    totalNotifications: null,
    showVersionUpdateModal: false,
  }),
  getters: {
    isSet: (state) => state.queue.length,
    get: (state) => state.queue,
    getByIndex: (state) => (index) => state.queue[index],
    indexExists: (state) => (index) => index < state.queue.length,
    indexSeen: (state) => (index) => state.seen.includes(index),
    hasNext: (state) => last(state.seen) < state.queue.length,
    hasCurrent(state) {
      return this.isSet && state.current !== null;
    },
    getCurrent(state) {
      return this.hasCurrent ? state.queue[state.current] : null;
    },
    currentIsLast(state) {
      return this.hasCurrent && state.current < state.queue.length - 1;
    },
  },
  actions: {
    new(alert) {
      const defaults = {
        id: this.queue.length + 1,
        message: 'Message',
        color: null,
        duration: 5000,
        dismissable: true,
      };
      this.push({ ...defaults, ...alert });

      if (!this.hasCurrent) this.next();
    },
    next() {
      const next = this.current ? this.current + 1 : this.queue.length - 1;

      if (this.indexExists(next) && !this.indexSeen(next)) {
        this.setCurrent(next);
      } else {
        this.setCurrent(null);
      }
    },
    push(alert) {
      this.queue.push(alert);
    },
    setCurrent(index) {
      this.current = index;
      if (index !== null) this.seen.push(index);
    },
    async fetchNotificationCount() {
      const authStore = useAuthStore();
      const { isOnline } = storeToRefs(authStore);
      if (isOnline) {
        try {
          const data = await fetchAPI('notification/unread/');
          if (data?.statusCode === 200) {
            this.unreadNotificationCount = data?.data?.unreadNotification;
            this.totalNotifications = data?.data?.totalNotification;
          } else {
            this.unreadNotificationCount = 0;
          }
        } catch {
          this.unreadNotificationCount = 0;
        }
      }
    },
    async fetchNotifications() {
      this.notificationsPending = true;
      this.notificationsError = null;
      try {
        const data = await fetchAPI('notification/mark-as-read/');

        if (data?.statusCode === 200) {
          this.notificationPayload = data?.data;
        } else {
          this.notificationPayload = [];
        }
        this.notificationsPending = false;
      } catch {
        this.notificationPayload = [];
        this.notificationsPending = false;
      }
    },
    handleAppVersionUpdate() {
      const runtimeConfig = useRuntimeConfig();
      const { buildVersion } = runtimeConfig.public;

      const appVersion = getDataFromLocalStorage('BUILD_VERSION');

      if (appVersion) {
        if (appVersion.toString() === buildVersion.toString()) return;
        this.showVersionUpdateModal = true;
      } else {
        setDataToLocalStorage('BUILD_VERSION', buildVersion);
      }
    },
    closeVersionUpdateModal() {
      this.showVersionUpdateModal = false;
    },
  },
});
