"use client";

import React, {
  useEffect,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { globalContext } from "@/context/globalContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/hooks/useDashboard";

const GridTiles = dynamic(() => import("@/components/GridTiles"), {
  loading: () => <DashboardSkeleton />,
  ssr: false,
});

const TipTapEditor = dynamic(
  () => import("@/components/TipTapEditor/TipTapMainEditor"),
  {
    loading: () => <div>Loading editor...</div>,
    ssr: false,
  },
);

const DashboardSkeleton = () => (
  <div className="animate-pulse p-4">
    <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
  </div>
);

function OptimizedDashboard({ params }) {
  const { id } = params;
  const queryClient = useQueryClient();
  const {
    dbUser,
    tiles,
    setTiles,
    boards,
    setBoards,
    activeBoard,
    setActiveBoard,
    setHeaderWidth,
  } = useContext(globalContext);

  const { data: dashboardData, isLoading, error } = useDashboard(id);

  const assignDatatoUser = useCallback(
    (data) => {
      if (data && data.tiles) {
        setTiles(data.tiles);
        setActiveBoard(data);
      }
    },
    [setTiles, setActiveBoard],
  );

  useEffect(() => {
    if (dashboardData) {
      assignDatatoUser(dashboardData);
    }
  }, [dashboardData, assignDatatoUser]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (
    !dashboardData ||
    !dashboardData.tiles ||
    dashboardData.tiles.length === 0
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No Tiles Found
          </h2>
          <p className="text-gray-500">This dashboard appears to be empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <GridTiles
        tileCordinates={tiles}
        setTileCordinates={setTiles}
        activeBoard={activeBoard}
        updateTilesInLocalstorage={(updatedTiles) => {
          // Update React Query cache
          queryClient.setQueryData(dashboardKeys.detail(id), (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: updatedTiles,
            };
          });
        }}
      />
    </div>
  );
}

export default OptimizedDashboard;
