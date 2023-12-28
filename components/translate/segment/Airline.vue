<template>
  <div class="c-airline">
    <slot />

    <span class="c-airline__spacer"></span>

    <span v-if="showLockedByInfo" class="u-truncate u-mh--">
      <i class="u-icon">lock_outline</i> Locked by&nbsp;
      <user :user="segment.lockedBy" avatar passive />
    </span>
    <span v-if="isLocked && segment.progress < 2" class="u-truncate">
      <tooltip :text="lockInfoText">
        {{ lockedFor.translator ? 'Locked for translators' : '' }}
        {{ lockedFor.reviewer ? 'and reviewers' : '' }}
      </tooltip>
    </span>

    <slot name="right" />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import Tooltip from '~/components/utilities/Tooltip';
import User from '~/components/utilities/User';
import { useUserStore } from '~/store';

const props = defineProps({
  segment: { type: Object, default: null },
  lockedFor: { type: Object, default: null },
  isLocked: Boolean,
});

const userStore = useUserStore();
const { username } = storeToRefs(userStore);

const showLockedByInfo = computed(() => {
  return (
    props.segment?.lockedBy &&
    (props.segment?.lockedBy?.username !== username.value ||
      (props.segment?.lockedBy?.username === username.value &&
        props.segment?.progress < 2))
  );
});

const lockInfoText = computed(() => {
  let lockedFor = props.lockedFor.translator ? 'translators' : '';
  lockedFor += props.lockedFor.reviewer ? ' and reviewers' : '';
  const votedBy = props.lockedFor.translator ? 'reviewers' : 'trustees';
  return !props.lockedFor.all && lockedFor
    ? `This paragraph is locked for ${lockedFor} because ${votedBy} already voted on it`
    : '';
});
</script>

<style lang="scss" scoped>
$c-edit: $c-primary-7;
$c-compare: $c-gray-9;

.c-airline {
  @include inuit-font-size($font-size-small);

  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: $airline-height;
  padding: $unit-tiny 15px;
  white-space: nowrap;
  color: $c-muted;
  transition: color $global-transition;
  border-top: 1px solid #dee0e1;
  background-color: white;
  > *:not(:last-child) {
    margin-right: $unit-tiny;
  }
}

.c-airline__spacer {
  flex-grow: 1;
}

/**
 * 1. Visual vertical center
 */
.c-airline__words {
  display: inline-block;
  height: 18px;
  text-align: center;
  line-height: 1;
  vertical-align: middle;
  text-transform: uppercase;
  margin-top: -0.5em; /* 1 */

  > div:first-child {
    font-size: 120%;
    font-weight: bold;
  }

  > div:last-child {
    font-size: 50%;
  }
}
</style>
