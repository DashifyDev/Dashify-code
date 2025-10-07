"use client";
"use strict";
import dynamic from "next/dynamic";
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  memo,
  useCallback,
  useMemo,
} from "react";
import "../styles/styles.css";
import { Rnd } from "react-rnd";

import MoreHorizSharpIcon from "@mui/icons-material/MoreHorizSharp";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import DifferenceOutlinedIcon from "@mui/icons-material/DifferenceOutlined";
import ColorPicker from "./ColorPicker";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

const TipTapMainEditor = dynamic(
  () => import("./TipTapEditor/TipTapMainEditor"),
  {
    loading: () => <div>Loading editor...</div>,
    ssr: false,
  }
);

const TipTapTextEditorDialog = dynamic(
  () => import("./TipTapEditor/TipTapTextEditorDialog"),
  {
    loading: () => <div>Loading dialog...</div>,
    ssr: false,
  }
);
import axios from "axios";
import { globalContext } from "@/context/globalContext";
import isDblTouchTap from "@/hooks/isDblTouchTap";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { dashboardKeys } from "@/hooks/useDashboard";
import "suneditor/dist/css/suneditor.min.css";
import { fonts, colors } from "@/constants/textEditorConstant";
import imageUpload from "../assets/imageUpload.jpg";
import text from "../assets/text.png";
import Image from "next/image";

const SunEditor = dynamic(() => import("suneditor-react"), {
  ssr: false,
});

