<template>
  <header class="c-header">
    <i
      v-show="!openMenu"
      class="u-icon c-hamburger--mobile"
      @click="openNavMenu"
    >
      view_headline
    </i>
    <!-- Header -->
    <div
      class="o-wrapper c-header__inner"
      :class="{
        'o-wrapper--full-width': fullwidth,
        'c-header__mobile': openMenu,
      }"
    >
      <i
        v-show="openMenu"
        style="width: 100%"
        class="u-icon c-closeicon--mobile"
        @click="openNavMenu"
        >close</i
      >
      <div
        v-show="openMenu"
        class="c-header__left u-truncate"
        @click="onNavigate"
      >
        <nuxt-link id="logo" to="/" class="c-header__logo">
          <img src="~/assets/images/logo-300.svg" alt="ellen4all logo" />
        </nuxt-link>

        <template v-if="authenticated">
          <nuxt-link to="/dashboard/" class="c-header__link u-ml-">
            Dashboard
          </nuxt-link>

          <!-- Translation Dropdown Menu -->
          <translation-dropdown-menu />
          <nuxt-link v-if="isGc" to="/library/" class="c-header__link u-ml-">
            Books
          </nuxt-link>
        </template>
      </div>

      <div class="c-header__right">
        <div
          v-show="!isOnline"
          class="offline-icon c-btn c-btn--primary c-btn--ghost c-btn-"
        >
          <i class="u-icon">cloud_off_outlined</i><span>Offline</span>
        </div>

        <div v-show="isOnline" class="notifications">
          <u-dropdown
            v-if="authenticated"
            placement="bottom"
            custom-classes="notification-dropdown"
            max-width="450px"
            min-width="450px"
          >
            <template #header> Notifications </template>
            <template #anchor>
              <div class="notification-anchor" @click="fetchAllNotifications">
                <i class="u-icon notification-bell">notifications</i>
                <div
                  v-if="notificationCount"
                  class="notification-count o-flex o-flex--middle o-flex--center"
                >
                  {{ notificationCount }}
                </div>
              </div>
            </template>

            <u-dropdown-item
              v-if="notificationsPending && isEmpty(notificationPayload)"
            >
              <div class="notification-content o-flex">
                <div class="notification-content__left">
                  <h3 class="message u-blind-text is-loading">
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry.
                  </h3>
                </div>
              </div>
            </u-dropdown-item>
            <u-dropdown-item
              v-else-if="!notificationsPending && isEmpty(notificationPayload)"
            >
              <div class="notification-content o-flex">
                <div class="notification-content__left">
                  <h3 class="message">No notifications</h3>
                </div>
              </div>
            </u-dropdown-item>

            <u-dropdown-item
              v-for="notification in notificationPayload"
              v-else
              :key="notification.id"
              type="nuxt-link"
              :url="notification.url ?? ''"
            >
              <div class="notification-content o-flex">
                <div class="notification-content__left">
                  <h3 class="message">
                    {{ notification.message }}
                    <span class="time">
                      {{ timeSince(notification.created) }} ago
                    </span>
                  </h3>
                  <p v-if="notification.chapter" class="sub-info">
                    Chapter - {{ notification.chapter }}
                  </p>
                </div>
                <div class="notification-content__right">
                  <span
                    v-if="!notification.isRead"
                    class="unread-indicator"
                  ></span>
                </div>
              </div>
            </u-dropdown-item>
          </u-dropdown>
        </div>

        <u-dropdown v-if="authenticated" placement="bottom">
          <template #header>
            Signed in as <strong>{{ username }}</strong>
          </template>
          <template #anchor>
            <user :user="userInfo" avatar passive />
            <span class="u-icon u-icon--small">arrow_drop_down</span>
          </template>
          <u-dropdown-item type="nuxt-link" url="/dashboard">
            Dashboard
          </u-dropdown-item>
          <u-dropdown-item
            v-if="isOnline"
            type="button"
            @click="downloadStatic"
          >
            Download
          </u-dropdown-item>
          <u-dropdown-item
            v-if="nuxtApp.$installEvent"
            type="button"
            @click="installE4a"
          >
            Install
          </u-dropdown-item>
          <u-dropdown-item v-if="isOnline" type="nuxt-link" url="/offline">
            Offline
          </u-dropdown-item>
          <u-dropdown-item
            v-if="isOnline"
            type="button"
            @click="settingsCpanel"
          >
            <div style="width: 100%">Your Profile</div>
          </u-dropdown-item>
          <!-- <u-dropdown-item type="divider"></u-dropdown-item> -->
          <u-dropdown-item type="button" @click="doLogout">
            <div style="width: 100%">Logout</div>
          </u-dropdown-item>
        </u-dropdown>
        <button v-else class="c-btn c-btn--green c-btn-" @click="signIn">
          Login
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import User from '../utilities/User.vue';
import TranslationDropdownMenu from './TranslationDropdownMenu.vue';

