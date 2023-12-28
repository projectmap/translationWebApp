<template>
  <div>
    <div class="c-modal--project-creation__header">
      <nuxt-link
        v-if="getTranslationLink"
        :to="getTranslationLink"
        class="c-header__link"
      >
        Start
        <span class="u-icon u-icon--move">keyboard_arrow_right</span>
      </nuxt-link>
    </div>
    <div class="c-modal--project-creation__body">
      <div class="c-modal--project-creation__body--upper">
        <img src="~/assets/images/mask-group-two.png" class="mask-group-two" />
        <img src="~/assets/images/check-circle.png" class="check-circle" />
        <img src="~/assets/images/mask-group-one.png" class="mask-group-one" />
      </div>
      <div class="c-modal--project-creation__body--lower">
        <p>The project has been created</p>
      </div>
    </div>
    <div class="c-modal--project-creation__footer">
      <nuxt-link
        to="/dashboard"
        class="c-header__link c-header__link-btn u-ml-"
      >
        Go back to dashboard
      </nuxt-link>
      <a
        v-if="contributorsLink"
        class="c-btn--dark c-btn--primary"
        :href="contributorsLink"
        target="_blank"
      >
        Create Project Team
      </a>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  newTranslationLink: { type: String, default: '' },
  contributorsLink: { type: String, default: '' },
});
const getTranslationLink = computed(() => {
  if (props.newTranslationLink) {
    return `/${props.newTranslationLink}`;
  }
  return null;
});
</script>

<style></style>
