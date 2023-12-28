import get from 'lodash/get';
import { defineStore, storeToRefs } from 'pinia';

import { useAuthStore } from './auth';
import { useTranslationStore } from './translations';
import {
  fetchAPI,
  getDataFromLocalStorage,
  patchAPI,
  setDataToLocalStorage,
  storeAPI,
} from '~/helpers/apiCore';
import { getLocalData, saveToLocalDb } from '~/service-worker/db';
import { OFFLINE_CREDENTIAL } from '~/service-worker/constants';
import { Base64 } from '~/helpers/base64encrypt';

export const useUserStore = defineStore({
  id: 'users-store',
  state: () => ({
    url: null,
    id: null,
    username: '',
    firstName: '',
    lastName: '',
    thumbnail: null,
    status: null,
    isVerified: false,
    filterSelected: null,
    filterType: null,
    pending: {
      request: false,
    },
    profile: null,
    gcStatus: false,
    adminStatus: false,
    roles: [],
    downloadInfo: {},
  }),
  getters: {
    isAuthenticated() {
      const authStore = useAuthStore();
      const { authenticated } = storeToRefs(authStore);
      return authenticated.value;
    },
    name: (state) => state.username,
    getUser: (state) => state,
    getLanguage: (state) => state.language || null,
    languageCode: (state) => get(state.language, 'code'),
    permissions(state) {
      get(state.permissions, this.languageCode, null);
    },
    can() {
      return (key) => {
        get(this.permissions, key, false);
      };
    },
    role() {
      if (this.can('trustee')) return 'Publisher';
      if (this.can('reviewTranslation')) return 'Reviewer';
      return 'Translator';
    },
    isAdmin: (state) => state.adminStatus || false,
    isGc: (state) => state.gcStatus || false,
    userRoles: (state) => state.roles || null,
    userRoleByWorkId: (state) => (workid) => {
      return state.roles?.find((role) => role.work === workid)?.role || [];
    },
    userDownloadInfo: (state) => {
      return state.downloadInfo || {};
    },
  },
  actions: {
    async getInitialDatas() {
      const translationStore = useTranslationStore();
      this.requestLocalData();
      if (!this.id) {
        await this.requestFullProfile();
      }

      this.setFilterLanguage(this.language);
      translationStore.setCurrentLanguage(this.language);
    },
    async requestFullProfile() {
      if (!this.isAuthenticated) return helpers.getUnauthenticatedError();
      try {
        const { data } = await fetchAPI(`user/`);
        if (data) {
          this.set(data);
          setDataToLocalStorage(
            'user',
            Base64.encode(
              JSON.stringify({
                id: data.id,
                username: data.username,
                gcStatus: data.gcStatus,
                adminStatus: data.adminStatus,
                thumbnail: data.thumbnail,
              })
            )
          );

          if (data.language) {
            this.setLanguage(response.language);
          }

          const offlineData = await getLocalData(OFFLINE_CREDENTIAL);

          if (
            data?.hasRole &&
            (!offlineData?.createdBy || offlineData.createdBy !== data.id)
          ) {
            const { data } = await fetchAPI(`/auth/offline-user/`);

            if (data?.id) {
              await saveToLocalDb({ data, key: OFFLINE_CREDENTIAL });
            }
          }
        }
      } catch (e) {}
    },
    requestLocalData() {
      const data = getDataFromLocalStorage('user');
      if (data) {
        const localUserData = JSON.parse(
          Base64.decode(getDataFromLocalStorage('user'))
        );
        if (localUserData?.id) {
          this.adminStatus = localUserData?.adminStatus;
          this.gcStatus = localUserData?.gcStatus;
          this.username = localUserData?.username;
          this.thumbnail = localUserData?.thumbnail;
        }
      }
    },
    setLanguage(language) {
      this.patch({ language });
      return this.update({
        language: get(language, 'code'),
      });
    },
    setFilterLanguage(language) {
      this.set({ filterSelected: language });
    },
    setFilterType(type) {
      this.set({ filterType: type });
    },
    async update(data) {
      if (!this.isAuthenticated) helpers.getUnauthenticatedError();
      try {
        const { data: response } = await patchAPI(`user/`, data);
        this.patch(response);
      } catch (e) {}
    },
    set(data) {
      for (const prop in data) {
        if (data[prop] === '<') return;
        Object.assign(this.$state, data);
      }
    },
    patch(data) {
      Object.assign(this.$state, data);
    },
    setName(name) {
      this.username = name;
    },
    async retrieveUsersListBySearchType(params) {
      const { data } = await storeAPI('retrive-users/', params);
      return data;
    },
  },
});

/*
 * helpers
 ************************************/
const helpers = {
  getUnauthenticatedError: () =>
    new Error('You are not logged in or your login has expired'),
};
