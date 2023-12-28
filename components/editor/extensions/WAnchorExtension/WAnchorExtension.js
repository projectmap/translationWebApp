import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

export const WAnchorExtension = Node.create({
  name: 'wAnchor',
  inline: true,
  draggable: true,
  selectable: true,
  content: 'inline*',
  atom: true,
  isolating: true,
  group: 'inline',
  addOptions() {
    return {
      HTMLAttributes: {
        id: null,
        contenteditable: false,
      },
    };
  },
  addAttributes() {
    return {
      id: {
        default: this.options.HTMLAttributes.id,
      },
      contenteditable: {
        default: this.options.HTMLAttributes.contenteditable,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-anchor[id]',
        getAttrs: (node) => {
          return { id: node.getAttribute('id') };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['w-anchor', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleWAnchor:
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
      removeWAnchor:
        () =>
        ({ tr, dispatch, state }) => {
          const { from, to } = state.selection;

          if (tr.selection?.node.type === this.type) {
            if (dispatch) {
              dispatch(tr.delete(from, to).scrollIntoView());
            }

            return true;
          }
          return false;
        },
    };
  },
});