import { useAuthStore, useUserStore, userAlertStore } from '~/store';
import uDropdown from '~/components/utilities/Dropdown';
import uDropdownItem from '~/components/utilities/DropdownItem';
import { STORE_STATIC_ASSETS } from '~/service-worker/constants';
import { timeSince } from '~/helpers/Util';

defineProps({
  fullwidth: Boolean,
});

const nuxtApp = useNuxtApp();

const userStore = useUserStore();
const { name: username, getUser, isGc } = storeToRefs(userStore);

const authStore = useAuthStore();
const { authenticated, isOnline } = storeToRefs(authStore);

const alertStore = userAlertStore();
const { unreadNotificationCount, notificationPayload, notificationsPending } =
  storeToRefs(alertStore);

const runTimeConfig = useRuntimeConfig();
const { cpanelUrl } = runTimeConfig.public;

const openMenu = ref(false);
const isNotificationOpen = ref(false);

const notificationInterval = ref(null);

if (process.client) {
  if (window.innerWidth >= 576) {
    openMenu.value = true;
  }
}

const userInfo = computed(() => getUser.value);

const onNavigate = (event) => {
  // maybe in the future focus #site-content
  if (process.client) {
    if (window.innerWidth <= 576) {
      openMenu.value = false;
    }
  }
  event.target.blur();
};

const openNavMenu = () => {
  openMenu.value = !openMenu.value;
};

const settingsCpanel = () => {
  window.open(`${cpanelUrl}/accounts/profile`, '_blank');
};
const downloadStatic = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller.postMessage({
      type: STORE_STATIC_ASSETS,
      data: 'DATA',
    });
  } else {
    console.error('serviceWorker not available');
  }
};

const installE4a = () => {
  if (!nuxtApp.$installEvent) return;
  nuxtApp.$installEvent.prompt().then((choice) => {
    // Hide the install button as its purpose is over.
    if (choice.outcome === 'accepted') {
      nuxtApp.provide('installEvent', null);
    }
  });
};

const doLogout = () => {
  authStore.logout();
};

const notificationCount = computed(() =>
  unreadNotificationCount.value > 9 ? '9+' : unreadNotificationCount.value
);

const fetchAllNotifications = () => {
  isNotificationOpen.value = !isNotificationOpen.value;
  if (isNotificationOpen.value) {
    alertStore.fetchNotifications();
  }
};

onMounted(() => {
  if (isOnline.value) {
    notificationInterval.value = setInterval(() => {
      alertStore.fetchNotificationCount();
    }, 1000 * 60);
  }
});

onBeforeUnmount(() => {
  isOnline.value && clearInterval(notificationInterval.value);
});
</script>

<style lang="scss" scoped>
.c-dropdown__item {
  padding: 6px 12px;
  line-height: 1.5;
  text-align: left;
  min-height: fit-content;
}

