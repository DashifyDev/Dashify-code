"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  useDashboard,
  useUserDashboards,
  useAdminDashboards,
} from "@/hooks/useDashboard";

const OptimizedContext = createContext();

export const useOptimizedContext = () => {
  const context = useContext(OptimizedContext);
  if (!context) {
    throw new Error(
      "useOptimizedContext must be used within OptimizedContextProvider"
    );
  }
  return context;
};

export const OptimizedContextProvider = ({ children }) => {
  const { user, isLoading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const {
    data: userDashboards = [],
    isLoading: dashboardsLoading,
    error: dashboardsError,
  } = useUserDashboards(
    null, // Don't use userId for Auth0 users
    user?.sub ||
      (typeof window !== "undefined" ? localStorage.getItem("sessionId") : null)
  );

  const { data: adminDashboards = [], isLoading: adminLoading } =
    useAdminDashboards();

  const allBoards = useMemo(() => {
    if (user) {
      return userDashboards;
    } else {
      return [...adminDashboards, ...userDashboards];
    }
  }, [user, userDashboards, adminDashboards]);

  const contextValue = useMemo(
    () => ({
      dbUser: user,
      userLoading,

      boards: allBoards,
      dashboardsLoading: dashboardsLoading || adminLoading,
      dashboardsError,

      queryClient,

      invalidateDashboards: () => {
        queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      },

      setBoards: () => {
        console.warn(
          "setBoards is deprecated. Use React Query mutations instead."
        );
      },
      setTiles: () => {
        console.warn(
          "setTiles is deprecated. Use React Query mutations instead."
        );
      },
      setActiveBoard: () => {
        console.warn("setActiveBoard is deprecated. Use URL state instead.");
      },
    }),
    [
      user,
      userLoading,
      allBoards,
      dashboardsLoading,
      adminLoading,
      dashboardsError,
      queryClient,
    ]
  );

  return (
    <OptimizedContext.Provider value={contextValue}>
      {children}
    </OptimizedContext.Provider>
  );
};

export const useDashboardData = (dashboardId) => {
  return useDashboard(dashboardId);
};

export const useCurrentUserBoards = () => {
  const { user } = useUser();
  return useUserDashboards(
    user?.sub,
    !user && typeof window !== "undefined"
      ? localStorage.getItem("sessionId")
      : null
  );
};
