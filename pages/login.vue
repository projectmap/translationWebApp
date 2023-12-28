<script setup>
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';

import { useAuthStore } from '~/store';
import { Base64 } from '~/helpers/base64encrypt';
import { getLocalData } from '~/service-worker/db';
import { OFFLINE_CREDENTIAL } from '~/service-worker/constants';

const authStore = useAuthStore();

definePageMeta({
  layout: 'empty',
  public: true,
});

const state = reactive({
  username: '',
  password: '',
  submittingForm: false,
  error: '',
});

const rules = {
  username: { required },
  password: { required },
};

const v$ = useVuelidate(rules, state);

const login = async () => {
  try {
    v$.value.$touch();

    if (v$.value.$invalid) return;

    state.submittingForm = true;

    const offlineData = await getLocalData(OFFLINE_CREDENTIAL);

    if (!offlineData?.username) {
      state.error = 'Offline Creadentils is not setup';
      state.submittingForm = false;
      return;
    }

    if (state.username !== offlineData?.username) {
      state.error = 'Username not matched';
      state.submittingForm = false;

      return;
    }

    if (Base64.encode(state.password) !== offlineData?.password) {
      state.error = 'Password not matched';
      state.submittingForm = false;

      return;
    }

    await authStore.offlineLogin();

    state.submittingForm = false;
  } catch (error) {
    console.error(error);
    state.submittingForm = false;
  }
};
</script>

<template>
  <div class="login">
    <div class="login__header">
      <div class="login__header__logo">
        <img src="~/assets/images/logo-300.png" alt="ellen4all logo" />
        <h6>Ellen4All</h6>
      </div>
    </div>
    <div class="login__left">
      <div class="login__left-text">
        <img src="@/assets/images/cloudcross.png" alt="offline-cloud" />
        <h3>You are using offline mode</h3>
        <p>Get online to access online functionalities</p>
      </div>
    </div>
    <div class="login__right">
      <div class="login__right-inner">
        <h3>Login</h3>
        <form class="login__right-form" @submit.prevent="login">
          <dl class="o-layout__item">
            <dt v-if="state.error" class="mb-2 c-form__error">
              {{ state.error }}
            </dt>
            <dt>
              <label for="username">Username <span>*</span></label>
            </dt>
            <dd>
              <input
                id="username"
                v-model="state.username"
                type="text"
                name="username"
                :class="{
                  'c-input--outline-error': v$.$dirty && v$.username.$invalid,
                }"
                :disabled="state.submittingForm"
              />
              <p
                v-if="v$.$dirty && v$.username.$invalid"
                class="c-form__error--small"
              >
                Username is required
              </p>
            </dd>
          </dl>
          <dl class="o-layout__item">
            <dt>
              <label for="password">Password <span>*</span></label>
            </dt>
            <dd>
              <input
                id="password"
                v-model="state.password"
                type="password"
                name="password"
                :class="{
                  'c-input--outline-error': v$.$dirty && v$.password.$invalid,
                }"
                :disabled="state.submittingForm"
              />
              <p
                v-if="v$.$dirty && v$.password.$invalid"
                class="c-form__error--small"
              >
                Password is required
              </p>
            </dd>
          </dl>

          <dl class="o-layout__item">
            <button
              class="c-btn c-btn--dark c-btn--primary c-btn__submit"
              type="submit"
            >
              <div
                v-if="state.submittingForm"
                class="c-spinner c-spinner--small"
              ></div>
              <div v-else>Login</div>
            </button>
            <span class="offline-message--mobile">
              <div class="u-icon">cloud_off</div>
              You are currently using offline mode.</span
            >
          </dl>
        </form>

        <div class="login__right-points">
          <p>By logging in offline</p>
          <ul>
            <li>You won't be able to sync with new project updates.</li>
            <li>
              Updates you made will only be updated once you are back online.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login {
  display: flex;
  height: 100vh;
  position: relative;
}

.login__left {
  width: 40%;
  display: flex;
  flex-direction: column;
  background-color: #f8f8f8;
}

.login > .login__header > .login__header__logo {
  display: flex;
  align-items: baseline;
  position: absolute;
  left: 40px;
  top: 20px;
  img {
    max-height: 40px;
    width: 60px;
  }
  h6 {
    margin-bottom: 0px;
    font-weight: 400;
    font-size: 22px;
    line-height: 50px;
    color: $c-primary-7;
  }
}

.login__left > .login__left-text {
  width: 282px;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  img {
    width: 130px;
    margin-bottom: 20px;
  }
  h3 {
    font-weight: 600;
    font-size: 35px;
    text-align: center;
    margin-bottom: 24px;
  }

  p {
    font-size: 15px;
    width: 100%;
    font-weight: 400;
    color: rgba($color: #272727, $alpha: 0.8);
    margin-bottom: 0px;
  }
}

.login__right {
  width: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login__right > .login__right-inner {
  width: 530px;
  h3 {
    font-size: 35px;
    font-weight: 600;
  }

  .offline-message--mobile {
    display: none;
  }
}

.login__right > .login__right-inner > .login__right-form {
  .o-layout__item {
    text-align: left;
    width: 480px;
    padding-left: 0;
    dt {
      label {
        font-weight: 400;
        font-size: 14px;
        line-height: 130%;
        color: rgba(39, 39, 39, 0.52);

        span {
          color: red;
        }
      }
    }
    dd {
      margin: 0px;
    }

    .c-btn__submit {
      width: 100%;
      font-size: 18px;
      color: white;
      font-weight: 500;
      padding: 5px 24px;
      height: unset;
    }
  }

  .c-form__error--small {
    font-size: 12px;
  }
}

.login__right > .login__right-inner > .login__right-points {
  margin-top: 10px;
  p {
    color: rgba($color: #272727, $alpha: 0.7);
    font-size: 17px;
    font-weight: 400;
    line-height: 30px;
    letter-spacing: 0.0015em;
    text-align: left;
    margin-bottom: 15px;
  }
  ul {
    li {
      font-size: 15px;
      font-weight: 400;
      line-height: 24px;
      letter-spacing: 0.005em;
      text-align: left;
      color: rgba($color: #272727, $alpha: 0.6);
    }
  }
}

@media only screen and (max-width: 1400px) {
}

@media only screen and (max-width: 1200px) {
}

@media only screen and (max-width: 1023px) {
}

@media only screen and (max-width: 767px) {
  .login {
    display: flex;
    flex-direction: column-reverse;
    height: fit-content;
  }

  .login__left {
    display: none;
  }

  .login__right {
    width: 100%;
    margin-top: 20%;
  }

  .login__right > .login__right-inner {
    .offline-message--mobile {
      display: block;
      font-style: italic;
      font-weight: 500;
      font-size: medium;
    }
  }
}

@media only screen and (max-width: 480px) {
}
</style>
