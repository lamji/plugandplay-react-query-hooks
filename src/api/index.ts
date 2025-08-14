import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Creates an Axios instance with the provided base URL and token
 * @param baseUrl - The base URL for API requests
 * @param token - The authentication token
 * @param enableRefreshToken - Whether to enable token refresh functionality
 * @returns Configured Axios instance
 */
export const createApiClient = (
  baseUrl: string,
  token: string,
  enableRefreshToken: boolean = false,
  bearer: boolean,
): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      console.log('Request made with config:', bearer, token);
      // Add authorization header if token exists
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = bearer ? `Bearer ${token}` : token;
      }
      return config;
    },
    (error: Error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor to handle token refresh
  if (enableRefreshToken) {
    let isRefreshing: boolean = false;
    let failedQueue: QueueItem[] = [];

    const processQueue = (error: Error | null, token: string | null = null): void => {
      failedQueue.forEach((prom: QueueItem) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token!);
        }
      });

      failedQueue = [];
    };

    apiClient.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // If the error is due to an expired token (401) and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            // If we're already refreshing, add this request to the queue
            return new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((newToken: string) => {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
              })
              .catch((err: Error) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // In a real implementation, this would be a call to your refresh token endpoint
            // For this example, we'll simulate a successful token refresh
            console.log('Token expired. Attempting to refresh...');

            // Simulated token refresh - in a real app, this would be an API call
            // const response = await apiClient.post('/auth/refresh-token');
            // const newToken = response.data.token;

            // For demo purposes, we'll just create a new token
            const newToken: string = `refreshed_${token}_${Date.now()}`;

            // Update the token for future requests
            token = newToken;

            // Process the queue with the new token
            processQueue(null, newToken);

            // Update the Authorization header for the original request
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            isRefreshing = false;

            // Retry the original request with the new token
            return apiClient(originalRequest);
          } catch (refreshError) {
            // If refresh fails, process the queue with an error
            const error =
              refreshError instanceof Error ? refreshError : new Error('Token refresh failed');
            processQueue(error, null);
            isRefreshing = false;
            return Promise.reject(error);
          }
        }

        // If the error is not 401 or we've already tried to refresh, just reject
        return Promise.reject(error);
      },
    );
  }

  return apiClient;
};

/**
 * Creates an Axios instance for unauthenticated requests (like login)
 * @param baseUrl - The base URL for API requests
 * @returns Configured Axios instance without authentication
 */
export const createUnauthenticatedApiClient = (baseUrl: string): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Basic request interceptor (no auth token)
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      return config;
    },
    (error: Error) => {
      return Promise.reject(error);
    },
  );

  // Basic response interceptor (no token refresh logic)
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    },
  );

  return apiClient;
};
