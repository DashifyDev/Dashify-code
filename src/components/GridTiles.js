'use client';
'use strict';
import dynamic from 'next/dynamic';
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import '../styles/styles.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { globalContext } from '@/context/globalContext';
import isDblTouchTap from '@/hooks/isDblTouchTap';
import { dashboardKeys } from '@/hooks/useDashboard';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import MoreHorizSharpIcon from '@mui/icons-material/MoreHorizSharp';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import 'suneditor/dist/css/suneditor.min.css';
import imageUpload from '../assets/imageUpload.jpg';
import text from '../assets/text.png';
import ColorPicker from './ColorPicker';

const TipTapMainEditor = dynamic(() => import('./TipTapEditor/TipTapMainEditor'), {
  loading: () => <div>Loading editor...</div>,
  ssr: false
});

const TipTapTextEditorDialog = dynamic(() => import('./TipTapEditor/TipTapTextEditorDialog'), {
  loading: () => <div>Loading dialog...</div>,
  ssr: false
});

const SunEditor = dynamic(() => import('suneditor-react'), {
  ssr: false
});

const GridTiles = memo(function GridTiles({
  tileCordinates,
  setTileCordinates,
  activeBoard,
  updateTilesInLocalstorage
}) {
  const [showOption, setShowOption] = useState(null);
  const [showModel, setShowModel] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedPod, setSelectedPod] = useState(null);
  const [colorImage, setColorImage] = useState('color');
  const [textLink, setTextLink] = useState('text');
  const [imageFileName, setImageFileName] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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
  const [currentTileIndex, setCurrentTileIndex] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState({
    background: true, // Only first section open by default
    textDisplay: true,
    action: true,
    order: true
  });
  const { dbUser, setHeaderWidth, headerwidth } = useContext(globalContext);
  const queryClient = useQueryClient();
  const cloneMutation = useMutation(
    async tileToCreate => {
      const response = await axios.post('/api/tile/tile', tileToCreate);
      return response.data;
    },
    {
      // optimistic update
      onMutate: async newTile => {
        const detailKey = dashboardKeys.detail(activeBoard);
        await queryClient.cancelQueries({ queryKey: detailKey });
        const previous = queryClient.getQueryData(detailKey);

        const tempTile = { ...newTile, _id: `temp_clone_${Date.now()}` };

        // update cache only (do not touch local state here to avoid duplicates)
        queryClient.setQueryData(detailKey, old => {
          return {
            ...(old || {}),
            tiles: [...((old && old.tiles) || []), tempTile]
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
        queryClient.setQueryData(detailKey, old => {
          const tiles = (old && Array.isArray(old.tiles) ? old.tiles : []).map(t =>
            t._id === context.tempTile._id ? data : t
          );
          return { ...(old || {}), tiles };
        });

        setTileCordinates(prev => prev.map(t => (t._id === context.tempTile._id ? data : t)));
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(activeBoard)
        });
      }
    }
  );
  const hiddenFileInput = useRef(null);
  let firstNewLine = true;

  useEffect(() => {
    setMinHeightWidth(tileCordinates.map(() => ({ width: 50, height: 50 })));
  }, [tileCordinates]);

  // Sync currentTileIndex with selectedTile when editor opens and initialize content
  useEffect(() => {
    if (editorOpen && selectedTile !== null && selectedTile !== undefined) {
      setCurrentTileIndex(selectedTile);
      // Initialize selectedTileDetail and formValue with current tile data
      if (selectedTile >= 0 && selectedTile < tileCordinates.length) {
        const currentTile = tileCordinates[selectedTile];
        setSelectedTileDetail(currentTile);
        setFormValue({ tileText: currentTile.tileText || '' });
      }
    }
  }, [editorOpen, selectedTile, tileCordinates]);

  // Sync content when currentTileIndex changes in editor
  useEffect(() => {
    if (editorOpen && currentTileIndex !== null && currentTileIndex !== undefined) {
      if (currentTileIndex >= 0 && currentTileIndex < tileCordinates.length) {
        const currentTile = tileCordinates[currentTileIndex];
        // Only update if tile data is different to avoid unnecessary re-renders
        if (!selectedTileDetail._id || selectedTileDetail._id !== currentTile._id) {
          setSelectedTileDetail(currentTile);
          setFormValue({ tileText: currentTile.tileText || '' });
        }
      }
    }
  }, [editorOpen, currentTileIndex, tileCordinates]);

  const handleColorImage = useCallback(
    e => {
      setSelectedTileDetail({
        ...selectedTileDetail,
        backgroundAction: e.target.value
      });
      const values = formValue;
      values.backgroundAction = e.target.value;
      setFormValue(values);
    },
    [selectedTileDetail, formValue]
  );

  const changeAction = e => {
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
    // Reset collapsed sections when opening modal - only first section open
    setCollapsedSections({
      background: true, // Only first section open by default
      textDisplay: true,
      action: true,
      order: true
    });
  };

  const toggleSection = section => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const enterText = value => {
    let items = tileCordinates;
    if (firstNewLine && selectedTile !== null && selectedTile !== undefined) {
      const newLineIndex = value.indexOf('<div><br></div>');
      if (newLineIndex !== -1) {
        const enteredText = value.substring(0, newLineIndex);
        const enteredUserText = enteredText.replace(/<[^>]*>/g, '');
        items[selectedTile].editorHeading = enteredUserText;
        firstNewLine = false;
      }
    }
    setSelectedTileDetail({ ...selectedTileDetail, tileText: value });
    const values = formValue;
    values.tileText = value;
    setFormValue(values);
  };
  const enterLink = e => {
    setSelectedTileDetail({ ...selectedTileDetail, tileLink: e.target.value });
    const values = formValue;
    values.tileLink = e.target.value;
    setFormValue(values);
  };

  const displayTitle = e => {
    setSelectedTileDetail({
      ...selectedTileDetail,
      displayTitle: e.target.checked
    });
    let value = formValue;
    setFormValue({ ...value, displayTitle: e.target.checked });
  };

  const handleChangePositionX = e => {
    setSelectedTileDetail({ ...selectedTileDetail, titleX: e.target.value });
    const values = formValue;
    values.titleX = parseInt(e.target.value);
    setFormValue(values);
  };

  const handleChangePositionY = e => {
    setSelectedTileDetail({ ...selectedTileDetail, titleY: e.target.value });
    const values = formValue;
    values.titleY = parseInt(e.target.value);
    setFormValue(values);
  };

  const handleSave = index => {
    let formData = new FormData();
    let payload = { ...formValue };
    if (payload.tileBackground instanceof File) {
      payload.backgroundAction = 'image';
      formData.append('tileImage', payload.tileBackground);
      delete payload.tileBackground;
    }
    formData.append('formValue', JSON.stringify(payload));

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
      axios.patch(`/api/tile/${tileId}`, formData).then(res => {
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
    
    // Store original tile data to check if text content changed
    const originalTile = items[selectedTile];
    const originalTileText = originalTile.tileText || '';
    const originalTileContent = originalTile.tileContent || '';
    const originalHeight = originalTile.height;
    
    // Check if text content changed (only resize if text changed)
    const textChanged = 
      (payload.tileText !== undefined && payload.tileText !== originalTileText) ||
      (payload.tileContent !== undefined && payload.tileContent !== originalTileContent);
    
    setFormValue({});
    setImageFileName(null);
    setColorBackground(null);
    setShowModel(false);
    if (dbUser) {
      axios.patch(`/api/tile/${tileId}`, formData).then(res => {
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
        queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(tile =>
              tile._id === tileId ? res.data : tile
            )
          };
        });

        // Store selectedTile before setting it to null
        const currentSelectedTile = selectedTile;
        setSelectedTile(null);

        // Auto-resize tile after save ONLY if text content changed
        if (textChanged) {
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
              // Use original height if it exists, otherwise use 150 as fallback
              const currentHeight = originalHeight 
                ? parseInt(originalHeight) 
                : (parseInt(items[currentSelectedTile].height) || 150);
            const desiredHeight = Math.max(contentHeight + 30, 150); // 30px for padding

            if (desiredHeight > currentHeight + 5) {
              const updatedItems = [...items];
              updatedItems[currentSelectedTile] = {
                ...updatedItems[currentSelectedTile],
                height: `${desiredHeight}px`
              };
              setTileCordinates(updatedItems);

              // Update React Query cache
              queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(tile =>
                    tile._id === tileId ? updatedItems[currentSelectedTile] : tile
                  )
                };
              });
            }
          }
        }, 100);
        }
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
          let updatedData = JSON.parse(formData.get('formValue'));
          updatedData.tileBackground = e.target.result;
          let item = { ...items[selectedTile], ...updatedData };
          items[selectedTile] = item;
          setTileCordinates(items);
          updateTilesInLocalstorage(items);
          setSelectedTile(null);
        };
        reader.readAsDataURL(formValue.tileBackground);
      } else {
        let updatedData = JSON.parse(formData.get('formValue'));
        let item = { ...items[selectedTile], ...updatedData };
        items[selectedTile] = item;
        setTileCordinates(items);
        updateTilesInLocalstorage(items);

        // Store selectedTile before setting it to null
        const currentSelectedTile = selectedTile;
        setSelectedTile(null);

        // Auto-resize tile after save ONLY if text content changed
        if (textChanged) {
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
              // Use original height if it exists, otherwise use 150 as fallback
              const currentHeight = originalHeight 
                ? parseInt(originalHeight) 
                : (parseInt(items[currentSelectedTile].height) || 150);
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
    }
  };

  const deleteTile = index => {
    if (selectedPod) {
      let podIndex = selectedPod.podIndex;
      let tileIndex = selectedPod.tileIndex;
      let items = [...pods];
      let pod = items[podIndex];
      let tiles = pod.tiles;
      let tileId = tiles[tileIndex]._id;
      setShowModel(false);
      setSelectedPod(null);
      axios.delete(`/api/tile/${tileId}`).then(res => {
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

    // Get the order of the tile being deleted
    const deletedOrder = tileCordinates[index].order;

    if (dbUser) {
      // Create a new array instead of mutating the existing one
      let updatedTiles = tileCordinates.filter((_, i) => i !== index);

      // Recalculate orders for tiles that come after the deleted one
      updatedTiles = updatedTiles.map(tile => {
        if (tile.order && tile.order > deletedOrder) {
          return { ...tile, order: tile.order - 1 };
        }
        return tile;
      });

      // Use setTileCordinates which will call handleTileUpdate and update React Query cache
      // This ensures single source of truth
      setTileCordinates(updatedTiles);

      // Find tiles that need order updates
      const tilesToUpdate = updatedTiles.filter(tile => tile.order && tile.order > deletedOrder);

      axios
        .delete(`/api/tile/${tileId}`)
        .then(() => {
          // Update orders for tiles that come after the deleted one
          if (tilesToUpdate.length > 0) {
            const orderUpdates = tilesToUpdate.map(tile => ({
              tileId: tile._id,
              data: { order: tile.order }
            }));

            axios
              .post('/api/tile/batch-update', { updates: orderUpdates })
              .then(() => {
                // Orders updated successfully
              })
              .catch(err => {
                console.error('Error updating tile orders:', err);
              });
          }
          // React Query cache already updated by handleTileUpdate via setTileCordinates
        })
        .catch(error => {
          console.error('Error deleting tile:', error);
          // Revert optimistic update on error
          setTileCordinates(tileCordinates);
          queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(activeBoard) });
        });
    } else {
      // Create a new array instead of mutating the existing one
      let items = tileCordinates.filter((_, i) => i !== index);

      // Recalculate orders for tiles that come after the deleted one
      items = items.map(tile => {
        if (tile.order && tile.order > deletedOrder) {
          return { ...tile, order: tile.order - 1 };
        }
        return tile;
      });

      // Use setTileCordinates which will call handleTileUpdate and update React Query cache
      // This ensures single source of truth - same as for authenticated users
      setTileCordinates(items);
      updateTilesInLocalstorage(items);

      // React Query cache already updated by handleTileUpdate via setTileCordinates
      // No need to update it again here
    }
  };

  const handleImageChange = e => {
    const selectedImage = e.target.files[0];
    if (selectedImage) {
      setImageFileName(selectedImage.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedImage);
      const values = formValue;
      values.tileBackground = selectedImage;
      setFormValue(values);
    }
  };

  const handleImageInput = event => {
    hiddenFileInput.current.click();
  };

  const handleColorChange = color => {
    const values = formValue;
    // Use rgba if alpha is less than 1, otherwise use hex
    if (color.rgb && color.rgb.a !== undefined && color.rgb.a < 1) {
      values.tileBackground = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
    } else {
      values.tileBackground = color.hex;
    }
    setFormValue(values);
  };

  const style = useCallback((index, tile) => {
    let isImageBackground;
    if (tile.tileBackground) {
      isImageBackground = isBackgroundImage(tile.tileBackground);
    }

    const stylevalue = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'solid 1px #ddd',
      background: tile.tileBackground && !isImageBackground ? tile.tileBackground : '#deedf0ff',
      color: 'black',
      overflowWrap: 'anywhere',
      borderRadius: '10px'
    };

    return stylevalue;
  }, []);

  const changedTitlehandle = (index, tile) => {
    // Use tile.tileText directly instead of tileCordinates[index].tileText
    let tileText = tile.tileText;
    let content = tileText;

    if (tileText) {
      // Only check for empty divs, not strip all HTML
      if (tileText === '<div><br></div>' || tileText === '<div></div>') {
        content = '';
      }
    }

    const titleVal =
      content && tile.displayTitle ? tileText : !content && tile.displayTitle ? ' <div style="font-size: 18px;">New Box</div>' : '';
    return titleVal;
  };

  const onDoubleTap = (e, action, editorHtml, tile, index, isPod) => {
    if ((e.type === 'touchstart' || e.detail == 2) && action == 'link') {
      if (tile.tileLink) {
        window.open(tile.tileLink, '_blank');
      }
    } else if ((e.type === 'touchstart' || e.detail == 2) && action == 'textEditor') {
      setEditorLabel(tile.editorHeading);
      setOpenTextEdior(true);
      setTextEditorContent(editorHtml || '');
      if (isPod) {
        setSelectedPod(isPod);
      } else {
        setSelectedTile(index);
      }
    } else if ((e.type === 'touchstart' || e.detail == 2) && action == 'textDisplay') {
      // Open Text Display editor directly
      const currentTile = tileCordinates[index];
      setCurrentTileIndex(index);
      setSelectedTile(index);
      setSelectedTileDetail(currentTile);
      setFormValue({ tileText: currentTile.tileText || '' });
      setEditorOpen(true);
    }
  };
  const podStyle = index => {
    const stylevalue = {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: '10px',
      border: 'dashed 1px black',
      borderRadius: '20px',
      margin: '10px 20px'
    };

    return stylevalue;
  };
  const innerTileStyle = tile => {
    const stylevalue = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: tile.tileColor ? tile.tileColor : 'pink',
      flex: '1 1 100%',
      border: '1px solid #bbb',
      borderRadius: '20px',
      height: '100%',
      margin: ' 0 5px',
      cursor: 'grabbing',
      position: 'relative',
      minHeight: '120px',
      minWidth: '120px'
    };
    return stylevalue;
  };
  const createPods = (dragTile, dropTile, direction) => {
    console.log('=====>>>..', direction);
    let tiles = tileCordinates;
    let removableTileIds = [dragTile._id, dropTile._id];
    const filteredArray = tiles.filter(obj => !removableTileIds.includes(obj._id));
    setTileCordinates(filteredArray);

    const newPod = {
      isPod: true,
      x: dropTile.x,
      y: dropTile.y,
      height: 185,
      width: 325,
      tiles: [dropTile, dragTile],
      dashboardId: activeBoard
    };
    axios.post('api/pod/createPod', newPod).then(res => {
      let data = res.data;
      data.tiles = [dropTile, dragTile];
      setPods([...pods, data]);
    });
  };

  const updatePods = (dragtile, droppablePod) => {
    let dragTileIndex = tileCordinates.findIndex(obj => obj._id === dragtile._id);
    let tiles = tileCordinates;
    tiles.splice(dragTileIndex, 1);
    setTileCordinates(tiles);

    let tempPods = pods;
    let objIndex = tempPods.findIndex(obj => obj._id === droppablePod._id);
    if (objIndex !== -1) {
      tempPods[objIndex].tiles.push(dragtile);
    }
    setPods(tempPods);
    var payload = {
      isAdd: true,
      tileId: dragtile._id,
      podId: droppablePod._id
    };
    axios.post('api/pod/addTile', payload).then(res => {
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
      y: y
    };
    if (tile.x === x && tile.y === y) {
      return;
    }
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setTileCordinates(items);
    if (dbUser) {
      axios.patch(`/api/tile/${tileId}`, toUpdate).then(res => {
        if (res.data) {
          // Update React Query cache
          queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(tile =>
                tile._id === tileId ? { ...tile, ...res.data } : tile
              )
            };
          });
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
    const currentTile = items[index];

    // Debug: log resize info
    console.log('[Resize Debug] direction:', direction);
    console.log('[Resize Debug] delta:', delta);
    console.log('[Resize Debug] new position:', position);
    console.log('[Resize Debug] old position:', { x: currentTile.x, y: currentTile.y });
    console.log('[Resize Debug] new size:', { width: ref.style.width, height: ref.style.height });
    console.log('[Resize Debug] old size:', { width: currentTile.width, height: currentTile.height });

    // When resizing from left or top edges, position changes too
    // We need to save both size AND position to prevent jumping
    let toUpdate = {
      width: ref.style.width,
      height: ref.style.height,
      x: position.x,
      y: position.y
    };

    console.log('[Resize Debug] toUpdate:', toUpdate);

    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setTileCordinates(items);
    if (dbUser) {
      axios.patch(`/api/tile/${tileId}`, toUpdate).then(res => {
        if (res.data) {
          console.log('[Resize Debug] Server response:', res.data);
          // Update React Query cache
          queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(tile =>
                tile._id === tileId ? { ...tile, ...res.data } : tile
              )
            };
          });
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
      y: y
    };
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setPods(items);
    axios.patch(`/api/pod/${podId}`, toUpdate).then(res => {
      if (res.data) {
        console.log('update Drag Coordinate');
      }
    });
  };

  const handlePodResizeStop = (e, direction, ref, delta, position, index) => {
    let items = [...pods];
    let podId = pods[index]._id;
    let toUpdate = {
      width: ref.style.width,
      height: ref.style.height
    };
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setPods([...items]);
    axios.patch(`/api/pod/${podId}`, toUpdate).then(res => {
      if (res.data) {
        console.log('update resize');
      }
    });
  };

  const handleCloseTextEditor = content => {
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
      form.append('formValue', JSON.stringify(payload));
      axios.patch(`/api/tile/${tileId}`, form).then(res => {
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
      form.append('formValue', JSON.stringify(payload));
      axios.patch(`/api/tile/${tileId}`, form).then(res => {
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
        queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tiles: oldData.tiles.map(tile => (tile._id === tileId ? res.data : tile))
          };
        });

        setSelectedTile(null);
        // Do not auto-resize on save from double-click editor
      });
    } else {
      let item = {
        ...items[selectedTile],
        tileContent: content,
        editorHeading: editorTitle
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
    const tileListIdArray = tileList.map(tile => {
      return tile._id;
    });
    pod['tiles'] = tileList;
    let podsArray = [...pods];
    podsArray[podIndex] = pod;
    setPods(podsArray);
    if (pod._id && pod.tiles.length == tileListIdArray.length) {
      axios.patch(`api/pod/${pod._id}`, { tiles: tileListIdArray }).then(res => {
        console.log('update indexing success');
      });
    }
  };

  const deletePod = index => {
    let podId = pods[index]._id;
    let podsArray = [...pods];
    podsArray.splice(index, 1);
    setPods(podsArray);
    axios.delete(`/api/pod/${podId}`).then(res => {
      console.log('===>>', res.data);
    });
  };

  const removeTileFromPod = (event, pod, podIndex) => {
    const { oldIndex, newIndex, originalEvent } = event;
    let dragType = originalEvent.type;
    let tile = pod.tiles[newIndex];
    if (dragType === 'dragend') {
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
          podId: pod._id
        };
        axios.post('api/pod/addTile', payload).then(res => {
          if (res.data) {
            console.log(res.data);
          }
        });
      }
    }
  };

  const tileClone = index => {
    let content = tileCordinates[index];

    // Use the same grid positioning logic as addTiles
    const TILE_WIDTH = 135;
    const TILE_HEIGHT = 135;
    const TILE_SPACING = 10; // Space between tiles
    const TILES_PER_ROW = 7; // Maximum tiles per row
    const START_X = 25;
    const START_Y = 25;
    const ROW_HEIGHT = TILE_HEIGHT + TILE_SPACING; // Height of one row including spacing

    // Count only tiles that are user-created (not the default welcome tile)
    // Filter out tiles with width > 200px (default welcome tile is 600px)
    const userCreatedTiles = tileCordinates.filter(tile => {
      const tileWidth = parseInt(tile.width || '0', 10);
      return tileWidth <= 200; // Only count small tiles, not the default welcome tile
    });

    const tileIndex = userCreatedTiles.length; // Index of new tile (0-based)
    const rowIndex = Math.floor(tileIndex / TILES_PER_ROW); // Which row (0-based)
    const colIndex = tileIndex % TILES_PER_ROW; // Position in row (0-6)

    // Calculate position from top-left corner - always start from top
    const newX = START_X + colIndex * (TILE_WIDTH + TILE_SPACING);
    const newY = START_Y + rowIndex * ROW_HEIGHT;

    // Calculate mobile profile defaults
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    const mobileWidth = `${windowWidth - 48}px`;
    const mobileY = userCreatedTiles.length * 166; // Position based on user-created tiles count

    // Get the order of the original tile
    const originalOrder = content.order || 0;
    // New tile always gets order = originalOrder + 1
    // All tiles with order > originalOrder will be shifted by +1
    const newOrder = originalOrder + 1;

    const newTile = {
      ...content,
      x: newX,
      y: newY,
      order: newOrder,
      mobileX: 0,
      mobileY: mobileY,
      mobileWidth: mobileWidth
      // mobileHeight will be copied from content if it exists
    };

    // Remove _id so a new one will be created
    delete newTile._id;

    setShowModel(false);
    if (dbUser) {
      // Update orders locally first (optimistic update)
      // This ensures that if we clone multiple times, we see updated orders
      const updatedTiles = tileCordinates.map(tile => {
        if (tile.order && tile.order > originalOrder) {
          return { ...tile, order: tile.order + 1 };
        }
        return tile;
      });

      // Update local state immediately
      setTileCordinates(updatedTiles);

      // Update orders on server for all tiles that come after the original
      const tilesToUpdate = tileCordinates
        .filter(tile => tile.order && tile.order > originalOrder)
        .map(tile => ({
          tileId: tile._id,
          data: { order: tile.order + 1 }
        }));

      // Update orders on server, then add the new tile
      if (tilesToUpdate.length > 0) {
        axios
          .post('/api/tile/batch-update', { updates: tilesToUpdate })
          .then(() => {
            // After orders are updated, add the new tile
            newTile.dashboardId = activeBoard;
            cloneMutation.mutate(newTile);
          })
          .catch(err => {
            console.error('Error updating tile orders:', err);
            // Revert local state on error
            setTileCordinates(tileCordinates);
            // Still try to add the tile
            newTile.dashboardId = activeBoard;
            cloneMutation.mutate(newTile);
          });
      } else {
        // No tiles to update, just add the new tile
        newTile.dashboardId = activeBoard;
        cloneMutation.mutate(newTile);
      }
    } else {
      // For guest users, update orders locally
      let items = tileCordinates.map(tile => {
        if (tile.order && tile.order > originalOrder) {
          return { ...tile, order: tile.order + 1 };
        }
        return tile;
      });

      // Add the new tile
      items = [...items, newTile];
      setTileCordinates(items);
      updateTilesInLocalstorage(items);
    }
  };

  const onResize = (index, e, direction, ref, delta, position) => {
    const tile = tileCordinates[index];
    if (tile && ref) {
      const contentElement = ref.querySelector('.text_overlay');
      if (contentElement) {
        const contentWidth = contentElement.scrollWidth;
        const contentHeight = contentElement.scrollHeight;
        const boxWidth = parseInt(ref.style.width);
        const boxHeight = parseInt(ref.style.height);
        if (resizeCount == 0 && (contentHeight >= boxHeight || contentWidth >= boxWidth)) {
          setResizeCount(prevCount => {
            return prevCount + 1;
          });

          setMinHeightWidth(prevSizes => {
            const newSizes = [...prevSizes];
            newSizes[index] = { width: contentWidth, height: contentHeight };
            return newSizes;
          });
        }
      }
    }
  };

  const TitlePositionStyle = tile => {
    let style = {
      top: tile.titleY == 1 ? 0 : 'auto',
      bottom: tile.titleY == 3 ? 0 : 'auto',
      left: tile.titleX == 1 ? 0 : 'auto',
      right: tile.titleX == 3 ? 0 : 'auto',
      textAlign: tile.titleX == 3 ? 'right' : tile.titleX == 2 ? 'center' : 'left'
    };
    return style;
  };

  const isBackgroundImage = useCallback(url => {
    if (url) {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      let isImage = imageExtensions.some(ext => url.toLowerCase().includes(ext));
      return isImage;
    }
  }, []);

  // Memoize per-tile styles keyed by tile coordinates and background to
  // avoid stale styles while allowing updates when position/size/background changes.
  const tileDepsKey = useMemo(() => {
    return tileCordinates
      .map(t => `${t._id}|${t.x}|${t.y}|${t.width}|${t.height}|${t.tileBackground}`)
      .join(',');
  }, [tileCordinates]);

  const tileStyles = useMemo(() => {
    return tileCordinates.map((tile, index) => ({
      index,
      style: style(index, tile),
      isImageBackground: tile.tileBackground ? isBackgroundImage(tile.tileBackground) : false
    }));
  }, [tileDepsKey, style, isBackgroundImage]);

  const currentBackground = tile => {
    if (tile.tileBackground) {
      if (isBackgroundImage(tile.tileBackground)) {
        if (tile.tileBackground.startsWith('data:image/')) {
          setImageFileName('uploaded-image.png');
          setImagePreview(tile.tileBackground);
        } else {
          const segments = tile.tileBackground.split('/');
          const imageName = segments[segments.length - 1];
          setImageFileName(imageName);
          setImagePreview(tile.tileBackground);
        }
      } else {
        setColorBackground(tile.tileBackground);
        setImagePreview(null);
      }
    } else {
      setColorBackground('#deedf0ff');
      setImagePreview(null);
    }
  };

  const saveEditorText = () => {
    // Get the current tile from tileCordinates using currentTileIndex
    if (
      currentTileIndex === null ||
      currentTileIndex === undefined ||
      currentTileIndex < 0 ||
      currentTileIndex >= tileCordinates.length
    ) {
    setEditorOpen(false);
      return;
    }

    const currentTile = tileCordinates[currentTileIndex];
    if (!currentTile || !currentTile._id) {
      setEditorOpen(false);
      return;
    }

    // Get the updated tileText from formValue
    const updatedTileText = formValue.tileText || selectedTileDetail.tileText || '';

    // Find the tile in tileCordinates by _id
    const items = [...tileCordinates];
    const tileIndex = items.findIndex(t => String(t._id) === String(currentTile._id));
    
    if (tileIndex < 0) {
      setEditorOpen(false);
      return;
    }

    const tileId = items[tileIndex]._id;

    // Update tile locally first
    const updatedTile = {
      ...items[tileIndex],
      tileText: updatedTileText
    };
    items[tileIndex] = updatedTile;
    setTileCordinates(items);
    
    // Update selectedTileDetail to reflect changes
    setSelectedTileDetail(updatedTile);

    // Save to server if user is logged in
    if (dbUser) {
      const formData = new FormData();
      const payload = { tileText: updatedTileText };
      formData.append('formValue', JSON.stringify(payload));

      axios.patch(`/api/tile/${tileId}`, formData).then(res => {
        if (res.data) {
          // Update tile with server response
          const serverUpdatedTile = { ...items[tileIndex], ...res.data };
          items[tileIndex] = serverUpdatedTile;
          setTileCordinates(items);
          
          // Update selectedTileDetail with server response
          setSelectedTileDetail(serverUpdatedTile);

          // Update React Query cache
          queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: oldData.tiles.map(tile => (tile._id === tileId ? res.data : tile))
            };
          });
        }
      }).catch(err => {
        console.error('Error saving tile text:', err);
      });
    } else {
      // Save to localStorage for guest users
      updateTilesInLocalstorage(items);
    }

    // Clear formValue
    setFormValue({});
    setEditorOpen(false);
  };

  return (
    <div className='main_grid_container'>
      <div className='tiles_container'>
        {/* Sort tiles by created date (oldest first, newest last) using MongoDB _id */}
        {[...tileCordinates]
          .map((tile, originalIndex) => ({ tile, originalIndex }))
          .sort((a, b) => {
            if (!a.tile._id && !b.tile._id) return 0;
            if (!a.tile._id) return -1;
            if (!b.tile._id) return 1;
            return a.tile._id.localeCompare(b.tile._id);
          })
          .map(({ tile, originalIndex: index }) => {
          const computedStyle = style(index, tile);
          const isImgBackground = isBackgroundImage(tile.tileBackground);
          return (
            <Rnd
              key={tile._id || index}
              onMouseLeave={() => setShowOption(null)}
              className='tile'
              style={computedStyle}
              size={{ width: tile.width, height: tile.height }}
              position={{ x: tile.x, y: tile.y }}
              onDragStop={(e, d) => handleDragStop(e, d, tile, index)}
              onResizeStop={(e, direction, ref, delta, position) =>
                handleResizeStop(e, direction, ref, delta, position, index)
              }
              onDoubleClick={e => onDoubleTap(e, tile.action, tile.tileContent, tile, index, null)}
              minWidth={minHeightWidth[index]?.width || 50}
              minHeight={minHeightWidth[index]?.height || 50}
              onResize={(e, direction, ref, delta, position) =>
                onResize(index, e, direction, ref, delta, position)
              }
              id={tile._id}
              onResizeStart={() => setResizeCount(0)}
              dragGrid={[5, 5]}
              onTouchStart={e => {
                if (isDblTouchTap(e)) {
                  onDoubleTap(e, tile.action, tile.tileContent, tile, index, null);
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
                  className='text_overlay'
                  style={TitlePositionStyle(tile)}
                  dangerouslySetInnerHTML={{
                    __html: changedTitlehandle(index, tile)
                  }}
                />
              )}
              {isImgBackground && (
                <Image
                  src={tile.tileBackground}
                  alt='Preview'
                  fill
                  priority={index < 6}
                  quality={75}
                  // Use unoptimized for external CDN URLs to allow browser parallel loading
                  unoptimized={tile.tileBackground && tile.tileBackground.startsWith('http')}
                  style={{
                    objectFit: 'cover',
                    borderRadius: '10px',
                    pointerEvents: 'none'
                  }}
                />
              )}
              <div
                className='showOptions absolute top-0 right-2 cursor-pointer'
                onClick={e => openModel(e, index, null)}
              >
                <MoreHorizSharpIcon />
              </div>
              {showOption == `tile_${index}` && (
                <div
                  className='absolute top-0 right-2 cursor-pointer '
                  onTouchStart={e => openModel(e, index, null)}
                >
                  <MoreHorizSharpIcon />
                </div>
              )}{' '}
              {/* For Mobile view port  */}
            </Rnd>
          );
        })}
      </div>

      {/* Tiles Property Model */}
      {showModel && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-all duration-300 ease-in-out'
            onClick={() => {
              setShowModel(false);
              setSelectedPod(null);
              setColorBackground(null);
              setFormValue({});
              setSelectedTile(null);
              setImageFileName(null);
            }}
          />

          {/* Modal */}
          <div className='fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none'>
            <div
              className='bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col pointer-events-auto transform transition-all duration-300 ease-in-out overflow-hidden'
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className='flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-[#63899e]/10 to-[#4a6d7e]/10 backdrop-blur-sm flex-shrink-0'>
                <h2 className='text-lg font-bold text-[#63899e]'>Box Settings</h2>
                <button
                  onClick={() => {
                    setShowModel(false);
                    setSelectedPod(null);
                    setColorBackground(null);
                    setFormValue({});
                    setSelectedTile(null);
                    setImageFileName(null);
                  }}
                  className='p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 border-0 outline-none flex-shrink-0 cursor-pointer'
                  aria-label='Close dialog'
                >
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2.5'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className='flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-4 sm:pb-6 space-y-6 min-h-0 mt-6'>
                {/* Text Display */}
                <div className='space-y-3'>
                  <button
                    onClick={() => toggleSection('textDisplay')}
                    className='w-full flex items-center justify-between text-base font-semibold text-[#63899e] bg-[#63899e]/10 px-4 py-5 rounded-lg hover:bg-[#63899e]/20 transition-colors cursor-pointer border-0'
                  >
                    <span>Box Text Display</span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${
                        collapsedSections.textDisplay ? 'rotate-180' : ''
                      }`}
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M19 9l-7 7-7-7' />
                    </svg>
                  </button>
                  {!collapsedSections.textDisplay && (
                  <div className='flex flex-col sm:flex-row gap-4'>
                    {/* Left: Edit Text Content button */}
                    <div className='flex-1'>
                      <button
                        onClick={() => {
                          if (selectedTile !== null && selectedTile !== undefined) {
                            setCurrentTileIndex(selectedTile);
                          }
                          setEditorOpen(true);
                        }}
                        className='flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#63899e] hover:bg-[#63899e]/5 transition-all duration-200 cursor-pointer group w-full'
                      >
                        <Image
                          src={text}
                          alt='TEXT'
                          width={40}
                          height={40}
                          className='group-hover:scale-110 transition-transform'
                        />
                        <span className='text-sm font-medium text-gray-700 group-hover:text-[#63899e]'>
                          Edit Text Content
                        </span>
                      </button>
                    </div>
                    {/* Right: Checkbox and dropdowns */}
                    <div className='flex flex-col gap-3 flex-1'>
                      <label className='flex items-center gap-2 cursor-pointer group'>
                        <input
                          type='checkbox'
                          checked={selectedTileDetail.displayTitle}
                          onChange={displayTitle}
                          className='w-4 h-4 text-[#63899e] border-gray-300 rounded focus:ring-0 focus:outline-none cursor-pointer'
                        />
                        <span className='text-sm font-medium text-gray-700'>Show Text</span>
                      </label>
                      <div className='flex gap-2'>
                        <select
                          value={selectedTileDetail.titleX}
                          onChange={handleChangePositionX}
                          className='px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63899e] focus:border-[#63899e] cursor-pointer bg-white flex-1'
                        >
                          <option value={1}>Left</option>
                          <option value={2}>Center</option>
                          <option value={3}>Right</option>
                        </select>
                        <select
                          value={selectedTileDetail.titleY}
                          onChange={handleChangePositionY}
                          className='px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63899e] focus:border-[#63899e] cursor-pointer bg-white flex-1'
                        >
                          <option value={1}>Top</option>
                          <option value={2}>Center</option>
                          <option value={3}>Bottom</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
                {/* Box Background */}
                <div className='space-y-3'>
                  <button
                    onClick={() => toggleSection('background')}
                    className='w-full flex items-center justify-between text-base font-semibold text-[#63899e] bg-[#63899e]/10 px-4 py-5 rounded-lg hover:bg-[#63899e]/20 transition-colors cursor-pointer border-0'
                  >
                    <span>Box Background</span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${
                        collapsedSections.background ? 'rotate-180' : ''
                      }`}
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M19 9l-7 7-7-7' />
                    </svg>
                  </button>
                  {!collapsedSections.background && (
                  <div className='space-y-4'>
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <label
                        className={`flex items-center gap-2 cursor-pointer group hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1 ${
                          selectedTileDetail.backgroundAction === 'color'
                            ? 'bg-[#63899e]/10 text-[#63899e]'
                            : ''
                        }`}
                      >
                        <input
                          type='radio'
                          name='backgroundAction'
                          value='color'
                          checked={selectedTileDetail.backgroundAction === 'color'}
                          onChange={handleColorImage}
                          className='w-4 h-4 text-[#63899e] border-gray-300 focus:ring-2 focus:ring-[#63899e] checked:ring-2 checked:ring-[#63899e] cursor-pointer appearance-none rounded-full border-2 checked:border-[#63899e] focus:outline-none focus:ring-offset-0 checked:ring-offset-0 relative before:content-[""] before:absolute before:inset-0 before:rounded-full before:scale-0 checked:before:scale-[0.4] before:bg-[#63899e] before:transition-transform before:duration-200'
                        />
                        <span
                          className={`text-sm font-medium transition-colors ${
                            selectedTileDetail.backgroundAction === 'color'
                              ? 'text-[#63899e] font-semibold'
                              : 'text-gray-700 group-hover:text-[#63899e]'
                          }`}
                        >
                          Select Color
                        </span>
                      </label>
                      <label
                        className={`flex items-center gap-2 cursor-pointer group hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1 ${
                          selectedTileDetail.backgroundAction === 'image'
                            ? 'bg-[#63899e]/10 text-[#63899e]'
                            : ''
                        }`}
                      >
                        <input
                          type='radio'
                          name='backgroundAction'
                          value='image'
                          checked={selectedTileDetail.backgroundAction === 'image'}
                          onChange={handleColorImage}
                          className='w-4 h-4 text-[#63899e] border-gray-300 focus:ring-2 focus:ring-[#63899e] checked:ring-2 checked:ring-[#63899e] cursor-pointer appearance-none rounded-full border-2 checked:border-[#63899e] focus:outline-none focus:ring-offset-0 checked:ring-offset-0 relative before:content-[""] before:absolute before:inset-0 before:rounded-full before:scale-0 checked:before:scale-[0.4] before:bg-[#63899e] before:transition-transform before:duration-200'
                        />
                        <span
                          className={`text-sm font-medium transition-colors ${
                            selectedTileDetail.backgroundAction === 'image'
                              ? 'text-[#63899e] font-semibold'
                              : 'text-gray-700 group-hover:text-[#63899e]'
                          }`}
                        >
                          Upload Image
                        </span>
                      </label>
                    </div>
                    {selectedTileDetail.backgroundAction === 'color' && (
                      <div className='pl-2'>
                        <ColorPicker
                          handleColorChange={handleColorChange}
                          colorBackground={colorBackground}
                        />
                      </div>
                    )}
                    {selectedTileDetail.backgroundAction === 'image' && (
                      <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200'>
                        <div
                          className='relative w-20 h-20 rounded-lg border-2 border-dashed border-[#63899e]/40 hover:border-[#63899e] hover:bg-[#63899e]/5 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden bg-white flex items-center justify-center group'
                          onClick={handleImageInput}
                        >
                          {imagePreview ||
                          (selectedTileDetail.tileBackground &&
                            typeof selectedTileDetail.tileBackground === 'string' &&
                            selectedTileDetail.tileBackground.startsWith('http')) ? (
                            <img
                              src={
                                imagePreview ||
                                (selectedTileDetail.tileBackground &&
                                typeof selectedTileDetail.tileBackground === 'string'
                                  ? selectedTileDetail.tileBackground
                                  : imageUpload)
                              }
                              alt='Preview'
                              className='w-full h-full object-cover'
                            />
                          ) : (
                            <div className='flex flex-col items-center gap-1'>
                              <Image
                                src={imageUpload}
                                alt='Upload image'
                                width={32}
                                height={32}
                                className='opacity-70 group-hover:opacity-100 transition-opacity duration-200'
                              />
                              <span className='text-[10px] text-[#63899e]/70 group-hover:text-[#63899e] font-medium transition-colors duration-200'>Upload</span>
                            </div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-xs text-gray-500 mb-1'>Selected file:</p>
                          <p className='text-sm font-medium text-gray-700 truncate'>
                            {imageFileName ||
                              (selectedTileDetail.tileBackground &&
                              typeof selectedTileDetail.tileBackground === 'string'
                                ? 'Image loaded'
                                : 'No file selected')}
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      type='file'
                      accept='image/*'
                      ref={hiddenFileInput}
                      className='hidden'
                      onChange={handleImageChange}
                    />
                  </div>
                  )}
                </div>

                {/* Box Action */}
                <div className='space-y-3'>
                  <button
                    onClick={() => toggleSection('action')}
                    className='w-full flex items-center justify-between text-base font-semibold text-[#63899e] bg-[#63899e]/10 px-4 py-5 rounded-lg hover:bg-[#63899e]/20 transition-colors cursor-pointer border-0'
                  >
                    <span>Box Action</span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${
                        collapsedSections.action ? 'rotate-180' : ''
                      }`}
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M19 9l-7 7-7-7' />
                    </svg>
                  </button>
                  {!collapsedSections.action && (
                  <div className='space-y-3'>
                    <div className='flex flex-row flex-wrap gap-2'>
                      <label
                        className={`flex items-center gap-2 cursor-pointer group hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1 min-w-[140px] ${
                          selectedTileDetail.action === 'link'
                            ? 'bg-[#63899e]/10 text-[#63899e]'
                            : ''
                        }`}
                      >
                        <input
                          type='radio'
                          name='action'
                          value='link'
                          checked={selectedTileDetail.action === 'link'}
                          onChange={changeAction}
                          className='w-4 h-4 text-[#63899e] border-gray-300 focus:ring-2 focus:ring-[#63899e] checked:ring-2 checked:ring-[#63899e] cursor-pointer appearance-none rounded-full border-2 checked:border-[#63899e] focus:outline-none focus:ring-offset-0 checked:ring-offset-0 relative before:content-[""] before:absolute before:inset-0 before:rounded-full before:scale-0 checked:before:scale-[0.4] before:bg-[#63899e] before:transition-transform before:duration-200'
                        />
                        <span
                          className={`text-sm font-medium transition-colors ${
                            selectedTileDetail.action === 'link'
                              ? 'text-[#63899e] font-semibold'
                              : 'text-gray-700 group-hover:text-[#63899e]'
                          }`}
                        >
                          Opens Link
                        </span>
                      </label>
                      <label
                        className={`flex items-center gap-2 cursor-pointer group hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1 min-w-[140px] ${
                          selectedTileDetail.action === 'textEditor'
                            ? 'bg-[#63899e]/10 text-[#63899e]'
                            : ''
                        }`}
                      >
                        <input
                          type='radio'
                          name='action'
                          value='textEditor'
                          checked={selectedTileDetail.action === 'textEditor'}
                          onChange={changeAction}
                          className='w-4 h-4 text-[#63899e] border-gray-300 focus:ring-2 focus:ring-[#63899e] checked:ring-2 checked:ring-[#63899e] cursor-pointer appearance-none rounded-full border-2 checked:border-[#63899e] focus:outline-none focus:ring-offset-0 checked:ring-offset-0 relative before:content-[""] before:absolute before:inset-0 before:rounded-full before:scale-0 checked:before:scale-[0.4] before:bg-[#63899e] before:transition-transform before:duration-200'
                        />
                        <span
                          className={`text-sm font-medium transition-colors ${
                            selectedTileDetail.action === 'textEditor'
                              ? 'text-[#63899e] font-semibold'
                              : 'text-gray-700 group-hover:text-[#63899e]'
                          }`}
                        >
                          Opens Text Editor
                        </span>
                      </label>
                      <label
                        className={`flex items-center gap-2 cursor-pointer group hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1 min-w-[140px] ${
                          selectedTileDetail.action === 'textDisplay'
                            ? 'bg-[#63899e]/10 text-[#63899e]'
                            : ''
                        }`}
                      >
                        <input
                          type='radio'
                          name='action'
                          value='textDisplay'
                          checked={selectedTileDetail.action === 'textDisplay'}
                          onChange={changeAction}
                          className='w-4 h-4 text-[#63899e] border-gray-300 focus:ring-2 focus:ring-[#63899e] checked:ring-2 checked:ring-[#63899e] cursor-pointer appearance-none rounded-full border-2 checked:border-[#63899e] focus:outline-none focus:ring-offset-0 checked:ring-offset-0 relative before:content-[""] before:absolute before:inset-0 before:rounded-full before:scale-0 checked:before:scale-[0.4] before:bg-[#63899e] before:transition-transform before:duration-200'
                        />
                        <span
                          className={`text-sm font-medium transition-colors ${
                            selectedTileDetail.action === 'textDisplay'
                              ? 'text-[#63899e] font-semibold'
                              : 'text-gray-700 group-hover:text-[#63899e]'
                          }`}
                        >
                          Opens Text Display
                        </span>
                      </label>
                      <label
                        className={`flex items-center gap-2 cursor-pointer group hover:bg-gray-50 rounded-lg p-2 transition-colors flex-1 min-w-[140px] ${
                          selectedTileDetail.action === 'noAction'
                            ? 'bg-[#63899e]/10 text-[#63899e]'
                            : ''
                        }`}
                      >
                        <input
                          type='radio'
                          name='action'
                          value='noAction'
                          checked={selectedTileDetail.action === 'noAction'}
                          onChange={changeAction}
                          className='w-4 h-4 text-[#63899e] border-gray-300 focus:ring-2 focus:ring-[#63899e] checked:ring-2 checked:ring-[#63899e] cursor-pointer appearance-none rounded-full border-2 checked:border-[#63899e] focus:outline-none focus:ring-offset-0 checked:ring-offset-0 relative before:content-[""] before:absolute before:inset-0 before:rounded-full before:scale-0 checked:before:scale-[0.4] before:bg-[#63899e] before:transition-transform before:duration-200'
                        />
                        <span
                          className={`text-sm font-medium transition-colors ${
                            selectedTileDetail.action === 'noAction'
                              ? 'text-[#63899e] font-semibold'
                              : 'text-gray-700 group-hover:text-[#63899e]'
                          }`}
                        >
                          No Action
                        </span>
                      </label>
                    </div>
                    {selectedTileDetail.action === 'link' && (
                      <Input
                        type='text'
                        value={selectedTileDetail.tileLink || ''}
                        onChange={enterLink}
                        placeholder='Add URL here'
                        className='w-full'
                      />
                    )}
                  </div>
                  )}
                </div>

                

                {/* Box Order */}
                <div className='space-y-3'>
                      <button
                    onClick={() => toggleSection('order')}
                    className='w-full flex items-center justify-between text-base font-semibold text-[#63899e] bg-[#63899e]/10 px-4 py-5 rounded-lg hover:bg-[#63899e]/20 transition-colors cursor-pointer border-0'
                  >
                    <span>Box Order</span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${
                        collapsedSections.order ? 'rotate-180' : ''
                      }`}
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M19 9l-7 7-7-7' />
                    </svg>
                  </button>
                  {!collapsedSections.order && (
                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-700'>
                      Order (used for text editor navigation):
                    </label>
                    <Input
                      type='number'
                      min='1'
                      value={
                        selectedTileDetail.order !== undefined && selectedTileDetail.order !== null
                          ? selectedTileDetail.order
                          : ''
                      }
                      onChange={e => {
                        const inputValue = e.target.value;
                        if (inputValue === '') {
                          setSelectedTileDetail({ ...selectedTileDetail, order: null });
                          const values = formValue;
                          values.order = null;
                          setFormValue(values);
                        } else {
                          const newOrder = parseInt(inputValue);
                          if (!isNaN(newOrder) && newOrder > 0) {
                            setSelectedTileDetail({ ...selectedTileDetail, order: newOrder });
                            const values = formValue;
                            values.order = newOrder;
                            setFormValue(values);
                          }
                        }
                      }}
                      placeholder='Enter order number'
                      className='w-full'
                    />
                    <p className='text-xs text-gray-500'>
                      This determines the order when navigating between boxes in the text editor
                    </p>
                  </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50/50 flex-shrink-0'>
                <div className='flex gap-4'>
                  <button
                    onClick={() => tileClone(selectedTile)}
                    className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#63899e] hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer border-0 outline-none'
                  >
                    <DifferenceOutlinedIcon className='text-[#63899e]' />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={() => deleteTile(selectedTile)}
                    className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer border-0 outline-none'
                  >
                    <DeleteOutlineIcon />
                    <span>Delete</span>
                  </button>
                </div>
                <div className='flex items-center gap-3 sm:justify-end'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowModel(false);
                      setSelectedPod(null);
                      setColorBackground(null);
                      setFormValue({});
                      setSelectedTile(null);
                      setImageFileName(null);
                    }}
                    className='border-gray-300 cursor-pointer flex-1 sm:flex-initial'
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='default'
                    onClick={index => handleSave(`tiles_${selectedTile}`)}
                    className='bg-[#63899e] hover:bg-[#4a6d7e] cursor-pointer flex-1 sm:flex-initial'
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Editor Modal */}
      {editorOpen && (() => {
        const hasMultipleTiles = tileCordinates.length > 1;
        const canGoPrev = currentTileIndex > 0;
        const canGoNext = currentTileIndex < tileCordinates.length - 1;

        const goPrev = () => {
          if (!canGoPrev) return;
          const prevIndex = currentTileIndex - 1;
          setCurrentTileIndex(prevIndex);
          setSelectedTile(prevIndex);
          const prevTile = tileCordinates[prevIndex];
          setSelectedTileDetail(prevTile);
          setFormValue({ ...formValue, tileText: prevTile.tileText || '' });
          currentBackground(prevTile);
        };

        const goNext = () => {
          if (!canGoNext) return;
          const nextIndex = currentTileIndex + 1;
          setCurrentTileIndex(nextIndex);
          setSelectedTile(nextIndex);
          const nextTile = tileCordinates[nextIndex];
          setSelectedTileDetail(nextTile);
          setFormValue({ ...formValue, tileText: nextTile.tileText || '' });
          currentBackground(nextTile);
        };

        return (
          <>
            <div
              className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-all duration-300 ease-in-out'
              onClick={() => setEditorOpen(false)}
            />
            <div className='fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none'>
              <div
                className='bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:w-full sm:max-w-[1128px] h-[100dvh] sm:h-auto sm:max-h-[90vh] max-h-screen flex flex-col pointer-events-auto transform transition-all duration-300 ease-in-out overflow-hidden'
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className='flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-[#63899e]/10 to-[#4a6d7e]/10 backdrop-blur-sm flex-shrink-0'>
                  <h2 className='text-xl font-bold text-[#63899e] m-0'>Edit Text</h2>
                  <button
                    onClick={() => setEditorOpen(false)}
                    className='p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 border-0 outline-none flex-shrink-0 cursor-pointer'
                    aria-label='Close dialog'
                  >
                    <svg
                      className='h-5 w-5'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2.5'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>

                {/* Editor Content */}
                <div className='flex-1 overflow-hidden flex items-stretch min-h-0'>
                  <div className='flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6'>
                    <TipTapMainEditor
                      initialContent={formValue.tileText || selectedTileDetail.tileText || ''}
                      onContentChange={html => enterText(html)}
                    />
                  </div>
                </div>

                {/* Navigation Indicator */}
                {hasMultipleTiles && (
                  <div className='flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-200'>
                    <button
                      onClick={goPrev}
                      disabled={!canGoPrev}
                      className={`p-2 rounded-lg transition-all duration-200 border-0 outline-none ${
                        canGoPrev
                          ? 'text-[#63899e] hover:bg-[#63899e]/10 cursor-pointer'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      aria-label='Previous tile'
                    >
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2.5'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M15 19l-7-7 7-7' />
                      </svg>
                    </button>
                    <div className='flex items-center gap-1 px-3'>
                      <span className='text-sm text-gray-600 font-medium'>
                        {currentTileIndex + 1} / {tileCordinates.length}
                      </span>
                    </div>
                    <button
                      onClick={goNext}
                      disabled={!canGoNext}
                      className={`p-2 rounded-lg transition-all duration-200 border-0 outline-none ${
                        canGoNext
                          ? 'text-[#63899e] hover:bg-[#63899e]/10 cursor-pointer'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      aria-label='Next tile'
                    >
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2.5'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path d='M9 5l7 7-7 7' />
                      </svg>
                    </button>
                  </div>
                )}

              {/* Footer */}
              <div
                className='flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 bg-gray-50/50 flex-shrink-0'
                style={{ borderTop: '1px solid #e5e7eb' }} // tailwind's border-gray-200 as inline style
              >
                <Button
                  variant='outline'
                  onClick={() => setEditorOpen(false)}
                  className='border-gray-300 cursor-pointer w-full'
                >
                  Close
                </Button>
                <Button
                  variant='default'
                  onClick={saveEditorText}
                  className='bg-[#63899e] hover:bg-[#4a6d7e] cursor-pointer w-full'
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
          </>
        );
      })()}

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
