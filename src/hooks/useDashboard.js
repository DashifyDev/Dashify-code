import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOptimizedQuery, optimizedAxios } from "./useOptimizedQuery";

export const dashboardKeys = {
  all: ["dashboards"],
  lists: () => [...dashboardKeys.all, "list"],
  list: (filters) => [...dashboardKeys.lists(), { filters }],
  details: () => [...dashboardKeys.all, "detail"],
  detail: (id) => [...dashboardKeys.details(), id],
};

export const useDashboard = (id) => {
  return useOptimizedQuery(
    dashboardKeys.detail(id),
    async () => {
      // If there's a locally created board stored in localStorage (guest mode),
      // return it directly to avoid calling the API which expects ObjectId _id.
      if (typeof window !== "undefined") {
        try {
          const localBoards = JSON.parse(
            localStorage.getItem("Dasify") || "[]"
          );
          const localBoard = localBoards.find((b) => b._id === id);
          if (localBoard) {
            return localBoard;
          }
        } catch (err) {
          // ignore parse errors and fall back to API
          console.warn("useDashboard: failed to read local boards", err);
        }
      }

      const response = await optimizedAxios.get(`/api/dashboard/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
      select: (data) => ({
        ...data,
        tiles: data.tiles || [],
        pods: data.pods || [],
      }),
    }
  );
};

export const useUserDashboards = (userId, sessionId) => {
  return useQuery({
    queryKey: dashboardKeys.list({ userId, sessionId }),
    queryFn: async () => {
      const params = userId ? { id: userId } : { sid: sessionId };
      const response = await optimizedAxios.get("/api/dashboard/addDashboard", {
        params,
      });
      return response.data;
    },
    enabled: !!(userId || sessionId),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useAdminDashboards = () => {
  return useQuery({
    queryKey: dashboardKeys.list({ admin: true }),
    queryFn: async () => {
      const response = await optimizedAxios.get(
        "/api/dashboard/defaultDashboard"
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

export const useCreateDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dashboardData) => {
      const response = await optimizedAxios.post(
        "/api/dashboard/addDashboard",
        dashboardData
      );
      return response.data;
    },
    onSuccess: (newDashboard) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
      queryClient.setQueryData(
        dashboardKeys.detail(newDashboard._id),
        newDashboard
      );
    },
  });
};

export const useUpdateDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await optimizedAxios.patch(`/api/dashboard/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedDashboard) => {
      queryClient.setQueryData(
        dashboardKeys.detail(updatedDashboard._id),
        updatedDashboard
      );
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
    },
  });
};

export const useDeleteDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await optimizedAxios.delete(`/api/dashboard/${id}`);
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: dashboardKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
    },
  });
};
