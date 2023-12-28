import { Node } from '@tiptap/core';

let indentValue = 0;

export const WTextBlockExtension = Node.create({
  name: 'wTextBlock',
  content: 'inline*',
  draggable: false,
  addOptions() {
    return {
      type: 'paragraph',
      indent: indentValue,
    };
  },
  addAttributes() {
    return {
      type: {
        default: 'paragraph',
      },
      indent: {
        default: indentValue,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'w-text-block',
      },
    ];
  },
  renderHTML({ node }) {
    const defaultType = this.options.type;
    const defaultIndent = this.options.indent;

    // Get parent node name from editor props
    const { editor } = this;
    const parentNodeName = editor.options?.editorProps?.tag;

    if (parentNodeName === 'w-sent') {
      if (node?.attrs && node?.attrs?.type !== 'paragraph') {
        return [
          'w-text-block',
          node.attrs?.type
            ? {
                type: node.attrs.type.toString(),
                draggable: 'false',
              }
            : { type: defaultType, draggable: 'false' },
          0,
        ];
      }
      return ['w-text-block', {}, 0];
    } else if (node?.attrs) {
      return [
        'w-text-block',
        node.attrs?.type
          ? {
              type: node.attrs.type.toString(),
              indent: node.attrs.indent.toString() ?? defaultIndent,
            }
          : { type: defaultType, indent: defaultIndent },
        0,
      ];
    }

    return ['w-text-block', { type: defaultType, indent: defaultIndent }, 0];
  },
  addCommands() {
    return {
      /* convert type of text block 
      type - blockquote, paragraph, poem
      */
      convertWTextBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
      updateWTextBlockIndent:
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
