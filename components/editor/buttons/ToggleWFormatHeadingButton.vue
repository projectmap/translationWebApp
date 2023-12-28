<script setup>
import isEmpty from 'lodash/isEmpty';

import { headingLevels } from '../utils';
import Ctooltip from '~/components/utilities/Ctooltip.vue';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
  initialHeadingLevel: { type: Number, default: null },
});

const type = ref('wHeading');

const emits = defineEmits(['set-heading-level']);

const command = (level) => {
  if (level) {
    const headingLevel = parseInt(level);
    props.editorInstance
      .chain()
      .focus()
      .toggleWFormatHeading({ level: headingLevel })
      .run();

    emits('set-heading-level', level);
  }
};

const isActive = computed(() => {
  if (type && !isEmpty(props.editorInstance)) {
    return props.editorInstance.isActive(type);
  }
  return false;
});
</script>

<template>
  <select
    class="heading-toggle"
    :class="{ 'is-active': isActive }"
    @change="(e) => command(e.target?.value)"
  >
    <option
      v-for="hLevel in headingLevels"
      :key="hLevel"
      :value="hLevel"
      :selected="initialHeadingLevel === hLevel"
    >
      H{{ hLevel }}
      <ctooltip :show="true"> Headings </ctooltip>
    </option>
  </select>
</template>

<style lang="scss">
.image-icon {
  width: 13px;
}

.heading-toggle {
  height: 32px !important;
  width: 32px !important;
  padding: 0px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  text-align: center;
  cursor: pointer;

  &:focus-visible {
    outline: none !important;
  }
}
</style>
