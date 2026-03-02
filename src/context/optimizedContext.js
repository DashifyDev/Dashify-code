"use client";

import React, { createContext, useContext, useMemo, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useDashboard, useUserDashboards, useAdminDashboards } from "@/hooks/useDashboard";
import { globalContext } from "@/context/globalContext";

const OptimizedContext = createContext();

export const useOptimizedContext = () => {
  const context = useContext(OptimizedContext);
  if (!context) {
    throw new Error("useOptimizedContext must be used within OptimizedContextProvider");
  }
  return context;
};

export const OptimizedContextProvider = ({ children }) => {
  const { user, isLoading: userLoading } = useUser();
  const queryClient = useQueryClient();

  // Resolve backend user id (Mongo _id) for authenticated users so we can
  // request dashboards by userId instead of by sessionId (Auth0 sub).
  const [resolvedUserId, setResolvedUserId] = useState(null);

  // Use backend user id only from AppContext (single source of truth). Do not
  // call getUser here to avoid duplicate user creation and duplicate migration.
  const appContext = useContext(globalContext);
  const appDbUser = appContext?.dbUser;

  useEffect(() => {
    if (!user) {
      setResolvedUserId(null);
      return;
    }
    if (appDbUser?._id) {
      setResolvedUserId(appDbUser._id);
    }
  }, [user, appDbUser]);

  // Clear cache when user state changes
  useEffect(() => {
    if (!user) {
      // Clear all caches on logout
      queryClient.clear();
    }
  }, [user, queryClient]);

  const {
    data: userDashboards = [],
    isLoading: dashboardsLoading,
    error: dashboardsError,
  } = useUserDashboards(
    // Only for authenticated users
    user ? resolvedUserId : null,
    // Don't pass sessionId for guests
    null
  );

  const { data: adminDashboards = [], isLoading: adminLoading } = useAdminDashboards();

  const allBoards = useMemo(() => {
    if (user) {
      // For authenticated users - only their private dashboards
      return userDashboards;
    } else {
      // For guests - ONLY admin dashboards
      return adminDashboards;
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
        console.warn("setBoards is deprecated. Use React Query mutations instead.");
      },
      setTiles: () => {
        console.warn("setTiles is deprecated. Use React Query mutations instead.");
      },
      setActiveBoard: () => {
        console.warn("setActiveBoard is deprecated. Use URL state instead.");
      },
    }),
    [user, userLoading, allBoards, dashboardsLoading, adminLoading, dashboardsError, queryClient]
  );

  return <OptimizedContext.Provider value={contextValue}>{children}</OptimizedContext.Provider>;
};

export const useDashboardData = dashboardId => {
  return useDashboard(dashboardId);
};

export const useCurrentUserBoards = () => {
  const { user } = useUser();
  return useUserDashboards(
    user?.sub,
    !user && typeof window !== "undefined" ? localStorage.getItem("sessionId") : null
  );
};
