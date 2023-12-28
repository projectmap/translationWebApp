<script setup>
import { storeToRefs } from 'pinia';

import { useUserStore } from '~/store';
import Modal from '~/components/structure/Modal.vue';
import ErrorModal from '~/components/modal-content/timeline/ErrorModal.vue';

defineProps({
  open: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  contributorsLink: { type: String, default: '' },
});

const emit = defineEmits(['toggle-validation-modal']);

const userStore = useUserStore();

const { isAdmin, isGc } = storeToRefs(userStore);

const canAddContributor = computed(() => isAdmin.value || isGc.value);

const toggleModal = () => {
  emit('toggle-validation-modal');
};
</script>

<template>
  <modal
    title="Translator Validation"
    :open="open"
    custom-classes="c-modal--completion"
  >
    <error-modal @toggle-modal="toggleModal">
      <p class="u-mb-- info-text">
        Oops! It seems a translator hasn't been assigned to this book yet.
      </p>
      <p v-if="canAddContributor" class="u-mb-- sub-info-text">
        To start editing,
        <nuxt-link
          :to="contributorsLink"
          title="Add contributors to translation"
          target="_blank"
          class="contributor-link"
          >click here</nuxt-link
        >
        to assign a translator to this book.
      </p>
      <p v-else class="u-mb-- sub-info-text">
        To start editing, please reach out to your organization's admin and
        request a translator to be assigned to this book.
      </p>
    </error-modal>
  </modal>
</template>

<style lang="scss"></style>
