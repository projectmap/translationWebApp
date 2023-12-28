<template>
  <li
    class="c-record is-clickable"
    :class="{
      'is-current': isCurrent,
      'is-hot': isHot,
    }"
    @click="emits('select', item)"
  >
    <div class="c-timeline__node">
      <span class="u-icon">edit</span>
    </div>
    <div class="c-timeline__header u-mb1">
      <user :user="item.user" :date="item.date" points passive>
        edited {{ item.role ? 'as ' + item.role + ' ' : '' }}
      </user>
      <div class="c-timeline__controls">
        <button
          v-if="canUndo()"
          class="c-btn c-btn--ghost c-btn---"
          @click.stop="emits('undo', item)"
        >
          <i class="u-icon">undo</i> Undo
        </button>
        <button
          v-else
          class="c-btn c-btn--ghost c-btn---"
          @click.stop="emits('restore', item)"
        >
          <i class="u-icon">settings_backup_restore</i> Restore
        </button>
      </div>
    </div>
    <div v-if="item" class="c-record__body">
      <badge color="blue" size="---" class="u-bold u-dib u-mr--">
        #{{ item.relativeId }}
      </badge>
      <span
        v-if="isHot"
        class="u-icon u-warning u-mr--"
        title="Your current edit"
      >
        flash_on
      </span>
      {{ item.changeReason }}
    </div>
  </li>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import isHotRecord from '~/helpers/isHotRecord';
import User from '~/components/utilities/User';
import Badge from '~/components/structure/Badge';
import { useTranslationStore, useUserStore } from '~/store';

const props = defineProps({
  item: { type: Object, default: null },
});

const emits = defineEmits(['select', 'undo', 'restore']);

const translationStore = useTranslationStore();
const userStore = useUserStore();

const { currentRecord } = storeToRefs(translationStore);
const { id: userId } = storeToRefs(userStore);

/******************
 *     States     *
 *****************/
const isUser = computed(() => {
  return userId.value === props.item?.user?.id;
});
const isCurrent = computed(() => {
  return currentRecord.value?.id === props.item?.id;
});
const isHot = computed(() => {
  return isUser.value && isHotRecord(props.item);
});

/******************
 *   Permissions  *
 ******************/
const canUndo = () => {
  return isUser.value && isHot.value;
};
</script>
