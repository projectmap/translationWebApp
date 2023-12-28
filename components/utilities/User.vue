<template>
  <span class="c-user" :class="rootClass">
    <span v-if="avatar && getAvatar" class="c-user__avatar">
      <img :src="getAvatar" />
    </span>
    <span v-if="passive" class="c-user__name">{{ username }}</span>
    <nuxt-link v-else class="c-user__name" :to="url">{{ username }}</nuxt-link>

    <ctooltip :show="!passive && username">
      <div class="c-user c-user--card" :class="cardClass">
        <div class="o-flex o-flex--middle">
          <div v-if="getAvatar" class="o-flex__item c-user__avatar">
            <img :src="getAvatar" />
          </div>
          <div class="o-flex__item u-ml4">
            <div class="c-user__name">{{ username }}</div>
            <div class="o-flex o-flex--wrap o-flex--tiny">
              <div class="c-btn c-badge c-badge--" @click="openFlagReason">
                <span class="u-icon">flag</span>
              </div>
              <badge
                v-if="role || points"
                :color="badgeColor"
                soft
                border
                size="--"
                class="u-bold u-uppercase u-db u-text-center u-mt--"
              >
                <span v-if="getRole" class="c-user__role">
                  {{ getRole }}
                </span>
                <span v-if="getPoints" class="c-user__points">
                  {{ getPoints }}
                </span>
              </badge>
            </div>
          </div>
        </div>
      </div>
    </ctooltip>

    <span v-if="$slots.default" class="c-user__action u-ml--"><slot /></span>
    <time v-if="date" class="c-user__time" :datetime="date">
      {{ formattedDate }}
    </time>
  </span>
</template>

<script setup>
import {
  isSameYear,
  isSameMonth,
  format,
  formatDistance,
  parseISO,
} from 'date-fns';
import get from 'lodash/get';
import isString from 'lodash/isString';
import { storeToRefs } from 'pinia';

import Ctooltip from './Ctooltip.vue';
import Badge from '~/components/structure/Badge';
import { useEventStore, useUserStore } from '~/store';

const props = defineProps({
  user: { type: Object, default: null },
  date: { type: [String, Date], default: null },
  avatar: Boolean,
  points: Boolean,
  role: Boolean,
  passive: Boolean,
});

const eventStore = useEventStore();
const userStore = useUserStore();

const { languageCode } = storeToRefs(userStore);

const runtimeConfig = useRuntimeConfig();
const { cpanelUrl } = runtimeConfig.public;

const rootClass = computed(() => {
  return props.role ? `is-${getRole}` : '';
});
const cardClass = computed(() => {
  return getRole ? `is-${getRole}` : '';
});
const parsedDate = computed(() => {
  return isString(props.date) ? parseISO(props.date) : props.date;
});
const formattedDate = computed(() => {
  if (!props.date) return '';
  if (isSameMonth(parsedDate.value, Date.now())) {
    return formatDistance(parsedDate.value, Date.now()) + ' ago';
  } else if (isSameYear(parsedDate.value, Date.now())) {
    return 'on ' + format(parsedDate.value, 'MMM d');
  } else {
    return 'on ' + format(parsedDate.value, 'MMM d, yyyy');
  }
});

const username = computed(() => {
  return props.user?.username;
});

const url = computed(() => {
  return `${cpanelUrl}/accounts/profile`;
});

const getPoints = computed(() => {
  return get(props.user, 'contributions.edits', 0).toLocaleString();
});

const getAvatar = computed(() => {
  return get(props.user, 'thumbnail');
});

const getRole = computed(() => {
  if (!props.user?.permissions) return '';
  const permissions = props.user?.permissions?.[languageCode.value?.code];
  if (permissions?.trustee) return 'appointee';
  else if (permissions?.reviewTranslation) return 'reviewer';
  else if (permissions?.changeTranslation) return 'translator';
  else return 'novice';
});
const badgeColor = computed(() => {
  switch (getRole) {
    case 'appointee':
      return 'purple';
    case 'reviewer':
      return 'green';
    case 'translator':
      return 'blue';
    case 'novice':
    default:
      return 'yellow';
  }
});

const openFlagReason = () => {
  if (props.user) {
    eventStore.new({
      name: 'FLAG_USER',
      payload: {
        popup: true,
        id: props.user.id,
        username: username.value,
        reason: '',
      },
    });
  }
};
</script>
