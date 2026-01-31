"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Modal from "react-modal";
import ImageInsertModal from "./ImageInsertModal";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaSubscript,
  FaSuperscript,
  FaUndo,
  FaRedo,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaListUl,
  FaListOl,
  FaLink,
  FaImage,
  FaTable,
  FaQuoteLeft,
  FaRemoveFormat,
  FaOutdent,
  FaIndent,
  FaFont,
  FaHighlighter,
  FaTextHeight,
  FaMinus,
  FaPrint,
  FaParagraph,
  FaCheck,
} from "react-icons/fa";
import FontFamilySelector from "./FontFamilySelector";
import "./styles/Toolbar.css";
import { rgbToHex } from "./utils/color";
import TableSizePicker from "./TableSizePicker";
import ColorGridPicker from "../ColorGridPicker";

Modal.setAppElement("body");

const dividerOptions = [
  { variant: "solid", className: "hr-solid" },
  { variant: "dashed", className: "hr-dashed" },
  { variant: "dotted", className: "hr-dotted" },
];



const Toolbar = ({ editor, activeStyles }) => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkState, setLinkState] = useState({
    url: "",
    text: "",
    openInNewWindow: false,
    download: false,
    anchorMode: false,
  });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDividerOpen, setIsDividerOpen] = useState(false);
  const dividerMenuRef = useRef(null);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const tableMenuRef = useRef(null);
  const [showColorGrid, setShowColorGrid] = useState(false);
  const [showHighlightGrid, setShowHighlightGrid] = useState(false);

  const openLinkModal = useCallback(() => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");

    const attrs = editor.getAttributes("link");
    const currentUrl = attrs.href || "";
    setLinkState({
      url: currentUrl,
      text: text || "",
      openInNewWindow: attrs.target === "_blank",
      download: !!attrs.download,
      anchorMode: currentUrl?.startsWith("#") || false,
    });
    setIsLinkModalOpen(true);
  }, [editor]);

  const closeLinkModal = () => setIsLinkModalOpen(false);

  useEffect(() => {
    const onOpenLinkModal = (e) => {
      const detail = e.detail || {};
      const href = detail.href || "";
      setLinkState({
        url: href.startsWith(window.location.origin)
          ? href.replace(
              `${window.location.origin}${window.location.pathname}`,
              "",
            )
          : href,
        text: detail.text || "",
        openInNewWindow: detail.target === "_blank",
        download: !!detail.download,
        anchorMode: href.startsWith("#") || href.includes(`#`),
      });
      setIsLinkModalOpen(true);
    };
    window.addEventListener("tiptap:openLinkModal", onOpenLinkModal);
    return () =>
      window.removeEventListener("tiptap:openLinkModal", onOpenLinkModal);
  }, []);

  const handleSetLink = () => {
    const { from, to } = editor.state.selection;
    let { url, text, openInNewWindow, download, anchorMode } = linkState;

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      closeLinkModal();
      return;
    }

    let inputVal = url.trim();
    if (anchorMode && !inputVal.startsWith("#")) {
      inputVal = `#${inputVal}`;
    }

    let resolvedUrl = inputVal;
    if (anchorMode && typeof window !== "undefined") {
      const base = `${window.location.origin}${window.location.pathname}`;
      resolvedUrl = `${base}${inputVal}`;
    }

    const attrs = {
      href: resolvedUrl,
      target: openInNewWindow ? "_blank" : null,
      download: download ? "" : null,
    };

    if (
      text &&
      (from === to || editor.state.doc.textBetween(from, to, " ") !== text)
    ) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: text,
          marks: [{ type: "link", attrs: attrs }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
    }

    closeLinkModal();
  };

  const addImage = useCallback(() => {
    setIsImageModalOpen(true);
  }, [editor]);

  const toggleDividerMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDividerOpen((v) => !v);
  }, []);

  const handleInsertDivider = (variant) => {
    editor.chain().focus().insertDivider(variant).run();
    setIsDividerOpen(false);
  };

  const toggleTableMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTableOpen((v) => !v);
  }, []);

  const handlePrint = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const style = `
      html, body { margin: 0; padding: 0; }
      body { padding: 24px; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      a { color: inherit; text-decoration: none; }
      img { max-width: 100%; height: auto; }
      .tableWrapper { display: block; width: 100%; max-width: 100%; overflow: visible; }
      table { border-collapse: collapse; width: 100%; table-layout: fixed; }
      th, td { border: 1px solid #e5e7eb; padding: 12px; vertical-align: top; }
      th { background: #f9fafb; font-weight: 600; }
      .tiptap-link { text-decoration: underline; }
      .print-root { max-width: 100%; }
    `;

    const doc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Print</title>
