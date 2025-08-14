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
 * Hook for GET requests
 * @param baseUrl - Base URL for the API
 * @param endpoint - API endpoint
 * @param query - Query parameters
 * @param options - Additional options for useQuery
 * @returns useQuery result object
 */
export const useGetData = <TData = unknown>(
  baseUrl: string,
  endpoint: string,
  query: QueryParams = {},
  options: Omit<
    UseQueryOptions<ApiResponse<TData>, Error, ApiResponse<TData>, any>,
    "queryKey" | "queryFn"
  > = {}
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
    queryKey: ["data", baseUrl, endpoint, query] as const,
    queryFn: fetchData,
    ...options
  });
};

/**
 * Hook for POST requests
 * @param baseUrl - Base URL for the API
 * @param endpoint - API endpoint
 * @param options - Additional options for useMutation
 * @returns useMutation result object
 */
export const usePostData = <TData = unknown, TVariables = unknown>(
  baseUrl: string,
  endpoint: string,
  options: MutationOptions<ApiResponse<TData>, Error, TVariables> = {}
) => {
  const { token, refreshToken, bearer } = useAppContext();
  const queryClient = useQueryClient();
  const apiClient = createApiClient(
    baseUrl,
    token || "",
    refreshToken || false,
    bearer || false
  );

  const postData = async (data: TVariables): Promise<ApiResponse<TData>> => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  };

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: postData,
    onSuccess: (data, variables, context) => {
      // Invalidate queries that might be affected by this mutation
      queryClient.invalidateQueries({ queryKey: [endpoint] });

      // Call the onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

/**
 * Hook for PUT requests
 * @param baseUrl - Base URL for the API
 * @param endpoint - API endpoint
 * @param options - Additional options for useMutation
 * @returns useMutation result object
 */
/**
 * A flexible hook for performing PUT requests with dynamic endpoint generation.
 *
 * @template TData The type of data returned by the API
 * @template TVariables The type of data being sent in the request
 *
 * @param baseUrl The base URL of the API
 * @param endpoint The base endpoint for the request
 * @param options Additional mutation options, including an optional custom endpoint generator
 *
 * @returns A mutation hook for performing PUT requests
 *
 * @example
 * // Simple update with ID
 * const updateItem = usePutData<ItemResponse, ItemData>(BASE_URL, '/items');
 * updateItem.mutate({ id: '12345', name: 'Updated Item' });
 *
 * @example

 * updateMultipleItems.mutate({
 *   updates: [
 *     { itemId: '12345', quantity: 9 },
 *     { itemId: '67890', quantity: 4 }
 *   ]
 * });
 *
 * @example
 * // Update without ID
 * const updateProfile = usePutData<ProfileResponse, ProfileData>(
 *   BASE_URL,
 *   '/profile'
 * );
 * updateProfile.mutate({ name: 'John Doe', email: 'john@example.com' });
 */
export const usePutData = <TData = unknown, TVariables = unknown>(
  baseUrl: string,
  endpoint: string,
  options: MutationOptions<ApiResponse<TData>, Error, TVariables> & {
    getEndpoint?: (data: TVariables) => string;
  } = {}
) => {
  const { token, refreshToken, bearer } = useAppContext();
  const queryClient = useQueryClient();
  const apiClient = createApiClient(
    baseUrl,
    token || "",
    !!refreshToken,
    bearer || false
  );

  const putData = async (data: TVariables): Promise<ApiResponse<TData>> => {
    // Use custom endpoint generation if provided, otherwise fallback to default

    const response = await apiClient.put(endpoint, data);
    return response.data;
  };

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: putData,
    onSuccess: (data, variables, context) => {
      // Invalidate queries that might be affected by this mutation
      queryClient.invalidateQueries({ queryKey: [endpoint] });

      // Call the onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

/**
 * Hook for unauthenticated POST requests (like login)
 * @param baseUrl - Base URL for the API
 * @param endpoint - API endpoint
 * @param options - Additional options for useMutation
 * @returns useMutation result object
 */
export const useUnauthenticatedPostData = <
  TData = unknown,
  TVariables = unknown
>(
  baseUrl: string,
  endpoint: string,
  options: MutationOptions<ApiResponse<TData>, Error, TVariables> = {}
) => {
  const queryClient = useQueryClient();
  const apiClient = createUnauthenticatedApiClient(baseUrl);

  const postData = async (data: TVariables): Promise<ApiResponse<TData>> => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  };

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: postData,
    onSuccess: (data, variables, context) => {
      // Invalidate queries that might be affected by this mutation
      queryClient.invalidateQueries({ queryKey: [endpoint] });

      // Call the onSuccess callback if provided
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
export const useDeleteData = <TData = unknown>(
  baseUrl: string,
  endpoint: string,
  options: MutationOptions<ApiResponse<TData>, Error, void> = {}
) => {
  const { token, refreshToken, bearer } = useAppContext();
  const queryClient = useQueryClient();
  const apiClient = createApiClient(
    baseUrl,
    token || "",
    refreshToken || false,
    bearer || false
  );

  const deleteData = async (): Promise<ApiResponse<TData>> => {
    // For DELETE requests, the ID is already included in the endpoint (e.g., /delete/123)
    const response = await apiClient.delete(endpoint);
    return response.data;
  };

  return useMutation<ApiResponse<TData>, Error, void>({
    mutationFn: deleteData,
    onSuccess: (data, variables, context) => {
      // Invalidate queries that might be affected by this mutation
      queryClient.invalidateQueries({ queryKey: [endpoint] });

      // Call the onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};
