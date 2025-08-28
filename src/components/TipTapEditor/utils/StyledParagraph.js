import { Paragraph } from '@tiptap/extension-paragraph';

export const StyledParagraph = Paragraph.extend({
  name: 'paragraph',

  addAttributes() {
    return {
      ...this.parent?.(),
      isSpaced: {
        default: false,
        parseHTML: element => element.getAttribute('data-is-spaced') === 'true',
      },
      isBordered: {
        default: false,
        parseHTML: element => element.getAttribute('data-is-bordered') === 'true',
      },
      isNeon: {
        default: false,
        parseHTML: element => element.getAttribute('data-is-neon') === 'true',
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const { isSpaced, isBordered, isNeon } = node.attrs;
    const classes = [];

    if (isSpaced) classes.push('text-style-spaced');
    if (isBordered) classes.push('text-style-bordered');
    if (isNeon) classes.push('text-style-neon');
    
    const dataAttrs = {
      'data-is-spaced': isSpaced || null,
      'data-is-bordered': isBordered || null,
      'data-is-neon': isNeon || null,
    };

    return [
      'p',
      {
        ...HTMLAttributes,
        ...dataAttrs,
        class: `${HTMLAttributes.class || ''} ${classes.join(' ')}`.trim(),
      },
      0,
    ];
  },
  
  addCommands() {
    return {
      ...this.parent?.(),
      toggleSpacedStyle: () => ({ commands, editor }) => {
        const current = editor.getAttributes('paragraph').isSpaced;
        return commands.updateAttributes('paragraph', { isSpaced: !current });
      },
      toggleBorderedStyle: () => ({ commands, editor }) => {
        const current = editor.getAttributes('paragraph').isBordered;
        return commands.updateAttributes('paragraph', { isBordered: !current });
      },
      toggleNeonStyle: () => ({ commands, editor }) => {
        const current = editor.getAttributes('paragraph').isNeon;
        return commands.updateAttributes('paragraph', { isNeon: !current });
      },
    };
  },
});