<style>${style}</style>
</head>
<body>
  <div class="print-root">${html}</div>
  <script>
    window.onload = function() {
      setTimeout(function(){ window.focus(); window.print(); window.close(); }, 50);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(doc);
    printWindow.document.close();
  }, [editor]);

  React.useEffect(() => {
    const onDocClick = (event) => {
      if (
        dividerMenuRef.current &&
        !dividerMenuRef.current.contains(event.target)
      ) {
        setIsDividerOpen(false);
      }
    };

    if (isDividerOpen) {
      document.addEventListener("click", onDocClick);
    }

    return () => {
      document.removeEventListener("click", onDocClick);
    };
  }, [isDividerOpen]);

  React.useEffect(() => {
    const onDocClick = (event) => {
      if (
        tableMenuRef.current &&
        !tableMenuRef.current.contains(event.target)
      ) {
        setIsTableOpen(false);
      }
    };

    if (isTableOpen) {
      document.addEventListener("click", onDocClick);
    }

    return () => {
      document.removeEventListener("click", onDocClick);
    };
  }, [isTableOpen]);

  if (!editor || !activeStyles) return null;

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <FaUndo />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <FaRedo />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={activeStyles.isBold ? "is-active" : ""}
            title="Bold"
          >
            <FaBold />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={activeStyles.isItalic ? "is-active" : ""}
            title="Italic"
          >
            <FaItalic />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={activeStyles.isUnderline ? "is-active" : ""}
            title="Underline"
          >
            <FaUnderline />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={activeStyles.isStrike ? "is-active" : ""}
            title="Strikethrough"
          >
            <FaStrikethrough />
          </button>
          
        </div>

        <div className="toolbar-group">
          <div className="color-picker-container">
            <button
              className="color-picker-button"
              title="Text Color"
              onClick={() => {
                setShowColorGrid(!showColorGrid);
                if (!showColorGrid) {
                  setShowHighlightGrid(false);
                }
              }}
            >
              <FaFont />
              <span
                className="color-indicator"
                style={{
                  backgroundColor:
                    rgbToHex(activeStyles.color) || "transparent",
                }}
              ></span>
            </button>
            {showColorGrid && (
              <ColorGridPicker
                onColorSelect={(color) => {
                  editor.chain().focus().setMark("textStyle", { color }).run();
                  setShowColorGrid(false);
                }}
                currentColor={rgbToHex(activeStyles.color)}
              />
            )}
          </div>
          <div className="color-picker-container">
            <button
              className="color-picker-button"
              title="Highlight Color"
              onClick={() => {
                setShowHighlightGrid(!showHighlightGrid);
                if (!showHighlightGrid) {
                  setShowColorGrid(false);
                }
              }}
            >
              <FaHighlighter />
              <span
                className="color-indicator"
                style={{
                  backgroundColor: activeStyles.highlight || "transparent",
                }}
              ></span>
            </button>
            {showHighlightGrid && (
              <ColorGridPicker
                onColorSelect={(color) => {
                  editor.chain().focus().toggleHighlight({ color }).run();
                  setShowHighlightGrid(false);
                }}
                currentColor={activeStyles.highlight}
              />
            )}
          </div>

          <FontFamilySelector
            editor={editor}
            activeFontFamily={activeStyles.fontFamily}
          />
          <select
            onChange={(e) =>
              e.target.value
                ? editor
                    .chain()
                    .focus()
                    .setMark("textStyle", { fontSize: e.target.value })
                    .run()
                : editor
                    .chain()
                    .focus()
                    .unsetMark("textStyle", { fontSize: null })
                    .run()
            }
            value={activeStyles.fontSize || ""}
            title="Font Size"
          >
            <option value="">Size</option>
            {[
              "10px",
              "12px",
              "14px",
              "16px",
              "18px",
              "20px",
              "22px",
              "24px",
              "26px",
              "28px",
              "30px",
              "32px",
              "36px",
              "40px",
              "48px"
            ].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          {/* <TextStyleDropdown editor={editor} /> */}
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={activeStyles.textAlign === "left" ? "is-active" : ""}
            title="Align Left"
          >
            <FaAlignLeft />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={activeStyles.textAlign === "center" ? "is-active" : ""}
            title="Align Center"
          >
            <FaAlignCenter />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={activeStyles.textAlign === "right" ? "is-active" : ""}
            title="Align Right"
          >
            <FaAlignRight />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={activeStyles.textAlign === "justify" ? "is-active" : ""}
            title="Align Justify"
          >
            <FaAlignJustify />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={activeStyles.isBulletList ? "is-active" : ""}
            title="Bulleted List"
          >
            <FaListUl />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={activeStyles.isOrderedList ? "is-active" : ""}
            title="Numbered List"
          >
            <FaListOl />
          </button>

          <button
            onClick={() => editor.chain().focus().indent().run()}
            disabled={!editor.can().indent()}
            title="Indent"
          >
            <FaIndent />
          </button>
          <button
            onClick={() => editor.chain().focus().outdent().run()}
            disabled={!editor.can().outdent()}
            title="Outdent"
          >
            <FaOutdent />
          </button>
          <div className="lh-select-wrap" title="Line height">
            <button type="button" className="icon-like-button">
              <FaTextHeight />
            </button>
            <select
              className="lh-select"
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  editor.chain().focus().unsetLineHeight().run();
                } else {
                  editor.chain().focus().setLineHeight(v).run();
                }
              }}
              defaultValue=""
            >
              <option value="">(Default)</option>
              <option value="1">1</option>
              <option value="1.15">1.15</option>
              <option value="1.5">1.5</option>
              <option value="2">2</option>
            </select>
          </div>
        </div>


        <div className="toolbar-group">
          <div className="divider-wrap" title="Insert Divider">
            <button
              type="button"
              className="icon-like-button"
              onClick={toggleDividerMenu}
            >
              <FaMinus />
            </button>
            {isDividerOpen && (
              <div ref={dividerMenuRef} className="divider-menu">
                {dividerOptions.map((option) => (
                  <button
                    key={option.variant}
                    type="button"
                    onClick={() => handleInsertDivider(option.variant)}
                  >
                    <span className={`hr ${option.className}`}></span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={openLinkModal}
            className={activeStyles.isLink ? "is-active" : ""}
            title="Insert Link"
          >
            <FaLink />
          </button>
          <button onClick={addImage} title="Insert Image">
            <FaImage />
          </button>
          <div className="table-picker-wrap" title="Insert Table">
            <button
              type="button"
              className="icon-like-button"
              onClick={toggleTableMenu}
            >
              <FaTable />
            </button>
            {isTableOpen && (
              <div ref={tableMenuRef} className="table-picker-menu">
                <TableSizePicker
                  onSelect={(rows, cols) => {
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows, cols, withHeaderRow: true })
                      .run();
                    setIsTableOpen(false);
                  }}
                />
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleBlockquote().run();
            }}
            className={editor.isActive("blockquote") ? "is-active" : ""}
            title="Blockquote"
          >
            <FaQuoteLeft />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            title="Clear Format"
          >
            <FaRemoveFormat />
          </button>

        </div>
      </div>

      <Modal
        isOpen={isLinkModalOpen}
        onRequestClose={closeLinkModal}
        contentLabel="Insert Link"
        className="modal"
        overlayClassName="overlay"
        shouldCloseOnOverlayClick={true}
      >
        <h2>Insert Link</h2>

        <div className="form-group">
          <label htmlFor="linkUrl">URL to link</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="linkUrl"
              type="text"
              placeholder={
                linkState.anchorMode ? "#anchor" : "https://example.com"
              }
              value={linkState.url}
              onChange={(e) =>
                setLinkState((prev) => ({ ...prev, url: e.target.value }))
              }
              autoFocus
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="icon-like-button"
              title="Anchor mode"
              onClick={() =>
                setLinkState((prev) => ({
                  ...prev,
                  anchorMode: !prev.anchorMode,
                }))
              }
              style={{
                width: 40,
                height: 40,
                border: "1px solid #ddd",
                borderRadius: 6,
              }}
            >
              #
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="linkText">Text to display</label>
          <input
            id="linkText"
            type="text"
            placeholder="Enter text"
            value={linkState.text}
            onChange={(e) =>
              setLinkState((prev) => ({ ...prev, text: e.target.value }))
            }
          />
        </div>

        <div className="modal-buttons">
          <button className="button-secondary" onClick={closeLinkModal}>
            Cancel
          </button>
          <button className="button-primary" onClick={handleSetLink}>
            Submit
          </button>
        </div>
      </Modal>

      <ImageInsertModal
        isOpen={isImageModalOpen}
        onRequestClose={() => setIsImageModalOpen(false)}
        onSubmit={({ src, alt, width, height, align }) => {
          const attrs = { src, alt };
          if (width) attrs.width = width;
          if (height) attrs.height = height;
          editor.chain().focus().setImage(attrs).run();
          if (align === "left")
            editor.chain().focus().setTextAlign("left").run();
          if (align === "center")
            editor.chain().focus().setTextAlign("center").run();
          if (align === "right")
            editor.chain().focus().setTextAlign("right").run();
        }}
      />
    </>
  );
};

export default Toolbar;
