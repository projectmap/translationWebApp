<template>
  <div class="step funding-step">
    <div class="step-container">
      <div class="step-form">
        <div class="form-row o-flex">
          <div class="form-item form-item--full-width">
            <p class="form-label">Are you requesting funding for this book ?</p>
            <div class="o-flex">
              <!-- MIGHT NEED FOR LATER USE -->
              <!-- <label class="o-flex o-flex--middle radio-btn">
                <input
                  type="radio"
                  :value="true"
                  v-model="applyFunding"
                  @input="() => onUpdate('applyFunding', true)"
                />
                Yes
              </label>

              <label class="o-flex o-flex--middle radio-btn">
                <input
                  type="radio"
                  :value="false"
                  v-model="applyFunding"
                  @input="() => onUpdate('applyFunding', false)"
                />
                No
              </label> -->
            </div>
          </div>
        </div>
        <div class="form-row o-flex">
          <div class="form-item form-item--full-width o-flex o-flex--column">
            <p class="form-label">Select the areas you need funding for</p>
            <div class="areas-selections o-flex">
              <button
                class="o-flex o-flex--column o-flex--center o-flex--middle"
                :class="{ active: translate }"
                @click="onUpdate('translate')"
              >
                <i class="u-icon">translate</i>
                <span>Translate</span>
              </button>
              <button
                class="o-flex o-flex--column o-flex--center o-flex--middle"
                :class="{ active: ebook }"
                @click="onUpdate('ebook')"
              >
                <i class="u-icon">book</i>
                <span>Ebook</span>
              </button>
              <button
                class="o-flex o-flex--column o-flex--center o-flex--middle"
                :class="{ active: audioBook }"
                @click="onUpdate('audioBook')"
              >
                <i class="u-icon">headset</i>
                <span>Audiobook</span>
              </button>
              <button
                class="o-flex o-flex--column o-flex--center o-flex--middle"
                :class="{ active: publish }"
                @click="onUpdate('publish')"
              >
                <i class="u-icon">cloud_upload</i>
                <span>Publish</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentStep: { type: Number, default: 1 },
  applyFunding: { type: Boolean, default: false },
  translate: { type: Boolean },
  publish: { type: Boolean },
  ebook: { type: Boolean },
  audioBook: { type: Boolean },
});

const emits = defineEmits(['update-form-data']);

const onUpdate = (key, value) => {
  switch (key) {
    case 'translate':
      emits('update-form-data', 'translate', !props.translate);
      break;

    case 'ebook':
      emits('update-form-data', 'ebook', !props.ebook);
      break;

    case 'publish':
      emits('update-form-data', 'publish', !props.publish);
      break;

    case 'audioBook':
      emits('update-form-data', 'audio_book', !props.audioBook);
      break;

    case 'applyFunding':
      emits('update-form-data', 'apply_funding', value);
      break;
  }
};
</script>

<style lang="scss" scoped>
.areas-selections {
  button {
    width: 100px;
    height: 82px;
    border-radius: 8px;
    border: 1px solid #a9adaf;
    background: transparent;
    cursor: pointer;
    &:not(:last-child) {
      margin-right: 16px;
    }

    .u-icon {
      color: #8d8d8d;
      margin-bottom: 12px;
      font-size: 30px;
    }

    span {
      font-size: 14px;
      font-weight: 400;
      letter-spacing: 0.005em;
      color: rgba($color: #272727, $alpha: 0.8);
    }

    &:hover {
      border: 1px solid #31bf60;

      .u-icon,
      span {
        color: #103d1f;
      }
    }
    &.active {
      border: 1px solid #31bf60;
      background: #e3f5e9;

      .u-icon,
      span {
        color: #103d1f;
      }
    }
  }
}
</style>
