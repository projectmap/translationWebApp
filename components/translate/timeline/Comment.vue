<template>
  <li class="c-comment" :class="rootClasses">
    <div class="c-node">
      <span class="u-icon">comment</span>
    </div>

    <div class="c-timeline__say">
      <comment
        :comment="item"
        @update="updateComment"
        @delete="deleteComment"
        @undelete="undeleteComment"
      >
        <user
          class="u-truncate"
          :user="item.user"
          :date="item.lastModified"
          avatar
          points
          passive
        >
          commented {{ item.role ? 'as ' + item.role : '' }}
        </user>
      </comment>
    </div>
  </li>
</template>

<script setup>
import User from '~/components/utilities/User';
import Comment from '~/components/comments/Comment';
import { patchAPI, updateAPI } from '~/helpers/apiCore';

const props = defineProps({
  item: { type: Object, default: null },
  baseUrl: { type: String, default: '' },
  belongsTo: { type: Object, default: null },
});

const emits = defineEmits(['update:item']);

const deleted = computed(() => {
  return Boolean(props.item.toDelete);
});

const isTrustee = () => {
  return props.item?.role === 'trustee';
};
const isReviewer = () => {
  return props.item?.role === 'reviewer';
};

const rootClasses = () => {
  if (deleted) return 'is-deleted';
  if (props.belongsTo?.assessment < 0) return 'is-red';
  else
    return {
      'is-green': isReviewer,
      'is-purple': isTrustee,
    };
};

const updateComment = async (comment) => {
  try {
    const { data } = await updateAPI(
      `${props.baseUrl}comments/${comment.id}/`,
      {
        content: comment.content,
      }
    );

    emits('update:item', data.comment);
  } catch (e) {}
};

const deleteComment = async (comment) => {
  try {
    const { data } = await patchAPI(`${props.baseUrl}comments/${comment.id}/`, {
      delete: true,
    });

    emits('update:item', data.comment);
  } catch (e) {}
};

const undeleteComment = async (comment) => {
  try {
    const { data } = await patchAPI(`${props.baseUrl}comments/${comment.id}/`, {
      delete: false,
    });

    emits('update:item', data.comment);
  } catch (e) {}
};
</script>
