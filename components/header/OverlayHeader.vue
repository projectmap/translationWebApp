<template>
  <header class="c-header c-header--overlay">
    <!-- Header -->
    <div
      class="o-wrapper c-header__inner"
      :class="{
        'o-wrapper--full-width': fullwidth,
        'c-header__mobile': state.openMenu,
      }"
    >
      <div class="c-header__left u-truncate" @click="onNavigate">
        <nuxt-link id="logo" to="/" class="c-header__logo">
          <img src="~/assets/images/logo-300.png" alt="ellen4all logo" />
          <h6 v-show="!state.openMenu">Ellen4All</h6>
        </nuxt-link>
      </div>

      <div class="c-header__center o-flex o-flex--middle">
        <button
          class="c-header__link c-header__link--custom"
          :class="{ 'is-active': state.selectedNav === 'home' }"
          @click.prevent="goToHome"
        >
          Home
        </button>

        <button
          class="c-header__link c-header__link--custom"
          :class="{ 'is-active': state.selectedNav === 'about-us' }"
          @click.prevent="scrollToContent('about-us')"
        >
          About Us
        </button>
        <button
          class="c-header__link c-header__link--custom"
          :class="{ 'is-active': state.selectedNav === 'projects' }"
          @click.prevent="scrollToContent('projects')"
        >
          Projects
        </button>
        <button
          class="c-header__link c-header__link--custom"
          :class="{ 'is-active': state.selectedNav === 'contact' }"
          @click.prevent="scrollToContent('contact')"
        >
          Contact Us
        </button>
        <button
          v-show="state.openMenu"
          class="c-btn c-btn--primary c-btn--ghost c-btn-"
          @click="signIn"
        >
          Login
        </button>
      </div>

      <div class="c-header__right">
        <div
          v-show="!isOnline"
          class="offline-icon c-btn c-btn--primary c-btn--ghost c-btn-"
        >
          <i class="u-icon">cloud_off_outlined</i><span>Offline</span>
        </div>

        <button
          v-show="!state.openMenu"
          class="c-btn c-btn--primary c-btn--ghost c-btn-"
          @click="signIn"
        >
          Login
        </button>
        <i
          v-show="!state.openMenu"
          class="u-icon c-hamburger--mobile"
          @click="openNavMenu"
        >
          view_headline
        </i>
        <i
          v-show="state.openMenu"
          style="width: 100%"
          class="u-icon c-closeicon--mobile"
          @click="openNavMenu"
          >close</i
        >
      </div>
    </div>
    <background-modal :open="state.modalOpen" :modal-text="state.modalText" />
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import BackgroundModal from '@/components/structure/BackgroundModal.vue';

import { useAuthStore } from '~/store';

import { joinURLSegments } from '@/helpers/urlBuilder';

// Register props
const props = defineProps({
  fullwidth: Boolean,
});

const authStore = useAuthStore();
const { isOnline } = storeToRefs(authStore);

const router = useRouter();

const config = useRuntimeConfig();
const { apiBaseUrl } = config.public;

const { fullwidth } = toRefs(props);

// Register custom events

const emit = defineEmits(['scroll-section']);

const state = reactive({
  openMenu: false,
  selectedNav: null,
  modalOpen: false,
  modalText: 'Logging in...',
  authenticated: false,
});

onUnmounted(() => {
  state.modalOpen = false;
});

// Methods
const scrollToContent = (documentId) => {
  emit('scroll-section', documentId);
  state.selectedNav = documentId;
};

const signIn = () => {
  try {
    if (!isOnline.value && process.client) {
      router.push('/login');
      return;
    }

    if (!state.authenticated) {
      window.location = joinURLSegments(apiBaseUrl, [
        'accounts/login/auth-server',
      ]);

      state.modalOpen = true;
      state.modalText = 'Logging in ....';
    } else if (process.client) {
      router.replace('/dashboard');
    }
  } catch (e) {
    state.modalOpen = false;
  }
};
</script>

<style lang="scss" scoped>
.c-header {
  position: absolute;
  z-index: 98;
  width: 100%;
  background: white;

  .c-header__left,
  .c-header__right {
    display: flex;
    align-items: center;
  }
  .c-header__inner {
    padding: 10px 130px;
    height: $header-height;
    padding-top: $unit-small;
    padding-bottom: $unit-small;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .c-header__left {
      .c-header__logo > img {
        max-height: $unit;
      }
      .c-header__logo {
        display: flex;
        align-items: baseline;

        img {
          max-height: 40px;
          width: 60px;
        }
        h6 {
          margin-bottom: 0px;
          font-weight: 400;
          font-size: 35px;
          line-height: 50px;
          color: $c-primary-7;
        }
      }
      a {
        color: rgba($color: #000000, $alpha: 0.6);
      }
    }

    .c-header__center {
      margin-left: auto;
      margin-right: auto;
    }

    .c-header__right {
      position: relative;
      order: 99; /* 1 */

      .c-bell {
        background: none;
      }

      .c-hamburger--mobile,
      .c-closeicon--mobile {
        display: none;
      }
    }

    .c-header__link {
      color: rgba($color: #000000, $alpha: 0.6);
      transition: color $global-transition;
      margin-right: 40px;

      &:after {
        content: '';
        display: block;
        margin: auto;
        height: 3px;
        width: 0px;
        background: transparent;
        transition: width 0.5s ease, background-color 0.5s ease, color 0.5s ease;
      }

      &.is-active {
        color: $c-primary-7;
        font-weight: 600;

        &:after {
          width: 100%;
          background: $c-primary-7;
        }
      }

      &:hover,
      &:focus {
        color: $c-primary-7;

        &:after {
          width: 100%;
          background: $c-primary-7;
        }
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

      &.c-header__link--custom {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
      }
    }
  }
}

@media (max-width: 576px) {
}

@media only screen and (max-width: 1023px) {
  .c-header {
    .c-header__inner {
      padding: 10px 80px;
      .c-header__left {
        .c-header__logo {
          img {
            width: 50px;
          }
          h6 {
            font-size: 30px;
          }
        }
      }
    }
  }
}

@media only screen and (max-width: 767px) {
  .c-header {
    .c-header__inner {
      padding: 10px 50px;

      &:not(.c-header__mobile) {
        .c-header__center {
          display: none;
        }
      }

      &.c-header__mobile {
        height: 100%;
        background: #f2f4fb;
        padding-top: 20px;
        align-items: flex-start;

        .c-header__center {
          flex-direction: column;

          .c-header__link {
            margin-bottom: 15px;
            margin-right: 0px;
          }
        }
      }

      .c-header__left {
        .c-header__logo {
          img {
            width: 50px;
          }
          h6 {
            font-size: 30px;
          }
        }
      }

      .c-header__right {
        .c-hamburger--mobile,
        .c-closeicon--mobile {
          display: block;
          font-size: 35px;
          padding: 10px;
          cursor: pointer;
          color: $c-primary-5;
        }
      }
    }
  }
}

@media only screen and (max-width: 480px) {
  .c-header {
    .c-header__inner {
      padding: 10px 0 10px 20px;

      &.c-header__mobile {
        padding-top: 10px;

        .c-header__center {
          padding-top: 10px;
        }
      }

      .c-header__left {
        .c-header__logo {
          h6 {
            display: none;
          }
        }
      }
    }
  }
}
.offline-icon {
  margin-right: 10px;
  color: $c-primary-6;

  :hover {
    color: $c-white;
  }

  span {
    padding-left: 10px;
  }

  i {
    color: inherit;
    // padding: 2px;
    width: 20px;
    font-size: 1.5rem;
  }
}
</style>
