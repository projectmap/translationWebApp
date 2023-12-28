import { Node } from '@tiptap/core';

export const WParaExtension = Node.create({
  name: 'wPara',
  group: 'block',
  content: 'wTextBlock{1}',
  atom: true,
  marks: '',
  draggable: false,
  parseHTML() {
    return [
      {
        tag: 'w-para',
      },
    ];
  },
  renderHTML() {
    return ['w-para', {}, 0];
  },
});
