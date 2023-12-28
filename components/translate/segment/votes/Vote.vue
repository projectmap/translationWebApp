<template>
  <component
    :is="canVote ? 'button' : 'div'"
    ref="voteRef"
    class="u-no-btn"
    @click="vote"
  >
    <!-- <tooltip :text="tooltip" :class="{ 'is-clickable': canVote }"> -->
    <badge
      class="vote"
      :class="{
        'u-attention': attention,
        'is-clickable': canVote,
        'is-green': color === 'green',
        'is-red': color === 'red',
        'is-yellow': color === 'yellow',
      }"
      :color="color"
      :soft="!didVote"
      :border="!didVote"
    >
      <span v-if="!isTranslator" class="u-icon">{{ icon }}</span>
      <strong v-if="!isTranslator">{{ votes }}</strong>
      <span v-if="!isTranslator" class="u-faded">/{{ required }}</span>
      <span v-else>Edit</span>
    </badge>
    <!-- </tooltip> -->
  </component>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import { useUserStore } from '~/store';
import Badge from '@/components/structure/Badge';
// import Tooltip from '@/components/utilities/Tooltip';

const props = defineProps({
  icon: { type: String, default: 'check' },
  role: { type: String, default: 'reviewer' },
  verb: { type: String, default: 'reviewed' },
  votes: { type: Number, default: 0 },
  required: { type: Number, default: 1 },
  canVote: Boolean,
  didVote: Boolean,
  translatedBy: { type: String, default: '' },
  canRevokeOriginal: { type: Boolean, default: false },
});

const emits = defineEmits(['vote']);

// Template Ref
const voteRef = ref(null);

const userStore = useUserStore();
const { name: username } = storeToRefs(userStore);

const color = computed(() => {
  if (props.votes >= props.required) return 'green';
  else if (props.votes < 0) return 'red';
  else if (props.votes > 0) return 'yellow';
  return '';
});

const attention = computed(() => {
  return (
    !props.isTranslator &&
    props.canVote &&
    !props.didVote &&
    !(props.votes >= props.required)
  );
});

const getPastTense = (string) => {
  return string + (string.endsWith('e') ? 'd' : 'ed');
};

/* eslint-disable */ // TODO: fix lint
const tooltip = computed(() => {
  let tooltip = '';
  const past = getPastTense(props.verb);

  if (props.didVote) {
    tooltip = `<i class="u-icon">check</i> <strong>${
      username.value === props.translatedBy ? 'You' : username.value
    } ${past}</strong><br>`;
  } else if (props.canVote) {
    tooltip = `<i class="u-icon">info_outline</i> <strong>You can ${props.verb}!</strong><br>`;
  }

  if (props.canVote && !props.didVote) {
    tooltip += `This paragraph needs your help!`;
  } else if (props.votes === 0) {
    tooltip += `Not ${past} yet`;
  } else if (props.votes < 0) {
    tooltip += `One or more ${props.role}s suggested changes`;
  } else if (props.votes >= props.required) {
    tooltip += `This paragraph is ${props.required > 1 ? 'fully ' : ''}${past}`;
  } else {
    tooltip += `Waiting for more ${props.role}s`;
  }

  return tooltip;
});

const isTranslator = computed(() => {
  return props.role === 'translator';
});

const vote = () => {
  if (!props.canVote) return;
  nextTick(() => voteRef.value.blur());
  if (props.didVote) {
    if (props.canRevokeOriginal) {
      emits('vote', { role: props.role, setTo: 0 });
    } else {
      emits('vote', { role: props.role, setTo: -1 });
    }
    props.votes = props.votes - 1;
    props.didVote = false;
  } else {
    emits('vote', { role: props.role, setTo: 1 });
    props.votes = props.votes + 1;
    props.didVote = true;
  }
};
</script>

<style lang="scss" scoped>
.v-popover.is-clickable {
  cursor: pointer;
}

.vote {
  @include inuit-font-size($font-size-small);

  border-radius: $global-radius; /* 1 */

  &.is-clickable:hover {
    background-color: $c-gray-1;
  }

  &.is-clickable.c-badge--soft:hover {
    background-color: $c-gray-2;
  }

  &.is-clickable.c-badge--red:hover {
    background-color: $c-red-3;
  }

  &.is-clickable.c-badge--yellow:hover {
    background-color: $c-yellow-4;
  }

  &.is-clickable.c-badge--green:hover {
    background-color: $c-green-3;
  }
}
</style>
