<template>
  <div>
    <div class="c-modal--completion__body">
      <div class="c-modal--completion__body">
        <div class="c-modal--completion__body--lower --left">
          <slot></slot>
        </div>
      </div>
    </div>

    <div class="c-modal--completion__footer">
      <button class="c-btn--ghost c-btn--primary" @click.prevent="toggleModal">
        {{ denyBtnLabel }}
      </button>
      <button
        v-if="resubmit"
        class="c-btn--dark c-btn--primary"
        @click.prevent="sendBookForApproval"
      >
        {{ confirmBtnLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  timelineLink: { type: String, default: '' },
  denyBtnLabel: { type: String, default: 'Cancel' },
  confirmBtnLabel: { type: String, default: 'Confirm' },
  resubmit: { type: Boolean, default: false },
});

const emits = defineEmits(['toggle-modal', 'submit-approval']);

const toggleModal = () => {
  emits('toggle-modal');
};
const sendBookForApproval = (e) => {
  emits('submit-approval', e);
};
</script>

<style lang="scss">
.c-modal--completion {
  width: 460px;
  .c-modal__header {
    display: none;
  }

  .c-modal__body {
    padding: 12px 20px;
  }

  .c-modal--completion__header {
    text-align: right;
    .c-header__link {
      font-weight: 400 !important;
      font-size: 14px !important;
    }
  }

  .c-modal--completion__body {
    margin-top: 15px;

    .c-modal--completion__body--upper {
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      .mask-group-two {
        margin-top: auto;
      }

      .mask-group-one {
        margin-bottom: auto;
        margin-top: 10px;
      }
    }

    .c-modal--completion__body--lower {
      margin-bottom: 20px;
      &.--left {
        text-align: left;
      }
      p {
        text-align: center;
        font-weight: 400;
        font-size: 18px;
        line-height: 150%;
        color: #103d1f;

        &.info-text {
          font-size: 18px;
          font-weight: 600;

          span {
            color: $c-primary-5;
            text-decoration: underline;
          }
        }

        &.sub-info-text {
          font-size: 15px;
          font-weight: 400;
        }
      }
    }
  }
  .c-modal--completion__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid rgba(223, 227, 229, 0.6);
    padding: 20px 0 8px 0;
    button {
      padding: 7px 15px;
      height: fit-content;
      width: fit-content;
      cursor: pointer;
      &:nth-child(1) {
        margin-right: 10px;
        border-radius: 4px;
      }
    }
  }
}
</style>
