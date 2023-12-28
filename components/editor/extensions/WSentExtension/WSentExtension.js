import { Node } from '@tiptap/core';

let indentValue = 0;

export const WSentExtension = Node.create({
  name: 'wSent',
  group: 'block',
  content: 'wTextBlock{1}',
  atom: true,
  marks: '',
  draggable: false,
  addOptions() {
    return {
      indent: indentValue,
    };
  },
  addAttributes() {
    return {
      indent: {
        default: indentValue,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-sent',
      },
    ];
  },
  renderHTML({ node }) {
    const defaultIndent = this.options.indent;

    if (node?.attrs) {
      return [
        'w-sent',
        node.attrs?.indent
          ? {
              indent: node.attrs.indent.toString(),
              draggable: 'false',
            }
          : { indent: defaultIndent, draggable: 'false' },
        0,
      ];
    }
    return ['w-sent', { indent: defaultIndent, draggable: 'false' }, 0];
  },
  addCommands() {
    return {
      updateWSentIndent:
        (attributes) =>
        ({ commands }) => {
          if (attributes?.action === 'plus') {
            indentValue += 1;
          } else {
            if (indentValue === 0) return;
            indentValue -= 1;
          }
          return commands.updateAttributes(this.name, {
            indent: indentValue,
          });
        },
    };
  },
});
