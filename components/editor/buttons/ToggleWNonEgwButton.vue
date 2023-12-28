<template>
  <select
    class="toolbar-btn toolbar-btn--dropdown nonegw-toggle"
    :class="{ 'is-active': isActive }"
    :disabled="!isTextSelected"
    @change="(e) => command(e.target?.value)"
  >
    <option v-for="option in options" :key="option" :value="hLevel">
      {{ option }}
    </option>
    <ctooltip :show="true"> Toggle Non-egw </ctooltip>
  </select>
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';
import Ctooltip from '~/components/utilities/Ctooltip.vue';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
  isTextSelected: { type: Boolean, default: false },
});

const type = ref('wNonEgw');

const command = (type) => {
  props.editorInstance
    .chain()
    .focus()
    .toggleWNonEgw({
      type,
    })
    .run();
};

const options = [
  'appendix',
  'comment',
  'foreword',
  'intro',
  'note',
  'preface',
  'text',
];

const isActive = computed(() => {
  if (type && !isEmpty(props.editorInstance)) {
    return props.editorInstance.isActive(type);
  }
  return false;
});
</script>

<style lang="scss" scoped>
.nonegw-toggle {
  width: 150px !important;
}
</style>
