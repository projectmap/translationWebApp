<template>
  <div class="breadcrumbs u-truncate">
    <nuxt-link class="c-btn c-btn--none c-btn---" :to="url()" exact>
      translate
    </nuxt-link>
    <template v-if="language">
      /
      <nuxt-link
        class="c-btn c-btn--none c-btn---"
        :to="url(language.code)"
        exact
      >
        {{ language.name }}
      </nuxt-link>
    </template>
    <template v-if="translation">
      /
      <nuxt-link
        class="c-btn c-btn--none c-btn---"
        :to="url(language.code, translation.abbreviation)"
        exact
      >
        {{ translation.title }}
      </nuxt-link>
    </template>
    <template v-if="chapter">
      /
      <nuxt-link
        class="c-btn c-btn--none c-btn---"
        :to="url(language.code, translation.abbreviation, chapter.number)"
        exact
      >
        Chapter {{ chapter.number }}
      </nuxt-link>
    </template>
  </div>
</template>

<script setup>
import urlBuilder from '~/helpers/urlBuilder';

defineProps({
  language: { type: Object, default: null },
  translation: { type: Object, default: null },
  chapter: { type: Object, default: null },
});

const url = (languageCode = null, abbr = null, chapter = null) => {
  return urlBuilder(languageCode, abbr, chapter);
};
</script>

<style lang="scss" scoped>
.breadcrumbs {
  @include inuit-font-size($font-size-tiny);

  text-align: center;
  text-transform: uppercase;
  color: $c-gray-3;
  white-space: nowrap;

  a {
    color: $c-gray-4;

    &:hover,
    &:focus {
      background-color: $c-gray-2;
    }
  }
}
</style>
