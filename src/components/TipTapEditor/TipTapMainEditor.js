"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { createRoot } from "react-dom/client";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import {
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";
import { CustomTable } from "./utils/CustomTable";
import {
  IndentBlock,
  IndentCommands,
  ExtendedTextStyle,
  LineHeight,
  SafeLink,
  CustomHorizontalRule,
} from "./utils/tiptapExtensions";
import { StyledParagraph } from './utils/StyledParagraph';

import Toolbar from "./Toolbar";
import LinkBubble from "./LinkBubble";
import { BottomTableMenu, TopTableMenu } from "./TableBubble";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import "./styles/TipTapMainEditor.css";

const TipTapMainEditor = ({ initialContent, onContentChange }) => {
  const [activeStyles, setActiveStyles] = useState({});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: false,
        underline: false,
        paragraph: false, 
      }),
      StyledParagraph,
      IndentBlock,
      IndentCommands,
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      SafeLink.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: true }),
      CustomTable, 
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({ multicolor: true }),
      ExtendedTextStyle,
      LineHeight,
      CustomHorizontalRule,
    ],
    content: initialContent || "",

    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
      setActiveStyles({
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isSubscript: editor.isActive("subscript"),
        isSuperscript: editor.isActive("superscript"),
        textAlign:
          ["left", "center", "right", "justify"].find((align) =>
            editor.isActive({ textAlign: align })
          ) || "left",
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isLink: editor.isActive("link"),
        color: editor.getAttributes("textStyle").color,
        highlight: editor.getAttributes("highlight")?.color,
        fontFamily: editor.getAttributes("textStyle").fontFamily,
        fontSize: editor.getAttributes("textStyle").fontSize,
      });
    },

    onSelectionUpdate: ({ editor }) => {
      setActiveStyles({
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isSubscript: editor.isActive("subscript"),
        isSuperscript: editor.isActive("superscript"),
        textAlign:
          ["left", "center", "right", "justify"].find((align) =>
            editor.isActive({ textAlign: align })
          ) || "left",
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isLink: editor.isActive("link"),
        color: editor.getAttributes("textStyle").color,
        highlight: editor.getAttributes("highlight")?.color,
        fontFamily: editor.getAttributes("textStyle").fontFamily,
        fontSize: editor.getAttributes("textStyle").fontSize,
      });
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => {
      if (editor) editor.destroy();
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((initialContent || "") !== current) {
      editor.commands.setContent(initialContent || "", false);
    }
  }, [initialContent, editor]);
  
  useEffect(() => {
    if (!editor) return;
    const menu = document.createElement("div");
    menu.className = "link-bubble-menu";
    const root = createRoot(menu);

    const tip = tippy("body", {
      trigger: "manual",
      content: menu,
      placement: "top",
      interactive: true,
      zIndex: 99999,
    })[0];

    const captureClick = (ev) => {
      const target = ev.target;
      if (!(target instanceof HTMLElement)) return;
      const anchor = target.closest("a");
      if (anchor) {
        ev.preventDefault();
        if (typeof ev.stopImmediatePropagation === "function") {
          ev.stopImmediatePropagation();
        }
        ev.stopPropagation();
        editor.chain().focus().extendMarkRange("link").run();
      }
    };
    editor.view.dom.addEventListener("click", captureClick, true);

    const update = () => {
      const isActive = editor.isActive("link");
      if (!isActive) {
        tip.hide();
        return;
      }
      root.render(<LinkBubble editor={editor} />);
      const { view } = editor;
      const { from } = view.state.selection;
      const start = view.coordsAtPos(from);
      tip.setProps({
        getReferenceClientRect: () => ({
          width: 0,
          height: 0,
          top: start.top,
          bottom: start.bottom,
          left: start.left,
          right: start.right,
          x: start.left,
          y: start.top,
          toJSON() {
            return {};
          },
        }),
      });
      tip.show();
    };

    const onTrans = () => update();
    const onSel = () => update();
    editor.on("transaction", onTrans);
    editor.on("selectionUpdate", onSel);

    update();
    return () => {
      editor.off("transaction", onTrans);
      editor.off("selectionUpdate", onSel);
      if (editor && !editor.isDestroyed) {
        editor.view.dom.removeEventListener("click", captureClick, true);
      }
      tip.destroy();
    };
  }, [editor]);
  

