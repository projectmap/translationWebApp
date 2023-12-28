import axios from 'axios';
import { getDataFromLocalStorage } from '~/helpers/apiCore';
import { joinURLSegments } from '~/helpers/urlBuilder';
import { useAuthStore, userAlertStore } from '~/store';

let unauthorizedRequestQueue = [];

export default defineNuxtPlugin(() => {
  const app = useNuxtApp();
  const authStore = useAuthStore();
  const alertStore = userAlertStore();

  const axiosInstance = axios.create({
    baseURL: joinURLSegments(app.$config.public.apiBaseUrl, ['api/']),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  axiosInstance.interceptors.request.use((request) => {
    const bearer = JSON.parse(
      getDataFromLocalStorage('auth-store')
    )?.accessToken;

    if (bearer) {
      request.headers.Authorization = `Bearer ${bearer}`;
    }

    return request;
  });

  let isRefreshingAccessToken = false;

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (err) => {
      const originalRequest = err.config;

      const { response } = err;

      if (!originalRequest) {
        return Promise.reject(err);
      }
      if (response?.status === 401) {
        try {
          const refreshToken = JSON.parse(
            getDataFromLocalStorage('auth-store')
          )?.refreshToken;

          if (!isRefreshingAccessToken) {
            isRefreshingAccessToken = true;

            const { token } = await authStore.fetchRefreshToken(refreshToken);

            if (token) {
              const newRequest = changeAccessToken(originalRequest, token);

              callRequestsFromUnauthorizedQueue(token);

              unauthorizedRequestQueue = [];

              isRefreshingAccessToken = false;
              return axiosInstance.request(newRequest);
            }
          }
          const retryRequest = new Promise((resolve) => {
            subscribeToAccessTokenRefresh((refreshedAccessToken) => {
              const newRequest = changeAccessToken(
                originalRequest,
                refreshedAccessToken
              );
              resolve(axiosInstance.request(newRequest));
            });
          });
          return retryRequest;
        } catch (e) {
          console.error(e);
        }
      } else {
        const errMessage =
          err?.response?.data?.message ||
          'Something went wrong, please try again.';

        alertStore.new({
          message: errMessage,
          color: 'red',
          duration: 5000,
        });
      }

      return Promise.reject(err);
    }
  );

  return {
    provide: {
      axios: axiosInstance,
    },
  };
});

/**
 * Changes access token of the provided request.
 *
 * @param {Object} originalRequest
 * @param {Object} newToken
 */
const changeAccessToken = (originalRequest, newToken) => {
  return {
    ...originalRequest,
    headers: {
      ...originalRequest.headers,
      Authorization: `Bearer ${newToken}`,
    },
  };
};

/**
 * Calls pending requests from unauthorized request queue.
 *
 * @param {String} refreshedAccessToken
 */
function callRequestsFromUnauthorizedQueue(refreshedAccessToken) {
  unauthorizedRequestQueue.map((cb) => cb(refreshedAccessToken));
}

/**
 * Subscribe retry request to access token refresh.
 * Add request to unauthorized request queue.
 *
 * @param {Function} callback
 */
function subscribeToAccessTokenRefresh(callback) {
  unauthorizedRequestQueue.push(callback);
}
