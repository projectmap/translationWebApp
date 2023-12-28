import { Mark } from '@tiptap/core';

export const WFormatAllCapsExtension = Mark.create({
  name: 'wFormatAllCaps',
  addAttributes() {
    return {
      type: {
        default: 'all-caps',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-format[type=all-caps]',
        getAttrs: () => ({ type: 'all-caps' }),
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
      setWFormatAllCaps:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleWFormatAllCaps:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetWFormatAllCaps:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
