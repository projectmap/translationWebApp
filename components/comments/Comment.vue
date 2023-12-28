<template>
  <div v-if="!deleted" class="c-comment">
    <div class="c-comment__header">
      <slot />

      <div class="c-comment__controls">
        <button
          v-if="canEdit"
          class="c-btn c-btn--minimal c-btn--square c-btn---"
          @click="onEdit"
        >
          <i class="u-icon">mode_edit</i></button
        ><button
          v-if="canDelete"
          class="c-btn c-btn--minimal c-btn--square c-btn---"
          @click="onDelete"
        >
          <i class="u-icon">delete</i>
        </button>
      </div>
    </div>
    <div class="c-comment__body">
      <template v-if="isEditing">
        <textarea
          v-if="isEditing"
          v-model="contentCopy"
          class="c-comment__input"
          rows="5"
          @keyup.enter.prevent="onUpdate"
        >
        </textarea>
        <div class="u-text-right">
          <button class="c-btn c-btn--ghost c-btn--" @click="onCancel">
            Cancel
          </button>
          <button class="c-btn c-btn--green c-btn--" @click="onUpdate">
            Save
          </button>
        </div>
      </template>

      <span v-else class="u-content" v-html="content"></span>
    </div>
  </div>
  <div v-else class="c-comment c-comment--deleted">
    <span>Comment deleted.</span>
    <button v-if="canDelete" class="c-link c-link--dotted" @click="onUndelete">
      Undo
    </button>
  </div>
</template>

<script setup>
import get from 'lodash/get';
import { marked } from 'marked';
import { storeToRefs } from 'pinia';

import { useUserStore } from '~/store';

const props = defineProps({
  comment: { type: Object, default: null },
});

const emits = defineEmits(['update', 'delete', 'undelete']);

/* eslint-disable */ // TODO: fix lint
let contentCopy = ref('');
let isEditing = ref(false);

const userStore = useUserStore();
const { id: userId } = storeToRefs(userStore);

const content = computed(() => {
  return marked(props.comment.content);
});
const deleted = computed(() => {
  return props.comment.toDelete;
});
const canEdit = computed(() => {
  return get(props.comment, 'user.id') === userId.value;
});
const canDelete = computed(() => {
  return get(props.comment, 'user.id') === userId.value;
});

const onEdit = () => {
  contentCopy.value = props.comment.content;
  isEditing.value = true;
};
const onCancel = () => {
  isEditing.value = false;
};
const onUpdate = (event) => {
  if (event.shiftKey) return;
  emits('update', {
    ...props.comment,
    content: contentCopy.value,
  });
  isEditing.value = false;
};
const onDelete = () => {
  emits('delete', props.comment);
};
const onUndelete = () => {
  emits('undelete', props.comment);
};
</script>

<style lang="scss" scoped>
.c-comment {
  &--deleted {
    color: $c-muted;
  }
}

.c-comment__header {
  position: relative;
  margin-bottom: $unit-1;
}

.c-comment__controls {
  position: absolute;
  z-index: 1;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
  visibility: hidden;
  white-space: nowrap;
  background-color: $c-white;
  border-radius: $global-radius;
  box-shadow: 0 0 5px $c-white;

  .c-comment:hover & {
    visibility: visible;
  }
}

.c-comment__avatar {
  width: $unit;
  height: $unit;
  border-radius: $global-radius;
  background-color: $c-muted;
}

.c-comment__body {
  @include font-size($font-size-small);

  overflow-wrap: break-word;
  color: $c-gray-8;
}

.c-comment__input {
  display: block;
  margin-bottom: $unit-1;
}
</style>
