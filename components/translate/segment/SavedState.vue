<template>
  <badge v-if="error" color="red" soft border>
    <i class="u-icon">error</i> Error while saving
  </badge>
  <badge v-else-if="state === 'success'" color="green" soft border>
    <i class="u-icon">cloud_done</i> Saved
  </badge>
  <badge v-else-if="state === 'pending'" color="green" soft border>
    <i class="u-icon u-icon--rotating">refresh</i> Saving ...
  </badge>
  <badge v-else-if="touched" color="yellow" soft border>
    <i class="u-icon">mode_edit</i> Edited
  </badge>
</template>

<script setup>
import isObject from 'lodash/isObject';
// change to functional components if the badge isn't needed any more
import Badge from '~/components/structure/Badge';

const props = defineProps({
  touched: Boolean,
  state: { type: [String, Object], default: '' },
});

const error = computed(() => {
  return props.state === 'error' || (props.state && isObject(props.state))
    ? props.state
    : null;
});
</script>
