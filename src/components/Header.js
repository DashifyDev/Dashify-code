'use client';
import { globalContext } from '@/context/globalContext';
import useAdmin from '@/hooks/isAdmin';
import isDblTouchTap from '@/hooks/isDblTouchTap';
import { dashboardKeys } from '@/hooks/useDashboard';
import useIsMobile from '@/hooks/useIsMobile';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import { v4 as uuidv4 } from 'uuid';
import logo from '../assets/logo.png';
import SideDrawer from './SideDrawer';
import { Button } from './ui/button';
import { Input } from './ui/input';

function Header() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showIcon, setShowIcon] = useState(null);
  const [openDashDeleteModel, setOpenDashDeleteModel] = useState(false);
  const [selectedDashIndex, setSelectedDashIndex] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [showDeshboardModel, setShowDashboardModel] = useState(false);
  const [dashBoardName, setDashBoardName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [options, setOptions] = useState(null);
  const { isLoading, user } = useUser();
  const {
    dbUser,
    tiles,
    setTiles,
    activeBoard,
    setActiveBoard,
    boards,
    setBoards,
    headerwidth,
    isBoardsLoaded,
    setIsBoardsLoaded
  } = useContext(globalContext);
  const divRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const router = useRouter();
  const isAdmin = useAdmin();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [boardMenuAnchor, setBoardMenuAnchor] = useState(null);
  const [addTilesMenuAnchor, setAddTilesMenuAnchor] = useState(null);

  const currentActiveBoard = id || activeBoard;

  useEffect(() => {
    if (id && id !== activeBoard) {
      setActiveBoard(id);
    }
  }, [id, activeBoard, setActiveBoard]);
  const [shareLinkModal, setShareLinkModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  useEffect(() => {
    // Only check overflow on desktop (where ReactSortable is rendered)
    if (isMobile) {
      setIsOverflowing(false);
      return;
    }

    // Check if refs are available
    if (divRef.current && divRef.current.ref && divRef.current.ref.current) {
      const divElement = divRef.current.ref.current;
      if (divElement) {
        if (divElement.scrollWidth > divElement.clientWidth) {
          setIsOverflowing(true);
        } else {
          setIsOverflowing(false);
        }
      }
    }
  }, [boards, isMobile]);

  const handleScroll = direction => {
    // Only handle scroll on desktop (where ReactSortable is rendered)
    if (isMobile) return;

    // Check if refs are available
    if (divRef.current && divRef.current.ref && divRef.current.ref.current) {
      const divElement = divRef.current.ref.current;
      if (divElement) {
        if (direction === 'left') {
          divElement.scrollLeft -= 100;
        } else if (direction === 'right') {
          divElement.scrollLeft += 100;
        }
      }
    }
  };

  useEffect(() => {
    // Always prefer authoritative server list for authenticated users.
    if (dbUser && user) {
      // clear any guest data to avoid localStorage shadowing server state
      try {
        localStorage.removeItem('Dasify');
        localStorage.removeItem('sessionId');
      } catch (e) {
        /* ignore */
      }

      axios
        .get(`/api/dashboard/addDashboard/?id=${dbUser._id}&t=${Date.now()}`)
        .then(res => {
          if (res && Array.isArray(res.data) && res.data.length >= 1) {
            setBoards(res.data);
            if (!id) {
              router.push(`/dashboard/${res.data[0]._id}`);
            }
          } else {
            setBoards([]);
          }
          if (!isBoardsLoaded) setIsBoardsLoaded(true);
        })
        .catch(err => {
          console.warn('Failed to load dashboards for user', err);
          setBoards([]);
          if (!isBoardsLoaded) setIsBoardsLoaded(true);
        });
    } else {
      if (!isLoading && !user) {
        // Clear user cache when switching to guest mode
        try {
          localStorage.removeItem('sessionId');
        } catch (e) {
          /* ignore */
        }
        getDefaultDashboard();
      }
    }
  }, [user, dbUser, isLoading]);

  const getDefaultDashboard = async () => {
    let localData = JSON.parse(localStorage.getItem('Dasify'));

    if (localData) {
      setBoards(prev => [...localData]);
      if (!id) {
        if (localData.length > 0) {
          router.push(`/dashboard/${localData[0]._id}`);
        }
      }
      if (!isBoardsLoaded) setIsBoardsLoaded(true);
      return;
    }

    axios.get('/api/dashboard/defaultDashboard').then(res => {
      setBoards(prev => [...res.data]);
      if (!id) {
        if (res.data.length > 0) {
          router.push(`/dashboard/${res.data[0]._id}`);
        }
      }
      localStorage.setItem('Dasify', JSON.stringify(res.data));
    });
  };

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  const addTiles = () => {
    const TILE_WIDTH = 135;
    const TILE_HEIGHT = 135;
    const TILE_SPACING = 10; // Space between tiles
    const TILES_PER_ROW = 7; // Maximum tiles per row
    const START_X = 25;
    const START_Y = 25;
    const ROW_HEIGHT = TILE_HEIGHT + TILE_SPACING; // Height of one row including spacing

    // Get current tiles from React Query cache to ensure we have the latest data
    // This is important because tiles might have been deleted and context not updated yet
    const detailKey = dashboardKeys.detail(currentActiveBoard);
    const cachedDashboardData = queryClient.getQueryData(detailKey);
    const currentTiles = cachedDashboardData?.tiles || tiles || [];

    // Count only tiles that are user-created (not the default welcome tile)
    // Filter out tiles with width > 200px (default welcome tile is 600px)
    const userCreatedTiles = currentTiles.filter(tile => {
      const tileWidth = parseInt(tile.width || '0', 10);
      return tileWidth <= 200; // Only count small tiles, not the default welcome tile
    });

    const tileIndex = userCreatedTiles.length; // Index of new tile (0-based)
    const rowIndex = Math.floor(tileIndex / TILES_PER_ROW); // Which row (0-based)
    const colIndex = tileIndex % TILES_PER_ROW; // Position in row (0-6)

    // Calculate position from top-left corner - always start from top
    const newX = START_X + colIndex * (TILE_WIDTH + TILE_SPACING);
    const newY = START_Y + rowIndex * ROW_HEIGHT;

    // New tile always gets order: 1 (first position)
    // All existing tiles will be shifted by +1
    const newOrder = 1;

    // Calculate mobile profile defaults
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    // Increased side padding: 24px on each side (48px total)
    const mobileWidth = `${windowWidth - 48}px`;
    // New tile at the top, mobileY: 0
    const mobileY = 0;

    const newtile = {
      dashboardId: currentActiveBoard,
      width: `${TILE_WIDTH}px`,
      height: `${TILE_HEIGHT}px`,
      x: newX,
      y: newY,
      titleX: 2,
      titleY: 2,
      action: 'textEditor',
      displayTitle: true,
      backgroundAction: 'color',
      order: newOrder,
      mobileX: 0,
      mobileY: mobileY,
      mobileWidth: mobileWidth
      // mobileHeight not set - will use min-height by default
    };

    if (dbUser) {
      // Shift all existing tiles order by +1 and mobileY by +166
      const MOBILE_TILE_HEIGHT = 166;
      const updatedTiles = currentTiles.map(tile => {
        const currentTileOrder = tile.order || 0;
        const currentMobileY = tile.mobileY || 0;
        return {
          ...tile,
          order: currentTileOrder + 1,
          mobileY: currentMobileY + MOBILE_TILE_HEIGHT
        };
      });

      // Optimistic update - add new tile at beginning with updated existing tiles
      const tempTile = { ...newtile, _id: `temp_${Date.now()}` };
      setTiles([tempTile, ...updatedTiles]);

      // Update React Query cache optimistically
      queryClient.setQueryData(dashboardKeys.detail(currentActiveBoard), oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tiles: [tempTile, ...updatedTiles]
        };
      });

      // Prepare batch update for existing tiles (shift order and mobileY)
      const tilesToUpdate = currentTiles
        .filter(tile => tile._id && !tile._id.toString().startsWith('temp_'))
        .map(tile => ({
          tileId: tile._id,
          data: {
            order: (tile.order || 0) + 1,
            mobileY: (tile.mobileY || 0) + MOBILE_TILE_HEIGHT
          }
        }));

      // First update existing tiles, then add new tile
      const addNewTile = () => {
        axios
          .post('/api/tile/tile', newtile)
          .then(res => {
            // Replace temporary block with real one
            setTiles(prevTiles =>
              prevTiles.map(tile => (tile._id === tempTile._id ? res.data : tile))
            );

            // Update React Query cache
            queryClient.setQueryData(dashboardKeys.detail(currentActiveBoard), oldData => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                tiles: (oldData.tiles || []).map(tile =>
                  tile._id === tempTile._id ? res.data : tile
                )
              };
            });
            // ensure subscribers see the latest data
            queryClient.setQueryData(detailKey, old => {
              if (!old) return { ...res.data };
              return {
                ...(old || {}),
                tiles: (old.tiles || []).map(t => (t._id === tempTile._id ? res.data : t))
              };
            });
          })
          .catch(error => {
            console.error('Error adding tile:', error);
            // Remove temporary block on error and revert tile positions
            setTiles(currentTiles);

            queryClient.setQueryData(dashboardKeys.detail(currentActiveBoard), oldData => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                tiles: currentTiles
              };
            });
          });
      };

      // Update existing tiles first, then add new tile
      if (tilesToUpdate.length > 0) {
        axios
          .post('/api/tile/batch-update', { updates: tilesToUpdate })
          .then(() => {
            addNewTile();
          })
          .catch(err => {
            console.error('Error updating tile orders:', err);
            // Still try to add the tile
            addNewTile();
          });
      } else {
        addNewTile();
      }
    } else {
      let boardIndex = boards.findIndex(obj => obj._id === currentActiveBoard);
      if (boardIndex === -1) {
        console.error('Active dashboard not found for saving to localStorage');
        return;
      }
      let items = JSON.parse(JSON.stringify(boards));
      if (!items[boardIndex].tiles) {
        items[boardIndex].tiles = [];
      }

      // Shift all existing tiles order by +1 and mobileY by +166
      const MOBILE_TILE_HEIGHT = 166;
      items[boardIndex].tiles = items[boardIndex].tiles.map(tile => ({
        ...tile,
        order: (tile.order || 0) + 1,
        mobileY: (tile.mobileY || 0) + MOBILE_TILE_HEIGHT
      }));

      // Add temporary ID for guest users too and add at the beginning
      const tempTile = { ...newtile, _id: `temp_${Date.now()}_${Math.random()}` };
      items[boardIndex].tiles.unshift(tempTile);

      // Update localStorage first to ensure useDashboard hook sees the latest data
      localStorage.setItem('Dasify', JSON.stringify(items));
      setBoards(items);

      // Use functional update to ensure we get the latest state
      setTiles(prevTiles => {
        // Always return the updated tiles from the current board
        return items[boardIndex].tiles;
      });

      // Update React Query cache optimistically for guest users - ensure it's complete
      const updatedDashboardData = {
        _id: items[boardIndex]._id,
        name: items[boardIndex].name || '',
        tiles: items[boardIndex].tiles,
        pods: items[boardIndex].pods || []
      };

      // Update both query keys to ensure all components see the update
      // Since useDashboard checks localStorage first, it will return the updated data
      queryClient.setQueryData(dashboardKeys.detail(currentActiveBoard), updatedDashboardData);
      queryClient.setQueryData(detailKey, updatedDashboardData);

      // Force refetch from localStorage to ensure page.js picks up the changes
      // For guest users, useDashboard reads from localStorage, so this won't call the API
      // but will trigger a re-read of localStorage and update dashboardData
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(currentActiveBoard),
          refetchType: 'active'
        });
      }, 0);
    }
  };

  const addBoard = () => {
    const boardsLength = boards.length;
    setShowDashboardModel(false);
    let payload;
    if (dbUser) {
      if (isAdmin) {
        payload = {
          name: dashBoardName,
          userId: dbUser._id,
          hasAdminAdded: true
        };
      } else {
        payload = {
          name: dashBoardName,
          userId: dbUser._id
        };
      }
      axios.post('/api/dashboard/addDashboard', payload).then(res => {
        const newBoard = res.data;
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
        
        // Default tiles: Step 1 and Step 2
        // Position from top-left corner, one below the other
        const START_X = 25;
        const START_Y = 25;
        const TILE_SPACING = 10; // Space between tiles
        
        const defTile1 = {
          dashboardId: newBoard._id,
          width: '540px',
          height: '156px',
          x: START_X,
          y: START_Y,
          titleX: 1,
          titleY: 2,
          action: 'textEditor',
          displayTitle: true,
          backgroundAction: 'color',
          tileBackground: '#04b8c1',
          tileText: '<p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;"><strong>New Board Training | Step 1</strong></span></p><p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;">🖐️ Drag me anywhere, even resize me</span></p>',
          order: 1,
          mobileX: 0,
          mobileY: 0,
          mobileWidth: `${windowWidth - 48}px`
          // mobileHeight not set - will use min-height by default
        };

        const defTile2 = {
          dashboardId: newBoard._id,
          width: '604px',
          height: '161px',
          x: START_X,
          y: START_Y + 156 + TILE_SPACING, // Position below first tile
          titleX: 1,
          titleY: 2,
          action: 'textEditor',
          displayTitle: true,
          backgroundAction: 'color',
          tileBackground: '#2dbc83',
          tileText: '<p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;"><strong>New Board Training | Step 2</strong></span></p><p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;">🎨 Click my menu (top-right corner) to change some things about me</span></p>',
          order: 2,
          mobileX: 0,
          mobileY: 166, // Position below first tile on mobile
          mobileWidth: `${windowWidth - 48}px`
          // mobileHeight not set - will use min-height by default
        };

        // Add temporary IDs for optimistic update
        const tempDefTile1 = { ...defTile1, _id: `temp_${Date.now()}_${Math.random()}` };
        const tempDefTile2 = { ...defTile2, _id: `temp_${Date.now() + 1}_${Math.random()}` };

        // Optimistic update
        setTiles([tempDefTile1, tempDefTile2]);
        newBoard.tiles = [tempDefTile1, tempDefTile2];
        setBoards(prev => [newBoard, ...prev]);

        // Update React Query cache optimistically
        queryClient.setQueryData(dashboardKeys.detail(newBoard._id), {
          ...newBoard,
          tiles: [tempDefTile1, tempDefTile2]
        });

        // Create both tiles using batch endpoint to avoid race condition
        axios
          .post('/api/tile/tiles', {
            dashboardId: newBoard._id,
            tiles: [defTile1, defTile2]
          })
          .then(res => {
            // Replace temporary blocks with real ones
            const realTiles = res.data.tiles || [];
            setTiles(realTiles);
            newBoard.tiles = realTiles;
            setBoards(prev => prev.map(board => (board._id === newBoard._id ? newBoard : board)));

            // Update React Query cache with real data
            queryClient.setQueryData(dashboardKeys.detail(newBoard._id), {
              ...newBoard,
              tiles: realTiles
            });
          })
          .catch(error => {
            console.error('Error creating default tiles:', error);
            // Remove temporary blocks on error
            setTiles([]);
            setBoards(prev => prev.filter(board => board._id !== newBoard._id));
          });

        // ensure React Query lists/cache reflect the newly created board for other contexts
        try {
          queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
          queryClient.setQueryData(dashboardKeys.detail(newBoard._id), newBoard);
        } catch (e) {
          console.warn('Failed to update query cache after creating dashboard', e);
        }
        router.push(`/dashboard/${newBoard._id}`);
      });
    } else {
      const boardId = uuidv4();
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      
      // Default tiles: Step 1 and Step 2
      // Position from top-left corner, one below the other
      const START_X = 25;
      const START_Y = 25;
      const TILE_SPACING = 10; // Space between tiles
      
      const defTile1 = {
        dashboardId: boardId,
        width: '540px',
        height: '156px',
        x: START_X,
        y: START_Y,
        titleX: 1,
        titleY: 2,
        action: 'textEditor',
        displayTitle: true,
        backgroundAction: 'color',
        tileBackground: '#04b8c1',
        tileText: '<p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;"><strong>New Board Training | Step 1</strong></span></p><p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;">🖐️ Drag me anywhere, even resize me</span></p>',
        order: 1,
        mobileX: 0,
        mobileY: 0,
        mobileWidth: `${windowWidth - 48}px`
        // mobileHeight not set - will use min-height by default
      };

      const defTile2 = {
        dashboardId: boardId,
        width: '604px',
        height: '161px',
        x: START_X,
        y: START_Y + 156 + TILE_SPACING, // Position below first tile
        titleX: 1,
        titleY: 2,
        action: 'textEditor',
        displayTitle: true,
        backgroundAction: 'color',
        tileBackground: '#2dbc83',
        tileText: '<p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;"><strong>New Board Training | Step 2</strong></span></p><p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;">🎨 Click my menu (top-right corner) to change some things about me</span></p>',
        order: 2,
        mobileX: 0,
        mobileY: 166, // Position below first tile on mobile
        mobileWidth: `${windowWidth - 48}px`
        // mobileHeight not set - will use min-height by default
      };

      // Add temporary IDs for guest users
      const tempDefTile1 = { ...defTile1, _id: `temp_${Date.now()}_${Math.random()}` };
      const tempDefTile2 = { ...defTile2, _id: `temp_${Date.now() + 1}_${Math.random()}` };

      payload = {
        _id: boardId,
        name: dashBoardName,
        tiles: [tempDefTile1, tempDefTile2]
      };
      let items = boards;
      items = [payload, ...items];
      localStorage.setItem('Dasify', JSON.stringify(items));
      setBoards(items);
      setTiles([tempDefTile1, tempDefTile2]);

      // Update React Query cache for guest users
      try {
        queryClient.setQueryData(dashboardKeys.detail(boardId), {
          ...payload,
          tiles: [tempDefTile1, tempDefTile2]
        });
      } catch (e) {
        console.warn('Failed to update query cache for guest board', e);
      }

      router.push(`/dashboard/${payload._id}`);
    }
  };

  const selectBoard = dashboardId => {
    router.push(`/dashboard/${dashboardId}`);
  };

  const updatedDashBoard = () => {
    setShowDashboardModel(false);
    const data = {
      name: dashBoardName
    };
    if (dbUser) {
      axios.patch(`/api/dashboard/${selectedDashboard}`, data).then(res => {
        if (res) {
          const updatedList = boards.map(board => {
            if (board._id === res.data._id) {
              return res.data;
            }
            return board;
          });
          setBoards(updatedList);
        }
      });
    } else {
      let items = boards;
      let boardIndex = items.findIndex(obj => obj._id === selectedDashboard);
      let item = items[boardIndex];
      item = { ...item, name: dashBoardName };
      items[boardIndex] = item;
      localStorage.setItem('Dasify', JSON.stringify(items));
    }
  };

  const changeDashboardName = e => {
    setDashBoardName(e.target.value);
  };

  const setBoardPosition = list => {
    if (dbUser) {
      setBoards(list);
      let listArray = list.map((item, index) => {
        return { position: index + 1, _id: item._id };
      });
      if (list.length > 1) {
        axios.patch('/api/dashboard/addDashboard', listArray).then(res => {});
      }
    } else {
      if (list.length > 1) {
        setBoards(list);
        localStorage.setItem('Dasify', JSON.stringify(list));
      }
    }
  };

  const deleteDashboard = (id, index) => {
    let isLastIndex = index == boards.length - 1 ? true : false;
    if (dbUser) {
      axios
        .delete(`/api/dashboard/${id}`)
        .then(res => {
          if (res && (res.status === 200 || res.status === 204 || res.data)) {
            // remove immutably so React re-renders (coerce ids to strings)
            const newBoards = (boards || []).filter(b => String(b._id) !== String(id));
            setBoards(newBoards);

            // update react-query cache and ensure UI re-renders
            try {
              queryClient.removeQueries({ queryKey: dashboardKeys.detail(id) });
              queryClient.invalidateQueries({
                queryKey: dashboardKeys.lists()
              });
            } catch (e) {
              console.warn('Failed to update query cache after delete', e);
            }

            // (already removed above) no-op here

            // refresh authoritative list from server to ensure consistency
            if (dbUser && dbUser._id) {
              axios
                .get(`/api/dashboard/addDashboard/?id=${dbUser._id}&t=${Date.now()}`)
                .then(resp => {
                  if (resp && Array.isArray(resp.data)) setBoards(resp.data);
                })
                .catch(e => console.warn('Failed to refresh boards after delete', e));
            }

            setDash(isLastIndex, index);
          } else {
            console.warn('Delete dashboard responded with unexpected status', res && res.status);
          }
        })
        .catch(err => {
          console.error('Failed to delete dashboard:', err);
        });
    } else {
      let items = boards;
      items.splice(index, 1);
      setBoards(items);
      localStorage.setItem('Dasify', JSON.stringify(items));
      setDash(isLastIndex, index);
    }
    setOpenDashDeleteModel(false);
    setSelectedDashIndex(null);
  };

  const setDash = (isLastIndex, index) => {
    if (isLastIndex && index === 0) {
      router.push('/dashboard');
    } else {
      isLastIndex ? selectBoard(boards[index - 1]._id) : selectBoard(boards[index]._id);
    }
  };

  const handlePicClick = event => {
    setAnchorEl(event.currentTarget);
    navigator.clipboard.writeText(window.location.href);
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(location.href);
    setIsCopied(true);
  }

  const duplicateBoard = currentBoard => {
    if (dbUser) {
      const newBoard = { ...currentBoard };
      axios.post('/api/dashboard/duplicateDashboard', newBoard).then(res => {
        setBoards([...boards, res.data]);
      });
    } else {
      const newBoard = { ...currentBoard, _id: uuidv4() };
      setBoards([...boards, newBoard]);
      localStorage.setItem('Dasify', JSON.stringify([...boards, newBoard]));
    }
  };

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [boards, isMobile]);

  const scrollBoards = direction => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header
      className='sticky top-0 z-50 w-full max-w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-sm py-2'
      style={{ width: headerwidth, maxWidth: '100%' }}
    >
      <div className='w-full px-2 sm:px-4 lg:px-6 max-w-full'>
        <div className='flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4 min-w-0 max-w-full'>
          {/* Left Section */}
          <div
            className={`flex items-center min-w-0 max-w-full ${
              isMobile ? 'flex-1 justify-between' : 'gap-4 flex-1'
            }`}
          >
            {/* Add Tiles Button */}
            <div className='relative'>
              <button
                onClick={e => setAddTilesMenuAnchor(e.currentTarget)}
                className='flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#63899e] text-white hover:bg-[#4a6d7e] transition-all duration-200 shadow-sm hover:shadow-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2'
                aria-label='Add tile or board'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2.5}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
              </button>

              {/* Add Tiles Dropdown Menu */}
              {addTilesMenuAnchor && (
                <>
                  <div className='fixed inset-0 z-40' onClick={() => setAddTilesMenuAnchor(null)} />
                  <div
                    className='fixed z-50 mt-1 w-48 bg-white rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm'
                    style={{
                      top: addTilesMenuAnchor.getBoundingClientRect().bottom + 4,
                      left: addTilesMenuAnchor.getBoundingClientRect().left
                    }}
                  >
                    <div>
                      <a
                        href='#'
                        onClick={e => {
                          e.preventDefault();
                          setAddTilesMenuAnchor(null);
                          addTiles();
                        }}
                        className='w-full  flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline'
                      >
                        <svg
                          className='w-5 h-5 text-gray-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 4v16m8-8H4'
                          />
                        </svg>
                        <span className='text-lg'>Add Box</span>
                      </a>
                      <hr className='border-[#63899e]/20 m-0 p-0' />
                      <a
                        href='#'
                        onClick={e => {
                          e.preventDefault();
                          setAddTilesMenuAnchor(null);
                          setShowDashboardModel(true);
                          setSelectedDashboard(null);
                          setDashBoardName('');
                        }}
                        className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors no-underline'
                      >
                        <svg
                          className='w-5 h-5 text-gray-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 4v16m8-8H4'
                          />
                        </svg>
                        <span className='text-lg'>Add Board</span>
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* Divider */}
            <div className='hidden sm:block w-px h-6 bg-gray-300 mx-2 sm:mx-4' />

            {isMobile ? (
              <>
                {/* Mobile: Logo and Board Selector */}
                <div className='flex flex-col items-center flex-1 justify-center gap-1 min-w-0 max-w-full'>
                  <Image
                    src={logo}
                    alt='Boardzy logo'
                    priority
                    className='h-5 w-auto flex-shrink-0'
                  />
                  <button
                    onClick={e => setBoardMenuAnchor(e.currentTarget)}
                    className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#538a95] text-sm font-medium transition-colors min-w-[140px] max-w-[220px] border-0 outline-none flex-shrink-0'
                  >
                    <span className='truncate min-w-0'>
                      {boards.find(b => b._id === currentActiveBoard)?.name || 'Select Board'}
                    </span>
                    <svg
                      className='w-4 h-4 flex-shrink-0'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </button>
                </div>
                {/* Mobile Board Menu */}
                {boardMenuAnchor && (
                  <>
                    <div
                      className='fixed inset-0 z-40 bg-black/20 backdrop-blur-sm h-screen '
                      onClick={() => setBoardMenuAnchor(null)}
                    />
                    <div
                      className='fixed z-50 w-[280px] max-h-[60vh] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col'
                      style={{
                        top: boardMenuAnchor.getBoundingClientRect().bottom + 4,
                        left: boardMenuAnchor.getBoundingClientRect().left
                      }}
                    >
                      <div className='overflow-y-auto overflow-x-hidden flex-1 min-h-0'>
                        <ReactSortable
                          list={boards}
                          setList={list => setBoardPosition(list)}
                          animation={200}
                          easing='ease-out'
                          handle='.board-drag-handle'
                          filter='.board-options-btn'
                          preventOnFilter={false}
                          className='flex flex-col'
                          key={(boards || []).map(b => String(b._id)).join(',')}
                        >
                        {boards.map((board, index) => (
                          <div
                            key={board._id}
                              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                              board._id === currentActiveBoard
                                ? 'bg-[#63899e]/15 font-semibold text-[#538a95]'
                                : 'text-[#538a95] hover:bg-[#63899e]/10'
                            }`}
                            onClick={() => {
                              selectBoard(board._id);
                              setBoardMenuAnchor(null);
                            }}
                          >
                              <svg
                                className='board-drag-handle w-5 h-5 mr-2 text-[#538a95]/60 flex-shrink-0 cursor-move'
                                fill='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <circle cx='9' cy='5' r='1.5' />
                                <circle cx='9' cy='12' r='1.5' />
                                <circle cx='9' cy='19' r='1.5' />
                                <circle cx='15' cy='5' r='1.5' />
                                <circle cx='15' cy='12' r='1.5' />
                                <circle cx='15' cy='19' r='1.5' />
                              </svg>
                            <span className='truncate flex-1'>{board.name}</span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (options === e.currentTarget) {
                                  setOptions(null);
                                } else {
                                  setOptions(e.currentTarget);
                                  setSelectedDashboard(board._id);
                                  setSelectedDashIndex(index);
                                }
                              }}
                                className='board-options-btn ml-2 p-1 rounded hover:bg-[#63899e]/20 text-[#538a95] border-0 outline-none cursor-pointer'
                            >
                              <svg
                                className='w-4 h-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                        </ReactSortable>
                        <div className='border-t border-[#63899e]/30 mt-2 pt-2'>
                          <button
                            onClick={() => {
                              setBoardMenuAnchor(null);
                              setShowDashboardModel(true);
                              setSelectedDashboard(null);
                              setDashBoardName('');
                            }}
                            className='w-full flex items-center gap-2 px-4 py-3 bg-[#63899e]/10 hover:bg-[#63899e]/20 text-[#538a95] font-semibold transition-colors border-0 outline-none'
                          >
                            <svg
                              className='w-5 h-5'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 4v16m8-8H4'
                              />
                            </svg>
                            New Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Mobile Options Menu */}
                {options && (
                  <>
                    <div className='fixed inset-0 z-40' onClick={() => setOptions(null)} />
                    <div
                      className='fixed z-50 mt-1 w-48 bg-white rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm'
                      style={{
                        top: options.getBoundingClientRect().bottom + 4,
                        left: options.getBoundingClientRect().right - 192
                      }}
                    >
                      <div>
                        {dbUser && (
                          <a
                            href='#'
                            onClick={e => {
                              e.preventDefault();
                              setOptions(null);
                              setShareLinkModal(true);
                              setCopiedUrl(window.location.href);
                            }}
                            className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline'
                          >
                            <svg
                              className='w-4 h-4 text-gray-600'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                              />
                            </svg>
                            <span>Share</span>
                          </a>
                        )}
                        <a
                          href='#'
                          onClick={e => {
                            e.preventDefault();
                            setOptions(null);
                            const board = boards.find(b => b._id === selectedDashboard);
                            if (board) {
                              setDashBoardName(board.name);
                              setShowDashboardModel(true);
                            }
                          }}
                          className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline'
                        >
                          <svg
                            className='w-4 h-4 text-gray-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                          </svg>
                          <span>Rename</span>
                        </a>
                        <a
                          href='#'
                          onClick={e => {
                            e.preventDefault();
                            setOptions(null);
                            const board = boards.find(b => b._id === selectedDashboard);
                            if (board) {
                              duplicateBoard(board);
                            }
                          }}
                          className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline'
                        >
                          <svg
                            className='w-4 h-4 text-gray-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                            />
                          </svg>
                          <span>Duplicate</span>
                        </a>
                      </div>
                      <div className='border-b border-gray-100'></div>
                      <div>
                        <a
                          href='#'
                          onClick={e => {
                            e.preventDefault();
                            setOptions(null);
                            setOpenDashDeleteModel(true);
                          }}
                          className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-b border-gray-100 no-underline'
                        >
                          <svg
                            className='w-4 h-4 text-red-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                          </svg>
                          <span>Delete</span>
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Desktop: Boards Navigation with Horizontal Scroll */}
                <div className='flex items-center gap-2 flex-1 min-w-0 max-w-full overflow-visible'>
                  {/* Scroll Left Button */}
                  {canScrollLeft && (
                    <button
                      onClick={() => scrollBoards('left')}
                      className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#63899e]'
                      aria-label='Scroll left'
                    >
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                    </button>
                  )}

                  {/* Boards Scroll Container */}
                  <div className='flex-1 min-w-0 relative max-w-full overflow-visible'>
                    <div
                      ref={scrollContainerRef}
                      className='flex gap-1 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth max-w-full p-2'
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        overflowY: 'visible'
                      }}
                    >
                      <ReactSortable
                        ref={divRef}
                        filter='.dashboard_btn'
                        dragClass='sortableDrag'
                        list={boards}
                        setList={list => setBoardPosition(list)}
                        animation={200}
                        easing='ease-out'
                        className='flex gap-1 items-center'
                        key={(boards || []).map(b => String(b._id)).join(',')}
                      >
                        {boards.map((board, index) => (
                          <div
                            key={board._id}
                            className='relative group flex items-center'
                            onMouseEnter={() => setShowIcon(board._id)}
                            onMouseLeave={() => setShowIcon(null)}
                          >
                            <button
                              onClick={() => selectBoard(board._id)}
                              onTouchStart={e => {
                                if (isDblTouchTap(e)) {
                                  selectBoard(board._id);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-1 ${
                                board._id === currentActiveBoard
                                  ? 'bg-[#a2c4c9] text-white font-semibold'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {board.name}
                            </button>

                            {showIcon === board._id && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  options ? setOptions(null) : setOptions(e.currentTarget);
                                  setSelectedDashboard(board._id);
                                  setSelectedDashIndex(index);
                                }}
                                className='absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 text-gray-600 hover:text-[#63899e] transition-colors outline-none'
                              >
                                <svg
                                  className='w-3 h-3'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 9l-7 7-7-7'
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </ReactSortable>
                    </div>
                  </div>

                  {/* Scroll Right Button */}
                  {canScrollRight && (
                    <button
                      onClick={() => scrollBoards('right')}
                      className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#63899e]'
                      aria-label='Scroll right'
                    >
                      <svg
                        className='w-5 h-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 5l7 7-7 7'
                        />
                      </svg>
                    </button>
                  )}

                  {/* Desktop Options Menu */}
                  {options && (
                    <>
                      <div className='fixed inset-0 z-40' onClick={() => setOptions(null)} />
                      <div
                        className='fixed z-50 mt-1 w-48 bg-white rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm'
                        style={{
                          top: options.getBoundingClientRect().bottom + 4,
                          left: options.getBoundingClientRect().right - 192
                        }}
                      >
                        <div>
                          <a
                            href='#'
                            onClick={e => {
                              e.preventDefault();
                              setOptions(null);
                              setShareLinkModal(true);
                              setCopiedUrl(window.location.href);
                            }}
                            className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline'
                          >
                            <svg
                              className='w-4 h-4 text-gray-600'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                              />
                            </svg>
                            <span>Share</span>
                          </a>
                          <a
                            href='#'
                            onClick={e => {
                              e.preventDefault();
                              setOptions(null);
                              setSelectedDashboard(selectedDashboard);
                              const board = boards.find(b => b._id === selectedDashboard);
                              if (board) {
                                setDashBoardName(board.name);
                                setShowDashboardModel(true);
                              }
                            }}
                            className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline'
                          >
                            <svg
                              className='w-4 h-4 text-gray-600'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                              />
                            </svg>
                            <span>Rename</span>
                          </a>
                          <a
                            href='#'
                            onClick={e => {
                              e.preventDefault();
                              setOptions(null);
                              const board = boards.find(b => b._id === selectedDashboard);
                              if (board) {
                                duplicateBoard(board);
                              }
                            }}
                            className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 no-underline'
                          >
                            <svg
                              className='w-4 h-4 text-gray-600'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                              />
                            </svg>
                            <span>Duplicate</span>
                          </a>
                        </div>
                        <div className='border-b border-gray-100'></div>
                        <div>
                          <a
                            href='#'
                            onClick={e => {
                              e.preventDefault();
                              setOptions(null);
                              setOpenDashDeleteModel(true);
                            }}
                            className='w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-b border-gray-100 no-underline'
                          >
                            <svg
                              className='w-4 h-4 text-red-600'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                              />
                            </svg>
                            <span>Delete</span>
                          </a>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Section */}
          <div className='flex items-center gap-2 sm:gap-3 flex-shrink-0'>
            {/* Logo (Desktop only) */}
            {!isMobile && (
              <Image src={logo} alt='Boardzy logo' priority className='h-8 w-auto flex-shrink-0' />
            )}

            {/* Menu Button */}
            <button
              onClick={toggleDrawer}
              className='inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[#45818e] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2 transition-all duration-200 border-0 outline-none'
              aria-label='Open menu'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2.5}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>

            {/* User Menu or Auth Buttons */}
            {dbUser ? (
              <div className='relative'>
                <button
                  onClick={handlePicClick}
                  className='flex items-center focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2 rounded-full border-0 outline-none transition-all duration-200 hover:ring-2 hover:ring-[#63899e]/30'
                >
                  <img
                    src={dbUser.picture}
                    alt={dbUser.email}
                    className='h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-gray-200 hover:border-[#63899e] transition-all duration-200 shadow-sm hover:shadow-md'
                  />
                </button>

                {/* Dropdown Menu */}
                {anchorEl && (
                  <>
                    <div className='fixed inset-0 z-40' onClick={() => setAnchorEl(null)} />
                    <div className='absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white/95 backdrop-blur-sm border border-gray-200/60 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200'>
                      {/* User Info Section */}
                      <div className='px-4 py-4 bg-gradient-to-r from-[#63899e]/5 to-[#4a6d7e]/5 border-b border-gray-200/60'>
                        <div className='flex items-center gap-3'>
                          <img
                            src={dbUser.picture}
                            alt={dbUser.email}
                            className='h-10 w-10 rounded-full border-2 border-[#63899e]/20'
                          />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold text-gray-900 truncate'>
                              {dbUser.name || 'User'}
                            </p>
                            <p className='text-xs text-gray-500 truncate mt-0.5'>{dbUser.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className='h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent' />

                      {/* Menu Items */}
                      <div>
                        <a
                          href='/api/auth/logout'
                          className='flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50/50 transition-all duration-200 group'
                        >
                          <svg
                            className='h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors'
                            fill='none'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                          </svg>
                          <span className='group-hover:text-red-600 font-medium transition-colors'>
                            Log out
                          </span>
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              !isMobile && (
                <div className='flex items-center gap-2'>
                  <Link
                    href='/api/auth/login'
                    prefetch={false}
                    className='px-4 py-2 text-sm font-semibold text-[#63899e] hover:text-[#4a6d7e] transition-colors'
                  >
                    Login
                  </Link>
                  <Link
                    href='/api/auth/login'
                    prefetch={false}
                    className='px-4 py-2 text-sm font-semibold bg-[#63899e] text-white rounded-lg hover:bg-[#4a6d7e] transition-colors shadow-sm hover:shadow-md'
                  >
                    Sign up
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <SideDrawer
        open={isDrawerOpen}
        close={toggleDrawer}
        user={dbUser}
        isMobile={isMobile}
        authUser={user}
      />

      {/* Delete Dashboard Modal */}
      {openDashDeleteModel && (
        <>
          <div
            className='fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen bg-black/50 backdrop-blur-sm z-[10000] transition-opacity duration-300'
            onClick={() => {
              setOpenDashDeleteModel(false);
              setSelectedDashIndex(null);
            }}
          />
          <div className='fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen z-[10001] flex items-center justify-center p-4 pointer-events-none'>
            <div
              className='bg-white rounded-xl shadow-2xl w-full max-w-sm pointer-events-auto transform transition-all duration-300'
              onClick={e => e.stopPropagation()}
            >
              <div className='px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>Delete Dashboard</h2>
              </div>
              <div className='px-6 py-4'>
                <p className='text-sm text-gray-600'>
                  Are you sure you want to delete this dashboard?
                </p>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenDashDeleteModel(false);
                    setSelectedDashIndex(null);
                  }}
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    deleteDashboard(selectedDashboard, selectedDashIndex);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white w-1/2"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Update Dashboard Modal */}
      {showDeshboardModel && (
        <>
          <div
            className='fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen bg-black/50 backdrop-blur-sm z-[10000] transition-opacity duration-300'
            onClick={() => setShowDashboardModel(false)}
          />
          <div className='fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen z-[10001] flex items-center justify-center p-4 pointer-events-none'>
            <div
              className='bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all duration-300'
              onClick={e => e.stopPropagation()}
            >
              <div className='px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>
                  {selectedDashboard ? 'Update Dashboard' : 'Add Dashboard'}
                </h2>
              </div>
              <div className='px-6 py-4'>
                <Input
                  type='text'
                  value={dashBoardName}
                  placeholder='Enter Dashboard Name'
                  onChange={changeDashboardName}
                  className='w-full'
                  autoFocus
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3 justify-end sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDashboardModel(false)}
                  className="w-1/2"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    selectedDashboard ? updatedDashBoard() : addBoard();
                  }}
                  className="w-1/2"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Share Link Modal */}
      {shareLinkModal && (
        <>
          <div
            className='fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen bg-black/50 backdrop-blur-sm z-[10000] transition-opacity duration-300'
            onClick={() => {
              setShareLinkModal(false);
              setIsCopied(false);
            }}
          />
          <div className='fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen z-[10001] flex items-center justify-center p-4 pointer-events-none'>
            <div
              className='bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all duration-300'
              onClick={e => e.stopPropagation()}
            >
              <div className='px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>Share Dashboard</h2>
              </div>
              <div className='px-6 py-4'>
                <input
                  type='text'
                  value={copiedUrl}
                  readOnly
                  className='w-full px-3 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#63899e]/20 select-all'
                  onClick={e => e.target.select()}
                />
              </div>
              <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3'>
                <div className="flex gap-3">
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShareLinkModal(false);
                      setIsCopied(false);
                    }}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                  {isCopied ? (
                    <Button variant='default' disabled className="w-1/2">
                      Copied
                    </Button>
                  ) : (
                    <Button variant='default' onClick={() => handleCopy()} className="w-1/2">
                      Copy
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default Header;
