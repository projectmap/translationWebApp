import { Mark, markInputRule, markPasteRule } from '@tiptap/core';

export const starInputRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/;
export const starPasteRegex = /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g;
export const underscoreInputRegex = /(?:^|\s)((?:__)((?:[^__]+))(?:__))$/;
export const underscorePasteRegex = /(?:^|\s)((?:__)((?:[^__]+))(?:__))/g;

export const WFormatBoldExtension = Mark.create({
  name: 'wFormatBold',
  addAttributes() {
    return {
      type: {
        default: 'bold',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-format[type=bold]',
        getAttrs: () => ({ type: 'bold' }),
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
      setWFormatBold:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleWFormatBold:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetWFormatBold:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
  addKeyboardShortcuts() {
    return {
      'Mod-b': () => this.editor.commands.toggleWFormatBold(),
      'Mod-B': () => this.editor.commands.unsetWFormatBold(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: starInputRegex,
        type: this.type,
      }),
      markInputRule({
        find: underscoreInputRegex,
        type: this.type,
      }),
    ];
  },
  addPasteRules() {
    return [
      markPasteRule({
        find: starPasteRegex,
        type: this.type,
      }),
      markPasteRule({
        find: underscorePasteRegex,
        type: this.type,
      }),
    ];
  },
});