const GridTiles = memo(function GridTiles({
  tileCordinates,
  setTileCordinates,
  activeBoard,
  updateTilesInLocalstorage,
}) {
  const [showOption, setShowOption] = useState(null);
  const [showModel, setShowModel] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedPod, setSelectedPod] = useState(null);
  const [colorImage, setColorImage] = useState("color");
  const [textLink, setTextLink] = useState("text");
  const [imageFileName, setImageFileName] = useState(null);
  const [formValue, setFormValue] = useState({});
  const [pods, setPods] = useState([]);
  const [openTextEditor, setOpenTextEdior] = useState(false);
  const [selectedTileDetail, setSelectedTileDetail] = useState({});
  const [textEditorContent, setTextEditorContent] = useState();
  const [editorLabel, setEditorLabel] = useState();
  const [minHeightWidth, setMinHeightWidth] = useState([]);
  const [resizeCount, setResizeCount] = useState(0);
  const [colorBackground, setColorBackground] = useState();
  const [editorOpen, setEditorOpen] = useState(false);
  const { dbUser, setHeaderWidth, headerwidth } = useContext(globalContext);
  const queryClient = useQueryClient();
  const cloneMutation = useMutation(
    async (tileToCreate) => {
      const response = await axios.post("/api/tile/tile", tileToCreate);
      return response.data;
    },
    {
      // optimistic update
      onMutate: async (newTile) => {
        const detailKey = dashboardKeys.detail(activeBoard);
        await queryClient.cancelQueries({ queryKey: detailKey });
        const previous = queryClient.getQueryData(detailKey);

        const tempTile = { ...newTile, _id: `temp_clone_${Date.now()}` };

        // update cache only (do not touch local state here to avoid duplicates)
        queryClient.setQueryData(detailKey, (old) => {
          return {
            ...(old || {}),
            tiles: [...((old && old.tiles) || []), tempTile],
          };
        });

        return { previous, tempTile };
      },
      onError: (err, newTile, context) => {
        const detailKey = dashboardKeys.detail(activeBoard);
        if (context?.previous) {
          queryClient.setQueryData(detailKey, context.previous);
        }
        if (context?.previous?.tiles) setTileCordinates(context.previous.tiles);
      },
      onSuccess: (data, newTile, context) => {
        const detailKey = dashboardKeys.detail(activeBoard);
        // replace temp tile with server tile in cache
        queryClient.setQueryData(detailKey, (old) => {
          const tiles = (old && Array.isArray(old.tiles) ? old.tiles : []).map(
            (t) => (t._id === context.tempTile._id ? data : t)
          );
          return { ...(old || {}), tiles };
        });

        setTileCordinates((prev) =>
          prev.map((t) => (t._id === context.tempTile._id ? data : t))
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(activeBoard),
        });
      },
    }
  );
  const hiddenFileInput = useRef(null);
  let firstNewLine = true;

  useEffect(() => {
    setMinHeightWidth(tileCordinates.map(() => ({ width: 50, height: 50 })));
  }, [tileCordinates]);

  const handleColorImage = useCallback(
    (e) => {
      setSelectedTileDetail({
        ...selectedTileDetail,
        backgroundAction: e.target.value,
      });
      const values = formValue;
      values.backgroundAction = e.target.value;
      setFormValue(values);
    },
    [selectedTileDetail, formValue]
  );

  const changeAction = (e) => {
    setSelectedTileDetail({ ...selectedTileDetail, action: e.target.value });
    const values = formValue;
    values.action = e.target.value;
    setFormValue(values);
  };

  const openModel = (e, index, isPod) => {
    e.stopPropagation();
    setShowModel(true);
    if (isPod) {
      setSelectedPod(isPod);
      setSelectedTileDetail(pods[isPod.podIndex].tiles[isPod.tileIndex]);
    } else {
      setSelectedTile(index);
      setSelectedTileDetail(tileCordinates[index]);
      currentBackground(tileCordinates[index]);
    }
  };

  const enterText = (value) => {
    let items = tileCordinates;
    if (firstNewLine && selectedTile !== null && selectedTile !== undefined) {
      const newLineIndex = value.indexOf("<div><br></div>");
      if (newLineIndex !== -1) {
        const enteredText = value.substring(0, newLineIndex);
        const enteredUserText = enteredText.replace(/<[^>]*>/g, "");
        items[selectedTile].editorHeading = enteredUserText;
        firstNewLine = false;
      }
    }
    setSelectedTileDetail({ ...selectedTileDetail, tileText: value });
    const values = formValue;
    values.tileText = value;
    setFormValue(values);
  };
  const enterLink = (e) => {
    setSelectedTileDetail({ ...selectedTileDetail, tileLink: e.target.value });
    const values = formValue;
    values.tileLink = e.target.value;
    setFormValue(values);
  };

  const displayTitle = (e) => {
    setSelectedTileDetail({
      ...selectedTileDetail,
      displayTitle: e.target.checked,
    });
    let value = formValue;
    setFormValue({ ...value, displayTitle: e.target.checked });
  };

  const handleChangePositionX = (e) => {
    setSelectedTileDetail({ ...selectedTileDetail, titleX: e.target.value });
    const values = formValue;
    values.titleX = parseInt(e.target.value);
    setFormValue(values);
  };

  const handleChangePositionY = (e) => {
    setSelectedTileDetail({ ...selectedTileDetail, titleY: e.target.value });
    const values = formValue;
    values.titleY = parseInt(e.target.value);
    setFormValue(values);
  };

  const handleSave = (index) => {
    let formData = new FormData();
    let payload = { ...formValue };
    if (payload.tileBackground instanceof File) {
      (payload.backgroundAction = "image"), (payload.displayTitle = false);
      formData.append("tileImage", payload.tileBackground);
      delete payload.tileBackground;
    }
    formData.append("formValue", JSON.stringify(payload));

    if (selectedPod) {
      let podIndex = selectedPod.podIndex;
      let tileIndex = selectedPod.tileIndex;
      let items = [...pods];
      let pod = items[podIndex];
      let changeTile = pod.tiles[tileIndex];
      let tileId = changeTile._id;
      setFormValue({});
      setImageFileName(null);
      setShowModel(false);
      setSelectedPod(null);
      axios.patch(`/api/tile/${tileId}`, formData).then((res) => {
        items[podIndex].tiles[tileIndex] = res.data;
        setPods(items);
      });
      return;
    }

    if (
      selectedTile === null ||
      selectedTile === undefined ||
      selectedTile < 0 ||
      selectedTile >= tileCordinates.length
    ) {
      return;
    }

    let items = [...tileCordinates];
    let tileId = items[selectedTile]._id;
    setFormValue({});
    setImageFileName(null);
    setColorBackground(null);
    setShowModel(false);
    if (dbUser) {
      axios.patch(`/api/tile/${tileId}`, formData).then((res) => {
        if (
          selectedTile === null ||
          selectedTile === undefined ||
          selectedTile < 0 ||
          selectedTile >= items.length
        ) {
          return;
        }
        let item = { ...items[selectedTile], ...res.data };
        items[selectedTile] = item;
        setTileCordinates(items);

        // Update React Query cache
        queryClient.setQueryData(
          dashboardKeys.detail(activeBoard),
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(
                (tile) => (tile._id === tileId ? res.data : tile)
              ),
            };
          }
        );

        // Store selectedTile before setting it to null
        const currentSelectedTile = selectedTile;
        setSelectedTile(null);
        
        // Auto-resize tile after save for authenticated users
        setTimeout(() => {
          // Try different selectors for tiles
          let textOverlay = null;
          if (tileId && !tileId.startsWith('temp_')) {
            // Escape the tileId for CSS selector (MongoDB ObjectIds start with numbers)
            const escapedTileId = CSS.escape(tileId);
            textOverlay = document.querySelector(`#${escapedTileId} .text_overlay`);
          }
          
          // Fallback: try to find by index
          if (!textOverlay) {
            const allTextOverlays = document.querySelectorAll('.text_overlay');
            textOverlay = allTextOverlays[currentSelectedTile];
          }
          
          if (textOverlay && currentSelectedTile !== null) {
            const contentHeight = textOverlay.scrollHeight;
            const currentHeight = parseInt(items[currentSelectedTile].height) || 150;
            const desiredHeight = Math.max(contentHeight + 30, 150); // 30px for padding
            
            if (desiredHeight > currentHeight + 5) {
              const updatedItems = [...items];
              updatedItems[currentSelectedTile] = {
                ...updatedItems[currentSelectedTile],
                height: `${desiredHeight}px`
              };
              setTileCordinates(updatedItems);
              
              // Update React Query cache
              queryClient.setQueryData(
                dashboardKeys.detail(activeBoard),
                (oldData) => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(
                      (tile) => (tile._id === tileId ? updatedItems[currentSelectedTile] : tile)
                    ),
                  };
                }
              );
            }
          }
        }, 100);
      });
    } else {
      if (formValue.tileBackground instanceof File) {
        const reader = new FileReader();
        reader.onload = function (e) {
          if (
            selectedTile === null ||
            selectedTile === undefined ||
            selectedTile < 0 ||
            selectedTile >= items.length
          ) {
            return;
          }
          let updatedData = JSON.parse(formData.get("formValue"));
          updatedData.tileBackground = e.target.result;
          let item = { ...items[selectedTile], ...updatedData };
          items[selectedTile] = item;
          setTileCordinates(items);
          updateTilesInLocalstorage(items);
          setSelectedTile(null);
        };
        reader.readAsDataURL(formValue.tileBackground);
      } else {
        let updatedData = JSON.parse(formData.get("formValue"));
        let item = { ...items[selectedTile], ...updatedData };
        items[selectedTile] = item;
        setTileCordinates(items);
        updateTilesInLocalstorage(items);
        
        // Store selectedTile before setting it to null
        const currentSelectedTile = selectedTile;
        setSelectedTile(null);
        
        // Auto-resize tile after save for guest users
        setTimeout(() => {
          const tileId = items[currentSelectedTile]._id;
          
          // Try different selectors for guest tiles
          let textOverlay = null;
          if (tileId && !tileId.startsWith('temp_')) {
            // Escape the tileId for CSS selector (MongoDB ObjectIds start with numbers)
            const escapedTileId = CSS.escape(tileId);
            textOverlay = document.querySelector(`#${escapedTileId} .text_overlay`);
          }
          
          // Fallback: try to find by index
          if (!textOverlay) {
            const allTextOverlays = document.querySelectorAll('.text_overlay');
            textOverlay = allTextOverlays[currentSelectedTile];
          }
          
          if (textOverlay && currentSelectedTile !== null) {
            const contentHeight = textOverlay.scrollHeight;
            const currentHeight = parseInt(items[currentSelectedTile].height) || 150;
            const desiredHeight = Math.max(contentHeight + 30, 150); // 30px for padding
            
            if (desiredHeight > currentHeight + 5) {
              const updatedItems = [...items];
              updatedItems[currentSelectedTile] = {
                ...updatedItems[currentSelectedTile],
                height: `${desiredHeight}px`
              };
              setTileCordinates(updatedItems);
              updateTilesInLocalstorage(updatedItems);
            }
          }
        }, 100);
      }
    }
  };

  const deleteTile = (index) => {
    if (selectedPod) {
      let podIndex = selectedPod.podIndex;
      let tileIndex = selectedPod.tileIndex;
      let items = [...pods];
      let pod = items[podIndex];
      let tiles = pod.tiles;
      let tileId = tiles[tileIndex]._id;
      setShowModel(false);
      setSelectedPod(null);
      axios.delete(`/api/tile/${tileId}`).then((res) => {
        if (res) {
          tiles.splice(tileIndex, 1);
          if (tiles.length == 1) {
            deletePod(podIndex);
            let tile = tiles[0];
            setTileCordinates([...tileCordinates, tile]);
          } else {
            items[podIndex].tiles = tiles;
            setPods(items);
          }
        }
      });
      return;
    }
    let tileId = tileCordinates[index]._id;
    setShowModel(false);
    if (dbUser) {
      axios.delete(`/api/tile/${tileId}`).then((res) => {
        if (res) {
          tileCordinates.splice(index, 1);
          setTileCordinates([...tileCordinates]);

          // Update React Query cache
          queryClient.setQueryData(
            dashboardKeys.detail(activeBoard),
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                tiles: (Array.isArray(oldData.tiles)
                  ? oldData.tiles
                  : []
                ).filter((tile) => tile._id !== tileId),
              };
            }
          );
        }
      });
    } else {
      let items = tileCordinates;
      items.splice(index, 1);
      setTileCordinates(items);
      updateTilesInLocalstorage(items);
    }
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImageFileName(selectedImage.name);
    const values = formValue;
    values.tileBackground = selectedImage;
    setFormValue(values);
  };

  const handleImageInput = (event) => {
    hiddenFileInput.current.click();
  };

  const handleColorChange = (color) => {
    const values = formValue;
    values.tileBackground = color.hex;
    setFormValue(values);
  };

  const style = useCallback((index, tile) => {
    let isImageBackground;
    if (tile.tileBackground) {
      isImageBackground = isBackgroundImage(tile.tileBackground);
    }

    const stylevalue = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "solid 1px #ddd",
      background:
        tile.tileBackground && !isImageBackground
          ? tile.tileBackground
          : "#deedf0ff",
      color: "black",
      overflowWrap: "anywhere",
      borderRadius: "10px",
    };

    return stylevalue;
  }, []);

  const changedTitlehandle = (index, tile) => {
    // Use tile.tileText directly instead of tileCordinates[index].tileText
    let tileText = tile.tileText;
    let content = tileText;
    
    if (tileText) {
      // Only check for empty divs, not strip all HTML
      if (tileText === "<div><br></div>" || tileText === "<div></div>") {
        content = "";
      }
    }
    
    const titleVal =
      content && tile.displayTitle
        ? tileText
        : !content && tile.displayTitle
        ? " New Tile"
        : "";
    return titleVal;
  };

  const onDoubleTap = (e, action, editorHtml, tile, index, isPod) => {
    if ((e.type === "touchstart" || e.detail == 2) && action == "link") {
      if (tile.tileLink) {
        window.open(tile.tileLink, "_blank");
      }
    } else if (
      (e.type === "touchstart" || e.detail == 2) &&
      action == "textEditor"
    ) {
      setEditorLabel(tile.editorHeading);
      setOpenTextEdior(true);
      setTextEditorContent(editorHtml || "");
      if (isPod) {
        setSelectedPod(isPod);
      } else {
        setSelectedTile(index);
      }
    }
  };
  const podStyle = (index) => {
    const stylevalue = {
      display: "flex",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-around",
      padding: "10px",
      border: "dashed 1px black",
      borderRadius: "20px",
      margin: "10px 20px",
    };

    return stylevalue;
  };
  const innerTileStyle = (tile) => {
    const stylevalue = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: tile.tileColor ? tile.tileColor : "pink",
      flex: "1 1 100%",
      border: "1px solid #bbb",
      borderRadius: "20px",
      height: "100%",
      margin: " 0 5px",
      cursor: "grabbing",
      position: "relative",
      minHeight: "120px",
      minWidth: "120px",
    };
    return stylevalue;
  };
  const createPods = (dragTile, dropTile, direction) => {
    console.log("=====>>>..", direction);
    let tiles = tileCordinates;
    let removableTileIds = [dragTile._id, dropTile._id];
    const filteredArray = tiles.filter(
      (obj) => !removableTileIds.includes(obj._id)
    );
    setTileCordinates(filteredArray);

    const newPod = {
      isPod: true,
      x: dropTile.x,
      y: dropTile.y,
      height: 185,
      width: 325,
      tiles: [dropTile, dragTile],
      dashboardId: activeBoard,
    };
    axios.post("api/pod/createPod", newPod).then((res) => {
      let data = res.data;
      data.tiles = [dropTile, dragTile];
      setPods([...pods, data]);
    });
  };

  const updatePods = (dragtile, droppablePod) => {
    let dragTileIndex = tileCordinates.findIndex(
      (obj) => obj._id === dragtile._id
    );
    let tiles = tileCordinates;
    tiles.splice(dragTileIndex, 1);
    setTileCordinates(tiles);

    let tempPods = pods;
    let objIndex = tempPods.findIndex((obj) => obj._id === droppablePod._id);
    if (objIndex !== -1) {
      tempPods[objIndex].tiles.push(dragtile);
    }
    setPods(tempPods);
    var payload = {
      isAdd: true,
      tileId: dragtile._id,
      podId: droppablePod._id,
    };
    axios.post("api/pod/addTile", payload).then((res) => {
      if (res.data) {
        console.log(res.data);
      }
    });
  };

  const handleDragStop = (e, data, tile, index) => {
    let { x, y } = data;
    e.preventDefault();
    let items = [...tileCordinates];
    let tileId = tileCordinates[index]._id;
    if (x < 0) {
      x = 0;
    }
    if (y < 0) {
      y = 0;
    }
    let toUpdate = {
      x: x,
      y: y,
    };
    if (tile.x === x && tile.y === y) {
      return;
    }
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setTileCordinates(items);
    if (dbUser) {
      axios.patch(`/api/tile/${tileId}`, toUpdate).then((res) => {
        if (res.data) {
          // Update React Query cache
          queryClient.setQueryData(
            dashboardKeys.detail(activeBoard),
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(
                  (tile) =>
                    tile._id === tileId ? { ...tile, ...res.data } : tile
                ),
              };
            }
          );
        }
      });
    } else {
      updateTilesInLocalstorage(items);
    }
  };

  const handleResizeStop = (e, direction, ref, delta, position, index) => {
    e.preventDefault();
    let items = [...tileCordinates];
    let tileId = tileCordinates[index]._id;
    let toUpdate = {
      width: ref.style.width,
      height: ref.style.height,
    };
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setTileCordinates(items);
    if (dbUser) {
      axios.patch(`/api/tile/${tileId}`, toUpdate).then((res) => {
        if (res.data) {
          // Update React Query cache
          queryClient.setQueryData(
            dashboardKeys.detail(activeBoard),
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(
                  (tile) =>
                    tile._id === tileId ? { ...tile, ...res.data } : tile
                ),
              };
            }
          );
        }
      });
    } else {
      updateTilesInLocalstorage(items);
    }
  };
  const handlePodDragStop = (e, data, pod, index) => {
    const { x, y } = data;
    e.preventDefault();
    let items = [...pods];
    let podId = pods[index]._id;
    let toUpdate = {
      x: x,
      y: y,
    };
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setPods(items);
    axios.patch(`/api/pod/${podId}`, toUpdate).then((res) => {
      if (res.data) {
        console.log("update Drag Coordinate");
      }
    });
  };

  const handlePodResizeStop = (e, direction, ref, delta, position, index) => {
    let items = [...pods];
    let podId = pods[index]._id;
    let toUpdate = {
      width: ref.style.width,
      height: ref.style.height,
    };
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setPods([...items]);
    axios.patch(`/api/pod/${podId}`, toUpdate).then((res) => {
      if (res.data) {
        console.log("update resize");
      }
    });
  };

  const handleCloseTextEditor = (content) => {
    setOpenTextEdior(false);
    setTextEditorContent(null);
    setSelectedTile(null);
    setSelectedPod(null);
  };

  const updateEditorContent = (content, editorTitle) => {
    if (selectedPod) {
      let podIndex = selectedPod.podIndex;
      let tileIndex = selectedPod.tileIndex;
      let items = [...pods];
      let pod = items[podIndex];
      let changeTile = pod.tiles[tileIndex];
      let tileId = changeTile._id;

      setSelectedPod(null);
      setOpenTextEdior(false);
      setTextEditorContent(null);
      const form = new FormData();
      const payload = { tileContent: content, editorHeading: editorTitle };
      form.append("formValue", JSON.stringify(payload));
      axios.patch(`/api/tile/${tileId}`, form).then((res) => {
        if (res.data) {
          items[podIndex].tiles[tileIndex] = res.data;
          setPods(items);
        }
      });
      return;
    }

    if (
      selectedTile === null ||
      selectedTile === undefined ||
      selectedTile < 0 ||
      selectedTile >= tileCordinates.length
    ) {
      return;
    }

    let items = [...tileCordinates];
    let tileId = items[selectedTile]._id;
    setTextEditorContent(null);
    setOpenTextEdior(false);
    if (dbUser) {
      const form = new FormData();
      const payload = { tileContent: content, editorHeading: editorTitle };
      form.append("formValue", JSON.stringify(payload));
      axios.patch(`/api/tile/${tileId}`, form).then((res) => {
        if (
          selectedTile === null ||
          selectedTile === undefined ||
          selectedTile < 0 ||
          selectedTile >= items.length
        ) {
          return;
        }
        let item = { ...items[selectedTile], ...res.data };
        items[selectedTile] = item;
        setTileCordinates(items);

        // Update React Query cache
        queryClient.setQueryData(
          dashboardKeys.detail(activeBoard),
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: oldData.tiles.map((tile) =>
                tile._id === tileId ? res.data : tile
              ),
            };
          }
        );

        setSelectedTile(null);
        // Do not auto-resize on save from double-click editor
      });
    } else {
    let item = {
      ...items[selectedTile],
      tileContent: content,
      editorHeading: editorTitle,
    };
      items[selectedTile] = item;
      setTileCordinates(items);
      updateTilesInLocalstorage(items);
      
      // Store selectedTile before setting it to null
      const currentSelectedTile = selectedTile;
      setSelectedTile(null);
      
      // Do not auto-resize on save from double-click editor (guest)
    }
  };

  const onSortEnd = (tileList, pod, podIndex) => {
    const tileListIdArray = tileList.map((tile) => {
      return tile._id;
    });
    pod["tiles"] = tileList;
    let podsArray = [...pods];
    podsArray[podIndex] = pod;
    setPods(podsArray);
    if (pod._id && pod.tiles.length == tileListIdArray.length) {
      axios
        .patch(`api/pod/${pod._id}`, { tiles: tileListIdArray })
        .then((res) => {
          console.log("update indexing success");
        });
    }
  };

  const deletePod = (index) => {
    let podId = pods[index]._id;
    let podsArray = [...pods];
    podsArray.splice(index, 1);
    setPods(podsArray);
    axios.delete(`/api/pod/${podId}`).then((res) => {
      console.log("===>>", res.data);
    });
  };

  const removeTileFromPod = (event, pod, podIndex) => {
    const { oldIndex, newIndex, originalEvent } = event;
    let dragType = originalEvent.type;
    let tile = pod.tiles[newIndex];
    if (dragType === "dragend") {
      if (pod.tiles.length === 2) {
        let tiles = pod.tiles;
        deletePod(podIndex);
        let freeTiles = [...tileCordinates];
        freeTiles = [...tileCordinates, ...tiles];
        setTileCordinates(freeTiles);
      } else {
        pod.tiles.splice(newIndex, 1);
        onSortEnd(pod.tiles, pod, podIndex);
        let freeTiles = [...tileCordinates];
        freeTiles = [...tileCordinates, tile];
        setTileCordinates(freeTiles);
        let payload = {
          isAdd: false,
          tileId: tile._id,
          podId: pod._id,
        };
        axios.post("api/pod/addTile", payload).then((res) => {
          if (res.data) {
            console.log(res.data);
          }
        });
      }
    }
  };

  const tileClone = (index) => {
    let content = tileCordinates[index];

    // Always place cloned block in fixed location
    const FIXED_X = 25;
    const FIXED_Y = 25;

    const newTile = {
      ...content,
      x: FIXED_X,
      y: FIXED_Y,
    };

    setShowModel(false);
    if (dbUser) {
      newTile.dashboardId = activeBoard;
      // Use mutation for optimistic clone
      cloneMutation.mutate(newTile);
    } else {
      let items = [...tileCordinates, newTile];
      setTileCordinates(items);
      updateTilesInLocalstorage(items);
    }
  };

  const onResize = (index, e, direction, ref, delta, position) => {
    const tile = tileCordinates[index];
    if (tile && ref) {
      const contentElement = ref.querySelector(".text_overlay");
      if (contentElement) {
        const contentWidth = contentElement.scrollWidth;
        const contentHeight = contentElement.scrollHeight;
        const boxWidth = parseInt(ref.style.width);
        const boxHeight = parseInt(ref.style.height);
        if (
          resizeCount == 0 &&
          (contentHeight >= boxHeight || contentWidth >= boxWidth)
        ) {
          setResizeCount((prevCount) => {
            return prevCount + 1;
          });

          setMinHeightWidth((prevSizes) => {
            const newSizes = [...prevSizes];
            newSizes[index] = { width: contentWidth, height: contentHeight };
            return newSizes;
          });
        }
      }
    }
  };

  const TitlePositionStyle = (tile) => {
    let style = {
      top: tile.titleY == 1 ? 0 : "auto",
      bottom: tile.titleY == 3 ? 0 : "auto",
      left: tile.titleX == 1 ? 0 : "auto",
      right: tile.titleX == 3 ? 0 : "auto",
      textAlign:
        tile.titleX == 3 ? "right" : tile.titleX == 2 ? "center" : "left",
    };
    return style;
  };

  const isBackgroundImage = useCallback((url) => {
    if (url) {
      const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
      let isImage = imageExtensions.some((ext) =>
        url.toLowerCase().includes(ext)
      );
      return isImage;
    }
  }, []);

  // Memoize per-tile styles keyed by tile coordinates and background to
  // avoid stale styles while allowing updates when position/size/background changes.
  const tileDepsKey = useMemo(() => {
    return tileCordinates
      .map(
        (t) =>
          `${t._id}|${t.x}|${t.y}|${t.width}|${t.height}|${t.tileBackground}`
      )
      .join(",");
  }, [tileCordinates]);

  const tileStyles = useMemo(() => {
    return tileCordinates.map((tile, index) => ({
      index,
      style: style(index, tile),
      isImageBackground: tile.tileBackground
        ? isBackgroundImage(tile.tileBackground)
        : false,
    }));
  }, [tileDepsKey, style, isBackgroundImage]);

  const currentBackground = (tile) => {
    if (tile.tileBackground) {
      if (isBackgroundImage(tile.tileBackground)) {
        if (tile.tileBackground.startsWith("data:image/")) {
          setImageFileName("uploaded-image.png");
        } else {
          const segments = tile.tileBackground.split("/");
          const imageName = segments[segments.length - 1];
          setImageFileName(imageName);
        }
      } else {
        setColorBackground(tile.tileBackground);
      }
    } else {
      setColorBackground("#deedf0ff");
    }
  };

  const saveEditorText = () => {
    setEditorOpen(false);
  };

  return (
    <div className="main_grid_container">
      <div className="tiles_container">
        {tileCordinates.map((tile, index) => {
          const computedStyle = style(index, tile);
          const isImgBackground = isBackgroundImage(tile.tileBackground);
          return (
            <Rnd
              key={tile._id || index}
              onMouseLeave={() => setShowOption(null)}
              className="tile"
              style={computedStyle}
              size={{ width: tile.width, height: tile.height }}
              position={{ x: tile.x, y: tile.y }}
              onDragStop={(e, d) => handleDragStop(e, d, tile, index)}
              onResizeStop={(e, direction, ref, delta, position) =>
                handleResizeStop(e, direction, ref, delta, position, index)
              }
              onDoubleClick={(e) =>
                onDoubleTap(e, tile.action, tile.tileContent, tile, index, null)
              }
              minWidth={minHeightWidth[index]?.width || 50}
              minHeight={minHeightWidth[index]?.height || 50}
              onResize={(e, direction, ref, delta, position) =>
                onResize(index, e, direction, ref, delta, position)
              }
              id={tile._id}
              onResizeStart={() => setResizeCount(0)}
              dragGrid={[5, 5]}
              onTouchStart={(e) => {
                if (isDblTouchTap(e)) {
                  onDoubleTap(
                    e,
                    tile.action,
                    tile.tileContent,
                    tile,
                    index,
                    null
                  );
                } else {
                  setShowOption(`tile_${index}`);
                }
              }}
              onDrag={(event, data) => {
                const tileRight = data.x + parseInt(tile.width, 10);
                if (tileRight > headerwidth) {
                  setHeaderWidth(tileRight);
                }
              }}
            >
              {tile.displayTitle && (
                <div
                  className="text_overlay"
                  style={TitlePositionStyle(tile)}
                  dangerouslySetInnerHTML={{
                    __html: changedTitlehandle(index, tile),
                  }}
                />
              )}
              {isImgBackground && (
                <Image
                  src={tile.tileBackground}
                  alt="Preview"
                  fill
                  priority={index < 6}
                  quality={75}
                  // Use unoptimized for external CDN URLs to allow browser parallel loading
                  unoptimized={
                    tile.tileBackground &&
                    tile.tileBackground.startsWith("http")
                  }
                  style={{
                    objectFit: "cover",
                    borderRadius: "10px",
                    pointerEvents: "none",
                  }}
                />
              )}
              <div
                className="showOptions absolute top-0 right-2 cursor-pointer"
                onClick={(e) => openModel(e, index, null)}
              >
                <MoreHorizSharpIcon />
              </div>
              {showOption == `tile_${index}` && (
                <div
                  className="absolute top-0 right-2 cursor-pointer "
                  onTouchStart={(e) => openModel(e, index, null)}
                >
                  <MoreHorizSharpIcon />
                </div>
              )}{" "}
              {/* For Mobile view port  */}
            </Rnd>
          );
        })}
      </div>

      {/* Tiles Property Model */}
      <Dialog open={showModel} id={`model_${selectedTile}`}>
        <div className="all_options">
          <ul>
            <li>
              <h3 className="menu_header">Box Background</h3>
              <div className="radio_menu">
                <div className="radiosets">
                  <FormControl>
                    <RadioGroup
                      aria-labelledby="demo-radio-buttons-group-label"
                      defaultValue={selectedTileDetail.backgroundAction}
                      name="radio-buttonsColor"
                      onChange={handleColorImage}
                    >
                      <FormControlLabel
                        value="color"
                        control={<Radio />}
                        label="Select Color"
                      />
                      <FormControlLabel
                        value="image"
                        control={<Radio />}
                        label="Upload Image"
                      />
                    </RadioGroup>
                  </FormControl>
                </div>
                {selectedTileDetail.backgroundAction === "color" && (
                  <ColorPicker
                    handleColorChange={handleColorChange}
                    colorBackground={colorBackground}
                  />
                )}
                {selectedTileDetail.backgroundAction === "image" && (
                  <div className="image_value">
                    <Image
                      src={imageUpload}
                      alt="image"
                      width={60}
                      height={60}
                      onClick={handleImageInput}
                    />
                    <div className="file_Name">
                      <span>{imageFileName}</span>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={hiddenFileInput}
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
              </div>
            </li>
            <li>
              <h3 className="menu_header">Box Action</h3>
              <div className="radio_control">
                <div className="radiosets">
                  <FormControl>
                    <RadioGroup
                      aria-labelledby="demo-radio-buttons-group-label"
                      defaultValue={selectedTileDetail.action}
                      name="radio-buttonsLink"
                      onChange={changeAction}
                    >
                      <FormControlLabel
                        value="link"
                        control={<Radio />}
                        label="Opens Link"
                      />
                      <FormControlLabel
                        value="textEditor"
                        control={<Radio />}
                        label="Opens Text Editor"
                      />
                      <FormControlLabel
                        value="noAction"
                        control={<Radio />}
                        label="No Action"
                      />
                    </RadioGroup>
                  </FormControl>
                  <input
                    type="text"
                    className="url_text"
                    value={selectedTileDetail.tileLink}
                    onChange={enterLink}
                    placeholder="Add URL here"
                    disabled={selectedTileDetail.action !== "link"}
                  />
                </div>
              </div>
            </li>
            <li>
              <h3 className="menu_header">Box Text</h3>
              <div className="title_editor">
                <div className="display_title">
                  <div className="display_title_check">
                    <input
                      type="checkbox"
                      checked={selectedTileDetail.displayTitle}
                      onChange={displayTitle}
                    />
                    <label>Display Text</label>
                  </div>
                  <div className="position">
                    <select
                      value={selectedTileDetail.titleX}
                      onChange={handleChangePositionX}
                    >
                      <option value={1}>Left</option>
                      <option value={2}>Center</option>
                      <option value={3}>Right</option>
                    </select>
                    <select
                      value={selectedTileDetail.titleY}
                      onChange={handleChangePositionY}
                    >
                      <option value={1}>Top</option>
                      <option value={2}>Center</option>
                      <option value={3}>Bottom</option>
                    </select>
                  </div>
                </div>
                <Image
                  src={text}
                  alt="TEXT"
                  onClick={() => setEditorOpen(true)}
                  className="text-editor-image"
                />
              </div>
            </li>
          </ul>
          <div className="line_break"></div>
          <div className="menu_action">
            <div>
              <div className="delete_duplicate_action">
                <span onClick={() => tileClone(selectedTile)}>
                  <DifferenceOutlinedIcon />
                </span>
                <span onClick={() => tileClone(selectedTile)}>Duplicate</span>
              </div>
              <div className="delete_duplicate_action">
                <span onClick={() => deleteTile(selectedTile)}>
                  <DeleteOutlineIcon />
                </span>
                <span onClick={() => deleteTile(selectedTile)}>Delete</span>
              </div>
            </div>
            <div
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                paddingRight: "25px",
              }}
            >
              <Button
                className="button_cancel"
                sx={{ color: "#63899e", marginRight: "3px" }}
                onClick={() => {
                  setShowModel(false);
                  setSelectedPod(null);
                  setColorBackground(null);
                  setFormValue({});
                  setSelectedTile(null);
                  setImageFileName(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="button_filled"
                sx={{
                  background: "#63899e",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#63899e", opacity: 0.8 },
                }}
                onClick={(index) => handleSave(`tiles_${selectedTile}`)}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog maxWidth={"md"} open={editorOpen}>
        <DialogContent
          sx={{
            height: "540px",
            // overflow: "hidden",
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <TipTapMainEditor
              initialContent={
                formValue.tileText || selectedTileDetail.tileText || ""
              }
              onContentChange={(html) => enterText(html)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <div
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              paddingRight: "25px",
            }}
          >
            <Button
              onClick={() => setEditorOpen(false)}
              sx={{ color: "#63899e" }}
            >
              Close
            </Button>
            <Button
              onClick={saveEditorText}
              sx={{
                background: "#63899e",
                color: "#fff",
                "&:hover": { backgroundColor: "#63899e", opacity: 0.8 },
              }}
            >
              Save
            </Button>
          </div>
        </DialogActions>
      </Dialog>

      {/* <TextEditor */}
      <TipTapTextEditorDialog
        open={openTextEditor}
        onClose={handleCloseTextEditor}
        content={textEditorContent}
        onSave={updateEditorContent}
        label={editorLabel}
        tileDetails={tileCordinates}
        selectedTileIndex={selectedTile}
      />
    </div>
  );
});

export default GridTiles;
