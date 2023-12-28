<script setup>
import Modal from '@/components/structure/Modal.vue';
import ProcessingModal from '@/components/translate/new-project/ProcessingModal.vue';
import CompletionModal from '@/components/modal-content/timeline/CompletionModal.vue';
import ErrorModal from '@/components/modal-content/timeline/ErrorModal.vue';
import ConfirmationModal from '@/components/modal-content/timeline/ConfirmationModal.vue';

defineProps({
  open: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: null },
  processing: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle-modal', 'submit']);

const toggleModal = () => {
  emit('toggle-modal');
};

const submitFunc = () => {
  emit('submit');
};
</script>

<template>
  <modal
    title="Chapter Approval"
    :open="open"
    custom-classes="c-modal--completion"
  >
    <processing-modal v-if="processing" />
    <div v-else-if="completed">
      <completion-modal @toggle-modal="toggleModal">
        <p class="u-mb-- info-text">Chapter has been successfully approved.</p>
      </completion-modal>
    </div>
    <div v-else-if="error">
      <error-modal
        resubmit
        @toggle-modal="toggleModal"
        @submit-approval="submitFunc"
      >
        <p v-if="errorMessage" class="u-mb-- info-text">
          {{ errorMessage }}
        </p>
        <p v-else class="u-mb-- info-text">
          Oops! Something went wrong and we were unable to process your request.
        </p>
        <p class="u-mb-- sub-info-text">Please try again later.</p>
      </error-modal>
    </div>
    <div v-else>
      <confirmation-modal
        resubmit
        confirm-btn-label="Yes"
        deny-btn-label="No"
        @toggle-modal="toggleModal"
        @submit-approval="submitFunc"
      >
        <p class="u-mb-- info-text">
          Are you sure you want to approve this whole chapter?
        </p>
        <p class="u-mb-- sub-info-text">
          You have the option to approve all the sentences in this chapter at
          once.
        </p>
      </confirmation-modal>
    </div>
  </modal>
</template>
