<template>
  <section
    id="contact"
    class="o-wrapper o-wrapper--full-width u-text-center c-contacts__wrapper o-flex o-flex--center"
  >
    <div class="c-contacts o-flex o-flex--middle">
      <div
        class="c-contacts__left o-flex o-flex--column"
        :class="{
          'move-left': showForm,
        }"
      >
        <p>We would love to hear from you 👋,</p>
        <div class="c-contacts__title">
          <h3>Get in touch</h3>
          <img class="wave-line" src="~/assets/images/wave-line.png" />
        </div>

        <ul class="c-contact__left-info">
          <li>
            <img src="~/assets/images/map-pin.png" />
            <span> 12501 Old Columbia Pk, Silver Spring, MD 20904, USA </span>
          </li>
          <li>
            <img src="~/assets/images/phone-circle.png" />
            <span>1 301 680 6540</span>
          </li>
        </ul>
        <button
          v-if="!showForm"
          class="c-btn c-btn--dark c-btn--primary c-btn__contact"
          @click.prevent="toggleForm"
        >
          <div>
            Contact Us
            <span class="u-icon u-icon--move">keyboard_arrow_right</span>
          </div>
        </button>
      </div>
      <div
        class="c-contacts__right"
        :class="{
          'move-left': showForm,
        }"
      >
        <form class="c-contacts__form" @submit.prevent="submitContactForm">
          <dl class="o-layout__item">
            <dt><label for="user-first-name">Full Name</label></dt>
            <dd>
              <input
                id="user-first-name"
                v-model="state.contactValues.name"
                type="text"
                name="user-first-name"
                :class="{
                  'c-input--outline-error':
                    v$.$dirty && v$.contactValues.name.$invalid,
                }"
                :disabled="submittingForm"
              />
            </dd>
          </dl>
          <dl class="o-layout__item">
            <dt><label for="user-email">Email</label></dt>
            <dd>
              <input
                id="user-email"
                v-model="state.contactValues.email"
                type="text"
                name="user-email"
                :class="{
                  'c-input--outline-error':
                    v$.$dirty && v$.contactValues.email.$invalid,
                }"
                :disabled="submittingForm"
              />
            </dd>
          </dl>
          <dl class="o-layout__item">
            <dt><label for="user-phone-number">Phone number</label></dt>
            <dd>
              <input
                id="user-phone-number"
                type="text"
                :value="state.contactValues.phone"
                name="user-phone-number"
                :class="{
                  'c-input--outline-error':
                    v$.$dirty && v$.contactValues.phone.$invalid,
                }"
                min="1"
                step="1"
                :disabled="submittingForm"
                maxlength="15"
                @input="handlePhoneNumber"
              />
            </dd>
          </dl>
          <dl class="o-layout__item">
            <dt><label for="user-enquiry">Your Enquiry</label></dt>
            <dd>
              <textarea
                id="user-enquiry"
                v-model="state.contactValues.message"
                name="user-enquiry"
                rows="5"
                :disabled="submittingForm"
                :class="{
                  'c-input--outline-error':
                    v$.$dirty && v$.contactValues.message.$invalid,
                }"
              />
            </dd>
          </dl>
          <dl class="o-layout__item">
            <button
              class="c-btn c-btn--dark c-btn--primary c-btn__submit"
              type="submit"
              :disabled="submittingForm"
            >
              <div
                v-if="submittingForm"
                class="c-spinner c-spinner--small"
              ></div>
              <div v-else>
                Submit
                <span class="u-icon u-icon--move">keyboard_arrow_right</span>
              </div>
            </button>

            <button
              v-if="!submittingForm"
              class="c-btn c-btn--ghost c-btn--primary c-btn__cancel"
              @click.prevent="closeForm"
            >
              <div>Cancel</div>
            </button>
          </dl>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { required, email, numeric } from '@vuelidate/validators';

import { storeAPI } from '~/helpers/apiCore';
import { CONTACT_US_KEY } from '~/service-worker/constants';
import { deleteLocalData, getLocalData } from '~/service-worker/db';

const state = reactive({
  contactValues: { name: '', email: '', phone: '', message: '' },
});

const emits = defineEmits([
  'toggle-modal',
  'set-success-values',
  'set-error-values',
]);

const submittingForm = ref(false);
const showForm = ref(false);

const rules = {
  contactValues: {
    name: { required },
    email: { required, email },
    phone: { required, numeric },
    message: { required },
  },
};

const v$ = useVuelidate(rules, state);

const handlePhoneNumber = (e) => {
  e.target.value = e.target.value.replace(/\D/g, '');
  state.contactValues.phone = e.target.value;
};

const closeForm = () => {
  toggleForm();
  resetValues();
  v$.value.$reset();
};

const toggleForm = () => {
  showForm.value = !showForm.value;
};

const resetValues = () => {
  state.contactValues = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };
};

onMounted(() => {
  window.addEventListener('online', async () => {
    const data = await getLocalData(CONTACT_US_KEY);
    if (data && data.name) {
      await storeAPI('contact/', data, {
        headers: {
          'x-auth': 'ZTRhbGw=',
        },
      }).then((res) => {
        if (res?.statusCode === 200) {
          deleteLocalData(CONTACT_US_KEY);
        }
      });
    }
  });
});

