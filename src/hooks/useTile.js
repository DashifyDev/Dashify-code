import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "./useDashboard";
import axios from "axios";

export const useCreateTile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tileData) => {
      const response = await axios.post("/api/tile/tile", tileData);
      return response.data;
    },
    onSuccess: (newTile, variables) => {
      const dashboardId = variables.dashboardId;
      queryClient.setQueryData(dashboardKeys.detail(dashboardId), (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tiles: [...(oldData.tiles || []), newTile],
        };
      });
    },
  });
};

export const useUpdateTile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tileId, data }) => {
      const formData = new FormData();
      formData.append("formValue", JSON.stringify(data));

      const response = await axios.patch(`/api/tile/${tileId}`, formData);
      return response.data;
    },
    onMutate: async ({ tileId, data }) => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.all });

      const previousDashboards = queryClient.getQueriesData({
        queryKey: dashboardKeys.all,
      });

      queryClient.setQueriesData({ queryKey: dashboardKeys.all }, (oldData) => {
        if (!oldData || !oldData.tiles) return oldData;

        const tileIndex = oldData.tiles.findIndex(
          (tile) => tile._id === tileId,
        );
        if (tileIndex === -1) return oldData;

        const updatedTiles = [...oldData.tiles];
        updatedTiles[tileIndex] = { ...updatedTiles[tileIndex], ...data };

        return {
          ...oldData,
          tiles: updatedTiles,
        };
      });

      return { previousDashboards };
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

export const useDeleteTile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tileId) => {
      const response = await axios.delete(`/api/tile/${tileId}`);
      return response.data;
    },
    onMutate: async (tileId) => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.all });

      const previousDashboards = queryClient.getQueriesData({
        queryKey: dashboardKeys.all,
      });

      queryClient.setQueriesData({ queryKey: dashboardKeys.all }, (oldData) => {
        if (!oldData || !oldData.tiles) return oldData;

        return {
          ...oldData,
          tiles: oldData.tiles.filter((tile) => tile._id !== tileId),
        };
      });

      return { previousDashboards };
    },
    onError: (err, tileId, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};
