import { Mark } from '@tiptap/core';

export const WFormatSubscriptExtension = Mark.create({
  name: 'wFormatSubscript',
  addAttributes() {
    return {
      type: {
        default: 'subscript',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-format[type=subscript]',
        getAttrs: () => ({ type: 'subscript' }),
      },
    ];
  },
  renderHTML({ mark }) {
    return [
      'w-format',
      {
        type: mark.attrs?.type.toString(),
      },
      0,
    ];
  },
  addCommands() {
    return {
      setWFormatSubscript:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleWFormatSubscript:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetWFormatSubscript:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
