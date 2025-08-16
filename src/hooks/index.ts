import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { createApiClient, createUnauthenticatedApiClient } from "../api";
import { useAppContext } from "../context/AppContext";

// Generic types for API responses
export type ApiResponse<T = unknown> = T;

// Types for mutation options
export type MutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = unknown,
  TContext = unknown
> = Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "mutationFn">;

// Types for query parameters
export type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Hook for making GET requests with React Query
 * @param baseUrl - Base URL for the API (e.g., 'https://api.example.com')
 * @param endpoint - API endpoint path (e.g., '/users')
 * @param query - Optional query parameters object (e.g., { page: 1, limit: 10 })
 * @param options - React Query options including:
 *   - queryKey: Custom query key for caching (e.g., ['users', { page: 1 }])
 *   - enabled: Boolean to control query execution
 *   - staleTime: Duration in ms before data becomes stale
 *   - ...other React Query options
 * @returns React Query result object with data, isLoading, error, etc.
 * 
 * @example
 * // Basic usage
 * const { data, isLoading } = useGetData<UserType>(
 *   'https://api.example.com',
 *   '/users',
 *   { page: 1 }
 * );
 * 
 * // With custom queryKey and options
 * const { data } = useGetData<UserType>(
 *   'https://api.example.com',
 *   '/users',
 *   { page: 1 },
 *   {
 *     queryKey: ['users', 'list', { page: 1 }],
 *     enabled: true,
 *     staleTime: 5000
 *   }
 * );
 */
export const useGetData = <TData = unknown>(
  baseUrl: string,
  endpoint: string,
  query: QueryParams = {},
  options: Omit<UseQueryOptions<ApiResponse<TData>, Error, ApiResponse<TData>, any>, "queryFn"> = {}
) => {
  const { token, refreshToken, bearer } = useAppContext();
  const apiClient = createApiClient(
    baseUrl,
    token || "",
    refreshToken || false,
    bearer || false
  );

  const fetchData = async (): Promise<ApiResponse<TData>> => {
    const response = await apiClient.get(endpoint, { params: query });
    return response.data;
  };

  return useQuery<ApiResponse<TData>, Error>({    
    queryKey: options.queryKey,
    queryFn: fetchData,
    ...options
  });
};

/**
 * Hook for POST requests
 * @param config - Configuration object
 * @returns useMutation result object
 */
export const usePostData = <TData = unknown, TVariables = unknown>(config: {
  baseUrl: string;
  endpoint: string;
  invalidateQueryKey?: string | string[];
  axiosConfig?:any
  options?: MutationOptions<ApiResponse<TData>, Error, TVariables>;
}) => {
  const { baseUrl, endpoint, invalidateQueryKey, axiosConfig, options = {} } = config;

  const { token, refreshToken, bearer } = useAppContext();
  const queryClient = useQueryClient();
  const apiClient = createApiClient(
    baseUrl,
    token || "",
    refreshToken || false,
    bearer || false,
    axiosConfig
  );

  const postData = async (data: TVariables): Promise<ApiResponse<TData>> => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  };

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: postData,
    onSuccess: (data, variables, context) => {
      // Invalidate provided key(s) if any
      if (invalidateQueryKey) {
        if (Array.isArray(invalidateQueryKey)) {
          invalidateQueryKey.forEach((key) =>
            queryClient.invalidateQueries({ queryKey: [key] })
          );
        } else {
          queryClient.invalidateQueries({ queryKey: [invalidateQueryKey] });
        }
      }

      // Call user-provided onSuccess
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};


/**
 * Hook for PUT requests
 * @param config - Configuration object
 * @returns useMutation result object
 */
export const usePutData = <TData = unknown, TVariables = unknown>(config: {
  baseUrl: string;
  endpoint: string;
  invalidateQueryKey?: string | string[];
  axiosConfig?: any;
  options?: MutationOptions<ApiResponse<TData>, Error, TVariables>;
}) => {
  const { baseUrl, endpoint, invalidateQueryKey, axiosConfig, options = {} } = config;

  const { token, refreshToken, bearer } = useAppContext();
  const queryClient = useQueryClient();
  const apiClient = createApiClient(
    baseUrl,
    token || "",
    refreshToken || false,
    bearer || false,
    axiosConfig
  );

  const putData = async (data: TVariables): Promise<ApiResponse<TData>> => {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  };

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: putData,
    onSuccess: (data, variables, context) => {
      // Invalidate provided key(s) if any
      if (invalidateQueryKey) {
        if (Array.isArray(invalidateQueryKey)) {
          invalidateQueryKey.forEach((key) =>
            queryClient.invalidateQueries({ queryKey: [key] })
          );
        } else {
          queryClient.invalidateQueries({ queryKey: [invalidateQueryKey] });
        }
      }

      // Call user-provided onSuccess
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};


interface UseUnauthenticatedPostDataParams<TResponse, TVariables> {
  baseUrl: string;
  endpoint: string;
  axiosConfig?: any;
  options?: MutationOptions<TResponse, Error, TVariables>;
}

export const useUnauthenticatedPostData = <
  TResponse = unknown,
  TVariables = unknown
>({
  baseUrl,
  endpoint,
  axiosConfig,
  options = {},
}: UseUnauthenticatedPostDataParams<TResponse, TVariables>) => {
  const queryClient = useQueryClient();
  const apiClient = createUnauthenticatedApiClient(baseUrl, axiosConfig);

  const postData = async (data: TVariables): Promise<TResponse> => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  };

  return useMutation<TResponse, Error, TVariables>({
    mutationFn: postData,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });

      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

/**
 * Hook for DELETE requests
 * @param baseUrl - Base URL for the API
 * @param endpoint - API endpoint
 * @param options - Additional options for useMutation
 * @returns useMutation result object
 */
export const useDeleteData = <TData = unknown>(config: {
  baseUrl: string;
  endpoint: string;
  invalidateQueryKey?: string | string[];
  axiosConfig?: any;
  options?: MutationOptions<ApiResponse<TData>, Error, void>;
}) => {
  const { baseUrl, endpoint, invalidateQueryKey, axiosConfig, options = {} } = config;

  const { token, refreshToken, bearer } = useAppContext();
  const queryClient = useQueryClient();
  const apiClient = createApiClient(
    baseUrl,
    token || "",
    refreshToken || false,
    bearer || false,
    axiosConfig
  );

  const deleteData = async (): Promise<ApiResponse<TData>> => {
    const response = await apiClient.delete(endpoint);
    return response.data;
  };

  return useMutation<ApiResponse<TData>, Error, void>({
    mutationFn: deleteData,
    onSuccess: (data, variables, context) => {
      // Invalidate provided key(s) if any
      if (invalidateQueryKey) {
        if (Array.isArray(invalidateQueryKey)) {
          invalidateQueryKey.forEach((key) =>
            queryClient.invalidateQueries({ queryKey: [key] })
          );
        } else {
          queryClient.invalidateQueries({ queryKey: [invalidateQueryKey] });
        }
      }

      // Call user-provided onSuccess
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
