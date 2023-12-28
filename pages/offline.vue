<script setup>
import { storeToRefs } from 'pinia';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength, requiredIf, sameAs } from '@vuelidate/validators';

import { Base64 } from '~/helpers/base64encrypt';
import { useUserStore, userAlertStore } from '~/store';
import { storeAPI, patchAPI } from '~/helpers/apiCore';
import { OFFLINE_CREDENTIAL } from '~/service-worker/constants';
import { saveToLocalDb, getLocalData } from '~/service-worker/db';

const user = useUserStore();
const alertStore = userAlertStore();

const { username } = storeToRefs(user);

const offlineUserInfo = await getLocalData(OFFLINE_CREDENTIAL);

const state = reactive({
  user: {
    name: username.value,
    password: '',
    confPassword: '',
  },
  isAlreadyExist: false,
  passwordVisible: false,
  confPassVisible: false,
});

const submittingForm = ref(false);

const userPassword = computed(() => {
  return state.user.password;
});

// Custom validator to check if the new password matches the old password
const sameAsPrevious = (value) =>
  Base64.encode(value) !== offlineUserInfo?.password;

const rules = {
  user: {
    name: { required },
    password: {
      required: requiredIf(function () {
        return !state.isAlreadyExist;
      }),
      minLength: minLength(6),
      sameAsPrevious,
    },
    confPassword: {
      required: requiredIf(function () {
        return !state.isAlreadyExist;
      }),
      sameAsPassword: sameAs(userPassword),
      minLength: minLength(6),
    },
  },
};

const v$ = useVuelidate(rules, state);

const resetValues = () => {
  state.user = {
    name: '',
    password: '',
  };
};

onMounted(() => {
  if (offlineUserInfo?.username) {
    state.user.name = offlineUserInfo.username
      ? offlineUserInfo.username
      : username.value;
    state.isAlreadyExist = true;
  }
});

