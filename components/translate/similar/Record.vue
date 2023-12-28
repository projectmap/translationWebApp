<template>
  <li class="c-record is-clickable">
    <div class="c-timeline__header u-mb1">
      <div>{{ item.content }}</div>
    </div>
    <button
      style="outline: none"
      :class="copied ? 'c-badge--soft' : ''"
      class="c-badge c-badge--green c-badge--border"
      @click="copyToClipBoard(item.content)"
    >
      {{ copyState }}
    </button>
  </li>
</template>

<script setup>
/* eslint-disable */ // TODO: fix lint
const props = defineProps({
  item: { default: null },
  chapterPosition: { type: Number, default: null },
});

let copyState = ref('Copy');
let copied = ref(false);

const copyToClipBoard = (text) => {
  const cbarEditor = document.getElementsByTagName('cbar-rich-text');

  cbarEditor[this.chapterPosition - 1].pellInit();
  cbarEditor[this.chapterPosition - 1].addTextToEditor(text);

  copyState.value = 'Copied';
  copied.value = true;
  navigator.clipboard.writeText(text);
};
</script>
