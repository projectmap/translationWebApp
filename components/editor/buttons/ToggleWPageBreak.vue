<template>
  <command-button
    command-name="Page Break"
    action-name="Pagebreak"
    :disabled="isDisabled"
    :command-image-icon="isDisabled ? pageBreakDisabled : pageBreakIcon"
    :type="type"
    :editor-instance="editorInstance"
    @command-function="command"
  />
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import { storeToRefs } from 'pinia';
import CommandButton from './CommandButton.vue';
import pageBreakIcon from '@/components/editor/extensions/WPageExtension/assets/images/W-page_icon.svg';
import pageBreakDisabled from '@/components/editor/extensions/WPageExtension/assets/images/W-page_icon-disabled.svg';
import { useAuthStore, useEditorStore, userAlertStore } from '~/store';

const props = defineProps({
  editorInstance: { type: Object, default: () => {} },
  isTextSelected: { type: Boolean, default: false },
  pageBreak: { type: String, default: null },
});

const type = ref('wPage');

const authStore = useAuthStore();
const { isOnline } = storeToRefs(authStore);

const editorStore = useEditorStore();
const alertStore = userAlertStore();

const command = async () => {
  if (isOnline.value) {
    try {
      const data = await editorStore.fetchAllowedPageBreak();
      if (data?.pageBreak) {
        props.editorInstance
          .chain()
          .focus()
          .toggleWPageBreak({
            number: data?.pageBreak,
          })
          .run();
      } else {
        alertStore.new({
          message:
            'We could not fetch page break number for current segment, please try again.',
          color: 'red',
          duration: 2000,
        });
      }
    } catch (e) {
      alertStore.new({
        message:
          'We could not fetch page break number for current segment, please try again.',
        color: 'red',
        duration: 2000,
      });
    }
  }
};

const isDisabled = computed(() => {
  if (isOnline.value) {
    return isEmpty(props.editorInstance) || props.isTextSelected;
  }
  return true;
});
</script>

<style></style>
