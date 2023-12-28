import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import { STORE_STATIC_ASSETS } from './constants';

import { userDataConditionCb, userDataHandlerCb } from './userHandler';
import { contactHandlerCb, contactConditionCb } from './contactHandler';
import { coverApiConditionCb, converApiHandlerCb } from './coverHandler';

import {
  tranlationDataHandlerCb,
  tranlationDataCondtionCb,
} from './translationHandler';

import {
  publicWorkApiConditionCb,
  publicWorkApiHandlerCb,
} from './publicWorkHandler';
import { openE4aDatabase } from './db';
import { clearServiceWorkerCache } from './helper';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  openE4aDatabase();
});

const manifest = self.__WB_MANIFEST;

const urls = [
  { url: '/', revision: Math.random().toString() },
  { url: '/dashboard', revision: Math.random().toString() },
  {
    url: '/translate/a/b/chapter/1/',
    revision: Math.random().toString(),
  },
];

const entries = [...urls, ...manifest];
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === STORE_STATIC_ASSETS) {
    // Create a logic to store static file other then precacheAndRoute()
    // precacheAndRoute(entries);
  }
  if (event.data && event.data.type === 'clearCache') {
    clearServiceWorkerCache();
  }
});

precacheAndRoute(entries);

// clean old assets
cleanupOutdatedCaches();

// TODO: figure out allow list
// allow only fallback in dev: we don't want to cache anything
let allowlist;
// if (import.meta.env.DEV) allowlist = [/^\/$/];

// TODO: deny api and server page calls
let denylist;
// if (import.meta.env.PROD) denylist = [];

// public api
registerRoute(publicWorkApiConditionCb, publicWorkApiHandlerCb, 'GET');

/**
 * Handling contact US POST
 */
registerRoute(contactConditionCb, contactHandlerCb, 'POST');

// Handling GET /api/user
registerRoute(userDataConditionCb, userDataHandlerCb, 'GET');

// Handling GET remaming /api
registerRoute(tranlationDataCondtionCb, tranlationDataHandlerCb, 'GET');

registerRoute(coverApiConditionCb, converApiHandlerCb, 'GET');

// to allow work offline
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/'), { allowlist, denylist })
);
