"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";

const fontOptions = [
  "Arial",
  "Comic Sans MS",
  "Courier New",
  "Impact",
  "Georgia",
  "Tahoma",
  "Trebuchet MS",
  "Verdana",
  "Monospace",
  "Salesforce Sans",
  "Garamond",
  "Sans-Serif",
  "Serif",
  "Times New Roman",
  "Helvetica",
];

const FontFamilySelector = ({ editor, activeFontFamily }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleSelectFont = (font) => {
    if (font) {
      editor.chain().focus().setMark("textStyle", { fontFamily: font }).run();
    } else {
      editor.chain().focus().unsetMark("textStyle", { fontFamily: null }).run();
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentFontLabel = activeFontFamily || "Font";

  return (
    <div className="font-selector-container" ref={containerRef}>
      <button
        className="font-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Font Family"
      >
        <span style={{ fontFamily: activeFontFamily }}>{currentFontLabel}</span>
        <FaChevronDown className={`chevron ${isOpen ? "open" : ""}`} />
      </button>
      {isOpen && (
        <ul className="font-selector-list">
          <li onClick={() => handleSelectFont(null)}>Default Font</li>
          {fontOptions.map((font) => (
            <li
              key={font}
              onClick={() => handleSelectFont(font)}
              style={{ fontFamily: font }}
              className={activeFontFamily === font ? "is-active" : ""}
            >
              {font}
            </li>
          ))}
        </ul>
      )}
      <style jsx>{`
        .font-selector-container {
          position: relative;
          display: inline-block;
        }
        .font-selector-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 150px;
          text-align: left;
          border-right: 1px solid #eee !important;
        }
        .font-selector-button span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .chevron {
          margin-left: 8px;
          transition: transform 0.2s ease;
        }
        .chevron.open {
          transform: rotate(180deg);
        }
        .font-selector-list {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          list-style: none;
          padding: 4px;
          margin: 4px 0 0 0;
          z-index: 10;
          max-height: 200px;
          overflow-y: auto;
        }
        .font-selector-list li {
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
        }
        .font-selector-list li:hover {
          background-color: #f0f0f0;
        }
        .font-selector-list li.is-active {
          background-color: #e0e7ff;
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default FontFamilySelector;