const submitContactForm = async () => {
  v$.value.$touch();

  if (v$.value.$invalid) return;

  submittingForm.value = true;

  await storeAPI('contact/', state.contactValues, {
    headers: {
      'x-auth': 'ZTRhbGw=',
    },
  })
    .then((res) => {
      if (res?.statusCode === 200) {
        submittingForm.value = false;
        emits('toggle-modal');
        emits('set-success-values');
        resetValues();
        v$.value.$reset();
      } else {
        submittingForm.value = false;
        const errorMessage = e.response?.data?.detai || null;
        emits('set-error-values', errorMessage);
        emits('toggle-modal');
      }
    })
    .catch((e) => {
      submittingForm.value = false;
      const errorMessage = e.response?.data?.detai || null;
      emits('set-error-values', errorMessage);
      emits('toggle-modal');
    });
};
</script>

<style lang="scss" scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}
.c-contacts__wrapper {
  padding: 120px 130px;
  background: $c-gray-10;
  overflow: hidden;
  .c-contacts {
    width: 1200px;
    .c-contacts__left {
      width: 50%;
      padding-left: 20px;
      transform: translateX(50%);
      align-items: center;
      transition: transform 1s ease;
      .c-contacts__title {
        position: relative;

        h3 {
          color: $c-black-1;
        }
        .wave-line {
          position: absolute;
          width: 393px;
          height: 70px;
          left: -15px;
          top: 50px;
        }
      }

      p {
        font-size: 22px;
        font-weight: 400;
      }

      h3 {
        font-size: 50px;
        font-weight: 600;
        margin-bottom: 0px;
      }

      .c-contact__left-info {
        list-style: none;
        margin-top: 100px;
        text-align: left;

        li {
          margin-bottom: 28px;
          font-weight: 400;
          font-size: 15px;
          color: rgba(39, 39, 39, 0.8);

          img {
            margin-right: 8px;
          }
        }
      }

      .c-btn__contact {
        width: fit-content;
      }

      &.move-left {
        transform: translateX(-50px);
        align-items: flex-start;
      }
    }
    .c-contacts__right {
      width: 50%;
      transition: transform 1s ease;
      transform: translateX(50%);
      .c-contacts__form {
        visibility: hidden;
        // transition: visibility 2s ease;

        .o-layout__item {
          text-align: left;
          width: 480px;
          dt {
            label {
              font-weight: 400;
              font-size: 13px;
              line-height: 130%;
              color: rgba(39, 39, 39, 0.52);
            }
          }
          dd {
            margin: 0px;
          }
          .c-btn__submit {
            margin-right: 5px;
          }
          .c-btn__submit,
          .c-btn__cancel {
            width: fit-content;
            height: 41px;
            padding: 7px 24px;
          }
        }
      }
      &.move-left {
        transform: translateX(-50px);
        .c-contacts__form {
          visibility: visible;
        }
      }
    }
  }
}

@media only screen and (max-width: 1200px) {
  .c-contacts__wrapper {
    padding: 100px;
    .c-contacts {
      width: fit-content;
    }
  }
}

@media only screen and (max-width: 1023px) {
  .c-contacts__wrapper {
    padding: 80px;
    .c-contacts {
      // flex-direction: column;
      position: relative;
      .c-contacts__left {
        width: 100%;
        padding-left: 0;
        .c-contacts__title {
          .wave-line {
            width: 250px;
            height: 60px;
          }
        }

        &.move-left {
          visibility: hidden;
        }
      }
      .c-contacts__right {
        width: 100%;
        align-items: center;
        .c-contacts__form {
          .o-layout__item {
            padding-left: 0px;
          }
        }
        &.move-left {
          transform: translateX(-50%);
        }
      }
    }
  }
}

@media only screen and (max-width: 767px) {
  .c-contacts__wrapper {
    padding: 50px;
    .c-contacts {
      .c-contacts__left {
        width: 100%;
        padding-left: 0;
        align-items: center;
        transform: translateX(0);
        .c-contacts__title {
          .wave-line {
            width: 250px;
            height: 60px;
          }
        }
      }
      .c-contacts__right {
        width: 0;
        margin-top: 30px;

        &.move-left {
          width: 100%;
          transform: translateX(-70%);
        }
      }
    }
  }
}

@media only screen and (max-width: 480px) {
  .c-contacts__wrapper {
    padding: 50px;
    .c-contacts {
      .c-contacts__left {
        width: 100%;

        padding-left: 0;
        align-items: center;

        .c-contacts__title {
          h3 {
            font-size: 40px;
          }

          .wave-line {
            top: 35px;
          }
        }

        .c-contact__left-info {
          text-align: center;
        }
      }
      .c-contacts__right {
        .c-contacts__form {
          .o-layout__item {
            width: 350px;
          }
        }

        &.move-left {
          width: 100%;
          transform: translateX(-100%);
        }
      }
    }
  }
}
</style>
