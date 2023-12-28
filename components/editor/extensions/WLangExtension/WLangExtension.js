import { Mark } from '@tiptap/core';

export const WLangExtension = Mark.create({
  name: 'wLang',
  addOptions() {
    return {
      lang: null,
      dir: null,
    };
  },
  addAttributes() {
    return {
      lang: {
        default: null,
      },
      dir: {
        default: undefined,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-lang',
        getAttrs: (node) => {
          return {
            dir: node.getAttribute('dir'),
            lang: node.getAttribute('lang'),
          };
        },
      },
    ];
  },
  renderHTML({ mark }) {
    return [
      'w-lang',
      {
        ...(mark?.attrs?.lang ? { lang: mark.attrs.lang.toString() } : {}),
        ...(mark?.attrs?.dir ? { dir: mark.attrs.dir.toString() } : {}),
      },
      0,
    ];
  },
  addCommands() {
    return {
      toggleWLang:
        (attributes) =>
        ({ commands, tr }) => {
          if (!attributes.lang || !attributes.dir) {
            return false;
          }

          const { from, to } = tr.selection;

          return commands.toggleMark(this.name, attributes, { from, to });
        },
    };
  },
});