const handleSubmit = async () => {
  try {
    v$.value.$touch();

    if (v$.value.$invalid) return;

    submittingForm.value = true;
    if (state.isAlreadyExist) {
      const payload = {};
      if (state.user.name !== offlineUserInfo?.username) {
        payload.username = state.user.name;
      }

      if (
        state.user.password &&
        Base64.encode(state.user.password) !== offlineUserInfo?.password
      ) {
        payload.password = state.user.password;
      }

      if (Object.keys(payload).length) {
        // Update User
        const { data } = await patchAPI(`/auth/offline-user/`, payload);

        if (data?.id) {
          await saveToLocalDb({ data, key: OFFLINE_CREDENTIAL });
          alertStore.new({
            message: 'Offline credentials updated successfully.',
            color: 'green',
            duration: 2000,
          });
          resetValues();
          v$.value.$reset();
        }
      }

      submittingForm.value = false;
    } else {
      const payload = {
        username: state.user.name,
        password: state.user.password,
      };

      // Register
      const { data } = await storeAPI(`/auth/offline-user/`, payload);

      if (data?.id) {
        await saveToLocalDb({ data, key: OFFLINE_CREDENTIAL });
        alertStore.new({
          message: 'Offline credentials saved successfully.',
          color: 'green',
          duration: 2000,
        });
        resetValues();
        v$.value.$reset();
      }
    }

    submittingForm.value = false;
  } catch (error) {
    resetValues();
    v$.value.$reset();
    submittingForm.value = false;
  }
};
</script>
<template>
  <div class="offline-registration">
    <h3>
      {{
        state.isAlreadyExist
          ? 'Update Credentials for Offline Mode'
          : 'Setup New Credentials for Offline Mode'
      }}
    </h3>
    <form class="offline-register__form" @submit.prevent="handleSubmit">
      <dl class="o-layout__item">
        <dt>
          <label for="username">Username <span>*</span></label>
        </dt>

        <dd>
          <input
            id="login_field"
            v-model="state.user.name"
            type="text"
            class="c-form-field"
            name="username"
            autocomplete="username"
            :class="{
              'c-input--outline-error': v$.$dirty && v$.user.name.$invalid,
            }"
          />
          <p
            v-if="v$.$dirty && v$.user.name.$invalid"
            class="c-form__error--small"
          >
            Username is required
          </p>
        </dd>
      </dl>
      <dl class="o-layout__item">
        <dt>
          <label for="password_field">
            {{ state.isAlreadyExist ? 'New Password' : 'Password' }}
            <span v-if="!state.isAlreadyExist">*</span>
          </label>
        </dt>
        <dd>
          <div class="input-indent-group">
            <input
              id="password_field"
              v-model="state.user.password"
              :type="state.passwordVisible ? 'text' : 'password'"
              class="c-form-field"
              :class="{
                'c-input--outline-error':
                  v$.$dirty && v$.user.password.$invalid,
              }"
              name="password"
              autocomplete="password"
            />
            <button
              class="c-btn c-btn--dark c-btn--primary"
              @click.stop.prevent="
                () => {
                  state.passwordVisible = !state.passwordVisible;
                }
              "
            >
              <i v-if="state.passwordVisible" class="u-icon">visibility_off</i>
              <i v-else class="u-icon">visibility</i>
            </button>
          </div>

          <p
            v-if="v$.$dirty && v$.user.password.minLength.$invalid"
            class="c-form__error--small"
          >
            Password should be at least 6 characters long
          </p>
          <p
            v-if="v$.$dirty && v$.user.password.required.$invalid"
            class="c-form__error--small"
          >
            Password is required
          </p>
          <p
            v-if="v$.$dirty && v$.user.password.sameAsPrevious.$invalid"
            class="c-form__error--small"
          >
            Invalid Password: Please enter a different password than your
            previous one.
          </p>
        </dd>
      </dl>
      <dl class="o-layout__item">
        <dt>
          <label for="password_field">
            Confirm Password
            <span v-if="!state.isAlreadyExist">*</span>
          </label>
        </dt>
        <dd>
          <div class="input-indent-group">
            <input
              id="password_field"
              v-model="state.user.confPassword"
              :type="state.confPassVisible ? 'text' : 'password'"
              class="c-form-field"
              :class="{
                'c-input--outline-error':
                  v$.$dirty && v$.user.confPassword.$invalid,
              }"
              name="password"
              autocomplete="password"
            />
            <button
              class="c-btn c-btn--dark c-btn--primary"
              @click.stop.prevent="
                () => {
                  state.confPassVisible = !state.confPassVisible;
                }
              "
            >
              <i v-if="state.confPassVisible" class="u-icon">visibility_off</i>
              <i v-else class="u-icon">visibility</i>
            </button>
          </div>
          <p
            v-if="v$.$dirty && v$.user.confPassword.minLength.$invalid"
            class="c-form__error--small"
          >
            Password should be at least 6 characters long
          </p>
          <p
            v-if="v$.$dirty && v$.user.confPassword.required.$invalid"
            class="c-form__error--small"
          >
            Password is required
          </p>
          <p
            v-if="v$.$dirty && v$.user.confPassword.sameAsPassword.$invalid"
            class="c-form__error--small"
          >
            Password does not match.
          </p>
        </dd>
      </dl>

      <dl class="o-layout__item">
        <button
          type="submit"
          class="c-btn c-btn--dark c-btn--primary c-btn__submit"
          :disabled="submittingForm"
        >
          <span
            v-if="submittingForm"
            class="c-spinner c-spinner--small c-spinner--inline"
          ></span>
          <span v-else>{{ state.isAlreadyExist ? 'Update' : 'Save' }}</span>
        </button>
      </dl>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.offline-registration {
  width: 400px;
  margin: 60px auto;
  border-radius: 8px;
  padding: 24px;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;

  h3 {
    font-size: 20px;
  }
  .offline-register__form {
    .o-layout__item {
      &:last-child {
        margin-bottom: 0px;
      }
      text-align: left;
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
}

.input-indent-group {
  display: flex;

  input {
    border-top-right-radius: 0px !important;
    border-bottom-right-radius: 0px !important;
    border-right: 0px !important;
  }

  button {
    height: 33.2px;
    width: 33.2px;
    padding: 0;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }
}
</style>