.c-header {
  position: relative;
  z-index: 98;
  width: 100%;
  color: rgba($c-white, 0.8);
  background-color: $c-primary-9;
  border-bottom: 3px solid $c-primary-5;
  box-shadow: 0 -14px 20px 20px rgba($c-primary-5, 0.5),
    0 -4px 6px 6px rgba($c-primary-5, 0.2);

  &--overlay {
    position: absolute;
    background: none;
    padding-bottom: $unit-small;
    border-bottom-width: 0;
    box-shadow: none;
  }
}

.c-header__inner {
  height: $header-height;
  padding-top: $unit-small;
  padding-bottom: $unit-small;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-header__left,
.c-header__right {
  display: inline-block; /* fallback */
}

.c-header__left,
.c-header__right {
  display: flex;
  align-items: center;
}

// 1. jump over wrapper pseudo class
.c-header__right {
  position: relative;
  order: 99; /* 1 */

  .notifications {
    margin-right: 15px;

    .notification-anchor {
      position: relative;
      cursor: pointer;
      .notification-bell {
        font-size: 24px;
      }

      .notification-count {
        position: absolute;
        top: -4px;
        left: 12px;
        padding: 0 4px;
        min-width: 8px;
        height: 16px;
        border-radius: 22px;
        text-align: center;
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        background-color: #c00;
        color: #fff;
      }
    }
  }
}
.notification-content {
  width: 100%;

  .notification-content__left {
    width: 95%;
    .message {
      text-wrap: wrap;
      display: inline;
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      margin-bottom: 0px;
      .time {
        font-size: 14px;
        color: #6b778c;
        font-weight: 400;
        white-space: nowrap;
        margin-left: 4px;
      }
    }
    .sub-info {
      font-size: 11px;
      line-height: 14px;
      color: #6b778c;
    }
  }
  .notification-content__right {
    .unread-indicator {
      margin-left: auto;
      margin-top: 5px;
      padding: 0px;
      background-color: #579dff;
      z-index: 1;
      height: 8px;
      width: 8px;
      border-radius: 50%;
      position: relative;
      display: flex;
      -webkit-box-pack: center;
      justify-content: center;
      -webkit-box-align: center;
      align-items: center;
      outline: none;
    }
  }
}

.c-header__link {
  color: $c-primary-2;
  transition: color $global-transition;

  &.is-active {
    color: $c-white;
    font-weight: bold;
  }

  &:hover,
  &:focus {
    color: $c-white;
  }

  &.c-header__link-btn {
    border: 1px solid;
    border-color: $c-primary-2;
    width: 80px;
    height: 33px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 4px;
    transition: border $global-transition;

    &:hover,
    &:focus {
      border-color: $c-white;
    }
  }
}

.c-header__logo > img {
  max-height: $unit;
}

.c-user {
  &:hover,
  &:active {
    color: $c-white;
    cursor: pointer;
  }
}

.c-hamburger--mobile,
.c-closeicon--mobile {
  display: none;
}

.notification-dropdown {
  .v-overlay__content {
    .c-dropdown__inner {
      .c-scrollable {
        max-width: 400px !important;
      }
    }
  }
}

@media (max-width: 576px) {
  .c-hamburger--mobile,
  .c-closeicon--mobile {
    display: block;
    font-size: 35px;
    padding: 10px;
  }
  .c-header__mobile {
    height: 100%;
    padding: 0px;
    background: $c-primary-9;
    flex-direction: column;
    padding: 20px 0;
  }
  .c-header__mobile .c-header__left {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }
  .c-header__logo {
    position: absolute;
    top: 20px;
    right: 20px;
    img {
      max-height: 30px;
    }
  }

  .c-header {
    display: flex;
  }
  .c-header__inner {
    margin-left: 0px;
    margin-right: 0px;
    width: 100%;
  }
}

.c-dropdown__item {
  display: flex;

  &:first-child {
    margin-top: 6px;
  }
  .u-icon-left-u {
    margin-left: auto;
  }
}

.offline-icon {
  margin-right: 10px;
  color: #fff;

  span {
    padding-left: 10px;
  }

  i {
    color: #fff;
    // padding: 2px;
    width: 20px;
    font-size: 1.5rem;
  }
}
</style>
