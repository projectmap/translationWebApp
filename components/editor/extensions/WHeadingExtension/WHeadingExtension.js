import { Node } from '@tiptap/core';
import { headingLevels } from '../../utils';

export const WHeadingExtension = Node.create({
  name: 'wHeading',
  content: 'inline*',
  group: 'block',
  defining: true,
  addOptions() {
    return {
      levels: headingLevels,
      HTMLAttributes: {},
    };
  },
  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
    };
  },
  parseHTML() {
    return this.options.levels?.map((le) => ({
      tag: `w-heading[level="${le.toString()}"]`,
      getAttrs: () => ({ level: le.toString() }),
    }));
  },
  renderHTML({ node }) {
    return ['w-heading', { level: node?.attrs?.level.toString() }, 0];
  },
  addCommands() {
    return {
      setWFormatHeading:
        (attributes) =>
        ({ commands }) => {
          if (!this.options.levels.includes(attributes.level)) {
            return false;
          }

          return commands.setNode(this.name, attributes);
        },
      toggleWFormatHeading:
        (attributes) =>
        ({ commands }) => {
          if (!this.options.levels.includes(attributes.level)) {
            return false;
          }

          return commands.toggleNode(this.name, 'paragraph', attributes);
        },
    };
  },
});
