"use client";

import React, { useEffect, useState } from "react";
import TipTapMainEditor from "./TipTapMainEditor";
import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import Image from "next/image";
import leftArrow from "@/assets/leftArrow1.svg";
import rightArrow from "@/assets/rightArrow.svg";

const TipTapTextEditorDialog = ({
  open,
  onClose,
  content,
  onSave,
  label,
  tileDetails = [],
  selectedTileIndex = 0,
}) => {
  const [editorContent, setEditorContent] = useState(content || "");
  const [textBoxHeading, setTextBoxHeading] = useState("");
  const [indexValue, setIndexValue] = useState(selectedTileIndex);

  useEffect(() => {
    const nextHeading =
      tileDetails[selectedTileIndex] &&
      tileDetails[selectedTileIndex].editorHeading
        ? tileDetails[selectedTileIndex].editorHeading
        : "Title";
    setTextBoxHeading(nextHeading);
    setIndexValue(selectedTileIndex);
    setEditorContent(content || "");
  }, [selectedTileIndex, content, tileDetails]);

  const handleClose = () => {
    onClose && onClose(editorContent);
  };

  const handleSave = () => {
    onSave && onSave(editorContent, textBoxHeading);
  };

  const canGoPrev = indexValue > 0;
  const canGoNext = indexValue < tileDetails.length - 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    const nextIndex = indexValue - 1;
    setIndexValue(nextIndex);
    const td = tileDetails[nextIndex] || {};
    setTextBoxHeading(td.editorHeading || "Title");
    setEditorContent(td.tileContent || "");
  };

  const goNext = () => {
    if (!canGoNext) return;
    const nextIndex = indexValue + 1;
    setIndexValue(nextIndex);
    const td = tileDetails[nextIndex] || {};
    setTextBoxHeading(td.editorHeading || "Title");
    setEditorContent(td.tileContent || "");
  };

  return (
    <Dialog 
    open={open} 
    maxWidth={"md"}
    >
      <DialogTitle>
        <div>
          <input
            type="text"
            value={textBoxHeading}
            onChange={(e) => setTextBoxHeading(e.target.value)}
            style={{ padding: "5px" }}
          />
        </div>
      </DialogTitle>
      <span
        className="absolute top-4 right-7 cursor-pointer"
        onClick={handleClose}
      >
        <CloseSharpIcon />
      </span>
      <DialogContent
        sx={{
          height: "550px",
          display: "flex",
          alignItems: "center",
          gap: "0.8rem",
        }}
      >
        {canGoPrev && (
          <div>
            <Image
              src={leftArrow}
              style={{ width: "32px", height: "32px", cursor: "pointer" }}
              onClick={goPrev}
              alt="left-arrow"
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, }}>
          <TipTapMainEditor
            initialContent={editorContent}
            onContentChange={(html) => setEditorContent(html)}
          />
        </div>
        {canGoNext && (
          <div>
            <Image
              src={rightArrow}
              style={{ width: "32px", height: "32px", cursor: "pointer" }}
              onClick={goNext}
              alt="right-arrow"
            />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TipTapTextEditorDialog;
