<template>
  <div class="c-search">
    <div class="c-search__buttons">
      <button v-if="search" class="c-btn c-btn---" @click="onClear">
        <i class="u-icon">clear</i>
      </button>
      <button class="c-btn c-btn--dark c-btn-" @click="onSubmit">
        <span class="u-icon">search</span>
      </button>
    </div>
    <input
      v-model="search"
      class="c-search__input u-border0 u-shadow-2"
      type="text"
      placeholder="Search ..."
      @keyup.enter="onSubmit"
      @keyup.esc="onClear"
      @keydown="handleDebounceSearch"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  debounce: { type: Boolean, default: false },
  interval: { type: Number, default: 3000 },
});

const emit = defineEmits(['submit']);
const search = ref('');
let searchInterval = ref(null);

const onSubmit = () => {
  emit('submit', search.value);
};

const onClear = () => {
  search.value = '';
  nextTick(() => {
    onSubmit('');
  });
};

const handleDebounceSearch = () => {
  if (props.debounce) {
    clearInterval(searchInterval);
    searchInterval = setTimeout(() => {
      emit('submit', search.value);
    }, props.interval);
  }
};
</script>

<style lang="scss" scoped>
.c-search {
  position: relative;
  width: 16 * $unit; // good default width
  min-width: 4 * $unit; // min-width so it doesn't get squished
}

.c-search__buttons {
  position: absolute;
  right: $unit-0;
  top: $unit-0;
  height: calc(100% - 8px);
  line-height: calc(100% - 8px);

  > .c-btn {
    height: 100%;
    line-height: inherit;
    padding-top: 0;
    padding-bottom: 0;
  }
}

.c-search__input {
  line-height: $unit; // adapt to height of the other elements
  border-radius: $global-radius * 2;
  padding-right: $unit-8;
}
</style>
