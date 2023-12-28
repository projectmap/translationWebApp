import { defineStore } from 'pinia';
import { clearLocalStorage, fetchAPI, storeAPI } from '~/helpers/apiCore';

export const useAuthStore = defineStore({
  id: 'auth-store',
  state: () => ({
    authenticated: false,
    accessToken: null,
    refreshToken: null,
    expTime: null,
    isOnline: false,
  }),
  getters: {
    isAuthenticated: (state) => state.authenticated,
  },
  actions: {
    offlineLogin() {
      const router = useRouter();
      const twelveHr = 12 * 60 * 60 * 1000;

      this.accessToken = this.accessToken ? this.accessToken : 'Offline';
      this.authenticated = true;
      this.refreshToken = this.refreshToken ? this.refreshToken : 'Offline';
      this.expTime = new Date().getTime() + twelveHr;
      router.replace('/dashboard');
    },
    async fetchToken(callbackCode) {
      const router = useRouter();

      try {
        const { data: response } = await fetchAPI(
          `callback?code=${callbackCode}`,
          {
            token: true,
          }
        );

        if (response?.token) {
          this.accessToken = response?.token;
          this.authenticated = true;
          this.refreshToken = response?.refresh_token;
          this.expTime = response?.exp_time;
          router.replace('/dashboard');
        } else {
          this.authenticated = false;
        }
        return response;
      } catch (e) {
        console.error(e);
      }
    },
    async fetchRefreshToken(refreshToken = this.refreshToken) {
      try {
        this.accessToken = null;

        const { data: response } = await storeAPI(
          `refresh-token/`,
          {
            refresh_token: refreshToken,
          },
          { token: true }
        );

        if (response?.token) {
          this.accessToken = response?.token;
          this.authenticated = true;
          this.refreshToken = response?.refresh_token;
          this.expTime = response?.exp_time;
        } else {
          this.logout();
        }

        return response;
      } catch (e) {
        console.error(e);
      }
    },
    logout() {
      const router = useRouter();

      clearLocalStorage();
      this.authenticated = false;
      this.accessToken = null;
      this.refreshToken = null;
      this.expTime = null;
      router.push('/');
    },
    onlineHandler(status = false) {
      this.isOnline = status;
    },
    // TODO: manage explict offline mode
  },
  persist: {
    storage: localStorage,
  },
});
