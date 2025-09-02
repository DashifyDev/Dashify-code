"use client";
import React, { useEffect, useState } from "react";
import Admin from "../admin";
import "./board-library.css";
import {
  IconButton,
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
  DialogContent,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableContainer,
  TableCell,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ModeEditOutlineOutlinedIcon from "@mui/icons-material/ModeEditOutlineOutlined";
import { useDropzone } from "react-dropzone";
import axios from "axios";

function board_library() {
  const [addBoardData, setAddBoardData] = useState({});
  const [openDeleteModel, setOpneDeleteModel] = useState(false);
  const [openAddBoardModel, setOpenAddBoardModel] = useState(false);
  const [boards, setBoards] = useState([]);
  const [selectedId, setSelectedId] = useState();
  const [imageData, setImageData] = useState();
  const [modalButtonState, setModalButtonState] = useState(false);
  const [selectedData, setSelectedData] = useState({});
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    onDrop: (acceptedFiles) => {
      let file = acceptedFiles[0];
      setAddBoardData({ ...addBoardData, boardImage: file });
      let blobURL = URL.createObjectURL(file);
      setImageData(blobURL);
    },
  });

  useEffect(() => {
    axios.get("/api/template/addTemplate").then((res) => {
      setBoards(res.data);
    });
  }, []);

  const handleSaveData = () => {
    let formData = new FormData();
    let payload = addBoardData;

    if (payload.boardImage instanceof File) {
      formData.append("tileImage", payload.boardImage);
      delete payload.boardImage;
    }
    formData.append("formValue", JSON.stringify(payload));

    axios.post("/api/template/addTemplate", formData).then((res) => {
      setBoards([...boards, res.data]);
    });
    setOpenAddBoardModel(!openAddBoardModel);
    setImageData();
  };

  const handleEditClick = (board) => {
    setSelectedId(board._id);
    setOpenAddBoardModel(true);
    setModalButtonState(true);
    const inputDate = new Date(board.date);
    inputDate.setUTCDate(inputDate.getUTCDate());
    const outputDate = inputDate.toISOString().slice(0, 10);
    board.date = outputDate;
    setAddBoardData(board);
    setImageData(board.boardImage);
    setSelectedData(board);
  };

  const handleDelete = () => {
    axios.delete(`/api/template/${selectedId}`).then((res) => {
      setOpneDeleteModel(false);
      if (res.data.acknowledged) {
        let index = boards.findIndex((obj) => obj._id == selectedId);
        let boardData = [...boards];
        boardData.splice(index, 1);
        setBoards(boardData);
        setSelectedId();
      }
    });
  };

  const handleUpdate = () => {
    if (JSON.stringify(selectedData) === JSON.stringify(addBoardData)) {
      setImageData();
      setAddBoardData({});
      setModalButtonState(false);
      setOpenAddBoardModel(false);
    } else {
      setOpenAddBoardModel(false);
      let form = new FormData();
      let payload = addBoardData;
      if (payload.boardImage instanceof File) {
        form.append("tileImage", payload.boardImage);
        delete payload.boardImage;
      }
      form.append("updatedFields", JSON.stringify(payload));
      axios.patch(`/api/template/${selectedId}`, form).then((res) => {
        if (res.data) {
          const index = boards.findIndex((obj) => obj._id == res.data._id);
          let items = [...boards];
          items[index] = res.data;
          setBoards(items);
        }
      });
    }
  };

  return (
    <div className="board_library">
      <Admin />
      <div className="admin_board">
        <Button onClick={() => setOpenAddBoardModel(true)}>+ Add Board</Button>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow className="tableHead">
                <TableCell align="center">Title</TableCell>
                <TableCell align="center">Keywords</TableCell>
                <TableCell align="center">Image</TableCell>
                <TableCell align="center">Link</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center">Description</TableCell>
                <TableCell colSpan={2} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {boards.map((board, index) => (
                <TableRow key={board._id}>
                  <TableCell align="center">{board.boardName}</TableCell>
                  <TableCell align="center">
                    {board.keywords.join(", ")}
                  </TableCell>
                  <TableCell align="center" className="image-cell">
                    <img src={board.boardImage} className="image-cell-style" />
                  </TableCell>
                  <TableCell align="center">{board.boardLink}</TableCell>
                  <TableCell align="center">{board.rating}</TableCell>
                  <TableCell align="center">
                    {new Date(board.date).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell align="center">{board.boardDescription}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      sx={{ color: "#434343" }}
                      onClick={() => {
                        setOpneDeleteModel(true);
                        setSelectedId(board._id);
                      }}
                    >
                      <DeleteOutlinedIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      sx={{ color: "#434343" }}
                      onClick={() => {
                        handleEditClick(board);
                      }}
                    >
                      <ModeEditOutlineOutlinedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      {/* Add Board Model */}
      <Dialog open={openAddBoardModel} close={openAddBoardModel.toString()}>
        <DialogContent>
          <div className="modal-div-style">
            <label id="board-name">Board Name</label>
            <input
              className="modal-input-style"
              id="board-name"
              value={addBoardData.boardName}
              onChange={(event) =>
                setAddBoardData({
                  ...addBoardData,
                  boardName: event.target.value,
                })
              }
            />
          </div>
          <div className="modal-div-style">
            <label>Keywords</label>
            <input
              className="modal-input-style"
              value={addBoardData?.keywords}
              onChange={(event) =>
                setAddBoardData({
                  ...addBoardData,
                  keywords: event.target.value.split(","),
                })
              }
            />
          </div>
          <div className="modal-div-style">
            <label id="board-name">Links</label>
            <input
              className="modal-input-style"
              id="board-name"
              value={addBoardData.boardLink}
              onChange={(event) =>
                setAddBoardData({
                  ...addBoardData,
                  boardLink: event.target.value,
                })
              }
            />
          </div>
          <div className="modal-div-style">
            <label id="board-name">Rating</label>
            <input
              className="modal-input-style"
              id="board-name"
              value={addBoardData.rating}
              onChange={(event) =>
                setAddBoardData({
                  ...addBoardData,
                  rating: event.target.value,
                })
              }
            />
          </div>
          <div className="modal-div-style">
            <label id="board-name">Date</label>
            <input
              type="date"
              className="modal-input-style"
              id="board-name"
              value={addBoardData.date}
              onChange={(event) => {
                setAddBoardData({
                  ...addBoardData,
                  date: event.target.value,
                });
              }}
            />
          </div>
          <div className="modal-div-style">
            <label>Description</label>
            <textarea
              className="modal-input-style"
              value={addBoardData.boardDescription}
              onChange={(event) => {
                setAddBoardData({
                  ...addBoardData,
                  boardDescription: event.target.value,
                });
              }}
            />
          </div>
          <div className="modal-label-style">
            <label>Image</label>
          </div>
          <div
            {...getRootProps({ className: "dropzone" })}
            className="drop-zone"
          >
            <input {...getInputProps()} />

            {imageData ? (
              <img src={imageData} alt="" />
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          {modalButtonState ? (
            <Button onClick={() => handleUpdate()}>Update</Button>
          ) : (
            <Button onClick={() => handleSaveData()}>Save</Button>
          )}
          <Button
            onClick={() => {
              setOpenAddBoardModel(false);
              setImageData();
              setAddBoardData({});
              setModalButtonState(false);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Board Delete Model */}
      <Dialog open={openDeleteModel} className="model">
        <DialogTitle sx={{ width: "270px" }}>
          Are you sure you want to delete?
        </DialogTitle>
        <DialogActions>
          <Button
            className="button_cancel"
            sx={{ color: "#63899e" }}
            onClick={() => setOpneDeleteModel(false)}
          >
            Cancel
          </Button>
          <Button
            className="button_filled"
            sx={{
              background: "#63899e",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#63899e",
              },
            }}
            onClick={() => handleDelete()}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default board_library;