useEffect(() => {
  if (!editor) return;
  
  const topMenuNode = document.createElement("div");
  const bottomMenuNode = document.createElement("div");
  const topRoot = createRoot(topMenuNode);
  const bottomRoot = createRoot(bottomMenuNode);

  const topTip = tippy("body", {
    trigger: "manual",
    content: topMenuNode,
    placement: "top-start",
    interactive: true,
    zIndex: 99999,
  })[0];

  const bottomTip = tippy("body", {
    trigger: "manual",
    content: bottomMenuNode,
    placement: "bottom", 
    interactive: true,
    zIndex: 99999,
  })[0];

  const getTopMenuReference = () => {
    const { view } = editor;
    const { from } = view.state.selection;
    let tableDom = null;

    try {
      const startNode = view.domAtPos(from).node.parentElement;
      if (startNode?.closest) {
        tableDom = startNode.closest(".tableWrapper");
      }
    } catch (e) {}

    if (!tableDom) {
      const $from = view.state.doc.resolve(from);
      for (let depth = $from.depth; depth >= 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === "table") {
          try {
            const dom = view.nodeDOM($from.before(depth));
            if (dom?.getBoundingClientRect) tableDom = dom;
          } catch (e) {}
          break;
        }
      }
    }
    
    const tableRect = tableDom?.getBoundingClientRect() || new DOMRect(0, 0, 0, 0);

    return {
      width: 0,
      height: 0,
      top: tableRect.top,
      left: tableRect.left,
      right: tableRect.left,
      bottom: tableRect.top,
    };
  };
  
  const getBottomMenuReference = () => {
    const { view } = editor;
    const { from } = view.state.selection;
    let cellDom = null;

    try {
      const startNode = view.domAtPos(from).node.parentElement;
      if (startNode?.closest) {
        cellDom = startNode.closest("td, th");
      }
    } catch (e) {}
    
    if (!cellDom) {
      const tableReference = getTopMenuReference();
      if (tableReference.top > 0) { 
          const tableRect = editor.view.dom.querySelector('.tableWrapper')?.getBoundingClientRect();
          if (tableRect) {
               return {
                  width: tableRect.width,
                  height: 0,
                  top: tableRect.bottom,
                  bottom: tableRect.bottom,
                  left: tableRect.left,
                  right: tableRect.right,
               };
          }
      }
    }
    
    return cellDom?.getBoundingClientRect() || new DOMRect(0, 0, 0, 0);
  };

  const update = () => {
    const inTable = editor.isActive("table");

    if (!inTable) {
      topTip.hide();
      bottomTip.hide();
      return;
    }

    topRoot.render(<TopTableMenu editor={editor} />);
    bottomRoot.render(<BottomTableMenu editor={editor} />);
    
    topTip.setProps({ getReferenceClientRect: getTopMenuReference });
    const bottomRef = getBottomMenuReference();
    const isCellSelection = bottomRef && bottomRef.width > 0 && bottomRef.height > 0;
    bottomTip.setProps({ 
      getReferenceClientRect: () => bottomRef,
      placement: isCellSelection ? 'bottom' : 'bottom-start' 
    });

    topTip.show();
    bottomTip.show();
  };

  const onTrans = () => update();
  const onSel = () => update();
  editor.on("transaction", onTrans);
  editor.on("selectionUpdate", onSel);

  update();

  return () => {
    editor.off("transaction", onTrans);
    editor.off("selectionUpdate", onSel);
    topTip?.destroy();
    bottomTip?.destroy();
  };
}, [editor]);

  if (!editor) return null;

  return (
    <div
      className="tiptap-editor-container"
      style={{ border: "1px solid #ccc", borderRadius: "4px" }}
    >
      <Toolbar editor={editor} activeStyles={activeStyles} />
      <EditorContent
        editor={editor}
        className="tiptap-scroll-area"
        onClick={(e) => {
          const target = e.target;
          if (!(target instanceof HTMLElement)) return;
          const anchor = target.closest("a");
          if (anchor) {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().extendMarkRange("link").run();
          }
        }}
      />
    </div>
  );
};

export default TipTapMainEditor;