<template>
  <div class="contributors-form">
    <div v-if="canChooseTranslator" class="form-row o-flex o-flex--column">
      <div class="form-item">
        <p class="u-muted u-mb--">Translator</p>
        <filter-component
          label="Add a Translator"
          :shadow="false"
          :outline="true"
          :options="users"
          :current="state.selectedTranslator"
          :limit-label="false"
          search
          clearable
          module="project-creation"
          @update:current="onUpdate('translator', $event)"
        />
        <p
          v-if="
            validation.$dirty &&
            validation.contributorsFormData.translator.$invalid
          "
          class="c-form__error--small"
        >
          Translator is required
        </p>
      </div>
    </div>
    <div class="form-row o-flex o-flex--column">
      <div class="form-item">
        <p class="u-muted u-mb--">Editor</p>
        <filter-component
          label="Add an Editor"
          :shadow="false"
          :outline="true"
          :options="users"
          :current="state.selectedEditor"
          :limit-label="false"
          search
          clearable
          module="project-creation"
          @update:current="onUpdate('editor', $event)"
        />
        <p
          v-if="
            validation.$dirty && validation.contributorsFormData.editor.$invalid
          "
          class="c-form__error--small"
        >
          Editor is required
        </p>
      </div>
    </div>
    <div class="form-row o-flex o-flex--column">
      <div class="form-item">
        <p class="u-muted u-mb--">Reviewer <span>(optional)</span></p>
        <filter-component
          label="Add a reviewer"
          :shadow="false"
          :outline="true"
          :options="users"
          :current="state.selectedReviewer"
          :limit-label="false"
          search
          clearable
          module="project-creation"
          @update:current="onUpdate('reviewer', $event)"
        />
      </div>
    </div>
    <div class="form-row o-flex o-flex--bottom extra-contributors">
      <div class="form-item form-item--full-width">
        <p class="u-muted u-mb--">Other Contributors</p>
        <div
          v-for="(_key, keyIndex) in otherValues"
          :key="keyIndex"
          class="form-row o-flex o-flex--middle"
        >
          <div class="form-item">
            <filter-component
              label="Add a contributor"
              :shadow="false"
              :outline="true"
              :options="users"
              :current="getOtherUserValue(keyIndex)"
              :limit-label="false"
              search
              clearable
              module="project-creation"
              @update:current="onUpdate('others', $event, keyIndex)"
            />
          </div>
          <div class="form-item role-filter">
            <filter-component
              label="Role"
              :shadow="false"
              :outline="true"
              :options="roles"
              :current="getOtherRoleValue(keyIndex)"
              clearable
              module="project-creation"
              @update:current="onUpdate('role', $event, keyIndex)"
            />
          </div>
          <button
            v-if="state.otherValues.length > 1"
            class="remove--btn"
            @click.prevent="remove(keyIndex)"
          >
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
    <div class="form-row">
      <button
        class="c-btn--dark c-btn--primary add-more"
        @click.prevent="handleAddItem"
      >
        <span>Add</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import FilterComponent from '~/components/project-list/Filter';

defineProps({
  users: { type: Array, default: () => [] },
  roles: { type: Array, default: () => [] },
  canChooseTranslator: { type: Boolean },
});

const emits = defineEmits(['update-form-data']);

const state = reactive({
  selectedTranslator: null,
  selectedReviewer: null,
  selectedEditor: null,
  contributorListKeys: [0],
  contributorListId: null,
  otherValues: [
    {
      user: null,
      role: null,
    },
  ],
});
const validation = inject('validation');

/** Add new row to add extra contributors */
const handleAddItem = () => {
  // to add a new row
  state.otherValues.push({
    user: null,
    role: null,
  });

  emits('update-form-data', 'others', null, null, null, 'add');
};

/** Remove a row to remove any extra contributors */
const remove = (k) => {
  // Remove data from array
  state.otherValues.splice(k, 1);

  emits('update-form-data', 'others', null, k, null, 'remove');
};

/** Handles updating the values in the parent and current component */
const onUpdate = (key, value, valueIndex) => {
  switch (key) {
    case 'translator':
      state.selectedTranslator = value;
      emits('update-form-data', 'translator', value);
      break;

    case 'reviewer':
      state.selectedReviewer = value;
      emits('update-form-data', 'reviewer', value);
      break;

    case 'editor':
      state.selectedEditor = value;
      emits('update-form-data', 'editor', value);
      break;

    case 'others':
      state.otherValues[valueIndex].user = value;
      emits('update-form-data', 'others', value, valueIndex);
      break;

    case 'role':
      state.otherValues[valueIndex].role = value;
      emits('update-form-data', 'others', value, valueIndex, 'role');
      break;
  }
};

/** Get the value of the user selected in the extra contributors row by index */
const getOtherUserValue = (k) => {
  if (state.otherValues[k] && state.otherValues[k].user) {
    return state.otherValues[k].user;
  }
  return null;
};

/** Get the value of the role selected in the extra contributors row by index */
const getOtherRoleValue = (k) => {
  if (state.otherValues[k] && state.otherValues[k].role) {
    return state.otherValues[k].role;
  }
  return null;
};
</script>

<style lang="scss" scoped>
.add-more {
  width: fit-content !important;
  height: unset !important;
  padding: 5px 10px !important;
}

.remove--btn {
  border: 1px solid $c-primary-6;
  background: white;
  width: fit-content !important;
  height: unset !important;
  padding: 5px 10px !important;
  border-radius: 4px;
  color: $c-primary-6;
  font-size: 14px;
  cursor: pointer;
}
</style>
