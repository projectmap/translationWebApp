import { Mark } from '@tiptap/core';

export const WFormatSuperscriptExtension = Mark.create({
  name: 'wFormatSuperscript',
  addAttributes() {
    return {
      type: {
        default: 'superscript',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-format[type=superscript]',
        getAttrs: () => ({ type: 'superscript' }),
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
      setWFormatSuperscript:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleWFormatSuperscript:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetWFormatSuperscript:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
