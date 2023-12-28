import { Mark } from '@tiptap/core';
import { entityTypes } from '../../utils';

export const WEntityExtension = Mark.create({
  name: 'wEntity',
  addOptions() {
    return {
      types: entityTypes,
      value: undefined,
    };
  },
  addAttributes() {
    return {
      type: {
        default: null,
      },
      value: {
        default: undefined,
      },
    };
  },
  parseHTML() {
    return this.options.types?.map((type) => ({
      tag: `w-entity[type="${type.toString()}"]`,
      getAttrs: (node) => ({ type, value: node.getAttribute('value') }),
    }));
  },
  renderHTML({ mark }) {
    return [
      'w-entity',
      {
        type: mark?.attrs?.type.toString(),
        value: mark?.attrs?.value ?? undefined,
      },
      0,
    ];
  },
  addCommands() {
    return {
      toggleWEntity:
        (attributes) =>
        ({ commands, tr }) => {
          if (
            !this.options.types.includes(attributes.type) ||
            !attributes.value
          ) {
            return false;
          }

          const { from, to } = tr.selection;

          return commands.toggleMark(this.name, attributes, { from, to });
        },
    };
  },
});
