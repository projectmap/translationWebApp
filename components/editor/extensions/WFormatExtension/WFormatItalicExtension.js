import { Mark } from '@tiptap/core';

export const WFormatItalicExtension = Mark.create({
  name: 'wFormatItalic',
  addAttributes() {
    return {
      type: {
        default: 'italic',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-format[type=italic]',
        getAttrs: () => ({ type: 'italic' }),
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
  addKeyboardShortcuts() {
    return {
      'Mod-i': () => this.editor.commands.toggleWFormatItalic(),
      'Mod-I': () => this.editor.commands.unsetWFormatItalic(),
    };
  },
  addCommands() {
    return {
      setWFormatItalic:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleWFormatItalic:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetWFormatItalic:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
