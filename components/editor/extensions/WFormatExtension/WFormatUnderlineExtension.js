import { Mark } from '@tiptap/core';

export const WFormatUnderlineExtension = Mark.create({
  name: 'wFormatUnderline',
  addAttributes() {
    return {
      type: {
        default: 'underline',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-format[type=underline]',
        getAttrs: () => ({ type: 'underline' }),
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
      setWFormatUnderline:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleWFormatUnderline:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetWFormatUnderline:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
