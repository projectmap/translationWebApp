<template>
  <div>
    <!-- Main Hero Section -->
    <section id="home" class="c-hero">
      <div class="o-wrapper o-wrapper--full-width c-hero__wrapper">
        <div class="c-hero__inner o-flex o-flex--center o-flex--middle">
          <div class="c-hero__inner-left">
            <div class="c-hero__img">
              <img src="~/assets/images/ellen.png" alt="ellen4all" />
            </div>
          </div>
          <div class="c-hero__inner-right">
            <h2 class="c-hero__blurb">
              <span>"Sharing the Gift of Light"</span> project, aims to
              translate 16 core <span>Ellen G. White</span> books into all of
              the world's major languages. <br />
              <br />It's a huge task, and your support of this undertaking is
              most appreciated.
            </h2>
            <button
              class="c-hero__login-btn c-btn c-btn--full-width"
              @click.prevent="signIn"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Translation Flow Section -->
    <section
      class="o-wrapper o-wrapper--full-width u-text-center c-flow__wrapper o-flex o-flex--center"
    >
      <ul class="c-flow">
        <li class="c-flow__item">
          <div class="c-flow__item-icon">
            <img src="~/assets/images/file-icon.png" />
          </div>
          <div class="c-flow__item__info">
            <p class="title">Translate</p>
            <p class="description">
              Provide a platform to manage the translation of Ellen G. White's
              writtings.
            </p>
          </div>
        </li>
        <li class="c-flow__item">
          <div class="c-flow__item-icon">
            <img src="~/assets/images/folder-icon.png" />
          </div>
          <div class="c-flow__item__info">
            <p class="title">Edit</p>
            <p class="description">
              Allow easy editing of Ellen G. White's translations.
            </p>
          </div>
        </li>
        <li class="c-flow__item">
          <div class="c-flow__item-icon">
            <img src="~/assets/images/send-circle-1.png" />
          </div>
          <div class="c-flow__item__info">
            <p class="title">Publish</p>
            <p class="description">
              Approved Ellen G. White's translations will be made available on
              <a href="https://egwwritings.org/">egwwritings.org</a>
              and associated apps and websites.
            </p>
          </div>
        </li>
      </ul>
    </section>

    <!-- About Us section -->
    <aboutus :egw-api="egwApi" />

    <!-- Project lists section -->
    <projects-list :egw-api="egwApi" :project-list="state.projectList" />

    <!-- Stats Section -->
    <global-stats :stats-result="state.statsResult" />

    <!-- Contact Form section -->
    <contact
      :message-sent="state.messageSent"
      :error-message="state.errorMessage"
      :error="state.error"
      @toggle-modal="toggleModal"
      @set-success-values="setValuesOnSuccess"
      @set-error-values="setValuesOnError"
    />

    <background-modal :open="state.modalOpen" :modal-text="state.modalText" />

    <modal
      :open="state.infoModalOpen"
      custom-classes="c-modal--completion"
      @update:open="toggleModal"
    >
      <div v-if="state.messageSent">
        <completion-modal @toggle-modal="closeModal">
          <p class="u-mb-- info-text">Thank you for reaching out to us!</p>
          <p class="u-mb-- sub-info-text">
            Our team will review your message and get back to you as soon as
            possible.
          </p>
        </completion-modal>
      </div>
      <div v-else-if="state.error">
        <error-modal @toggle-modal="closeModal">
          <p v-if="state.errorMessage" class="u-mb-- info-text">
            {{ state.errorMessage }}
          </p>
          <p v-else>
            Oops! Something went wrong and we were unable to process your
            request.
          </p>
          <p class="u-mb-- sub-info-text">Please try again later.</p>
        </error-modal>
      </div>
      <div v-else></div>
    </modal>
    <modal
      :open="state.inActiveUserModal"
      custom-classes="c-modal--completion"
      @update:open="toggleUserInactiveModal"
    >
      <error-modal @toggle-modal="closeUserInactiveModal">
        <p>The user you are trying to login with is currently inactive.</p>
        <p class="u-mb-- sub-info-text">
          Please select another user and try again.
        </p>
      </error-modal>
    </modal>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import { useAuthStore } from '~/store';
import { fetchAPI } from '~/helpers/apiCore';
import Modal from '@/components/structure/Modal.vue';
import Contact from '@/components/landingpage/Contact.vue';
import Aboutus from '@/components/landingpage/Aboutus.vue';
import GlobalStats from '@/components/landingpage/GlobalStats.vue';
import ProjectsList from '@/components/landingpage/ProjectsList.vue';
import BackgroundModal from '@/components/structure/BackgroundModal.vue';
import ErrorModal from '@/components/modal-content/timeline/ErrorModal.vue';
import CompletionModal from '@/components/modal-content/timeline/CompletionModal.vue';
import { joinURLSegments } from '~/helpers/urlBuilder';

