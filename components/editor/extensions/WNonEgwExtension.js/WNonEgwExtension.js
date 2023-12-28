import { Mark } from '@tiptap/core';
import { nonEgwTypes } from '../../utils';

export const WNonEgwExtension = Mark.create({
  name: 'wNonEgw',

  addOptions() {
    return {
      types: nonEgwTypes,
      HTMLAttributes: {},
    };
  },
  addAttributes() {
    return {
      type: {
        default: null,
      },
    };
  },
  parseHTML() {
    return this.options.types?.map((ty) => ({
      tag: `w-non-egw[type="${ty.toString()}"]`,
      getAttrs: () => ({ type: ty.toString() }),
    }));
  },
  renderHTML({ mark }) {
    return ['w-non-egw', { type: mark?.attrs?.type.toString() }, 0];
  },
  addCommands() {
    return {
      setWNonEgw:
        (attributes) =>
        ({ commands }) => {
          if (!this.options.types.includes(attributes.type)) {
            return false;
          }

          return commands.setMark(this.name, attributes);
        },
      toggleWNonEgw:
        (attributes) =>
        ({ commands, tr }) => {
          if (!this.options.types.includes(attributes.type)) {
            return false;
          }

          const { from, to } = tr.selection;

          return commands.toggleMark(this.name, attributes, { from, to });
        },
    };
  },
});
