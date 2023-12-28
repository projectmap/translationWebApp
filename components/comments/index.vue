<template>
  <div class="c-comments">
    <div v-show="loading" class="u-text-center u-mv">
      <i class="u-icon u-icon++ u-icon--rotating">refresh</i>
    </div>

    <ul v-show="!loading" class="c-comments__list">
      <li
        v-for="comment in comments"
        :key="comment.id"
        class="o-media o-media--tiny c-comments__item"
      >
        <div class="o-media__img">
          <img class="c-comments__avatar" :src="comment.user.thumbnail" />
        </div>
        <div class="o-media__body">
          <comment-component
            :comment="comment"
            @update="onCommentUpdate"
            @delete="onCommentDelete"
            @undelete="onCommentUndelete"
          >
            <user-component
              class="u-truncate"
              :user="comment.user"
              :date="comment.lastModified"
              points
              passive
            />
          </comment-component>
        </div>
      </li>
    </ul>

    <comment-form
      class="c-comments__form"
      @height-update="onScrollToBottom"
      @submit="onCommentCreate"
    />
  </div>
</template>

<script setup>
import get from 'lodash/get';
import { storeToRefs } from 'pinia';

import CommentForm from './Form';
import CommentComponent from './Comment';
import UserComponent from '~/components/utilities/User';
import {
  useEventStore,
  useCommentsStore,
  useTranslationStore,
  useSegmentStore,
} from '~/store';

const props = defineProps({
  apiUrl: { type: String, default: 'comments/' },
});

const eventStore = useEventStore();
const commentStore = useCommentsStore();
const translationStore = useTranslationStore();
const segmentStore = useSegmentStore();

const instance = getCurrentInstance();

const { loading, getItems: comments } = storeToRefs(commentStore);
const { currentId } = storeToRefs(translationStore);
const { getCurrentPosition } = storeToRefs(segmentStore);

const interval = computed(() => {
  return eventStore.getEvent('INTERVAL');
});
const computedApiUrl = computed(() => {
  return (
    props.apiUrl ||
    `translations/${currentId.value}/segments/${getCurrentPosition.value}/comment/`
  );
});

watch(
  () => props.apiUrl,
  () => {
    commentStore.removeAll();
    commentStore.request(props.apiUrl);
  }
);

watch(interval.value, (newInterval) => {
  // update comments once a minute
  if (get(newInterval, 'payload', 1) % 12 === 0) {
    commentStore.requestUpdate({
      interval: true,
    });
  }
});

onMounted(async () => {
  await commentStore.request({
    url: computedApiUrl.value,
  });
  // setTimeout(() => {
  //   onScrollToBottom();
  // }, 2000);
});

const onCommentCreate = (content) => {
  commentStore.create(content);
};

const onCommentUpdate = (comment) => {
  commentStore.update(comment);
};

const onCommentDelete = (comment) => {
  commentStore.delete(comment);
};

const onCommentUndelete = (comment) => {
  commentStore.undelete(comment);
};

const onScrollToBottom = () => {
  instance.parent.emit('scrollToBottom');
};
</script>

<style lang="scss" scoped>
.c-comments__list {
  list-style: none;
  margin-left: 0;
}

.c-comments__item {
  @include font-size($font-size-small);

  margin-bottom: $unit;
}

.c-comments__avatar {
  width: $unit;
  height: $unit;
  border-radius: $global-radius;
  background-color: $c-muted;
}
</style>
