export function getDataFromLocalStorage(key) {
  return localStorage.getItem(key);
}

export function setDataToLocalStorage(key, value) {
  localStorage.setItem(key, value);
}

export function clearLocalStorage() {
  localStorage.clear();
}

/**
 * Fetches data from given url
 */
export const fetchAPI = async (url, rest) => {
  const app = useNuxtApp();

  try {
    const response = await app.$axios(url, rest);

    if (response?.status === 200 || response?.status === 201) {
      return response?.data;
    }
    return response;
  } catch (e) {
    return e?.response;
  }
};

/**
 * post given data to url
 */
export const storeAPI = async (url, data, rest) => {
  const app = useNuxtApp();

  try {
    const response = await app.$axios.post(url, data, {
      ...rest,
    });
    if (response?.status === 200 || response?.status === 201) {
      return response?.data;
    }
    return response;
  } catch (e) {
    return e?.response;
  }
};

/**
 * Updates data
 */
export const updateAPI = async (url, data, rest) => {
  const app = useNuxtApp();

  try {
    const response = await app.$axios.put(url, data, {
      ...rest,
    });

    if (response?.status === 200 || response?.status === 201) {
      return response?.data;
    }
    return response;
  } catch (e) {
    return e?.response;
  }
};

/**
 * Patch Data
 */
export const patchAPI = async (url, data, rest) => {
  const app = useNuxtApp();
  try {
    const response = await app.$axios.patch(url, data, {
      ...rest,
    });

    if (response?.status === 200 || response?.status === 201) {
      return response?.data;
    }
    return response;
  } catch (e) {
    return e?.response;
  }
};

export default {
  fetchAPI,
  storeAPI,
  updateAPI,
  patchAPI,
};
