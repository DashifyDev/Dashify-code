import React, { useEffect, useState, useContext } from "react";
import dynamic from "next/dynamic";
import "suneditor/dist/css/suneditor.min.css";
import "../styles/styles.css";
import { fonts, colors } from "@/constants/textEditorConstant";
const SunEditor = dynamic(() => import("suneditor-react"), {
  ssr: false,
});
import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import leftArrow from "../assets/leftArrow1.svg";
import rightArrow from "../assets/rightArrow.svg";
import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";

const TextEditor = ({
  open,
  onClose,
  content,
  onSave,
  label,
  tileDetails,
  selectedTileIndex,
}) => {
  const [editorContent, setEditorContent] = useState();
  const [textBoxHeading, setTextBoxHeading] = useState();
  const [newIndexValue, setNewIndexValue] = useState();
  const [newEditorContent, setNewEditorContent] = useState();
  const [rightArrowButtonState, setRightArrowButtonState] = useState(true);
  const [leftArrowButtonState, setLeftArrowButtonState] = useState(true);
  const [editBoxHeading, setEditBoxHeading] = useState(false);

  useEffect(() => {
    setTextBoxHeading(
      tileDetails[selectedTileIndex] &&
        tileDetails[selectedTileIndex].editorHeading
    );
    setLeftArrowButtonState(true);
    setRightArrowButtonState(true);
  }, [selectedTileIndex]);

  useEffect(() => {
    setEditorContent(content || "");
    setNewIndexValue(selectedTileIndex);
    setNewEditorContent(content || "");
  }, [content, selectedTileIndex]);

  const labelChange = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(label, "text/html");
    let content = doc.getElementsByTagName("div")[0].innerText;
    return content;
  };

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  const handleClose = () => {
    onClose(editorContent);
    setTextBoxHeading("");
    setEditBoxHeading(false);
  };

  const handleSave = () => {
    onSave(editorContent, textBoxHeading);
  };

  const handleHeadingChange = (value) => {
    setTextBoxHeading(value);
  };

  const handleNextTileContent = () => {
    setNewIndexValue(() => {
      let updatedIndex = newIndexValue + 1;
      if (updatedIndex < tileDetails.length) {
        setRightArrowButtonState(true);
        setLeftArrowButtonState(true);
        if (
          tileDetails[updatedIndex].backgroundAction === "image" ||
          !tileDetails[updatedIndex].hasOwnProperty("editorHeading")
        ) {
          setTextBoxHeading("Title");
        } else {
          setTextBoxHeading(tileDetails[updatedIndex].editorHeading);
        }
        setNewEditorContent(() => {
          return tileDetails[updatedIndex].tileContent;
        });
      } else {
        setRightArrowButtonState(false);
        updatedIndex = updatedIndex - 1;
      }
      return updatedIndex;
    });
  };

  const handlePreviousTileContent = () => {
    setNewIndexValue(() => {
      let updatedIndex = newIndexValue - 1;
      if (updatedIndex >= 0) {
        setLeftArrowButtonState(true);
        setRightArrowButtonState(true);
        if (
          tileDetails[updatedIndex].backgroundAction === "image" ||
          !tileDetails[updatedIndex].hasOwnProperty("editorHeading")
        ) {
          setTextBoxHeading("Title");
        } else {
          setTextBoxHeading(tileDetails[updatedIndex].editorHeading);
        }
        setNewEditorContent(() => tileDetails[updatedIndex].tileContent);
      } else {
        setLeftArrowButtonState(false);
        updatedIndex = updatedIndex + 1;
      }
      return updatedIndex;
    });
  };

  return (
    <Dialog open={open}>
      <DialogTitle>
        <div>
          {editBoxHeading ? (
            <input
              type="text"
              value={textBoxHeading}
              onBlur={() => setEditBoxHeading(false)}
              onChange={(e) => {
                handleHeadingChange(e.target.value);
              }}
              style={{ padding: "5px" }}
            />
          ) : (
            <span>{textBoxHeading ? textBoxHeading : "Title"}</span>
          )}
          <span>
            <EditIcon
              sx={{ fontSize: "medium", cursor: "pointer", marginLeft: "6px" }}
              onClick={() => {
                setEditBoxHeading(true);
              }}
            />
          </span>
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
          width: "600px",
          height: "540px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: "0.8rem",
        }}
      >
        {leftArrowButtonState && (
          <div>
            <Image
              src={leftArrow}
              style={{ width: "32px", height: "32px", cursor: "pointer" }}
              onClick={handlePreviousTileContent}
              alt="left-arrow"
            />
          </div>
        )}
        <SunEditor
          defaultValue={content}
          setContents={newEditorContent}
          onChange={handleEditorChange}
          setOptions={{
            buttonList: [
              ["undo", "redo"],
              [
                "bold",
                "underline",
                "italic",
                "strike",
                "subscript",
                "superscript",
              ],
              ["font", "fontSize"],
              ["removeFormat"],
              ["fontColor", "hiliteColor"],
              ["align", "list", "lineHeight"],
              ["outdent", "indent"],

              ["table", "horizontalRule", "link", "image", "video"],
              ["preview", "print"],
            ],
            colorList: colors,
            minHeight: "370px",
            maxHeight: "370px",
            showPathLabel: false,
            font: fonts,
          }}
        />
        {rightArrowButtonState && (
          <div>
            <Image
              src={rightArrow}
              style={{ width: "32px", height: "32px", cursor: "pointer" }}
              onClick={handleNextTileContent}
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

export default TextEditor;
