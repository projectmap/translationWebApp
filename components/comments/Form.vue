<template>
  <div class="c-commentform">
    <div class="c-commentform__body">
      <div ref="mirror" class="e-input c-commentform__mirror">
        <span class="u-content" v-html="mirrorInput"></span>
      </div>
      <textarea
        ref="comment"
        v-model="commentInput"
        class="c-commentform__input"
        :style="{ height: commentHeight + 'px' }"
        rows="1"
        autocomplete="on"
        placeholder="Leave a comment"
        @keyup.enter.prevent="onCommentSubmit"
      >
      </textarea>
    </div>
    <div class="c-commentform__footer">
      <span class="u-tiny u-truncate u-mr--">
        <a
          class="c-link c-link--muted"
          href="https://guides.github.com/features/mastering-markdown/"
          target="_blank"
        >
          <svg
            class="u-icon u-icon--svg"
            viewBox="0 0 16 16"
            version="1.1"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M14.85 3H1.15C.52 3 0 3.52 0 4.15v7.69C0 12.48.52 13 1.15 13h13.69c.64 0 1.15-.52 1.15-1.15v-7.7C16 3.52 15.48 3 14.85 3zM9 11H7V8L5.5 9.92 4 8v3H2V5h2l1.5 2L7 5h2v6zm2.99.5L9.5 8H11V5h2v3h1.5l-2.51 3.5z"
            ></path>
          </svg>
          &nbsp; Markdown is supported
        </a>
      </span>
      <button class="c-btn c-btn--green c-btn--" @click="onCommentSubmit">
        Comment
      </button>
    </div>
  </div>
</template>

<script setup>
import { marked } from 'marked';

const emits = defineEmits(['height-update', 'submit']);

const commentInput = ref('');
const commentHeight = ref(32);

// Template Ref
const mirror = ref(null);

const mirrorInput = computed(() => {
  return marked(commentInput.value);
});

/**
 * Update hight of mirror when typing.
 * There is a timeout because the height updates shortly after this
 * watcher is fired.
 */
watch(commentInput.value, () => {
  nextTick(() => {
    const min = 32;
    const max = 120;
    const height = mirror.value.offsetHeight;
    commentHeight.value = Math.min(Math.max(height, min), max);
  });
});

watch(commentHeight, () => {
  emits('height-update');
});

const onCommentSubmit = (event) => {
  if (event.shiftKey) return;
  emits('submit', commentInput.value);
  commentInput.value = '';
};
</script>

<style lang="scss" scoped>
.c-commentform {
  width: 100%;
}

.c-commentform__body {
  position: relative;
  margin-bottom: $unit-1;
}

.c-commentform__input {
  resize: none;
}

.c-commentform__mirror {
  position: absolute;
  z-index: -1;
  visibility: hidden;
  max-height: 120px;
  overflow: hidden;
}

.c-commentform__footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
</style>
