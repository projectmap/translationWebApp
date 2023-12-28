<script setup>
import get from 'lodash/get';
import { storeToRefs } from 'pinia';
import isEmpty from 'lodash/isEmpty';

import { useUserStore } from '~/store';
import { fetchAPI } from '~/helpers/apiCore';
import uDropdown from '~/components/utilities/Dropdown';
import Book from '~/components/project-list/project/Book.vue';
import uDropdownItem from '~/components/utilities/DropdownItem';

const userStore = useUserStore();
const { isAdmin } = storeToRefs(userStore);

const runTimeConfig = useRuntimeConfig();
const { egwApi } = runTimeConfig.public;

const state = reactive({
  recentProjectList: [],
  isPending: false,
});

const egwBookNumber = (project) => {
  return parseInt(get(project, 'key'));
};

const fetchProjectList = async () => {
  if (isEmpty(state.recentProjectList)) {
    state.isPending = true;
    const url = 'translations/?limit=5';
    try {
      const { data: results } = await fetchAPI(url);

      if (results) {
        state.recentProjectList = results?.map((project) => ({
          title: project?.title,
          bookProgress: project?.bookProgress,
          languageCode: project?.languageObj?.code,
          abbreviation: project?.abbreviation,
          key: project?.original?.key,
        }));
      }
      state.isPending = false;
    } catch (e) {
      state.isPending = false;
    }
  }
};

const getStatus = (project) => {
  if (project?.bookProgress === 0) {
    return 'In Translation';
  } else if (project?.bookProgress === 1) {
    return 'Translation Done';
  } else if (project?.bookProgress > 1 && project?.bookProgress < 8) {
    return 'In Review';
  } else if (project?.bookProgress > 7 && project?.bookProgress < 11) {
    return 'In Approval';
  } else if (project?.bookProgress === 11) {
    return 'Approved';
  } else {
    return 'In Process';
  }
};
</script>

<template>
  <u-dropdown placement="bottom" :disabled="false">
    <template #anchor>
      <button
        class="c-btn c-btn- c-btn--none c-btn-translate c-header__link u-ml-"
        @click="fetchProjectList"
      >
        Translate
      </button>
    </template>
    <u-dropdown-item
      v-if="isAdmin"
      type="nuxt-link"
      url="/new-project"
      style="margin-bottom: 6px"
    >
      <span class="u-icon translate-icon">translate</span> Create New Project
      <span class="u-icon u-icon--move u-icon-left-u"
        >keyboard_arrow_right</span
      >
    </u-dropdown-item>
    <span v-if="state.recentProjectList">
      <u-dropdown-item v-if="isAdmin" type="divider"></u-dropdown-item>
      <u-dropdown-item type="text-divider">
        Recent Translations
      </u-dropdown-item>

      <u-dropdown-item v-if="state.isPending">
        <div class="c-spinner c-spinner--small"></div>
      </u-dropdown-item>

      <template v-else>
        <template v-if="!isEmpty(state.recentProjectList)">
          <u-dropdown-item
            v-for="(project, index) in state.recentProjectList"
            :key="index"
            type="nuxt-link"
            :url="`/translate/${project.languageCode}/${project.abbreviation}/chapter/1`"
          >
            <div class="translation-item">
              <book
                :size="'small'"
                :number="egwBookNumber(project)"
                :egw-api="egwApi"
              />
              <div class="translation-item__info">
                <h6>{{ project.title }}</h6>
                <span
                  class="c-badge c-badge--soft c-badge--border"
                  :class="{
                    'c-badge--red':
                      project.bookProgress > 1 && project.bookProgress < 8,
                    'c-badge--primary':
                      project.bookProgress === 0 || project.bookProgress === 1,
                    'c-badge--green':
                      project.bookProgress === 11 ||
                      (project.bookProgress > 7 && project.bookProgress < 11),
                  }"
                >
                  {{ getStatus(project) }}
                </span>
              </div>
            </div>
            <span class="u-icon u-icon--move u-icon-left-u"
              >keyboard_arrow_right</span
            >
          </u-dropdown-item>
          <u-dropdown-item type="divider"></u-dropdown-item>
          <u-dropdown-item type="nuxt-link" :url="`/translate/`">
            View All Translations
            <span class="u-icon u-icon--move u-icon-left-u"
              >keyboard_arrow_right</span
            >
          </u-dropdown-item>
        </template>
        <u-dropdown-item v-else> No Translations </u-dropdown-item>
      </template>
    </span>
  </u-dropdown>
</template>

<style lang="scss" scoped>
.c-btn-translate {
  padding: 0;
}

.translate-icon {
  margin-right: 10px;
}

.translation-item {
  display: flex;

  .translation-item__info {
    margin-left: 10px;

    h6 {
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .c-badge {
      font-size: 11px;
      border-radius: 2px;
    }
  }
}

.c-dropdown__item {
  padding: 6px 12px;
  line-height: 1.5;
  text-align: left;
  min-height: fit-content;
}

.c-dropdown__item {
  display: flex;

  &:first-child {
    margin-top: 6px;
  }
  .u-icon-left-u {
    margin-left: auto;
  }
}
</style>
