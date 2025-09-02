"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDashboardData } from "@/context/optimizedContext";
import SimpleGridTiles from "@/components/SimpleGridTiles";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useUpdateTile } from "@/hooks/useTile";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/hooks/useDashboard";

function OptimizedDashboardPage() {
  const { id } = useParams();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const {
    data: dashboardData,
    isLoading,
    error,
    isFetching,
  } = useDashboardData(id);

  const [headerWidth, setHeaderWidth] = useState(0);
  const [selectedTile, setSelectedTile] = useState(null);
  const [showTileModal, setShowTileModal] = useState(false);

  const updateTileMutation = useUpdateTile();

  const { tiles, pods } = useMemo(() => {
    if (!dashboardData) return { tiles: [], pods: [] };
    return {
      tiles: dashboardData.tiles || [],
      pods: dashboardData.pods || [],
    };
  }, [dashboardData]);

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

  const handleTileClick = useCallback((tile, index) => {
    setSelectedTile({ tile, index });
    setShowTileModal(true);
  }, []);

  const handleTileDelete = useCallback(
    (tileId) => {
      queryClient.setQueryData(dashboardKeys.detail(id), (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tiles: oldData.tiles.filter((tile) => tile._id !== tileId),
        };
      });
    },
    [id, queryClient]
  );

  const handleTileClone = useCallback((tile) => {
    console.log("Clone tile:", tile);
  }, []);

  const updateTilesInLocalstorage = useCallback(
    (tiles) => {
      if (!user) {
        const existingBoards = JSON.parse(
          localStorage.getItem("Dasify") || "[]"
        );
        const boardIndex = existingBoards.findIndex(
          (board) => board._id === id
        );
        if (boardIndex >= 0) {
          existingBoards[boardIndex].tiles = tiles;
          localStorage.setItem("Dasify", JSON.stringify(existingBoards));
        }
      }
    },
    [user, id]
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
    <div className="optimized-dashboard-page">
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
      <SimpleGridTiles
        tiles={tiles}
        onTileUpdate={handleTileUpdate}
        onTileDelete={handleTileDelete}
        onTileClone={handleTileClone}
        onTileClick={handleTileClick}
        headerWidth={headerWidth}
        setHeaderWidth={setHeaderWidth}
        dbUser={user}
        updateTilesInLocalstorage={updateTilesInLocalstorage}
      />

      {}
      {showTileModal && selectedTile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3>Edit Tile</h3>
            <p>Tile ID: {selectedTile.tile._id}</p>
            <button
              onClick={() => setShowTileModal(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#63899e",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizedDashboardPage;
