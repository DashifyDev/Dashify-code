'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import '../styles/styles.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { globalContext } from '@/context/globalContext';
import isDblTouchTap from '@/hooks/isDblTouchTap';
import { dashboardKeys } from '@/hooks/useDashboard';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TuneIcon from '@mui/icons-material/Tune';
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
  const [imagePreview, setImagePreview] = useState(null);
  const [formValue, setFormValue] = useState({});
  const [openTextEditor, setOpenTextEdior] = useState(false);
  const [selectedTileDetail, setSelectedTileDetail] = useState({});
  const [textEditorContent, setTextEditorContent] = useState();
  const [editorLabel, setEditorLabel] = useState();
  const [colorBackground, setColorBackground] = useState();
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentTileIndex, setCurrentTileIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false); // Ref to track dragging state for use in timeouts
  const [isResizing, setIsResizing] = useState(false);
  const [editingTileId, setEditingTileId] = useState(null); // Tile in edit mode (after click)
  const [collapsedSections, setCollapsedSections] = useState({
    background: true, // Only first section open by default
    textDisplay: false,
    action: true, 
    order: true
  });
  const { dbUser } = useContext(globalContext);
  const queryClient = useQueryClient();
  const hiddenFileInput = useRef(null);
  const containerRef = useRef(null);
  const batchUpdateTimeoutRef = useRef(null);
  const pendingBatchUpdatesRef = useRef([]);
  const initialDragStateRef = useRef(null); // Store initial state when drag starts
  const isInitialMountRef = useRef(true); // Track if component just mounted
  const settingsModalRef = useRef(null); // Ref for settings modal
  const editorModalRef = useRef(null); // Ref for editor modal
  const initialEditorViewportHeight = useRef(null); // Store initial viewport height for editor modal

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

  // Batch update function with debounce
  const performBatchUpdate = useCallback(
    updates => {
      if (!dbUser || updates.length === 0) return;

      // Clear any pending timeout
      if (batchUpdateTimeoutRef.current) {
        clearTimeout(batchUpdateTimeoutRef.current);
      }

      // Add updates to pending queue
      pendingBatchUpdatesRef.current = [...pendingBatchUpdatesRef.current, ...updates];

      // Debounce: wait 300ms before sending batch request
      batchUpdateTimeoutRef.current = setTimeout(() => {
        const updatesToSend = [...pendingBatchUpdatesRef.current];
        pendingBatchUpdatesRef.current = [];

        // Prepare batch update payload
        const batchPayload = updatesToSend.map(update => ({
          tileId: update.tileId,
          data: update.data
        }));

        // Send single batch request
        axios
          .post('/api/tile/batch-update', { updates: batchPayload })
          .then(res => {
            // Update cache in the next tick to avoid blocking UI
            // This keeps data in sync without causing white screen
            Promise.resolve().then(() => {
              if (res.data && res.data.results && Array.isArray(res.data.results)) {
                // Create a map of updated tiles
                const updatedTilesMap = new Map();
                res.data.results.forEach(result => {
                  if (result && result.data && result.tileId) {
                    updatedTilesMap.set(String(result.tileId), result.data);
                  }
                });

                // Update React Query cache
                queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
                  if (!oldData) return oldData;

                  // Ensure tiles is always an array
                  const currentTiles = Array.isArray(oldData.tiles) ? oldData.tiles : [];

                  // Update tiles array - merge with existing to preserve order
                  const updatedTiles = currentTiles.map(t => {
                    if (!t || typeof t !== 'object') return t;
                    const tileId = String(t._id || t.id || '');
                    const updated = updatedTilesMap.get(tileId);
                    // Merge updated data with existing tile to preserve all properties
                    return updated ? { ...t, ...updated } : t;
                  });

                  return {
                    ...oldData,
                    tiles: Array.isArray(updatedTiles) ? updatedTiles : []
                  };
                });

                // Update local tileCordinates state to sync with server response
                setTileCordinates(currentTiles => {
                  if (!Array.isArray(currentTiles)) return currentTiles;
                  
                  return currentTiles.map(t => {
                    if (!t || typeof t !== 'object') return t;
                    const tileId = String(t._id || t.id || '');
                    const updated = updatedTilesMap.get(tileId);
                    // Merge updated data with existing tile to preserve all properties
                    return updated ? { ...t, ...updated } : t;
                  });
                });
              }
            });
          })
          .catch(() => {
            // Error in batch update
          });
      }, 300); // 300ms debounce
    },
    [dbUser, activeBoard, queryClient, setTileCordinates]
  );

  // Handle list update (only for local state, no API calls)
  const handleListUpdate = useCallback(
    newList => {
      // Skip if this is initial mount (ReactSortable may call setList on mount)
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        return;
      }

      // Only update if we're actually dragging (check if initialDragStateRef is set)
      if (!initialDragStateRef.current) {
        return;
      }

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
    },
    [setTileCordinates]
  );

  // Handle drag end - send batch update only if order actually changed
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;

    // Check if order actually changed by comparing with initial state
    if (!initialDragStateRef.current) {
      return;
    }

    // Use functional update to get the latest tileCordinates state
    setTileCordinates(currentTiles => {
      // Sort them by order to get current state
      const sortedTiles = [...currentTiles].sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        const yA = a.mobileY ?? 0;
        const yB = b.mobileY ?? 0;
        return yA - yB;
      });

      const initialOrder = initialDragStateRef.current.map(t => String(t._id));
      const currentOrder = sortedTiles.map(t => String(t._id));

      // Check if order changed
      const orderChanged =
        initialOrder.length !== currentOrder.length ||
        initialOrder.some((id, index) => id !== currentOrder[index]);

      if (!orderChanged) {
        // Order didn't change, no need to save
        initialDragStateRef.current = null;
        return currentTiles; // Return unchanged
      }

      // Order changed - prepare batch update
      if (dbUser) {
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

        // Recalculate positions for all tiles based on current sorted order
        const updatedTiles = sortedTiles.map((tile, index) => {
          let newY = 0;
          for (let i = 0; i < index; i++) {
            const prevTile = sortedTiles[i];
            const prevHeight = parseInt(prevTile.mobileHeight || prevTile.height || '150', 10);
            newY += prevHeight + 16;
          }

          return {
            ...tile,
            mobileX: 0,
            mobileY: newY,
            mobileWidth: `${windowWidth - 48}px`,
            order: index + 1
          };
        });

        // Prepare batch updates
        const batchUpdates = updatedTiles
          .filter(tile => !String(tile._id).startsWith('temp_')) // Skip temporary tiles
          .map(tile => ({
            tileId: tile._id,
            data: {
              mobileX: tile.mobileX,
              mobileY: tile.mobileY,
              // mobileWidth: tile.mobileWidth,
              order: tile.order
            }
          }));

        if (batchUpdates.length > 0) {
          performBatchUpdate(batchUpdates);
        }

        // Clear initial state
        initialDragStateRef.current = null;

        return updatedTiles;
      } else {
        // Guest user - update localStorage
        updateTilesInLocalstorage(sortedTiles);

        // Clear initial state
        initialDragStateRef.current = null;

        return currentTiles;
      }
    });
  }, [dbUser, setTileCordinates, updateTilesInLocalstorage, performBatchUpdate]);

  // Handle vertical resize (height only on mobile)
  const handleHeightResize = useCallback(
    (tileId, newHeight, isTopResize = false) => {
      // Find the tile being resized - use String comparison to handle different ID types
      // Support both real _id and temporary IDs (temp_*)
      const currentTile = tileCordinates.find(t => String(t._id || '') === String(tileId));

      if (!currentTile) {
        return;
      }

      const sortedIndex = sortedTiles.findIndex(t => String(t._id) === String(tileId));
      if (sortedIndex < 0) {
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
          // Real tile ID - prepare batch update for all affected tiles
          const resizedTile = updatedTiles.find(t => String(t._id) === String(tileId));
          if (!resizedTile) return;

          // Find all tiles that need to be updated (resized tile + tiles after it with changed Y positions)
          const originalTiles = tileCordinates;
          const batchUpdates = [];

          // Add resized tile
          batchUpdates.push({
            tileId: resizedTile._id,
            data: {
              mobileHeight: resizedTile.mobileHeight,
              mobileY: resizedTile.mobileY
            }
          });

          // Add all tiles after resized one that have changed Y positions
          for (let i = sortedIndex + 1; i < sortedTiles.length; i++) {
            const tile = sortedTiles[i];
            const updatedTile = updatedTiles.find(t => String(t._id) === String(tile._id));
            const originalTile = originalTiles.find(t => String(t._id) === String(tile._id));

            if (updatedTile && originalTile) {
              // Check if Y position or width changed
              if (
                updatedTile.mobileY !== originalTile.mobileY 
                // updatedTile.mobileWidth !== originalTile.mobileWidth
              ) {
                batchUpdates.push({
                  tileId: updatedTile._id,
                  data: {
                    mobileY: updatedTile.mobileY,
                    // mobileWidth: updatedTile.mobileWidth
                  }
                });
              }
            }
          }

          // Use batch update if there are multiple tiles to update, otherwise use single update
          if (batchUpdates.length > 1) {
            performBatchUpdate(batchUpdates);
          } else if (batchUpdates.length === 1) {
            // Single update - use batch update anyway for consistency
            performBatchUpdate(batchUpdates);
          }
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
      updateTilesInLocalstorage,
      performBatchUpdate
    ]
  );

  const style = useCallback(tile => {
    const isImageBackground = tile.tileBackground ? isBackgroundImage(tile.tileBackground) : false;

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    // Increased side padding: 24px on each side (48px total) instead of 16px (32px total)
    // Margin is 24px on each side = 48px total, so width should be windowWidth - 48px
    const maxWidth = windowWidth - 48;
    
    // Parse mobileWidth if it exists, otherwise use default
    let widthValue = maxWidth;

    const width = `${widthValue}px`;

    // If user has manually set mobileHeight (exists and is not null/undefined), use fixed height
    // Otherwise, use min-height to allow content to expand naturally
    const hasCustomHeight = tile.mobileHeight != null && tile.mobileHeight !== '';
    const defaultMinHeight = '150px';

    // If mobileHeight is set, always use it (user manually resized via drag OR desktop height > 200px)
    // Desktop blocks with height > 200px automatically get mobileHeight set to desktop height
    // If user manually resized, respect their choice regardless of size
    let effectiveHeight = null;
    if (hasCustomHeight) {
      // Parse height value (handle both "200px" strings and numbers)
      const heightStr = String(tile.mobileHeight).replace('px', '');
      const heightValue = parseInt(heightStr, 10);
      // If height is valid, use it (no size limit - supports both manual resize and large desktop heights)
      if (!isNaN(heightValue) && heightValue > 0) {
        effectiveHeight = tile.mobileHeight;
      }
    }

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

    if (effectiveHeight) {
      // User has manually resized with reasonable height - use fixed height
      styleObj.height = effectiveHeight;
    } else {
      // Default - use min-height to allow content to expand naturally
      styleObj.minHeight = defaultMinHeight;
    }

    return styleObj;
  }, [window]);

  const changedTitlehandle = tile => {
    let tileText = tile.tileText;
    let content = tileText;

    if (tileText) {
      if (tileText === '<div><br></div>' || tileText === '<div></div>') {
        content = '';
      }
    }

    const titleVal =
      content && tile.displayTitle ? tileText : !content && tile.displayTitle ? ' <div style="font-size: 16px;">New Box</div>' : '';
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
    } else if ((e.type === 'touchstart' || e.detail == 2) && action == 'textDisplay') {
      // Open Text Display editor directly
      const currentTile = sortedTiles[index];
      setCurrentTileIndex(index);
      setSelectedTile(index);
      setSelectedTileDetail(currentTile);
      setFormValue({ tileText: currentTile.tileText || '' });
      setEditorOpen(true);
    }
  };

  const openModel = (e, index) => {
    e.stopPropagation();
    setShowModel(true);
    setSelectedTile(index);
    setSelectedTileDetail(sortedTiles[index]);
    currentBackground(sortedTiles[index]);
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
    const newOrder = payload.order;
    const currentOrder = items[tileIndex].order;

    // Recalculate order for all tiles if order was changed
    if (newOrder !== undefined && newOrder !== null && newOrder > 0) {
      const hasCurrentOrder =
        currentOrder !== undefined && currentOrder !== null && currentOrder > 0;

      // Update order for all tiles to avoid duplicates
      const updatedTiles = items.map(tile => {
        // Skip the tile being edited
        if (String(tile._id) === String(tileId)) {
          return { ...tile, order: newOrder };
        }

        const tileOrder = tile.order;
        const hasTileOrder = tileOrder !== undefined && tileOrder !== null && tileOrder > 0;

        // If the edited tile didn't have an order (new tile or order was 0/null)
        if (!hasCurrentOrder) {
          // Shift tiles with order >= newOrder up by 1 to make space
          if (hasTileOrder && tileOrder >= newOrder) {
            return { ...tile, order: tileOrder + 1 };
          }
        }
        // If moving to a lower order (e.g., from 4 to 2)
        else if (newOrder < currentOrder) {
          // Shift tiles with order >= newOrder and < currentOrder up by 1
          if (hasTileOrder && tileOrder >= newOrder && tileOrder < currentOrder) {
            return { ...tile, order: tileOrder + 1 };
          }
        }
        // If moving to a higher order (e.g., from 2 to 4)
        else if (newOrder > currentOrder) {
          // Shift tiles with order > currentOrder and <= newOrder down by 1
          if (hasTileOrder && tileOrder > currentOrder && tileOrder <= newOrder) {
            return { ...tile, order: tileOrder - 1 };
          }
        }
        // If order stays the same, no changes needed
        return tile;
      });

      items = updatedTiles;
      setTileCordinates(updatedTiles);
    }
    setFormValue({});
    setImageFileName(null);
    setColorBackground(null);
    setShowModel(false);
    if (dbUser) {
      // Save the main tile first
      axios.patch(`/api/tile/${tileId}`, formData).then(res => {
        if (
          selectedTile === null ||
          selectedTile === undefined ||
          selectedTile < 0 ||
          selectedTile >= sortedTiles.length
        ) {
          return;
        }

        // Find the updated tile index again (in case items array was modified)
        const updatedTileIndex = items.findIndex(t => String(t._id) === String(tileId));
        if (updatedTileIndex < 0) {
          return;
        }

        // Update the tile with server response
        items[updatedTileIndex] = { ...items[updatedTileIndex], ...res.data };
        setTileCordinates(items);

        // Update React Query cache to sync with desktop
        queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(tile =>
              String(tile._id) === String(tileId) ? res.data : tile
            )
          };
        });

        // Invalidate queries to ensure desktop gets updated data
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(activeBoard)
        });

        // Save order for all tiles that have an order value and were affected by the recalculation
        const orderUpdatePromises = items
          .filter(tile => {
            // Skip temporary IDs and the tile we just saved (it's already saved above)
            if (String(tile._id).startsWith('temp_') || String(tile._id) === String(tileId)) {
              return false;
            }
            // Only update tiles that have a valid order value (> 0)
            return tile.order !== undefined && tile.order !== null && tile.order > 0;
          })
          .map(tile => {
            const orderFormData = new FormData();
            orderFormData.append('formValue', JSON.stringify({ order: tile.order }));
            return axios.patch(`/api/tile/${tile._id}`, orderFormData).then(res => ({
              tileId: tile._id,
              data: res.data
            }));
          });

        // Update all affected tiles
        if (orderUpdatePromises.length > 0) {
          Promise.all(orderUpdatePromises)
            .then(responses => {
              const updatedItems = [...items];
              responses.forEach(({ tileId, data }) => {
                const updateIndex = updatedItems.findIndex(t => String(t._id) === String(tileId));
                if (updateIndex >= 0 && data) {
                  updatedItems[updateIndex] = { ...updatedItems[updateIndex], ...data };
                }
              });
              setTileCordinates(updatedItems);

              queryClient.setQueryData(dashboardKeys.detail(activeBoard), oldData => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  tiles: (Array.isArray(oldData.tiles) ? oldData.tiles : []).map(tile => {
                    const updated = updatedItems.find(t => String(t._id) === String(tile._id));
                    return updated || tile;
                  })
                };
              });
            })
            .catch(err => {
              // Error updating tile orders
            });
        }

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

          // Find the updated tile index again (in case items array was modified by order recalculation)
          const updatedTileIndex = items.findIndex(t => String(t._id) === String(tileId));
          if (updatedTileIndex < 0) {
            setSelectedTile(null);
            return;
          }

          let item = { ...items[updatedTileIndex], ...updatedData };
          items[updatedTileIndex] = item;
          setTileCordinates(items);
          updateTilesInLocalstorage(items);
          setSelectedTile(null);
        };
        reader.readAsDataURL(formValue.tileBackground);
      } else {
        let updatedData = JSON.parse(formData.get('formValue'));

        // Find the updated tile index again (in case items array was modified by order recalculation)
        const updatedTileIndex = items.findIndex(t => String(t._id) === String(tileId));
        if (updatedTileIndex < 0) {
          setSelectedTile(null);
          return;
        }

        let item = { ...items[updatedTileIndex], ...updatedData };
        items[updatedTileIndex] = item;
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
    // Get the order of the tile being deleted
    const deletedOrder = items[tileIndex].order;
    setShowModel(false);

    if (dbUser) {
      // Create a new array instead of mutating the existing one
      let updatedItems = items.filter((_, i) => i !== tileIndex);

      // Recalculate orders for tiles that come after the deleted one
      updatedItems = updatedItems.map(tile => {
        if (tile.order && tile.order > deletedOrder) {
          return { ...tile, order: tile.order - 1 };
        }
        return tile;
      });

      // Use setTileCordinates which will call handleTileUpdate and update React Query cache
      // This ensures single source of truth
      setTileCordinates(updatedItems);

      // Find tiles that need order updates
      const tilesToUpdate = updatedItems.filter(tile => tile.order && tile.order > deletedOrder);

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
              .catch(() => {
                // Error updating tile orders
              });
          }
          // React Query cache already updated by handleTileUpdate via setTileCordinates
        })
        .catch(() => {
          // Revert optimistic update on error
          setTileCordinates(items);
          queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(activeBoard) });
        });
    } else {
      // Create a new array instead of mutating the existing one
      let updatedItems = items.filter((_, i) => i !== tileIndex);

      // Recalculate orders for tiles that come after the deleted one
      updatedItems = updatedItems.map(tile => {
        if (tile.order && tile.order > deletedOrder) {
          return { ...tile, order: tile.order - 1 };
        }
        return tile;
      });

      // Use setTileCordinates which will call handleTileUpdate and update React Query cache
      // This ensures single source of truth - same as for authenticated users
      setTileCordinates(updatedItems);
      updateTilesInLocalstorage(updatedItems);

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

  const tileClone = index => {
    const content = sortedTiles[index];
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

    // Use the same positioning logic as addTiles
    // Count only tiles that are user-created (not the default welcome tile)
    // Filter out tiles with width > 200px (default welcome tile is 600px)
    const userCreatedTiles = tileCordinates.filter(tile => {
      const tileWidth = parseInt(tile.width || '0', 10);
      return tileWidth <= 200; // Only count small tiles, not the default welcome tile
    });

    // Calculate mobileY based on userCreatedTiles to ensure proper stacking from top
    const mobileY = userCreatedTiles.length * 166; // Position based on user-created tiles count
    const mobileWidth = `${windowWidth - 48}px`;

    // Get the order of the original tile
    const originalOrder = content.order || 0;
    // New tile always gets order = originalOrder + 1
    // All tiles with order > originalOrder will be shifted by +1
    const newOrder = originalOrder + 1;

    const newTile = {
      ...content,
      mobileX: 0,
      mobileY: mobileY,
      mobileWidth: mobileWidth,
      // Only copy mobileHeight if it was manually set (not default)
      // If content had mobileHeight set, keep it; otherwise don't set it (use min-height)
      ...(content.mobileHeight ? { mobileHeight: content.mobileHeight } : {}),
      order: newOrder
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
          .catch(() => {
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
    // Get the current tile from sortedTiles using currentTileIndex
    if (
      currentTileIndex === null ||
      currentTileIndex === undefined ||
      currentTileIndex < 0 ||
      currentTileIndex >= sortedTiles.length
    ) {
      setEditorOpen(false);
      return;
    }

    const currentTile = sortedTiles[currentTileIndex];
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
  const singleClickTimer = useRef(null);
  const isDoubleTap = useRef(false);
  const lastDoubleTapTime = useRef(0); // Track when double tap occurred
  const lastEditModeExitTime = useRef(0); // Track when edit mode was exited via click

  const handleClick = (tileId) => {
    // Don't handle click on interactive elements
    if (!tileId) return;
    
    // If it was a double tap, don't handle single click - exit early
    if (isDoubleTap.current) {
      isDoubleTap.current = false;
      hasMoved.current = false;
      // Clear single click timer if exists
      if (singleClickTimer.current) {
        clearTimeout(singleClickTimer.current);
        singleClickTimer.current = null;
      }
      return;
    }
    
    // If clicking on a different tile, clear single click timer
    if (editingTileId && editingTileId !== String(tileId)) {
      if (singleClickTimer.current) {
        clearTimeout(singleClickTimer.current);
        singleClickTimer.current = null;
      }
    }
    
    // If already in edit mode for this tile, don't handle click
    if (editingTileId === String(tileId)) {
      hasMoved.current = false;
      return;
    }
    
    // If user moved, don't handle single click
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }
    
    // Handle single click - enter edit mode after a short delay
    // This delay allows us to detect if it's actually a double tap
    // Don't set timer if there was a recent double tap (within last 500ms)
    // Don't set timer if edit mode was just exited via click (within last 300ms)
    const timeSinceDoubleTap = Date.now() - lastDoubleTapTime.current;
    const timeSinceEditModeExit = Date.now() - lastEditModeExitTime.current;
    if (editingTileId !== String(tileId) && timeSinceDoubleTap > 500 && timeSinceEditModeExit > 300) {
      const currentTileId = String(tileId);
      singleClickTimer.current = setTimeout(() => {
        const timeSinceDoubleTap = Date.now() - lastDoubleTapTime.current;
        const timeSinceEditModeExit = Date.now() - lastEditModeExitTime.current;
        // Check again if it wasn't a double tap, no recent double tap, and edit mode wasn't just exited
        if (!isDoubleTap.current && !hasMoved.current && timeSinceDoubleTap > 500 && timeSinceEditModeExit > 300) {
          // Use functional update to check current state
          const finalTimeSinceDoubleTap = Date.now() - lastDoubleTapTime.current;
          const finalTimeSinceEditModeExit = Date.now() - lastEditModeExitTime.current;
          setEditingTileId(current => {
            // Only set if not already in edit mode, not a double tap, no recent double tap, and edit mode wasn't just exited
            if (current !== currentTileId && !isDoubleTap.current && finalTimeSinceDoubleTap > 500 && finalTimeSinceEditModeExit > 300) {
              // Haptic feedback if available
              if (navigator.vibrate) {
                navigator.vibrate(50);
              }
              return currentTileId;
            }
            return current;
          });
        }
        isDoubleTap.current = false;
        hasMoved.current = false;
      }, 300); // Wait 300ms to detect double tap
    }
    
    hasMoved.current = false;
  };

  // Cleanup batch update timeout on unmount
  useEffect(() => {
    return () => {
      if (batchUpdateTimeoutRef.current) {
        clearTimeout(batchUpdateTimeoutRef.current);
      }
      if (singleClickTimer.current) {
        clearTimeout(singleClickTimer.current);
      }
      // Send any pending updates before unmount
      if (pendingBatchUpdatesRef.current.length > 0 && dbUser) {
        const updatesToSend = [...pendingBatchUpdatesRef.current];
        pendingBatchUpdatesRef.current = [];
        const batchPayload = updatesToSend.map(update => ({
          tileId: update.tileId,
          data: update.data
        }));
        axios.post('/api/tile/batch-update', { updates: batchPayload }).catch(() => {
          // Error sending final batch update
        });
      }
    };
  }, [dbUser]);

  // Exit edit mode when clicking anywhere (except resize handles and settings button)
  useEffect(() => {
    let clickTimeoutId = null;

    const handleClickOutside = e => {
      if (!editingTileId) return;

      // Don't exit edit mode if dragging is in progress
      if (isDragging) {
        return;
      }

      const target = e.target;

      // Don't exit if clicking on resize handles or settings button
      if (target.closest('.resize-handle') || target.closest('.drag-handle')) {
        return;
      }

      // Don't exit if clicking on the tile that is in edit mode (might be start of drag)
      // Give drag a chance to start before exiting edit mode
      const clickedTile = target.closest('[data-tile-id]');
      if (clickedTile) {
        const clickedTileId = clickedTile.getAttribute('data-tile-id');
        const currentEditingTileId = editingTileId; // Capture current value
        if (clickedTileId === currentEditingTileId) {
          // Clear any existing timeout
          if (clickTimeoutId) {
            clearTimeout(clickTimeoutId);
          }
          // Use a small delay to allow drag to start
          clickTimeoutId = setTimeout(() => {
            // Only exit if drag didn't start and edit mode is still active for this tile
            setEditingTileId(current => {
              if (!isDraggingRef.current && current === currentEditingTileId) {
                lastEditModeExitTime.current = Date.now();
                return null;
              }
              return current;
            });
            clickTimeoutId = null;
          }, 500);
          return;
        }
      }

      // Exit edit mode when clicking anywhere (including the same tile)
      lastEditModeExitTime.current = Date.now(); // Record when edit mode was exited
      setEditingTileId(null);
    };

    if (editingTileId) {
      // Use a small delay to avoid immediate exit 2when entering edit mode
      const timeoutId = setTimeout(() => {
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (clickTimeoutId) {
          clearTimeout(clickTimeoutId);
        }
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editingTileId, isDragging]);

  // Sync currentTileIndex with selectedTile when editor opens and initialize content
  useEffect(() => {
    if (editorOpen && selectedTile !== null && selectedTile !== undefined) {
      setCurrentTileIndex(selectedTile);
      // Initialize selectedTileDetail and formValue with current tile data
      if (selectedTile >= 0 && selectedTile < sortedTiles.length) {
        const currentTile = sortedTiles[selectedTile];
        setSelectedTileDetail(currentTile);
        setFormValue({ tileText: currentTile.tileText || '' });
      }
    }
  }, [editorOpen, selectedTile, sortedTiles]);

  // Sync content when currentTileIndex changes in editor
  useEffect(() => {
    if (editorOpen && currentTileIndex !== null && currentTileIndex !== undefined) {
      if (currentTileIndex >= 0 && currentTileIndex < sortedTiles.length) {
        const currentTile = sortedTiles[currentTileIndex];
        // Only update if tile data is different to avoid unnecessary re-renders
        if (!selectedTileDetail._id || selectedTileDetail._id !== currentTile._id) {
          setSelectedTileDetail(currentTile);
          setFormValue({ tileText: currentTile.tileText || '' });
        }
      }
    }
  }, [editorOpen, currentTileIndex, sortedTiles]);

  // Fix height for editor modal - store initial viewport height
  useEffect(() => {
    if (!editorOpen) {
      initialEditorViewportHeight.current = null;
      return;
    }

    // Store initial viewport height when modal opens (before keyboard appears)
    if (!initialEditorViewportHeight.current) {
      initialEditorViewportHeight.current = window.innerHeight;
    }

    if (!editorModalRef.current) return;

    const setModalHeight = () => {
      if (editorModalRef.current) {
        // Use stored initial height or current height, whichever is larger
        // This prevents modal from shrinking when keyboard appears
        const currentHeight = window.innerHeight;
        const heightToUse = initialEditorViewportHeight.current || currentHeight;
        
        editorModalRef.current.style.height = `${heightToUse}px`;
      }
    };

    setModalHeight();
    
    // Only update on orientation change, not on resize (to avoid keyboard resize)
    const handleOrientationChange = () => {
      initialEditorViewportHeight.current = window.innerHeight;
      setModalHeight();
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [editorOpen]);

  // Fix height for iOS Safari - Settings Modal
  useEffect(() => {
    if (!showModel || !settingsModalRef.current) return;

    const setModalHeight = () => {
      if (settingsModalRef.current) {
        // Use window.innerHeight for iOS Safari compatibility
        const vh = window.innerHeight * 0.01;
        settingsModalRef.current.style.setProperty('--vh', `${vh}px`);
        settingsModalRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    setModalHeight();
    window.addEventListener('resize', setModalHeight);
    window.addEventListener('orientationchange', setModalHeight);

    return () => {
      window.removeEventListener('resize', setModalHeight);
      window.removeEventListener('orientationchange', setModalHeight);
    };
  }, [showModel]);


  return (
    <>
      {/* Edit mode badge - shown at top of page under header */}
      {editingTileId && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '28px',
            transform: 'translateX(-50%)',
            background: 'rgba(99, 137, 158, 0.6)',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: '36px',
            fontSize: '15px',
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(99, 137, 158, 0.3)',
            pointerEvents: 'none',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          <EditIcon
            style={{
              fontSize: 20,
              color: '#fff'
            }}
          />
          Edit Mode Enabled
        </div>
      )}
      <div
        ref={containerRef}
        className='mobile-grid-container'
        style={{ paddingBottom: '24px', paddingTop: '24px' }}
      >
        <ReactSortable
          list={sortedTiles}
          setList={handleListUpdate}
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

            // Store initial state before drag starts
            initialDragStateRef.current = [...tileCordinates];
            setIsDragging(true);
            isDraggingRef.current = true;
          }}
          onEnd={() => {
            handleDragEnd();
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

                  // Reset double tap flag
                  isDoubleTap.current = false;

                  // Store initial touch position for movement detection
                  const touch = e.touches?.[0];
                  if (touch) {
                    longPressStartPos.current = { x: touch.clientX, y: touch.clientY };
                    hasMoved.current = false;
                  }

                  // Track movement during touch
                  const handleMove = moveEvent => {
                    const currentTouch = moveEvent.touches?.[0];
                    if (currentTouch && longPressStartPos.current) {
                      const deltaX = Math.abs(currentTouch.clientX - longPressStartPos.current.x);
                      const deltaY = Math.abs(currentTouch.clientY - longPressStartPos.current.y);
                      // If moved more than 10px, mark as moved (user is scrolling)
                      if (deltaX > 10 || deltaY > 10) {
                        hasMoved.current = true;
                        document.removeEventListener('touchmove', handleMove);
                      }
                    }
                  };

                  document.addEventListener('touchmove', handleMove, { passive: true });

                  // Handle double tap for actions
                  if (isDblTouchTap(e)) {
                    isDoubleTap.current = true;
                    lastDoubleTapTime.current = Date.now(); // Record double tap time
                    // Clear single click timer if exists
                    if (singleClickTimer.current) {
                      clearTimeout(singleClickTimer.current);
                      singleClickTimer.current = null;
                    }
                    // Exit edit mode if it was activated
                    if (editingTileId === String(tile._id)) {
                      setEditingTileId(null);
                    }
                    document.removeEventListener('touchmove', handleMove);
                    onDoubleTap(e, tile.action, tile.tileContent, tile, index);
                  } else {
                    // Remove listener on touch end
                    const handleEnd = () => {
                      document.removeEventListener('touchmove', handleMove);
                    };
                    e.target.addEventListener('touchend', handleEnd, { once: true });
                  }
                }}
                onTouchEnd={() => {
                  handleClick(tile._id);
                }}
                onTouchCancel={() => {
                  // Clear single click timer on cancel
                  if (singleClickTimer.current) {
                    clearTimeout(singleClickTimer.current);
                    singleClickTimer.current = null;
                  }
                  hasMoved.current = false;
                }}
                onClick={e => {
                  // Don't handle if resizing or clicking on interactive elements
                  if (isResizing) return;
                  const target = e.target;
                  if (target.closest('.resize-handle') || target.closest('.drag-handle')) {
                    return;
                  }
                  handleClick(tile._id);
                }}
                onDoubleClick={e => {
                  if (isResizing) return;
                  const target = e.target;
                  if (target.closest('.resize-handle') || target.closest('.drag-handle')) {
                    return;
                  }
                  isDoubleTap.current = true;
                  lastDoubleTapTime.current = Date.now(); // Record double tap time
                  // Clear single click timer if exists
                  if (singleClickTimer.current) {
                    clearTimeout(singleClickTimer.current);
                    singleClickTimer.current = null;
                  }
                  // Exit edit mode if it was activated
                  if (editingTileId === String(tile._id)) {
                    setEditingTileId(null);
                  }
                  onDoubleTap(e, tile.action, tile.tileContent, tile, index);
                }}
              >
                {/* Drag handle indicator - shows when tile is in edit mode */}
                {isEditing && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 137, 158, 0.1)',
                      pointerEvents: 'none',
                      backdropFilter: 'blur(3px)',
                      WebkitBackdropFilter: 'blur(3px)'
                    }}
                  >
                    <svg
                      width='20'
                      height='20'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                      style={{ color: '#63899e' }}
                    >
                      <circle cx='9' cy='5' r='1.5' />
                      <circle cx='9' cy='12' r='1.5' />
                      <circle cx='9' cy='19' r='1.5' />
                      <circle cx='15' cy='5' r='1.5' />
                      <circle cx='15' cy='12' r='1.5' />
                      <circle cx='15' cy='19' r='1.5' />
                    </svg>
                  </div>
                )}

                {/* Settings button - opens tile settings modal */}
                {isEditing && (<div
                  className='drag-handle'
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '8px',
                    padding: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 137, 158, 0.1)',
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    openModel(e, index);
                  }}
                  onTouchStart={e => {
                    e.stopPropagation();
                    // Prevent drag when clicking settings button
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(99, 137, 158, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 137, 158, 0.1)';
                  }}
                >
                  <TuneIcon style={{ fontSize: '20px', color: '#63899e' }} />
                </div>)}

                {/* Resize handle for top edge - only visible in edit mode */}
                

                {/* Resize handle for bottom edge - only visible in edit mode */}
                {isEditing && (
                  <div
                    className='resize-handle resize-handle-bottom'
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      width: '100%',
                      height: '42px', // 32-44px total tap area
                      cursor: 'ns-resize',
                      zIndex: 15,
                      touchAction: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)', // Semi-transparent white background for backdrop-filter
                      borderBottomLeftRadius: '10px',
                      borderBottomRightRadius: '10px',
                      borderTopLeftRadius: '0',
                      borderTopRightRadius: '0',
                      boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(99, 137, 158, 0.15)',
                      backdropFilter: 'blur(3px)',
                      WebkitBackdropFilter: 'blur(3px)',
                      transition: 'all 0.2s ease'
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
                        // setEditingTileId(null);
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
                  >
                    {/* Visual indicator - resize icons (up and down arrows) */}
                    <div
                      className='resize-handle-arrows'
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '-4px',
                        pointerEvents: 'none',
                        lineHeight: 0
                      }}
                    >
                      <KeyboardArrowUpIcon
                        className='resize-handle-arrow-up'
                        style={{
                          fontSize: '24px',
                          color: '#63899e', // Theme color for better contrast with white background
                          pointerEvents: 'none',
                          marginBottom: '-4px'
                        }}
                      />
                      <KeyboardArrowDownIcon
                        className='resize-handle-arrow-down'
                        style={{
                          fontSize: '24px',
                          color: '#63899e', // Theme color for better contrast with white background
                          pointerEvents: 'none',
                          marginTop: '-4px'
                        }}
                      />
                    </div>
                  </div>
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

        {/* Tiles Property Model */}
        {showModel && (
          <>
            {/* Backdrop */}
            <div
              className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-all duration-300 ease-in-out'
              onClick={() => {
                setShowModel(false);
                setColorBackground(null);
                setFormValue({});
                setSelectedTile(null);
                setImageFileName(null);
              }}
            />

            {/* Modal */}
            <div className='fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none'>
              <div
                ref={settingsModalRef}
                className='bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] max-h-screen flex flex-col pointer-events-auto transform transition-all duration-300 ease-in-out overflow-hidden'
                onClick={e => e.stopPropagation()}
                style={{
                  height: typeof window !== 'undefined' && window.innerWidth < 640 
                    ? `${window.innerHeight}px` 
                    : undefined
                }}
              >
                {/* Header */}
                <div className='flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-[#63899e]/10 to-[#4a6d7e]/10 backdrop-blur-sm flex-shrink-0'>
                  <h2 className='text-lg font-bold text-[#63899e]'>Box Settings</h2>
                  <button
                    onClick={() => {
                      setShowModel(false);
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
                <div className='flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-4 sm:pb-6 space-y-6 min-h-0'>
                  {/* Box Text Display - Moved up */}
                  <div className='space-y-3 mt-6'>
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
                        <div>
                          <ColorPicker
                            handleColorChange={handleColorChange}
                            colorBackground={colorBackground}
                          />
                        </div>
                      )}
                      {selectedTileDetail.backgroundAction === 'image' && (
                        <div className='flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                          <div
                            className='relative w-16 h-16 rounded-lg border-2 border-dashed border-[#63899e]/40 hover:border-[#63899e] hover:bg-[#63899e]/5 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden bg-white flex items-center justify-center group'
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
                                  className='ml-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200'
                                />
                                <span className='text-[10px] text-[#63899e]/70 group-hover:text-[#63899e] font-medium transition-colors duration-200'>Upload</span>
                              </div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-xs text-gray-500 font-medium m-0'>Selected file</p>
                            <p className='text-sm font-medium text-gray-700 truncate m-0'>
                            {imageFileName ||
                              (selectedTileDetail.tileBackground &&
                              typeof selectedTileDetail.tileBackground === 'string' &&
                              isBackgroundImage(selectedTileDetail.tileBackground)
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
                          selectedTileDetail.order !== undefined &&
                          selectedTileDetail.order !== null
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
                <div className="w-full h-[1px] bg-gray-200" />

                {/* Footer */}
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50/50 flex-shrink-0'>
                  
                  <div className='flex gap-4 justify-center w-full'>
                    <button
                      onClick={() => tileClone(selectedTile)}
                      className='flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#63899e] hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer border-0 outline-none min-w-0'
                      style={{ maxWidth: '50%' }}
                    >
                      <DifferenceOutlinedIcon className='text-[#63899e]' />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={() => deleteTile(selectedTile)}
                      className='flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer border-0 outline-none min-w-0'
                      style={{ maxWidth: '50%' }}
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
                      onClick={() => handleSave(selectedTile)}
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
          const hasMultipleTiles = sortedTiles.length > 1;
          const canGoPrev = currentTileIndex > 0;
          const canGoNext = currentTileIndex < sortedTiles.length - 1;

          const goPrev = () => {
            if (!canGoPrev) return;
            const prevIndex = currentTileIndex - 1;
            setCurrentTileIndex(prevIndex);
            setSelectedTile(prevIndex);
            const prevTile = sortedTiles[prevIndex];
            setSelectedTileDetail(prevTile);
            setFormValue({ ...formValue, tileText: prevTile.tileText || '' });
          };

          const goNext = () => {
            if (!canGoNext) return;
            const nextIndex = currentTileIndex + 1;
            setCurrentTileIndex(nextIndex);
            setSelectedTile(nextIndex);
            const nextTile = sortedTiles[nextIndex];
            setSelectedTileDetail(nextTile);
            setFormValue({ ...formValue, tileText: nextTile.tileText || '' });
          };

          return (
            <>
              <div
                className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-all duration-300 ease-in-out'
                onClick={() => setEditorOpen(false)}
              />
              <div className='fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none'>
                <div
                  ref={editorModalRef}
                  className='bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:w-full sm:max-w-[1128px] h-[100dvh] sm:h-auto sm:max-h-[90vh] max-h-screen flex flex-col pointer-events-auto transform transition-all duration-300 ease-in-out overflow-hidden'
                  onClick={e => e.stopPropagation()}
                  style={{
                    height: typeof window !== 'undefined' && window.innerWidth < 640 
                      ? (initialEditorViewportHeight.current ? `${initialEditorViewportHeight.current}px` : '100dvh')
                      : undefined
                  }}
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
                          {currentTileIndex + 1} / {sortedTiles.length}
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
                <div className="flex items-center gap-3 p-4 sm:p-6 bg-gray-50/50 flex-shrink-0 sm:justify-end"
                style={{ borderTop: '1px solid #e5e7eb' }} // inline style for border
              >
                  <Button
                    variant='outline'
                    onClick={() => setEditorOpen(false)}
                    className='border-gray-300 cursor-pointer w-1/2'
                  >
                    Close
                  </Button>
                  <Button
                    variant='default'
                    onClick={saveEditorText}
                    className='bg-[#63899e] hover:bg-[#4a6d7e] cursor-pointer w-1/2'
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </>
          );
        })()}

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
