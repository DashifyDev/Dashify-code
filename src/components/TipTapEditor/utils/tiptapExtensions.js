import { Node, Extension } from "@tiptap/core";
import { TextStyle } from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

export const IndentBlock = Node.create({
  name: "indentBlock",
  group: "block",
  content: "block+",
  addAttributes() {
    return {
      indent: {
        default: 1,
        parseHTML: (element) =>
          parseInt(element.getAttribute("data-indent"), 10),
        renderHTML: (attributes) => ({ "data-indent": attributes.indent }),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-indent]",
        getAttrs: (dom) => ({
          indent: parseInt(dom.getAttribute("data-indent"), 10),
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const indent = HTMLAttributes["data-indent"];
    return [
      "div",
      { ...HTMLAttributes, style: `margin-left: ${indent * 24}px` },
      0,
    ];
  },
});

export const IndentCommands = Extension.create({
  name: "indentCommands",
  addCommands() {
    return {
      indent:
        () =>
        ({ editor, chain }) => {
          if (editor.isActive("listItem")) {
            return chain().sinkListItem("listItem").run();
          }
          if (editor.isActive("indentBlock")) {
            const currentIndent = editor.getAttributes("indentBlock").indent;
            if (currentIndent < 6) {
              return chain()
                .updateAttributes("indentBlock", { indent: currentIndent + 1 })
                .run();
            }
            return true;
          }
          return chain().wrapIn("indentBlock", { indent: 1 }).run();
        },
      outdent:
        () =>
        ({ editor, chain }) => {
          if (editor.isActive("listItem")) {
            return chain().liftListItem("listItem").run();
          }
          if (editor.isActive("indentBlock")) {
            const currentIndent = editor.getAttributes("indentBlock").indent;
            if (currentIndent > 1) {
              return chain()
                .updateAttributes("indentBlock", { indent: currentIndent - 1 })
                .run();
            }
            return chain().lift("indentBlock").run();
          }
          return false;
        },
    };
  },
});

export const ExtendedTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily,
        renderHTML: (attributes) =>
          attributes.fontFamily
            ? { style: `font-family: ${attributes.fontFamily}` }
            : {},
      },
      color: {
        default: null,
        parseHTML: (element) => element.style.color,
        renderHTML: (attributes) =>
          attributes.color ? { style: `color: ${attributes.color}` } : {},
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: (attributes) =>
          attributes.fontSize
            ? { style: `font-size: ${attributes.fontSize}` }
            : {},
      },
    };
  },
});

export const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (value) =>
        ({ chain }) => {
          if (!value) return false;
          return chain()
            .command(({ tr, state }) => {
              const { from, to } = state.selection;
              state.doc.nodesBetween(from, to, (node, pos) => {
                if (this.options.types.includes(node.type.name)) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    lineHeight: value,
                  });
                }
              });
              return true;
            })
            .run();
        },
      unsetLineHeight:
        () =>
        ({ chain }) => {
          return chain()
            .command(({ tr, state }) => {
              const { from, to } = state.selection;
              state.doc.nodesBetween(from, to, (node, pos) => {
                if (
                  this.options.types.includes(node.type.name) &&
                  node.attrs.lineHeight
                ) {
                  const { lineHeight, ...rest } = node.attrs;
                  tr.setNodeMarkup(pos, undefined, {
                    ...rest,
                    lineHeight: null,
                  });
                }
              });
              return true;
            })
            .run();
        },
    };
  },
});

export const SafeLink = Link.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank', 
        rel: 'noopener noreferrer nofollow', 
        class: 'tiptap-link', 
      },
    };
  },
});

export const CustomHorizontalRule = HorizontalRule.extend({
  name: "horizontalRule",
  addAttributes() {
    return {
      variant: {
        default: "solid",
        parseHTML: (element) => element.getAttribute("data-variant") || "solid",
        renderHTML: (attributes) => ({ "data-variant": attributes.variant }),
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const { variant } = node.attrs;
    const borderStyle =
      variant === "dashed"
        ? "1px dashed currentColor"
        : variant === "dotted"
        ? "1px dotted currentColor"
        : "1px solid currentColor";

    return [
      "hr",
      {
        ...HTMLAttributes,
        style: `border: none; border-top: ${borderStyle}; margin: 1em 10px;`,
      },
    ];
  },
  addCommands() {
    return {
      insertDivider:
        (variant = "solid") =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name, attrs: { variant } })
            .run();
        },
    };
  },
});
