import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useOptimizedQuery = (queryKey, queryFn, options = {}) => {
  const defaultOptions = {
    retry: (failureCount, error) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    ...options,
  };

  return useQuery({
    queryKey,
    queryFn,
    ...defaultOptions,
  });
};

export const optimizedAxios = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

optimizedAxios.interceptors.request.use(
  (config) => {
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

optimizedAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);
