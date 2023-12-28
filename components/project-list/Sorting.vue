<template>
  <dropdown v-model:open="open" placement="bottom">
    <template #anchor>
      <button
        class="c-btn c-btn--none c-btn-- c-btn--dropdown c-btn--baseline u-nowrap"
      >
        Sort by {{ current ? current.name : '...' }}
      </button>
    </template>

    <div ref="list" @keydown.up.down.capture="onUpDown" @keydown.esc="onEsc">
      <dropdown-item
        v-for="item in options"
        :key="item.param"
        type="button"
        :active="item.param === currentParam"
        @click="choose(item)"
      >
        {{ item.name }}
      </dropdown-item>
    </div>
  </dropdown>
</template>

<script setup>
import Dropdown from '@/components/utilities/Dropdown';
import DropdownItem from '@/components/utilities/DropdownItem';

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
    validator: (array) =>
      array.every((obj) => obj.param !== undefined && obj.name !== undefined),
  },
  current: { type: Object, default: null },
});

const emit = defineEmits(['update:current']);

const open = ref(false);

const currentParam = computed(() => {
  return props.current ? props.current.param : '';
});

const choose = (option) => {
  emit('update:current', option);
  open.value = false;
};
</script>
