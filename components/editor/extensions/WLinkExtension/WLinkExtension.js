import { Mark, mergeAttributes } from '@tiptap/core';

export const WLinkExtension = Mark.create({
  name: 'wLink',
  group: 'block',
  content: 'inline*',
  atom: true,
  marks: '',
  draggable: false,
  addOptions() {
    return {
      HTMLAttributes: {
        class: null,
        'data-link': null,
        title: null,
      },
    };
  },
  addAttributes() {
    return {
      class: {
        default: this.options.HTMLAttributes.class,
      },
      'data-link': {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-link]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setWLink:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleWLink:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetWLink:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
