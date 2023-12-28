import { Mark } from '@tiptap/core';

export const WFormatSmallCapsExtension = Mark.create({
  name: 'wFormatSmallCaps',
  addAttributes() {
    return {
      type: {
        default: 'small-caps',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-format[type=small-caps]',
        getAttrs: () => ({ type: 'small-caps' }),
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
      setWFormatSmallCaps:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleWFormatSmallCaps:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetWFormatSmallCaps:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
