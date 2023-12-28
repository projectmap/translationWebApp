import get from 'lodash/get';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use('get', get);
});
