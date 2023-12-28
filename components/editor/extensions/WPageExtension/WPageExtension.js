import { Node } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

export const WPageExtension = Node.create({
  name: 'wPage',
  content: 'inline*',
  marks: '_',
  atom: true,
  inline: true,
  draggable: true,
  selectable: true,
  isolating: true,
  group: 'inline',
  addOptions() {
    return {
      number: '1',
    };
  },
  addAttributes() {
    return {
      number: {
        default: this.options.number,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-page',
        getAttrs: (node) => {
          return { number: node.getAttribute('number') };
        },
      },
    ];
  },
  renderHTML({ node }) {
    return [
      'w-page',
      { number: node?.attrs?.number ? node?.attrs?.number.toString() : '1' },
    ];
  },
  addCommands() {
    return {
      toggleWPageBreak:
        (attributes) =>
        ({ tr, dispatch, state }) => {
          const { from, to } = state.selection;
          const node = this.type.create(attributes);

          dispatch?.(
            tr
              .replaceRangeWith(from, to, node)
              .setSelection(TextSelection.create(tr.doc, from + 1))
              .scrollIntoView()
          );

          return true;
        },
    };
  },
});
