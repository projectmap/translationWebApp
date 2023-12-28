<template>
  <div>
    <span v-if="isEdit && isEditable">
      <span>3rd-party translation:</span>
      <tooltip v-if="localContent === text" text="Clear 3rd-party translation">
        <button class="u-icon-btn" @click="$emit('update', '')">
          <i class="u-icon">delete</i>
        </button>
      </tooltip>
      <tooltip v-else text="Restore 3rd-party translation">
        <button class="u-icon-btn" @click="$emit('update', text)">
          <i class="u-icon">settings_backup_restore</i>
        </button>
      </tooltip>
      <tooltip text="Use 3rd-party translation as it is">
        <button class="u-icon-btn" @click="$emit('apply', text)">
          <i class="u-icon">check_circle</i>
        </button>
      </tooltip>
    </span>
    <span :class="{ 'u-muted': !isEdit }">
      <tooltip :text="tooltipText">
        <span class="u-faded">
          <i class="u-icon">info_outline</i> by {{ translator }}
        </span>
      </tooltip>
    </span>
  </div>
</template>

<script setup>
import Tooltip from '~/components/utilities/Tooltip';

const props = defineProps({
  segment: { type: Object, default: null },
  localContent: { type: String, default: '' },
  isEdit: Boolean,
  isEditable: Boolean,
});

const text = computed(() => {
  return props.segment?.ai?.content || '';
});

defineEmits(['update', 'apply']);

const tooltipText = computed(() => {
  const info = props.segment?.ai?.info || '';
  return `${info} Feel free to use this text as the basis of your translation or start from scratch.`;
});

const translator = computed(() => {
  return props.segment?.ai?.translator || '';
});
</script>
