<template>
  <div class="u-bg">
    <NuxtPage v-if="language" />
    <div v-else class="o-wrapper o-wrapper--slim u-text-center u-pv u-pb++">
      <div class="translations-header">
        <h3>Translations</h3>
        <nuxt-link
          v-if="isAdmin"
          to="/new-project/"
          class="c-header__link c-header__link-btn u-ml-"
        >
          New Project
        </nuxt-link>
      </div>

      <project-list
        class="u-mb+"
        :layout="layout"
        :default-params="defaultParams"
        @update-layout="updateLayout"
      />
      <nuxt-link class="c-btn c-btn--minimal" @click="$router.back()">
        <span class="u-icon">arrow_back</span> Back
      </nuxt-link>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import { useUserStore } from '~/store';
import ProjectList from '@/components/project-list';

const layout = ref('compact');

definePageMeta({
  layout: 'fullwidth',
  offline: true,
});

useHead({
  title: 'Translate',
  meta: [
    {
      nonResponsive: true,
    },
  ],
});

const route = useRoute();

const userStore = useUserStore();

const { isAdmin, getLanguage, getUser } = storeToRefs(userStore);

const user = getUser.value;

const currentLanguage = ref(null);
const defaultParams = ref({
  language: null,
});
const language = ref(null);

const updateLayout = (newLayout) => {
  layout.value = newLayout;
};

onBeforeMount(() => {
  if (user?.language?.code) {
    defaultParams.value.language = user.language.code;
  }
});

onMounted(() => {
  currentLanguage.value = getLanguage.value;
});

watch(route, () => {
  if (user?.language?.code) {
    defaultParams.value.language = user.language.code;
  }
});

onBeforeRouteUpdate((to, _, next) => {
  language.value = to.params.language;
  next();
});
</script>

<style lang="scss">
.translations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;

  h3 {
    margin: 0px;
  }

  .c-header__link-btn {
    background-color: $c-primary-6;
    color: white;

    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 10px;
    border-radius: 4px;
  }
}

.c-modal-context {
  display: flex;
  .c-modal-container {
    margin-bottom: auto;
  }
}
</style>
