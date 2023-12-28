<template>
  <div v-if="segment && statistics" class="o-flex o-flex--tiny">
    <vote
      v-if="!!parseInt(requiredEditorVotes)"
      icon="verified_user"
      role="editor"
      verb="edit"
      :votes="
        parseInt(
          segment.glossarySegment ? statistics.editors : statistics.editors.vote
        )
      "
      :required="parseInt(requiredEditorVotes)"
      :can-vote="canVoteAsEditor"
      :did-vote="Boolean(statistics.editors.user)"
      @vote="onVote"
    />
    <vote
      v-if="!!parseInt(requiredReviewerVotes)"
      icon="verified_user"
      role="reviewer"
      verb="review"
      :votes="
        parseInt(
          segment.glossarySegment
            ? statistics.reviewers
            : statistics.reviewers.vote
        )
      "
      :required="parseInt(requiredReviewerVotes)"
      :can-vote="canVoteAsReviewer"
      :did-vote="Boolean(statistics.reviewers.user)"
      @vote="onVote"
    />
    <vote
      v-if="displayEditOption"
      icon="check"
      role="translator"
      verb="translate"
      :votes="hasTranslatorVote"
      :required="parseInt(requiredTranslatorVotes)"
      :translated-by="translatedBy"
      :can-vote="canVoteAsTranslator"
      :did-vote="translatorDidVote"
      :can-revoke-original="segment.canRevokeOriginal"
      @vote="onVote"
    />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import Vote from './Vote';
import { useUserStore } from '~/store';

const props = defineProps({
  translation: { type: Object, default: null },
  segment: { type: Object, default: null },
});

const emits = defineEmits(['vote']);

const userStore = useUserStore();
const { name: username } = storeToRefs(userStore);

const translatedBy = computed(() => {
  if (props.segment.translatedUser) {
    return props.segment.translatedUser;
  }
  return '';
});

const canVoteAsEditor = computed(() => {
  return Boolean(
    userStore.userRoleByWorkId(props.translation.id).includes('editor') &&
      props.segment?.editorCanVote
  );
});

const canVoteAsReviewer = computed(() => {
  if (
    userStore.userRoleByWorkId(props.translation.id).includes('reviewer') &&
    props.segment.glossarySegment
  ) {
    return true;
  }
  return Boolean(
    userStore.userRoleByWorkId(props.translation.id).includes('reviewer') &&
      props.segment?.reviewerCanVote
  );
});

const translatorDidVote = computed(() => {
  return (
    Boolean(statistics.value.translators.user) ||
    props.segment.canRevokeOriginal
  );
});

const hasTranslatorVote = computed(() => {
  return (
    parseInt(
      props.segment.glossarySegment
        ? statistics.value.translators
        : statistics.value.translators.vote
    ) || props.segment.canRevokeOriginal
  );
});

const displayEditOption = computed(() => {
  return (
    canVoteAsTranslator.value &&
    !!parseInt(requiredTranslatorVotes.value) &&
    translatorDidVote.value
  );
});

const canVoteAsTranslator = computed(() => {
  if (props.segment.lockedBy) {
    return Boolean(
      props.segment.lockedBy.username === username.value &&
        (props.segment.progress <= 2 || props.segment.canRevokeOriginal)
    );
  } else {
    return Boolean(
      userStore.userRoleByWorkId(props.translation.id).includes('translator') &&
        props.segment?.translatorCanVote
    );
  }
});

const requiredTranslatorVotes = computed(() => {
  return (
    props.translation?.roleCounts?.translator ||
    props.segment.translatedUser === username.value
  );
});

const requiredReviewerVotes = computed(() => {
  return props.translation?.roleCounts?.reviewer;
});

const requiredEditorVotes = computed(() => {
  return props.translation?.roleCounts?.editor;
});

const statistics = computed(() => {
  return props.segment?.statistics;
});

const onVote = (vote) => {
  emits('vote', vote);
};
</script>
