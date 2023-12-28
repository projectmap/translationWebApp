<template>
  <div
    class="c-progrs"
    :class="{
      'is-pretranslated': phase === 'pretranslated',
      'is-translating': phase === 'translating',
      'is-translated': phase === 'translated',
      'is-reviewed': phase === 'reviewed',
      'is-approved': phase === 'approved',
    }"
  >
    <ctooltip :text="tooltip" placement="right">
      <div class="c-progrs__inner"></div>
    </ctooltip>
  </div>
</template>

<script setup>
import Ctooltip from '~/components/utilities/Ctooltip.vue';

// NOTE: MIGHT NEED THIS FOR LATER USE
// import Tooltip from '~/components/utilities/Tooltip.vue';

/*
 * 0: blank
 * 1: in translation
 * 2: translation done
 * 3: in review
 * 4: review done
 * 5: trustee done
 */

const props = defineProps({
  progress: { type: Number, default: 0 },
  thirdParty: Boolean,
});

const phase = computed(() => {
  if (props.progress >= 5) return 'approved';
  else if (props.progress >= 4) return 'reviewed';
  else if (props.progress >= 2) return 'translated';
  else if (props.progress >= 1) return 'translating';
  else if (props.thirdParty) return 'pretranslated';
  else return '';
});

const tooltip = computed(() => {
  switch (phase.value) {
    case 'approved':
      return 'Paragraph approved';
    case 'reviewed':
      return 'Review done, waiting for release';
    case 'translated':
      return 'Translation done, waiting for review';
    case 'translating':
      return 'In translation';
    case 'pretranslated':
      return 'Third-Party translation available';
    default:
      return 'Waiting for translation';
  }
});
</script>

<style lang="scss" scoped>
.c-progrs {
  height: 100%;
}

.c-progrs__inner {
  width: 4px;
  background-color: $c-gray-3;

  .is-pretranslated &,
  .is-translating & {
    background-color: $c-yellow-4;
  }

  .is-translated & {
    background-color: $c-yellow-5;
  }

  .is-reviewed & {
    background-color: $c-green-4;
  }

  .is-approved & {
    background-color: $c-green-6;
  }
}
</style>
