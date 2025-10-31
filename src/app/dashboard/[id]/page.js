"use client";

import React, { useEffect, useState, useMemo, useCallback, useContext } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { useDashboardData } from "@/context/optimizedContext";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from "uuid";

const GridTiles = dynamic(() => import("@/components/GridTiles"), {
  ssr: false,
  loading: () => <LoadingSpinner text={"Loading board..."} fullScreen={true} />,
});
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/hooks/useDashboard";
import { globalContext } from "@/context/globalContext";
import useAdmin from "@/hooks/isAdmin";

function OptimizedDashboardPage() {
  const { id } = useParams();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { boards, setBoards, dbUser, isBoardsLoaded } = useContext(globalContext);
  const isAdmin = useAdmin();
  const router = useRouter();

  const {
    data: dashboardData,
    isLoading,
    error,
    isFetching,
  } = useDashboardData(id);

  // Preload next boards
  useEffect(() => {
    if (dashboardData && dashboardData.relatedBoards) {
      dashboardData.relatedBoards.forEach((boardId) => {
        queryClient.prefetchQuery({
          queryKey: dashboardKeys.detail(boardId),
          queryFn: async () => {
            const response = await fetch(`/api/dashboard/${boardId}`);
            return response.json();
          },
          staleTime: 5 * 60 * 1000,
        });
      });
    }
  }, [dashboardData, queryClient]);

  const [tiles, setTiles] = useState([]);
  const [pods, setPods] = useState([]);
  const [activeBoard, setActiveBoard] = useState(id);
  const [headerWidth, setHeaderWidth] = useState(0);
  const [addedFlag, setAddedFlag] = useState(false);

  useEffect(() => {
    if (dashboardData) {
      setTiles(dashboardData.tiles || []);
      setPods(dashboardData.pods || []);
      setActiveBoard(id);
    }
  }, [dashboardData, id]);

  useEffect(() => {
    if (dashboardData
        && isBoardsLoaded
        && !boards.some(el => el?._id === dashboardData?._id)
        && dashboardData?.userId !== dbUser?._id
        && !addedFlag
    ) {
      addBoard(dashboardData)
      setAddedFlag(true)
    }
  }, [boards, dashboardData, dbUser, isBoardsLoaded])

  const addBoard = (data) => {
    let payload;
    if (dbUser) {
      if (isAdmin) {
        payload = {
          name: data.name,
          userId: dbUser._id,
          hasAdminAdded: true,
        };
      } else {
        payload = {
          name: data.name,
          userId: dbUser._id,
        };
      }
      axios.post("/api/dashboard/addDashboard", payload).then((res) => {
        const newBoard = res.data;

        const boardTiles = data.tiles.map(el => {
          const tileCopy = { ...el };
          delete tileCopy._id;
          tileCopy.dashboardId = newBoard._id;
          return tileCopy;
        });

        axios.post("/api/tile/tiles", { dashboardId: newBoard._id, tiles: boardTiles }).then((resp) => {
          setTiles(resp.data.tiles)
          newBoard.tiles = resp.data.tiles
          setBoards((prev) => [newBoard, ...prev]);

          try {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
            queryClient.setQueryData(
              dashboardKeys.detail(newBoard._id),
              newBoard
            );
          } catch (e) {
            console.warn(
              "Failed to update query cache after creating dashboard",
              e
            );
          }
          router.push(`/dashboard/${newBoard._id}`);
        })
      });
    } else {
      const boardId = uuidv4()
      const newTiles = data.tiles.map((tile) => {
        tile._id = uuidv4()
        tile.dashboardId = boardId
        return tile
      })
      let payload = {
        _id: boardId,
        name: data.name,
        tiles: newTiles,
      };
      let items = boards;
      items = [payload, ...items];
      localStorage.setItem("Dasify", JSON.stringify(items));
      setBoards(items);
      setTiles(newTiles);

      try {
        const detailKey = dashboardKeys.detail(newBoard._id);
        queryClient.setQueryData(detailKey, (oldData) => {
          if (oldData) {
            return {
              ...oldData,
              tiles: items[newBoard._id].tiles,
            };
          }
          return {
            _id: items[newBoard._id]._id,
            name: items[newBoard._id].name || "",
            tiles: items[newBoard._id].tiles,
            pods: items[newBoard._id].pods || [],
          };
        });
      } catch (e) {
        console.warn("Failed to update query cache for local board", e);
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
    if (tiles.length === 0) return 0;
    return Math.max(
      ...tiles.map((tile) => {
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
    (updatedTiles) => {
      setTiles(updatedTiles);

      queryClient.setQueryData(dashboardKeys.detail(id), (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tiles: updatedTiles,
        };
      });
    },
    [id, queryClient]
  );

  const updateTilesInLocalstorage = useCallback(
    (tileArray) => {
      if (!user) {
        const existingBoards = JSON.parse(
          localStorage.getItem("Dasify") || "[]"
        );
        const boardIndex = existingBoards.findIndex(
          (board) => board._id === activeBoard
        );
        if (boardIndex >= 0) {
          const updatedBoards = [...existingBoards];
          updatedBoards[boardIndex] = {
            ...updatedBoards[boardIndex],
            tiles: tileArray,
          };
          localStorage.setItem("Dasify", JSON.stringify(updatedBoards));
          setBoards(updatedBoards)
        }
      }
    },
    [user, activeBoard, setBoards]
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #63899e",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div style={{ color: "#666" }}>Loading dashboard...</div>
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
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ color: "#e74c3c", fontSize: "18px" }}>
          Error loading dashboard
        </div>
        <div style={{ color: "#666" }}>
          {error.message || "Something went wrong"}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px",
            backgroundColor: "#63899e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ color: "#666", fontSize: "18px" }}>
          Dashboard not found
        </div>
      </div>
    );
  }

  return (
    <div>
      {}
      {isFetching && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            backgroundColor: "#63899e",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 1000,
          }}
        >
          Updating...
        </div>
      )}

      {}
      <GridTiles
        tileCordinates={tiles}
        setTileCordinates={handleTileUpdate}
        activeBoard={activeBoard}
        updateTilesInLocalstorage={updateTilesInLocalstorage}
      />
    </div>
  );
}

export default OptimizedDashboardPage;
