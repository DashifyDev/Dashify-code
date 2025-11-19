"use client";
import React, { useState } from "react";
import Modal from "react-modal";

Modal.setAppElement("body");

const ImageInsertModal = ({ isOpen, onRequestClose, onSubmit }) => {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockRatio, setLockRatio] = useState(true);
  const [align, setAlign] = useState("basic");

  const reset = () => {
    setFile(null);
    setUrl("");
    setAlt("");
    setWidth("");
    setHeight("");
    setLockRatio(true);
    setAlign("basic");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalUrl = url;
      if (file) {
        const form = new FormData();
        form.append("tileImage", file);
        const res = await fetch("/api/manage/uploadImage", {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        finalUrl = data.url;
      }
      if (!finalUrl) return;

      const numericWidth =
        width && !isNaN(Number(width)) ? Number(width) : undefined;
      const numericHeight =
        height && !isNaN(Number(height)) ? Number(height) : undefined;

      onSubmit({
        src: finalUrl,
        alt: alt || "",
        width: numericWidth,
        height: numericHeight,
        align,
      });
      reset();
      onRequestClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        reset();
        onRequestClose();
      }}
      contentLabel="Insert image"
      className="modal"
      overlayClassName="overlay"
    >
      <h2>Insert image</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Select from files</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <button type="button" onClick={() => setFile(null)}>
                ×
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Image URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Alternative text</label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <div>
            <label>Width</label>
            <input
              type="text"
              placeholder="auto"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </div>
          <span>x</span>
          <div>
            <label>Height</label>
            <input
              type="text"
              placeholder="auto"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={lockRatio}
              onChange={(e) => setLockRatio(e.target.checked)}
            />
            Constrain proportions
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <div>Alignment</div>
          <label style={{ marginRight: 12 }}>
            <input
              type="radio"
              name="align"
              value="basic"
              checked={align === "basic"}
              onChange={() => setAlign("basic")}
            />{" "}
            Basic
          </label>
          <label style={{ marginRight: 12 }}>
            <input
              type="radio"
              name="align"
              value="left"
              checked={align === "left"}
              onChange={() => setAlign("left")}
            />{" "}
            Left
          </label>
          <label style={{ marginRight: 12 }}>
            <input
              type="radio"
              name="align"
              value="center"
              checked={align === "center"}
              onChange={() => setAlign("center")}
            />{" "}
            Center
          </label>
          <label>
            <input
              type="radio"
              name="align"
              value="right"
              checked={align === "right"}
              onChange={() => setAlign("right")}
            />{" "}
            Right
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => {
              reset();
              onRequestClose();
            }}
          >
            Cancel
          </button>
          <button type="submit">Submit</button>
        </div>
      </form>

      <style jsx global>{`
        .modal {
          background: #fff;
          padding: 24px;
          border-radius: 8px;
          max-width: 640px;
          width: 95vw;
        }
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal h2 {
          margin-top: 0;
        }
        .modal input[type="text"],
        .modal input[type="url"],
        .modal input[type="number"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .modal button.is-active {
          background: #e0e7ff;
          color: #3b82f6;
          border-radius: 6px;
        }
      `}</style>
    </Modal>
  );
};

export default ImageInsertModal;
