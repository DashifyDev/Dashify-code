'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import { globalContext } from '@/context/globalContext';
import { useDashboardData } from '@/context/optimizedContext';
import useAdmin from '@/hooks/isAdmin';
import { dashboardKeys } from '@/hooks/useDashboard';
import useIsMobile from '@/hooks/useIsMobile';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GridTiles = dynamic(() => import('@/components/GridTiles'), {
  ssr: false,
  loading: () => <LoadingSpinner text={'Loading board...'} fullScreen={true} />
});

const MobileGridTiles = dynamic(() => import('@/components/MobileGridTiles'), {
  ssr: false,
  loading: () => <LoadingSpinner text={'Loading board...'} fullScreen={true} />
});

function OptimizedDashboardPage() {
  const { id } = useParams();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { boards, setBoards, dbUser, isBoardsLoaded } = useContext(globalContext);
  const isAdmin = useAdmin();
  const router = useRouter();
  const isMobile = useIsMobile();

  const { data: dashboardData, isLoading, error, isFetching } = useDashboardData(id);

  // Redirect to nearest active board if current dashboard is deleted/not found
  useEffect(() => {
    if (error && isBoardsLoaded && boards && boards.length > 0) {
      // Check if error is 404 (dashboard not found) or similar
      const isNotFoundError =
        error?.response?.status === 404 ||
        error?.status === 404 ||
        error?.message?.toLowerCase().includes('not found') ||
        error?.message?.toLowerCase().includes('404');

      if (isNotFoundError) {
        // Find the nearest active board
        const currentIndex = boards.findIndex(b => String(b._id) === String(id));
        let targetBoard;

        if (currentIndex > 0) {
          // If not first, go to previous board
          targetBoard = boards[currentIndex - 1];
        } else if (boards.length > 0) {
          // If first or not found, go to first available board
          targetBoard = boards[0];
        }

        if (targetBoard) {
          router.push(`/dashboard/${targetBoard._id}`);
        } else {
          // If no boards available, redirect to dashboard list
          router.push('/dashboard');
        }
      }
    }
  }, [error, isBoardsLoaded, boards, id, router]);

  // Redirect if dashboard data is not available (deleted dashboard)
  useEffect(() => {
    if (!dashboardData && !isLoading && !error && isBoardsLoaded && boards && boards.length > 0) {
      const currentIndex = boards.findIndex(b => String(b._id) === String(id));
      let targetBoard;

      if (currentIndex > 0) {
        targetBoard = boards[currentIndex - 1];
      } else if (boards.length > 0) {
        targetBoard = boards[0];
      }

      if (targetBoard) {
        router.push(`/dashboard/${targetBoard._id}`);
      } else {
        router.push('/dashboard');
      }
    }
  }, [dashboardData, isLoading, error, isBoardsLoaded, boards, id, router]);

  // Preload next boards
  useEffect(() => {
    if (dashboardData && dashboardData.relatedBoards) {
      dashboardData.relatedBoards.forEach(boardId => {
        queryClient.prefetchQuery({
          queryKey: dashboardKeys.detail(boardId),
          queryFn: async () => {
            const response = await fetch(`/api/dashboard/${boardId}`);
            return response.json();
          },
          staleTime: 5 * 60 * 1000
        });
      });
    }
  }, [dashboardData, queryClient]);

  const [tiles, setTiles] = useState([]);
  const [pods, setPods] = useState([]);
  const [activeBoard, setActiveBoard] = useState(id);
  const [headerWidth, setHeaderWidth] = useState(0);
  const [addedFlag, setAddedFlag] = useState(false);

  // Track if we have local changes to avoid overwriting them
  const hasLocalChangesRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (dashboardData) {
      // Ensure tiles is always an array
      const dashboardTiles = Array.isArray(dashboardData.tiles) ? dashboardData.tiles : [];

      // Check if dashboardData has more tiles than current state
      // This indicates a new tile was added (e.g., from Header.js)
      const hasNewTiles = dashboardTiles.length > tiles.length;
      const hasTempTiles = dashboardTiles.some(t => t._id && t._id.startsWith('temp_'));

      // Only skip update if we have local changes AND it's not a new tile addition
      // This allows updates when new tiles are added from Header.js
      if (
        hasLocalChangesRef.current &&
        !isInitialLoadRef.current &&
        !hasNewTiles &&
        !hasTempTiles
      ) {
        // Skip update if we have local changes - they will be synced via batch update
        return;
      }

      // Ensure all tiles have mobile profile and order
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      const updatedTiles = dashboardTiles.map((tile, index) => {
        // Helper function to parse height value
        const parseHeight = heightStr => {
          if (!heightStr) return null;
          const parsed = parseInt(String(heightStr).replace('px', ''), 10);
          return isNaN(parsed) ? null : parsed;
        };

        // Helper function to parse width value
        const parseWidth = widthStr => {
          if (!widthStr) return null;
          const parsed = parseInt(String(widthStr).replace('px', ''), 10);
          return isNaN(parsed) ? null : parsed;
        };

        // Margin is 24px on each side = 48px total, so max width should be windowWidth - 48px
        const maxMobileWidth = windowWidth - 48;

        // If tile doesn't have mobile profile, create defaults
        if (tile.mobileWidth === undefined || tile.mobileWidth === null) {
          // Parse desktop height to check if it's reasonable for mobile
          const desktopHeight = parseHeight(tile.height);
          // Only set mobileHeight if desktop height is reasonable (<= 200px)
          // Otherwise, leave it undefined to use min-height for natural content expansion
          const mobileHeight = desktopHeight && desktopHeight <= 200 ? tile.height : undefined;
          
          return {
            ...tile,
            mobileX: 0,
            mobileY: index * 166, // Approximate position
            mobileWidth: `${maxMobileWidth}px`, // Ensure width fits within screen
            ...(mobileHeight ? { mobileHeight } : {}), // Only set if reasonable
            order: tile.order || index + 1
          };
        }
        
        // If tile has mobileWidth but it's too large, fix it
        if (tile.mobileWidth) {
          const mobileWidthValue = parseWidth(tile.mobileWidth);
          if (mobileWidthValue && mobileWidthValue > maxMobileWidth) {
            // Fix mobileWidth to fit within screen
            return {
              ...tile,
              mobileWidth: `${maxMobileWidth}px`,
              order: tile.order || index + 1
            };
          }
        }
        
        // If tile has mobileHeight but it's too large (likely from desktop), remove it
        if (tile.mobileHeight) {
          const mobileHeightValue = parseHeight(tile.mobileHeight);
          if (mobileHeightValue && mobileHeightValue > 200) {
            // Remove mobileHeight to allow natural content expansion
            const { mobileHeight, ...tileWithoutHeight } = tile;
            return {
              ...tileWithoutHeight,
              order: tile.order || index + 1
            };
          }
        }
        
        // Ensure order is set
        if (tile.order === undefined || tile.order === null) {
          return {
            ...tile,
            order: index + 1
          };
        }
        return tile;
      });
      setTiles(updatedTiles);
      setPods(dashboardData.pods || []);
      setActiveBoard(id);
      isInitialLoadRef.current = false; // Mark initial load as complete
      hasLocalChangesRef.current = false; // Reset flag after initial load
    }
  }, [dashboardData, id, tiles.length]);

  useEffect(() => {
    if (
      dashboardData &&
      isBoardsLoaded &&
      !boards.some(el => el?._id === dashboardData?._id) &&
      dashboardData?.userId !== dbUser?._id &&
      !addedFlag
    ) {
      addBoard(dashboardData);
      setAddedFlag(true);
    }
  }, [boards, dashboardData, dbUser, isBoardsLoaded]);

  const addBoard = data => {
    let payload;
    if (dbUser) {
      if (isAdmin) {
        payload = {
          name: data.name,
          userId: dbUser._id,
          hasAdminAdded: true
        };
      } else {
        payload = {
          name: data.name,
          userId: dbUser._id
        };
      }
      axios.post('/api/dashboard/addDashboard', payload).then(res => {
        const newBoard = res.data;

        // Assign order and mobile profile for copied tiles
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
        const boardTiles = data.tiles.map((el, index) => {
          const tileCopy = { ...el };
          delete tileCopy._id;
          tileCopy.dashboardId = newBoard._id;
          // Assign order based on index (1, 2, 3...)
          tileCopy.order = index + 1;
          // Set mobile profile defaults if not present
          // Margin is 24px on each side = 48px total
          if (!tileCopy.mobileWidth) {
            tileCopy.mobileWidth = `${windowWidth - 48}px`;
          }
          if (!tileCopy.mobileHeight) {
            tileCopy.mobileHeight = tileCopy.height || '150px';
          }
          if (tileCopy.mobileY === undefined) {
            tileCopy.mobileY = index * 166; // Approximate position
          }
          if (tileCopy.mobileX === undefined) {
            tileCopy.mobileX = 0;
          }
          return tileCopy;
        });

        axios
          .post('/api/tile/tiles', {
            dashboardId: newBoard._id,
            tiles: boardTiles
          })
          .then(resp => {
            setTiles(resp.data.tiles);
            newBoard.tiles = resp.data.tiles;
            setBoards(prev => [newBoard, ...prev]);

            try {
              queryClient.invalidateQueries({
                queryKey: dashboardKeys.lists()
              });
              queryClient.setQueryData(dashboardKeys.detail(newBoard._id), newBoard);
            } catch (e) {
              console.warn('Failed to update query cache after creating dashboard', e);
            }
            router.push(`/dashboard/${newBoard._id}`);
          });
      });
    } else {
      const boardId = uuidv4();
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      const newTiles = data.tiles.map((tile, index) => {
        tile._id = uuidv4();
        tile.dashboardId = boardId;
        // Assign order based on index
        tile.order = index + 1;
        // Set mobile profile defaults if not present
        // Margin is 24px on each side = 48px total
        if (!tile.mobileWidth) {
          tile.mobileWidth = `${windowWidth - 48}px`;
        }
        if (!tile.mobileHeight) {
          tile.mobileHeight = tile.height || '150px';
        }
        if (tile.mobileY === undefined) {
          tile.mobileY = index * 166;
        }
        if (tile.mobileX === undefined) {
          tile.mobileX = 0;
        }
        return tile;
      });
      let payload = {
        _id: boardId,
        name: data.name,
        tiles: newTiles
      };
      let items = boards;
      items = [payload, ...items];
      localStorage.setItem('Dasify', JSON.stringify(items));
      setBoards(items);
      setTiles(newTiles);

      try {
        const detailKey = dashboardKeys.detail(boardId);
        queryClient.setQueryData(detailKey, oldData => {
          if (oldData) {
            return {
              ...oldData,
              tiles: items.find(b => b._id === boardId)?.tiles || []
            };
          }
          const board = items.find(b => b._id === boardId);
          return {
            _id: board?._id || boardId,
            name: board?.name || '',
            tiles: board?.tiles || [],
            pods: board?.pods || []
          };
        });
      } catch (e) {
        console.warn('Failed to update query cache for local board', e);
      }

      router.push(`/dashboard/${boardId}`);
    }
  };

  useEffect(() => {
    if (dashboardData?.name) {
      document.title = dashboardData.name;
    }
  }, [dashboardData?.name]);

  const maxWidth = useMemo(() => {
    // Ensure tiles is always an array
    const tilesArray = Array.isArray(tiles) ? tiles : [];
    if (tilesArray.length === 0) return 0;
    return Math.max(
      ...tilesArray.map(tile => {
        const widthValue = parseInt(tile.width, 10) || 0;
        const xValue = tile.x || 0;
        return widthValue + xValue;
      })
    );
  }, [tiles]);

  useEffect(() => {
    if (tiles.length > 0) {
      const windowWidth = window.innerWidth;
      const newMaxWidth = Math.max(windowWidth, maxWidth);
      setHeaderWidth(newMaxWidth);
    }
  }, [tiles, maxWidth]);

  const handleTileUpdate = useCallback(
    updatedTiles => {
      // Mark that we have local changes to prevent useEffect from overwriting
      hasLocalChangesRef.current = true;
      setTiles(updatedTiles);

      queryClient.setQueryData(dashboardKeys.detail(id), oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tiles: updatedTiles
        };
      });
    },
    [id, queryClient]
  );

  const updateTilesInLocalstorage = useCallback(
    tileArray => {
      if (!user) {
        const existingBoards = JSON.parse(localStorage.getItem('Dasify') || '[]');
        const boardIndex = existingBoards.findIndex(board => board._id === activeBoard);
        if (boardIndex >= 0) {
          const updatedBoards = [...existingBoards];
          updatedBoards[boardIndex] = {
            ...updatedBoards[boardIndex],
            tiles: tileArray
          };
          localStorage.setItem('Dasify', JSON.stringify(updatedBoards));
          setBoards(updatedBoards);
        }
      }
    },
    [user, activeBoard, setBoards]
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #63899e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <div style={{ color: '#666' }}>Loading dashboard...</div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    // Check if error is 404 and we have boards to redirect to
    const isNotFoundError =
      error?.response?.status === 404 ||
      error?.status === 404 ||
      error?.message?.toLowerCase().includes('not found') ||
      error?.message?.toLowerCase().includes('404');

    // If it's a 404 and we have boards loaded, show loading while redirecting
    if (isNotFoundError && isBoardsLoaded && boards && boards.length > 0) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #63899e',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div style={{ color: '#666' }}>Redirecting to available board...</div>
          <style jsx>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      );
    }

    // Show error for other cases
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ color: '#e74c3c', fontSize: '18px' }}>Error loading dashboard</div>
        <div style={{ color: '#666' }}>{error.message || 'Something went wrong'}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#63899e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData && !isLoading && !error && isBoardsLoaded) {
    // Show loading while redirecting (handled by useEffect above)
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #63899e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <div style={{ color: '#666' }}>Redirecting to available board...</div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {}
      {isFetching && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            backgroundColor: '#63899e',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}
        >
          Updating...
        </div>
      )}

      {}
      {isMobile ? (
        <MobileGridTiles
          tileCordinates={tiles}
          setTileCordinates={handleTileUpdate}
          activeBoard={activeBoard}
          updateTilesInLocalstorage={updateTilesInLocalstorage}
        />
      ) : (
        <GridTiles
          tileCordinates={tiles}
          setTileCordinates={handleTileUpdate}
          activeBoard={activeBoard}
          updateTilesInLocalstorage={updateTilesInLocalstorage}
        />
      )}
    </div>
  );
}

export default OptimizedDashboardPage;

