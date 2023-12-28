import { getDataFromLocalStorage } from '~/helpers/apiCore';

export default defineNuxtRouteMiddleware((to) => {
  const store = JSON.parse(getDataFromLocalStorage('auth-store'));

  const isAuthenticated = store?.authenticated;
  const isOnline = store?.isOnline;

  // check if system is online and user is authenticated
  if (isOnline && isAuthenticated) return;

  // check if system is offline and user is authenticated and path is allowed
  if (!isOnline && isAuthenticated) {
    if (to.meta?.offline) return;

    return navigateTo('/dashboard');
  }

  if (
    !isOnline &&
    !isAuthenticated &&
    to.path !== '/' &&
    !to.path.includes('login')
  ) {
    return navigateTo('/');
  }

  if (to.meta?.public) return;

  return isOnline ? navigateTo('/') : navigateTo('/login');
});
