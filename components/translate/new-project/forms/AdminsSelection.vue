<template>
  <div class="step levels-step">
    <div class="step-container">
      <overlay-loader :active="loading" message="Fetching Data...">
        <div class="step-form">
          <h5>Choose the organization to assign the project to</h5>

          <div class="form-row o-flex">
            <div class="form-item form-item--full-width">
              <p class="u-muted u-mb--">Choose Division</p>
              <filter-component
                label="Select"
                :shadow="false"
                :outline="true"
                :options="divisions"
                :current="selectedDivision"
                :allow-all="false"
                :limit-label="false"
                module="project-creation"
                search
                clearable
                @update:current="onUpdate('division', $event)"
              />
              <p
                v-if="
                  validation.$dirty &&
                  validation.translationFormData.division.$invalid
                "
                class="c-form__error--small"
              >
                Division is required
              </p>
            </div>
          </div>
          <div class="form-row o-flex">
            <div class="form-item form-item--full-width">
              <p class="u-muted u-mb--">Choose Union (opt)</p>
              <filter-component
                label="Select"
                :shadow="false"
                :outline="true"
                :options="unions"
                :current="selectedUnion"
                :allow-all="false"
                :limit-label="false"
                search
                clearable
                module="project-creation"
                @update:current="onUpdate('union', $event)"
              />
            </div>
          </div>

          <div v-if="hasUnionConference" class="form-row o-flex">
            <div class="form-item form-item--full-width">
              <p class="u-muted u-mb--">Choose Conference (opt)</p>
              <filter-component
                label="Select"
                :shadow="false"
                :outline="true"
                :options="unionsConferenceList"
                :current="selectedUnionConference"
                :allow-all="false"
                :limit-label="false"
                search
                clearable
                module="project-creation"
                @update:current="onUpdate('union-conference', $event)"
              />
            </div>
          </div>
          <div class="form-row o-flex">
            <div class="form-item form-item--full-width">
              <p class="u-muted u-mb--">Choose Publisher (opt)</p>
              <filter-component
                label="Select"
                :shadow="false"
                :outline="true"
                :options="publishers"
                :current="selectedPublisher"
                :allow-all="false"
                :limit-label="false"
                search
                clearable
                module="project-creation"
                @update:current="onUpdate('publisher', $event)"
              />
            </div>
          </div>
        </div>
      </overlay-loader>
    </div>
  </div>
</template>

<script setup>
import isEmpty from 'lodash/isEmpty';

import OverlayLoader from '~/components/OverlayLoader.vue';
import FilterComponent from '~/components/project-list/Filter';

const props = defineProps({
  divisions: { type: Array, default: () => [] },
  unions: { type: Array, default: () => [] },
  publishers: { type: Array, default: () => [] },
  currentStep: { type: Number, default: 1 },
  loading: { type: Boolean, default: false },
  selectedDivision: { type: Array, default: () => {} },
  selectedUnion: { type: Array, default: () => {} },
  selectedPublisher: { type: Array, default: () => {} },
  selectedUnionConference: { type: Array, default: () => {} },
  unionsConferenceList: { type: Array, default: () => [] },
});

const emits = defineEmits([
  'fetch-divisions',
  'update-filter',
  'update-form-data',
  'clear-filter-options',
  'fetch-unions',
  'fetch-publishers',
]);

onMounted(() => {
  emits('fetch-divisions');
});

const validation = inject('validation');

const hasUnionConference = computed(() => {
  return !isEmpty(props.unionsConferenceList);
});

// A method that is called when the user selects a division, union or publisher. It is used to
// update the selectedDivision, selectedUnion and selectedPublisher data properties.
const onUpdate = (key, value) => {
  switch (key) {
    case 'division':
      emits('update-filter', 'selectedDivision', value);
      emits('update-filter', 'selectedUnion', null);
      emits('update-filter', 'selectedPublisher', null);
      emits('update-filter', 'unionsConferenceList', []);

      if (value?.id) {
        getUnions(value?.id);
        getPublishersByDivisionId(value?.id);
        emits('update-form-data', 'division', value?.id);
      } else {
        emits('clear-filter-options', 'unions');
        emits('clear-filter-options', 'publishers');
        emits('update-form-data', 'division', null);
        emits('update-form-data', 'union', null);
        emits('update-form-data', 'publishing_house', null);
      }
      break;

    case 'union':
      emits('update-filter', 'selectedUnion', value);
      emits('update-filter', 'selectedUnionConference', null);
      emits('update-filter', 'selectedPublisher', null);

      if (!isEmpty(value?.related)) {
        const options = value?.related?.map((a) => {
          if (!a.slug) {
            a.slug = a.domain;
          }
          a.name = `${a.domain} - ${a.name}`;

          return a;
        });
        emits('update-filter', 'unionsConferenceList', options);
      } else {
        emits('update-filter', 'unionsConferenceList', []);
      }
      if (value?.id) {
        getPublishersByUnionId(value?.id);
        emits('update-form-data', 'union', value?.id);
      } else {
        emits('update-form-data', 'union', null);
        emits('clear-filter-options', 'publishers');
      }
      emits('update-form-data', 'publishing_house', null);
      break;

    case 'union-conference':
      emits('update-filter', 'selectedUnionConference', value);
      emits('update-filter', 'selectedPublisher', null);

      if (value?.id) {
        getPublishersByUnionId(value?.id);
        emits('update-form-data', 'union', value?.id);
      } else {
        emits('update-form-data', 'union', props.selectedUnion?.id);
        emits('clear-filter-options', 'publishers');
      }
      emits('update-form-data', 'publishing_house', null);

      break;

    case 'publisher':
      emits('update-filter', 'selectedPublisher', value);
      if (value?.id) {
        emits('update-form-data', 'publishing_house', value?.id);
      } else {
        emits('update-form-data', 'publishing_house', null);
      }
      break;
  }
};

// A method that is called when the user selects a division. It is used to
// update the selectedDivision, selectedUnion and selectedPublisher data properties.
const getUnions = (divisionId) => {
  emits('fetch-unions', divisionId);
};

// A method that is called when the user selects a division. It is used to
// update the selectedDivision, selectedUnion and selectedPublisher data properties.
const getPublishersByDivisionId = (divisionId) => {
  let apiUrl = '';
  if (divisionId) {
    apiUrl = `admin/division/${divisionId}/publishing-house/`;
  }
  emits('fetch-publishers', apiUrl);
};

// A method that is called when the user selects a union. It is used to
// update the selectedDivision, selectedUnion and selectedPublisher data properties.
const getPublishersByUnionId = (unionId) => {
  let apiUrl = '';
  if (props.selectedDivision && unionId) {
    apiUrl = `admin/division/${props.selectedDivision?.id}/union/${unionId}/publishing-house/`;
  }
  emits('fetch-publishers', apiUrl);
};
</script>

<style></style>
