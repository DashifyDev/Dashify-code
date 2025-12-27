'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import '../styles/styles.css';

import { globalContext } from '@/context/globalContext';
import isDblTouchTap from '@/hooks/isDblTouchTap';
import { dashboardKeys } from '@/hooks/useDashboard';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import MoreHorizSharpIcon from '@mui/icons-material/MoreHorizSharp';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
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

const MobileGridTiles = memo(function MobileGridTiles({
  tileCordinates,
  setTileCordinates,
  activeBoard,
  updateTilesInLocalstorage
}) {
  const [showOption, setShowOption] = useState(null);
  const [showModel, setShowModel] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [colorImage, setColorImage] = useState('color');
  const [textLink, setTextLink] = useState('text');
  const [imageFileName, setImageFileName] = useState(null);
  const [formValue, setFormValue] = useState({});
  const [openTextEditor, setOpenTextEdior] = useState(false);
  const [selectedTileDetail, setSelectedTileDetail] = useState({});
  const [textEditorContent, setTextEditorContent] = useState();
  const [editorLabel, setEditorLabel] = useState();
  const [colorBackground, setColorBackground] = useState();
  const [editorOpen, setEditorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [editingTileId, setEditingTileId] = useState(null); // Tile in edit mode (after long press)
  const [longPressTimer, setLongPressTimer] = useState(null);
  const { dbUser } = useContext(globalContext);
  const queryClient = useQueryClient();
  const hiddenFileInput = useRef(null);
  const containerRef = useRef(null);

  // Sort tiles by order (mobileY position) for display
  const sortedTiles = useMemo(() => {
    return [...tileCordinates].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      // Fallback to mobileY if order is same
      const yA = a.mobileY ?? 0;
      const yB = b.mobileY ?? 0;
      return yA - yB;
    });
  }, [tileCordinates]);

  const cloneMutation = useMutation(
    async tileToCreate => {
      const response = await axios.post('/api/tile/tile', tileToCreate);
      return response.data;
    },
    {
      onMutate: async newTile => {
        const detailKey = dashboardKeys.detail(activeBoard);
        await queryClient.cancelQueries({ queryKey: detailKey });
        const previous = queryClient.getQueryData(detailKey);

        const tempTile = { ...newTile, _id: `temp_clone_${Date.now()}` };

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

  // Handle vertical drag and drop reordering
  const handleSortEnd = useCallback(
    newList => {
      // Calculate new mobileY positions based on order
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      const updatedTiles = newList.map((tile, index) => {
        // Calculate y position based on previous tiles' heights
        let newY = 0;
        for (let i = 0; i < index; i++) {
          const prevTile = newList[i];
          const prevHeight = parseInt(prevTile.mobileHeight || prevTile.height || '150', 10);
          newY += prevHeight + 16; // 16px margin between tiles
        }

        return {
          ...tile,
          mobileX: 0,
          mobileY: newY,
          mobileWidth: `${windowWidth - 48}px`, // Full width minus padding (24px on each side)
          order: index + 1
        };
      });

      setTileCordinates(updatedTiles);

      // Update order and mobile positions in database
      if (dbUser) {
        updatedTiles.forEach((tile, index) => {
          const updateData = {
            mobileX: tile.mobileX,
            mobileY: tile.mobileY,
            mobileWidth: tile.mobileWidth,
            order: tile.order
          };

          axios
            .patch(`/api/tile/${tile._id}`, updateData)
            .then(res => {
              if (res.data) {
                queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(t =>
                      t._id === tile._id ? res.data : t
                    )
                  };
                });
              }
            })
            .catch(err => {
              console.error('Error updating tile order:', err);
            });
        });
      } else {
        updateTilesInLocalstorage(updatedTiles);
      }
    },
    [dbUser, activeBoard, queryClient, setTileCordinates, updateTilesInLocalstorage]
  );

  // Handle vertical resize (height only on mobile)
  const handleHeightResize = useCallback(
    (tileId, newHeight, isTopResize = false) => {
      // Find the tile being resized - use String comparison to handle different ID types
      // Support both real _id and temporary IDs (temp_*)
      const currentTile = tileCordinates.find(t => String(t._id || '') === String(tileId));

      if (!currentTile) {
        console.warn(
          'Tile not found for resize:',
          tileId,
          'Available tiles:',
          tileCordinates.map(t => t._id || 'no-id')
        );
        return;
      }

      const sortedIndex = sortedTiles.findIndex(t => String(t._id) === String(tileId));
      if (sortedIndex < 0) {
        console.warn('Tile not found in sorted tiles for resize:', tileId);
        return;
      }

      const currentHeight = parseInt(currentTile.mobileHeight || currentTile.height || '150', 10);

      // Create updated copy of tiles - find by ID, not index
      // Support both real _id and temporary IDs
      const updatedTiles = tileCordinates.map(t => {
        const tId = String(t._id || '');
        const targetId = String(tileId);
        if (tId === targetId) {
          // Update ONLY the specific tile being resized
          if (isTopResize) {
            // When resizing from top, adjust Y position to move up
            const heightDelta = newHeight - currentHeight;
            const currentY = t.mobileY || 0;
            return {
              ...t,
              mobileHeight: `${newHeight}px`,
              mobileY: Math.max(0, currentY - heightDelta)
            };
          } else {
            // Bottom resize - only change height, Y stays the same
            return {
              ...t,
              mobileHeight: `${newHeight}px`
            };
          }
        }
        return { ...t };
      });

      // Recalculate Y positions only for tiles that come AFTER the resized one
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

      // Calculate Y position for the resized tile first
      let currentY = 0;
      for (let i = 0; i < sortedIndex; i++) {
        const prevTile = sortedTiles[i];
        const prevTileInUpdated = updatedTiles.find(t => String(t._id) === String(prevTile._id));
        const prevTileToUse = prevTileInUpdated || prevTile;
        const prevHeight = parseInt(
          prevTileToUse.mobileHeight || prevTile.mobileHeight || prevTile.height || '150',
          10
        );
        currentY += prevHeight + 16;
      }

      // Find the resized tile in updatedTiles - support temporary IDs
      const resizedTileInUpdated = updatedTiles.find(t => String(t._id || '') === String(tileId));
      if (!resizedTileInUpdated) return;

      // Update Y position of resized tile if it's bottom resize
      if (!isTopResize) {
        const resizedTileIndex = updatedTiles.findIndex(t => String(t._id) === String(tileId));
        if (resizedTileIndex >= 0) {
          updatedTiles[resizedTileIndex] = {
            ...updatedTiles[resizedTileIndex],
            mobileY: currentY
          };
        }
      }

      // Now recalculate positions for all tiles after the resized one
      const resizedTileHeight = parseInt(resizedTileInUpdated.mobileHeight || '150', 10);
      currentY += resizedTileHeight + 16;

      for (let i = sortedIndex + 1; i < sortedTiles.length; i++) {
        const tile = sortedTiles[i];
        const tileUpdateIndex = updatedTiles.findIndex(t => String(t._id) === String(tile._id));
        if (tileUpdateIndex >= 0) {
          const tileHeight = parseInt(
            updatedTiles[tileUpdateIndex].mobileHeight || tile.mobileHeight || tile.height || '150',
            10
          );
          updatedTiles[tileUpdateIndex] = {
            ...updatedTiles[tileUpdateIndex],
            mobileY: currentY,
            mobileWidth: `${windowWidth - 48}px`
          };
          currentY += tileHeight + 16;
        }
      }

      setTileCordinates(updatedTiles);

      if (dbUser) {
        // Update only the resized tile in database
        // Skip API call if it's a temporary ID (will be saved when tile is created)
        if (String(tileId).startsWith('temp_')) {
          // For temporary tiles, just update local state
          // The tile will be saved with real ID when user saves it
          setTileCordinates(updatedTiles);
          queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: updatedTiles
            };
          });
        } else {
          // Real tile ID - update in database
          const resizedTile = updatedTiles.find(t => String(t._id) === String(tileId));
          if (!resizedTile) return;

          axios
            .patch(`/api/tile/${tileId}`, {
              mobileHeight: resizedTile.mobileHeight,
              mobileY: resizedTile.mobileY
            })
            .then(res => {
              if (res.data) {
                queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(t =>
                      String(t._id) === String(tileId) ? res.data : t
                    )
                  };
                });
              }
            })
            .catch(err => {
              console.error('Error updating tile height:', err);
            });
        }
      } else {
        // Guest user - update localStorage
        updateTilesInLocalstorage(updatedTiles);
      }
    },
    [
      tileCordinates,
      sortedTiles,
      dbUser,
      activeBoard,
      queryClient,
      setTileCordinates,
      updateTilesInLocalstorage
    ]
  );

  const style = useCallback(tile => {
    const isImageBackground = tile.tileBackground ? isBackgroundImage(tile.tileBackground) : false;

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    // Increased side padding: 24px on each side (48px total) instead of 16px (32px total)
    const width = tile.mobileWidth || `${windowWidth - 48}px`;

    // If user has manually set mobileHeight (exists and is not null/undefined), use fixed height
    // Otherwise, use min-height to allow content to expand naturally
    const hasCustomHeight = tile.mobileHeight != null && tile.mobileHeight !== '';
    const defaultMinHeight = '150px';

    const styleObj = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'solid 1px #ddd',
      background: tile.tileBackground && !isImageBackground ? tile.tileBackground : '#deedf0ff',
      color: 'black',
      overflowWrap: 'anywhere',
      borderRadius: '10px',
      width: width,
      position: 'relative',
      margin: '8px 24px', // Increased side margins from 16px to 24px
      touchAction: 'pan-y',
      userSelect: 'none', // Prevent text selection
      WebkitUserSelect: 'none', // Safari
      MozUserSelect: 'none', // Firefox
      msUserSelect: 'none' // IE/Edge
    };

    if (hasCustomHeight) {
      // User has manually resized - use fixed height
      styleObj.height = tile.mobileHeight;
    } else {
      // Default - use min-height to allow content to expand
      styleObj.minHeight = defaultMinHeight;
    }

    return styleObj;
  }, []);

  const changedTitlehandle = tile => {
    let tileText = tile.tileText;
    let content = tileText;

    if (tileText) {
      if (tileText === '<div><br></div>' || tileText === '<div></div>') {
        content = '';
      }
    }

    const titleVal =
      content && tile.displayTitle ? tileText : !content && tile.displayTitle ? ' New Tile' : '';
    return titleVal;
  };

  const onDoubleTap = (e, action, editorHtml, tile, index) => {
    if ((e.type === 'touchstart' || e.detail == 2) && action == 'link') {
      if (tile.tileLink) {
        window.open(tile.tileLink, '_blank');
      }
    } else if ((e.type === 'touchstart' || e.detail == 2) && action == 'textEditor') {
      setEditorLabel(tile.editorHeading);
      setOpenTextEdior(true);
      setTextEditorContent(editorHtml || '');
      setSelectedTile(index);
    }
  };

  const openModel = (e, index) => {
    e.stopPropagation();
    setShowModel(true);
    setSelectedTile(index);
    setSelectedTileDetail(sortedTiles[index]);
    currentBackground(sortedTiles[index]);
  };

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

  const enterText = value => {
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
      payload.displayTitle = false;
      formData.append('tileImage', payload.tileBackground);
      delete payload.tileBackground;
    }
    formData.append('formValue', JSON.stringify(payload));

    if (
      selectedTile === null ||
      selectedTile === undefined ||
      selectedTile < 0 ||
      selectedTile >= sortedTiles.length
    ) {
      return;
    }

    let items = [...tileCordinates];
    const tileIndex = items.findIndex(t => t._id === sortedTiles[selectedTile]._id);
    if (tileIndex < 0) return;

    let tileId = items[tileIndex]._id;
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
          selectedTile >= sortedTiles.length
        ) {
          return;
        }
        let item = { ...items[tileIndex], ...res.data };
        items[tileIndex] = item;
        setTileCordinates(items);

        queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(tile =>
              tile._id === tileId ? res.data : tile
            )
          };
        });

        setSelectedTile(null);
      });
    } else {
      if (formValue.tileBackground instanceof File) {
        const reader = new FileReader();
        reader.onload = function (e) {
          if (
            selectedTile === null ||
            selectedTile === undefined ||
            selectedTile < 0 ||
            selectedTile >= sortedTiles.length
          ) {
            return;
          }
          let updatedData = JSON.parse(formData.get('formValue'));
          updatedData.tileBackground = e.target.result;
          let item = { ...items[tileIndex], ...updatedData };
          items[tileIndex] = item;
          setTileCordinates(items);
          updateTilesInLocalstorage(items);
          setSelectedTile(null);
        };
        reader.readAsDataURL(formValue.tileBackground);
      } else {
        let updatedData = JSON.parse(formData.get('formValue'));
        let item = { ...items[tileIndex], ...updatedData };
        items[tileIndex] = item;
        setTileCordinates(items);
        updateTilesInLocalstorage(items);
        setSelectedTile(null);
      }
    }
  };

  const deleteTile = index => {
    const items = [...tileCordinates];
    const tileIndex = items.findIndex(t => t._id === sortedTiles[index]._id);
    if (tileIndex < 0) return;

    let tileId = items[tileIndex]._id;
    setShowModel(false);
    if (dbUser) {
      axios.delete(`/api/tile/${tileId}`).then(res => {
        if (res) {
          items.splice(tileIndex, 1);
          setTileCordinates(items);

          queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).filter(
                tile => tile._id !== tileId
              )
            };
          });
        }
      });
    } else {
      items.splice(tileIndex, 1);
      setTileCordinates(items);
      updateTilesInLocalstorage(items);
    }
  };

  const handleImageChange = e => {
    const selectedImage = e.target.files[0];
    setImageFileName(selectedImage.name);
    const values = formValue;
    values.tileBackground = selectedImage;
    setFormValue(values);
  };

  const handleImageInput = event => {
    hiddenFileInput.current.click();
  };

  const handleColorChange = color => {
    const values = formValue;
    values.tileBackground = color.hex;
    setFormValue(values);
  };

  const tileClone = index => {
    const content = sortedTiles[index];
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

    const newTile = {
      ...content,
      mobileX: 0,
      mobileY: sortedTiles.length * 166, // Approximate position
      mobileWidth: `${windowWidth - 48}px`,
      // Only copy mobileHeight if it was manually set (not default)
      // If content had mobileHeight set, keep it; otherwise don't set it (use min-height)
      ...(content.mobileHeight ? { mobileHeight: content.mobileHeight } : {}),
      order: sortedTiles.length + 1
    };

    setShowModel(false);
    if (dbUser) {
      newTile.dashboardId = activeBoard;
      cloneMutation.mutate(newTile);
    } else {
      let items = [...tileCordinates, newTile];
      setTileCordinates(items);
      updateTilesInLocalstorage(items);
    }
  };

  const TitlePositionStyle = tile => {
    return {
      top: tile.titleY == 1 ? 0 : 'auto',
      bottom: tile.titleY == 3 ? 0 : 'auto',
      left: tile.titleX == 1 ? 0 : 'auto',
      right: tile.titleX == 3 ? 0 : 'auto',
      textAlign: tile.titleX == 3 ? 'right' : tile.titleX == 2 ? 'center' : 'left'
    };
  };

  const isBackgroundImage = useCallback(url => {
    if (url) {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      return imageExtensions.some(ext => url.toLowerCase().includes(ext));
    }
    return false;
  }, []);

  const currentBackground = tile => {
    if (tile.tileBackground) {
      if (isBackgroundImage(tile.tileBackground)) {
        if (tile.tileBackground.startsWith('data:image/')) {
          setImageFileName('uploaded-image.png');
        } else {
          const segments = tile.tileBackground.split('/');
          const imageName = segments[segments.length - 1];
          setImageFileName(imageName);
        }
      } else {
        setColorBackground(tile.tileBackground);
      }
    } else {
      setColorBackground('#deedf0ff');
    }
  };

  const handleCloseTextEditor = content => {
    setOpenTextEdior(false);
    setTextEditorContent(null);
    setSelectedTile(null);
  };

  const updateEditorContent = (content, editorTitle) => {
    if (
      selectedTile === null ||
      selectedTile === undefined ||
      selectedTile < 0 ||
      selectedTile >= sortedTiles.length
    ) {
      return;
    }

    const items = [...tileCordinates];
    const tileIndex = items.findIndex(t => t._id === sortedTiles[selectedTile]._id);
    if (tileIndex < 0) return;

    let tileId = items[tileIndex]._id;
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
          selectedTile >= sortedTiles.length
        ) {
          return;
        }
        let item = { ...items[tileIndex], ...res.data };
        items[tileIndex] = item;
        setTileCordinates(items);

        queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tiles: oldData.tiles.map(tile => (tile._id === tileId ? res.data : tile))
          };
        });

        setSelectedTile(null);
      });
    } else {
      let item = {
        ...items[tileIndex],
        tileContent: content,
        editorHeading: editorTitle
      };
      items[tileIndex] = item;
      setTileCordinates(items);
      updateTilesInLocalstorage(items);
      setSelectedTile(null);
    }
  };

  const saveEditorText = () => {
    setEditorOpen(false);
  };

  // Resize handler for vertical resizing
  const handleResize = useCallback(
    (tileId, newHeight, isTopResize = false) => {
      handleHeightResize(tileId, newHeight, isTopResize);
    },
    [handleHeightResize]
  );

  // Handle long press to enter edit mode
  const longPressStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const handleLongPressStart = (tileId, e) => {
    // Don't start long press on interactive elements
    const target = e.target;
    if (target.closest('.resize-handle') || target.closest('.drag-handle')) {
      return;
    }

    // Store initial touch position
    const touch = e.touches?.[0] || { clientX: e.clientX, clientY: e.clientY };
    longPressStartPos.current = { x: touch.clientX, y: touch.clientY };
    hasMoved.current = false;

    // Track movement during long press
    const handleMove = moveEvent => {
      const currentTouch = moveEvent.touches?.[0] || {
        clientX: moveEvent.clientX,
        clientY: moveEvent.clientY
      };
      const deltaX = Math.abs(currentTouch.clientX - longPressStartPos.current.x);
      const deltaY = Math.abs(currentTouch.clientY - longPressStartPos.current.y);

      // If moved more than 10px, cancel long press (user is scrolling)
      if (deltaX > 10 || deltaY > 10) {
        hasMoved.current = true;
        handleLongPressEnd();
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('mousemove', handleMove);
      }
    };

    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('mousemove', handleMove);

    const timer = setTimeout(() => {
      if (!hasMoved.current) {
        console.log('Entering edit mode for tile:', tileId);
        setEditingTileId(tileId);
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mousemove', handleMove);
    }, 750); // 0.75 seconds

    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    hasMoved.current = false;
  };

  // Exit edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (editingTileId && containerRef.current && !containerRef.current.contains(e.target)) {
        setEditingTileId(null);
      }
    };

    if (editingTileId) {
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingTileId]);

  return (
    <>
      {/* Edit mode badge - shown at top of page under header */}
      {editingTileId && (
        <div
          style={{
            position: 'absolute',
            top: '0px', // Start from very top for testing
            left: '0',
            backgroundColor: '#63899e',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 99999, // Very high z-index
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            whiteSpace: 'nowrap',
            width: 'auto',
            minWidth: '120px',
            opacity: 0.8,
            textAlign: 'center'
          }}
        >
          Edit Mode
        </div>
      )}
      <div ref={containerRef} className='mobile-grid-container' style={{ paddingBottom: '20px' }}>
        <ReactSortable
          list={sortedTiles}
          setList={handleSortEnd}
          animation={200}
          disabled={!editingTileId} // Disable drag by default, enable only in edit mode
          filter='.drag-handle, .resize-handle'
          preventOnFilter={false}
          onStart={evt => {
            // Only allow drag if tile is in edit mode
            const draggedTile = evt.item;
            const tileId = draggedTile.getAttribute('data-tile-id');

            if (tileId !== editingTileId) {
              return false; // Prevent drag if not in edit mode
            }

            // Check if drag started on resize handle or settings button
            const clickedResize = evt.originalEvent?.target?.closest('.resize-handle');
            const clickedSettings = evt.originalEvent?.target?.closest('.drag-handle');

            if (clickedResize || clickedSettings) {
              return false; // Prevent drag
            }
            setIsDragging(true);
          }}
          onEnd={() => {
            setIsDragging(false);
            // Exit edit mode after drag ends
            setEditingTileId(null);
          }}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {sortedTiles.map((tile, index) => {
            const computedStyle = style(tile);
            const isImgBackground = isBackgroundImage(tile.tileBackground);
            const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

            const isEditing = editingTileId === String(tile._id || '');

            return (
              <div
                key={tile._id || index}
                data-tile-id={tile._id}
                style={{
                  ...computedStyle,
                  position: 'relative',
                  marginBottom: '16px',
                  touchAction: isResizing ? 'none' : isEditing ? 'none' : 'pan-y',
                  opacity: isEditing ? 0.95 : 1,
                  boxShadow: isEditing ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                  transform: isEditing ? 'scaleX(1.02)' : 'scaleX(1)',
                  transition: isEditing
                    ? 'box-shadow 0.2s ease, transform 0.2s ease'
                    : 'transform 0.2s ease',
                  userSelect: 'none', // Prevent text selection
                  WebkitUserSelect: 'none', // Safari
                  MozUserSelect: 'none', // Firefox
                  msUserSelect: 'none' // IE/Edge
                }}
                onTouchStart={e => {
                  // Don't handle if resizing or clicking on interactive elements
                  if (isResizing) return;
                  const target = e.target;
                  if (target.closest('.resize-handle') || target.closest('.drag-handle')) {
                    return;
                  }

                  // If not in edit mode, start long press timer
                  if (!isEditing) {
                    handleLongPressStart(tile._id, e);
                  }

                  // Handle double tap for actions
                  if (isDblTouchTap(e)) {
                    handleLongPressEnd(); // Cancel long press
                    onDoubleTap(e, tile.action, tile.tileContent, tile, index);
                  }
                }}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onDoubleClick={e => {
                  if (isResizing) return;
                  const target = e.target;
                  if (target.closest('.resize-handle') || target.closest('.drag-handle')) {
                    return;
                  }
                  onDoubleTap(e, tile.action, tile.tileContent, tile, index);
                }}
              >
                {/* Settings button - opens tile settings modal */}
                <div
                  className='drag-handle'
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    opacity: isEditing ? 1 : 0.7,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '4px',
                    padding: '2px',
                    transition: 'opacity 0.2s ease'
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    openModel(e, index);
                  }}
                  onTouchStart={e => {
                    e.stopPropagation();
                    handleLongPressEnd(); // Cancel long press
                    // Prevent drag when clicking settings button
                  }}
                >
                  <MoreHorizSharpIcon style={{ fontSize: '20px' }} />
                </div>

                {/* Resize handle for top edge - only visible in edit mode */}
                {isEditing && (
                  <div
                    className='resize-handle resize-handle-top'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '12px',
                      cursor: 'ns-resize',
                      zIndex: 15,
                      touchAction: 'none'
                    }}
                    onTouchStart={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsResizing(true);
                      const startY = e.touches[0].clientY;
                      const startHeight = parseInt(tile.mobileHeight || tile.height || '150', 10);
                      const startTop = tile.mobileY || 0;

                      const handleMove = moveEvent => {
                        moveEvent.preventDefault();
                        const currentY = moveEvent.touches[0].clientY;
                        const deltaY = startY - currentY; // Inverted for top resize
                        const newHeight = Math.max(100, startHeight + deltaY);
                        handleResize(tile._id, newHeight, true);
                      };

                      const handleEnd = () => {
                        setIsResizing(false);
                        // Exit edit mode after resize ends
                        setEditingTileId(null);
                        document.removeEventListener('touchmove', handleMove, { passive: false });
                        document.removeEventListener('touchend', handleEnd);
                      };

                      document.addEventListener('touchmove', handleMove, { passive: false });
                      document.addEventListener('touchend', handleEnd);
                    }}
                    onMouseDown={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsResizing(true);
                      const startY = e.clientY;
                      const startHeight = parseInt(tile.mobileHeight || tile.height || '150', 10);

                      const handleMove = moveEvent => {
                        moveEvent.preventDefault();
                        const currentY = moveEvent.clientY;
                        const deltaY = startY - currentY; // Inverted for top resize
                        const newHeight = Math.max(100, startHeight + deltaY);
                        handleResize(tile._id, newHeight, true);
                      };

                      const handleEnd = () => {
                        setIsResizing(false);
                        // Exit edit mode after resize ends
                        setEditingTileId(null);
                        document.removeEventListener('mousemove', handleMove);
                        document.removeEventListener('mouseup', handleEnd);
                      };

                      document.addEventListener('mousemove', handleMove);
                      document.addEventListener('mouseup', handleEnd);
                    }}
                  />
                )}

                {/* Resize handle for bottom edge - only visible in edit mode */}
                {isEditing && (
                  <div
                    className='resize-handle resize-handle-bottom'
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '12px',
                      cursor: 'ns-resize',
                      zIndex: 15,
                      touchAction: 'none'
                    }}
                    onTouchStart={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsResizing(true);
                      const startY = e.touches[0].clientY;
                      const startHeight = parseInt(tile.mobileHeight || tile.height || '150', 10);

                      const handleMove = moveEvent => {
                        moveEvent.preventDefault();
                        const currentY = moveEvent.touches[0].clientY;
                        const deltaY = currentY - startY;
                        const newHeight = Math.max(100, startHeight + deltaY);
                        handleResize(tile._id, newHeight, false);
                      };

                      const handleEnd = () => {
                        setIsResizing(false);
                        // Exit edit mode after resize ends
                        setEditingTileId(null);
                        document.removeEventListener('touchmove', handleMove, { passive: false });
                        document.removeEventListener('touchend', handleEnd);
                      };

                      document.addEventListener('touchmove', handleMove, { passive: false });
                      document.addEventListener('touchend', handleEnd);
                    }}
                    onMouseDown={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsResizing(true);
                      const startY = e.clientY;
                      const startHeight = parseInt(tile.mobileHeight || tile.height || '150', 10);

                      const handleMove = moveEvent => {
                        moveEvent.preventDefault();
                        const currentY = moveEvent.clientY;
                        const deltaY = currentY - startY;
                        const newHeight = Math.max(100, startHeight + deltaY);
                        handleResize(tile._id, newHeight, false);
                      };

                      const handleEnd = () => {
                        setIsResizing(false);
                        // Exit edit mode after resize ends
                        setEditingTileId(null);
                        document.removeEventListener('mousemove', handleMove);
                        document.removeEventListener('mouseup', handleEnd);
                      };

                      document.addEventListener('mousemove', handleMove);
                      document.addEventListener('mouseup', handleEnd);
                    }}
                  />
                )}

                {tile.displayTitle && (
                  <div
                    className='text_overlay'
                    style={{
                      ...TitlePositionStyle(tile),
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      pointerEvents: 'none' // Prevent text selection
                    }}
                    dangerouslySetInnerHTML={{
                      __html: changedTitlehandle(tile)
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
                    unoptimized={tile.tileBackground && tile.tileBackground.startsWith('http')}
                    style={{
                      objectFit: 'cover',
                      borderRadius: '10px',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </div>
            );
          })}
        </ReactSortable>

        {/* Tiles Property Model - Same as desktop */}
        <Dialog open={showModel} id={`model_${selectedTile}`}>
          <div className='all_options'>
            <ul>
              <li>
                <h3 className='menu_header'>Box Background</h3>
                <div className='radio_menu'>
                  <div className='radiosets'>
                    <FormControl>
                      <RadioGroup
                        aria-labelledby='demo-radio-buttons-group-label'
                        defaultValue={selectedTileDetail.backgroundAction}
                        name='radio-buttonsColor'
                        onChange={handleColorImage}
                      >
                        <FormControlLabel value='color' control={<Radio />} label='Select Color' />
                        <FormControlLabel value='image' control={<Radio />} label='Upload Image' />
                      </RadioGroup>
                    </FormControl>
                  </div>
                  {selectedTileDetail.backgroundAction === 'color' && (
                    <ColorPicker
                      handleColorChange={handleColorChange}
                      colorBackground={colorBackground}
                    />
                  )}
                  {selectedTileDetail.backgroundAction === 'image' && (
                    <div className='image_value'>
                      <Image
                        src={imageUpload}
                        alt='image'
                        width={60}
                        height={60}
                        onClick={handleImageInput}
                      />
                      <div className='file_Name'>
                        <span>{imageFileName}</span>
                      </div>
                    </div>
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    ref={hiddenFileInput}
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>
              </li>
              <li>
                <h3 className='menu_header'>Box Action</h3>
                <div className='radio_control'>
                  <div className='radiosets'>
                    <FormControl>
                      <RadioGroup
                        aria-labelledby='demo-radio-buttons-group-label'
                        defaultValue={selectedTileDetail.action}
                        name='radio-buttonsLink'
                        onChange={changeAction}
                      >
                        <FormControlLabel value='link' control={<Radio />} label='Opens Link' />
                        <FormControlLabel
                          value='textEditor'
                          control={<Radio />}
                          label='Opens Text Editor'
                        />
                        <FormControlLabel value='noAction' control={<Radio />} label='No Action' />
                      </RadioGroup>
                    </FormControl>
                    <input
                      type='text'
                      className='url_text'
                      value={selectedTileDetail.tileLink}
                      onChange={enterLink}
                      placeholder='Add URL here'
                      disabled={selectedTileDetail.action !== 'link'}
                    />
                  </div>
                </div>
              </li>
              <li>
                <h3 className='menu_header'>Box Text</h3>
                <div className='title_editor'>
                  <div className='display_title'>
                    <div className='display_title_check'>
                      <input
                        type='checkbox'
                        checked={selectedTileDetail.displayTitle}
                        onChange={displayTitle}
                      />
                      <label>Display Text</label>
                    </div>
                    <div className='position'>
                      <select value={selectedTileDetail.titleX} onChange={handleChangePositionX}>
                        <option value={1}>Left</option>
                        <option value={2}>Center</option>
                        <option value={3}>Right</option>
                      </select>
                      <select value={selectedTileDetail.titleY} onChange={handleChangePositionY}>
                        <option value={1}>Top</option>
                        <option value={2}>Center</option>
                        <option value={3}>Bottom</option>
                      </select>
                    </div>
                  </div>
                  <Image
                    src={text}
                    alt='TEXT'
                    onClick={() => setEditorOpen(true)}
                    className='text-editor-image'
                  />
                </div>
              </li>
            </ul>
            <div className='line_break'></div>
            <div className='menu_action'>
              <div>
                <div className='delete_duplicate_action'>
                  <span onClick={() => tileClone(selectedTile)}>
                    <DifferenceOutlinedIcon />
                  </span>
                  <span onClick={() => tileClone(selectedTile)}>Duplicate</span>
                </div>
                <div className='delete_duplicate_action'>
                  <span onClick={() => deleteTile(selectedTile)}>
                    <DeleteOutlineIcon />
                  </span>
                  <span onClick={() => deleteTile(selectedTile)}>Delete</span>
                </div>
              </div>
              <div
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingRight: '25px'
                }}
              >
                <Button
                  className='button_cancel'
                  sx={{ color: '#63899e', marginRight: '3px' }}
                  onClick={() => {
                    setShowModel(false);
                    setColorBackground(null);
                    setFormValue({});
                    setSelectedTile(null);
                    setImageFileName(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className='button_filled'
                  sx={{
                    background: '#63899e',
                    color: '#fff',
                    '&:hover': { backgroundColor: '#63899e', opacity: 0.8 }
                  }}
                  onClick={() => handleSave(selectedTile)}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </Dialog>

        <Dialog maxWidth={'md'} open={editorOpen}>
          <DialogContent
            sx={{
              height: '540px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <TipTapMainEditor
                initialContent={formValue.tileText || selectedTileDetail.tileText || ''}
                onContentChange={html => enterText(html)}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <div
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                paddingRight: '25px'
              }}
            >
              <Button onClick={() => setEditorOpen(false)} sx={{ color: '#63899e' }}>
                Close
              </Button>
              <Button
                onClick={saveEditorText}
                sx={{
                  background: '#63899e',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#63899e', opacity: 0.8 }
                }}
              >
                Save
              </Button>
            </div>
          </DialogActions>
        </Dialog>

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
    </>
  );
});

export default MobileGridTiles;