definePageMeta({
  layout: 'overlay',
  public: true,
});

const runtimeConfig = useRuntimeConfig();
const { egwApi, apiBaseUrl } = runtimeConfig.public;

const state = reactive({
  pending: false,
  statsResult: {},
  projectList: [],
  error: false,
  errorMessage: null,
  modalOpen: false,
  modalText: 'Logging in...',
  infoModalOpen: false,
  messageSent: false,
  inActiveUserModal: false,
});

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const { authenticated, isOnline } = storeToRefs(authStore);

onBeforeMount(async () => {
  if (process.client) {
    if (authenticated.value) {
      router.replace('/dashboard');
    } else if (route?.query?.code) {
      state.modalOpen = true;
      state.modalText = 'Logging in ....';
      await authStore.fetchToken(route?.query?.code);
      state.modalOpen = false;
    }
  }
});

onMounted(() => {
  if (authenticated.value) {
    router.replace('/dashboard');
  }

  if (route?.query) {
    // eslint-disable-next-line
    if (route?.query['user_status']?.toLowerCase() === 'inactive') {
      state.inActiveUserModal = true;
    }
  }
  fetchProjectList();
});

onUnmounted(() => {
  state.modalOpen = false;
});

const fetchProjectList = async () => {
  state.pending = true;
  const url = 'work-public/';
  try {
    const { data: results } = await fetchAPI(url, {
      headers: {
        'x-auth': 'ZTRhbGw=',
      },
      public: true,
    });

    if (results?.basicStats) {
      state.statsResult = results?.basicStats;
    }

    if (results?.recentWork) {
      state.projectList = results?.recentWork;
    }
    state.error = false;
  } catch (e) {
    state.statsResult = {};
    state.projectList = [];
    state.errorMessage = e;
    state.error = true;
  }
  state.pending = false;
};

const signIn = () => {
  try {
    if (!isOnline.value && process.client) {
      router.push('/login');
      return;
    }

    if (!authenticated.value) {
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

const toggleModal = () => {
  state.infoModalOpen = !state.infoModalOpen;
};

const toggleUserInactiveModal = () => {
  state.inActiveUserModal = !state.inActiveUserModal;
};

const closeModal = () => {
  toggleModal();
  state.messageSent = false;
  state.error = false;
  state.errorMessage = null;
};

const closeUserInactiveModal = () => {
  toggleUserInactiveModal();
  router.replace('/');
};

const setValuesOnSuccess = () => {
  state.messageSent = true;
  state.error = false;
  state.errorMessage = null;
};

const setValuesOnError = (message) => {
  state.messageSent = false;
  state.error = true;
  state.errorMessage = message;
};
</script>

<style lang="scss">
.c-hero {
  // padding-bottom: $unit-large;
  padding: 130px 130px 100px 130px;

  .c-hero__wrapper {
    width: 1200px;
    max-width: 1900px;

    .c-hero__inner {
      margin: auto;
      .c-hero__inner-left {
        .c-hero__img {
          width: 520px;

          img {
            width: 100%;
          }
        }
      }

      .c-hero__inner-right {
        width: 490px;
        margin-left: 100px;

        .c-hero__blurb {
          color: $c-black-1;
          font-size: 25px;
          font-weight: 500;
          text-align: left;
          width: 100%;
          span {
            color: $c-primary-5;
            font-weight: 600;
          }
        }

        .c-hero__login-btn {
          margin-top: 70px;
          background: $c-primary-7;
          font-size: 18px;
          color: white;
          font-weight: 500;
          padding: 5px 24px;
        }
      }
    }
  }
}

.c-flow__wrapper {
  padding: 120px 130px;
  background: $c-gray-10;

  .c-flow {
    margin: 0;
    list-style: none;
    display: flex;
    width: 1200px;
    padding-inline-start: 0px;
    justify-content: space-between;
    .c-flow__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 90px;
      width: 368px;

      .c-flow__item-icon {
        height: 80px;
        width: 80px;
        img {
          width: 100%;
        }
      }

      .c-flow__item__info {
        width: 272px;
        text-align: left;

        .title {
          margin-bottom: 8px;
          font-weight: 400;
          font-size: 22px;
          line-height: 140%;
          color: $c-black-1;
        }

        .description {
          margin-bottom: 0px;
          font-weight: 400;
          font-size: 13px;
          line-height: 150%;
          color: rgba($color: #000000, $alpha: 0.8);
        }
      }
    }
  }
}
</style>
