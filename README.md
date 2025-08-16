# plugandplay-react-query-hooks

A collection of React hooks and providers for data fetching using React Query, with built-in authentication and alert management.

## Features

- 🔄 Built on top of React Query for powerful data fetching
- 🔒 Built-in authentication management
- 🔔 Integrated alert system
- 📦 TypeScript support
- ⚡ Next.js compatible

## Installation

```bash
npm install plugandplay-react-query-hooks @tanstack/react-query axios
# or
yarn add plugandplay-react-query-hooks @tanstack/react-query axios
```

## Peer Dependencies

- React (^16.8.0 || ^17.0.0 || ^18.0.0)
- @tanstack/react-query (^4.0.0 || ^5.0.0)
- axios (^1.0.0)

## Basic Usage

## 1. Create a Provider
In component create a provider specilay when using next js

```tsx
'use client'; // For next js
import React from 'react';
import { Providers } from 'plugandplay-react-query-hooks';

const queryClient = {
  queries: {
    // Default settings for react-query
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1, // Retry failed queries once
  },
};

export default function ReactProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers bearer={false} queryClient={queryClient}>
      {children}
    </Providers>
  );
}
```

### Explanation
- __'use client'__: Required in Next.js App Router to mark this file as a client component. The `Providers` wrapper uses React hooks/context and must run on the client.
- __`Providers`__: Wraps both React Query's `QueryClientProvider` and the app auth context `AppContextProvider` and `Axios`. This gives your app data fetching and auth state in one place.
- __`queryClient`__: An object for React Query `defaultOptions`. It is passed to `new QueryClient({ defaultOptions: { ...queryClient } })`. Configure `staleTime`, `gcTime`, `retry`, etc., here.
- __`token`__ (optional): Initial auth token to seed context. You can read it from cookies/localStorage or call `useAppContext().login(token)` later after login.
- __`refreshToken`__ (optional, default `false`): Enables a 401 response interceptor in `src/api/index.ts` that simulates refreshing tokens. Replace the simulated section with your real refresh endpoint.
- __`bearer`__ (optional): Controls the Authorization header format. If `true`, it sends `Authorization: Bearer <token>`; if `false`, it sends the raw `token`. Set according to your API's expectation.
- __Where to use__: Wrap your root layout.
  - Next.js App Router: in `app/layout.tsx` (client component).
  - React (CRA/Vite): in `src/main.tsx` or `src/index.tsx`.

## 2. Use the Provider in your root app
Wrap your entire app with the providers created in component

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

import ReactProvider from './components/Provider';
import { Navigation } from './components/Navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Inventory Management App',
  description: 'Manage your inventory with ease',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} `}>
        <ReactProvider>
          <Navigation />
          <main className="container mx-auto">{children}</main>
        </ReactProvider>
      </body>
    </html>
  );
}
```

## Authentication Flow

### Basic Authentication

This example shows a complete login flow with:
- Token persistence in localStorage
- Automatic token restoration on page load
- Loading states
- Form handling
- Logout functionality

```tsx
import { useEffect } from 'react';
import { useUnauthenticatedPostData, useAppContext } from 'plugandplay-react-query-hooks';

function LoginComponent() {
  // Get setToken from context - this will update the auth state across the app
  const { setToken } = useAppContext();

  // Use unauthenticated mutation for login endpoint
  const { mutate: loginMutate, isLoading } = useUnauthenticatedPostData(
    'https://api.example.com',
    '/auth/login'
  );

  // On component mount, check localStorage for existing token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setToken(token); // Restore auth state if token exists
    }
  }, [setToken]);

  // Handle login form submission
  const handleLogin = async (email: string, password: string) => {
    try {
      const { data } = await loginMutate({ email, password });
      localStorage.setItem('token', data.token); // Persist token
      setToken(data.token); // Update auth state
    } catch (error) {
      console.error('Login failed:', error);
      // Add your error handling here (e.g., show error message)
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove persisted token
    setToken(null); // Clear auth state
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleLogin(
        formData.get('email') as string,
        formData.get('password') as string
      );
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Log in'}
      </button>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </form>
  );
}
```

## `useGetData` Hook – Props Table

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `baseUrl` | `string` | ✅ Yes | — | Base URL of the API (e.g., `https://api.example.com`). |
| `endpoint` | `string` | ✅ Yes | — | API endpoint path (e.g., `/users`). |
| `query` | `Record<string, any>` | ❌ No | `{}` | Optional query parameters object (e.g., `{ page: 1, limit: 10 }`). Passed as `params` in the request. |
| `options` | `Omit<UseQueryOptions<ApiResponse<TData>, Error, ApiResponse<TData>, any>, "queryFn">` | ❌ No | `{}` | React Query options for customizing the query (except `queryFn`, which is handled internally). Includes:<br/>• `queryKey` – Custom query key for caching (e.g., `['users', { page: 1 }]`)<br/>• `enabled` – Boolean to control if query should run<br/>• `staleTime` – Time in ms before data is considered stale<br/>• Any other supported React Query options |

---

### Return Value
Returns a standard **React Query result object**, including:  
- `data` – Response data from the API  
- `isLoading` – Loading state  
- `error` – Error object (if request fails)  
- `refetch` – Function to manually refetch data  
- ...all other fields from [`useQuery`](https://tanstack.com/query/v4/docs/react/reference/useQuery)  

---

### Example

```tsx
// Basic usage
const { data, isLoading } = useGetData<UserType>(
  'https://api.example.com',
  '/users',
  { page: 1 }
);

// With custom queryKey and options
const { data } = useGetData<UserType>(
  'https://api.example.com',
  '/users',
  { page: 1 },
  {
    queryKey: ['users', 'list', { page: 1 }],
    enabled: true,
    staleTime: 5000
  }
);
```

## `usePostData` Hook – Props Table

| Config Property     | Type | Required | Default | Description |
|---------------------|------|----------|---------|-------------|
| `baseUrl` | `string` | ✅ Yes | — | Base URL of the API (e.g., `https://api.example.com`). |
| `endpoint` | `string` | ✅ Yes | — | API endpoint path (e.g., `/users`). |
| `invalidateQueryKey` | `string \| string[]` | ❌ No | — | Query key(s) to invalidate after a successful mutation. Can be a single string or an array of strings. |
| `axiosConfig` | `AxiosRequestConfig` \| `any` | ❌ No | `{}` | Extra Axios config (e.g., `{ headers, timeout, params }`). Passed directly into `axios.post()`. |
| `options` | `MutationOptions<ApiResponse<TData>, Error, TVariables>` | ❌ No | `{}` | React Query mutation options. Includes:<br/>• `onSuccess` – Callback after a successful mutation (query invalidation is handled automatically if `invalidateQueryKey` is provided).<br/>• `onError` – Callback on error.<br/>• `mutationKey` – Custom key for the mutation.<br/>• Any other supported React Query mutation options. |

---

### Return Value
Returns a standard **React Query `useMutation` result object**, including:  
- `mutate` – Function to trigger the mutation  
- `mutateAsync` – Promise-based version of `mutate`  
- `data` – Response data from the mutation  
- `isLoading` – Loading state during the request  
- `error` – Error object (if request fails)  
- ...all other fields from [`useMutation`](https://tanstack.com/query/v4/docs/react/reference/useMutation)  

---

### Example

```tsx
// Basic usage
const { mutate, isLoading } = usePostData({
  baseUrl: 'https://api.example.com',
  endpoint: '/users',
});

// Trigger the mutation
mutate({ name: 'John Doe', email: 'john@example.com' });


// With query invalidation + options
const { mutate } = usePostData({
  baseUrl: 'https://api.example.com',
  endpoint: '/users',
  invalidateQueryKey: ['users', 'list'],
  options: {
    onSuccess: (data) => {
      console.log('User created:', data);
    },
    onError: (error) => {
      console.error('Error creating user:', error);
    },
  },
});


// With axiosConfig (custom headers + timeout)
const { mutate } = usePostData<UserResponse, CreateUserPayload>({
  baseUrl: 'https://api.example.com',
  endpoint: '/users',
  axiosConfig: {
    headers: { Authorization: 'Bearer token123' },
    timeout: 5000,
  },
  options: {
    onSuccess: (data) => console.log('User created:', data),
  },
});


// Async version
const { mutateAsync } = usePostData({
  baseUrl: 'https://api.example.com',
  endpoint: '/users',
});

const handleSubmit = async () => {
  try {
    const response = await mutateAsync({ name: 'Jane Doe', email: 'jane@example.com' });
    console.log('User created:', response);
  } catch (error) {
    console.error(error);
  }
};
```


## `usePutData` Hook – Props Table

| Config Property     | Type | Required | Default | Description |
|---------------------|------|----------|---------|-------------|
| `baseUrl` | `string` | ✅ Yes | — | Base URL of the API (e.g., `https://api.example.com`). |
| `endpoint` | `string` | ✅ Yes | — | API endpoint path (e.g., `/users`). |
| `invalidateQueryKey` | `string \| string[]` | ❌ No | — | Query key(s) to invalidate after a successful mutation. Can be a single string or an array of strings. |
| `axiosConfig` | `AxiosRequestConfig` \| `any` | ❌ No | `{}` | Extra Axios config (e.g., `{ headers, timeout, params }`). Passed directly into `axios.put()`. |
| `options` | `MutationOptions<ApiResponse<TData>, Error, TVariables>` | ❌ No | `{}` | React Query mutation options (e.g., `onSuccess`, `onError`, `mutationKey`, etc.). |

---

### Example

```tsx
// Basic usage
const { mutate } = usePutData({
  baseUrl: 'https://api.example.com',
  endpoint: '/items',
});

mutate({ id: '12345', name: 'Updated Item' });


// With query invalidation + dynamic endpoint
const { mutate } = usePutData({
  baseUrl: 'https://api.example.com',
  endpoint: '/items',
  invalidateQueryKey: ['items'],
  options: {
    onSuccess: () => console.log('Item updated successfully'),
  },
});

// With axiosConfig (custom headers + timeout)
const { mutate } = usePutData({
  baseUrl: 'https://api.example.com',
  endpoint: '/items',
  invalidateQueryKey: ['items'],
  axiosConfig: {
    headers: { Authorization: 'Bearer token123' },
    timeout: 5000,
  },
  options: {
    onSuccess: () => console.log('Item updated successfully'),
  },
});

// Async version
const { mutateAsync } = usePutData({
  baseUrl: 'https://api.example.com',
  endpoint: '/profile',
});

const updateProfile = async () => {
  try {
    const response = await mutateAsync({ name: 'Jane Doe', email: 'jane@example.com' });
    console.log('Profile updated:', response);
  } catch (error) {
    console.error(error);
  }
};
```


## `useUnauthenticatedPostData` Hook – Props Table

| Config Property     | Type | Required | Default | Description |
|---------------------|------|----------|---------|-------------|
| `baseUrl` | `string` | ✅ Yes | — | Base URL of the API (e.g., `https://api.example.com`). |
| `endpoint` | `string` | ✅ Yes | — | API endpoint path (e.g., `/auth/login`). |
| `axiosConfig` | `AxiosRequestConfig` \| `any` | ❌ No | `{}` | Extra Axios config (e.g., `{ headers, timeout }`). |
| `options` | `MutationOptions<TResponse, Error, TVariables>` | ❌ No | `{}` | React Query mutation options (e.g., `onSuccess`, `onError`). |

---

### Return Value
Returns a standard **React Query `useMutation` result object**, including:  
- `mutate` – Function to trigger the mutation  
- `mutateAsync` – Promise-based version of `mutate`  
- `data` – Response data from the mutation  
- `isLoading` – Loading state during the request  
- `error` – Error object (if request fails)  

---

### Example

```tsx
// Basic login usage
const { mutate } = useUnauthenticatedPostData<LoginResponse, LoginPayload>({
  baseUrl: 'https://api.example.com',
  endpoint: '/auth/login',
});

// Trigger login
mutate({ 
  email: 'user@example.com', 
  password: 'password123' 
});


// With custom headers and error handling
const { mutateAsync } = useUnauthenticatedPostData<LoginResponse, LoginPayload>({
  baseUrl: 'https://api.example.com',
  endpoint: '/auth/login',
  axiosConfig: {
    headers: {
      'X-Client-Version': '1.0.0'
    },
    timeout: 5000
  },
  options: {
    onSuccess: (data) => {
      console.log('Login successful:', data);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    }
  }
});

// Async usage with try-catch
try {
  const response = await mutateAsync({ 
    email: 'user@example.com', 
    password: 'password123' 
  });
  console.log('Login successful:', response);
} catch (error) {
  console.error('Login failed:', error);
}
```

## `useDeleteData` Hook – Props Table

| Config Property     | Type | Required | Default | Description |
|---------------------|------|----------|---------|-------------|
| `baseUrl` | `string` | ✅ Yes | — | Base URL of the API (e.g., `https://api.example.com`). |
| `endpoint` | `string` | ✅ Yes | — | API endpoint path (e.g., `/users/123`). |
| `invalidateQueryKey` | `string \| string[]` | ❌ No | — | Query key(s) to invalidate after successful deletion. |
| `axiosConfig` | `AxiosRequestConfig` \| `any` | ❌ No | `{}` | Extra Axios config (e.g., `{ headers, timeout }`). |
| `options` | `MutationOptions<TData, Error, void>` | ❌ No | `{}` | React Query mutation options. |

---

### Return Value
Returns a standard **React Query `useMutation` result object**, including:  
- `mutate()` – Function to trigger the deletion  
- `mutateAsync()` – Promise-based version of `mutate`  
- `isLoading` – Loading state during the request  
- `error` – Error object (if request fails)  

---

### Example

```tsx
// Basic usage
const { mutate: deleteUser } = useDeleteData<void>({
  baseUrl: 'https://api.example.com',
  endpoint: `/users/${userId}`,
  invalidateQueryKey: 'users'
});

// Trigger deletion
deleteUser();


// With multiple query invalidation and error handling
const { mutateAsync: deletePost } = useDeleteData<void>({
  baseUrl: 'https://api.example.com',
  endpoint: `/posts/${postId}`,
  invalidateQueryKey: ['posts', `user-${userId}-posts`],
  axiosConfig: {
    headers: {
      'X-Delete-Reason': 'user-requested'
    }
  },
  options: {
    onSuccess: () => {
      console.log('Post deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete post:', error);
    }
  }
});

// Async usage with try-catch
try {
  await deletePost();
  console.log('Post deleted');
} catch (error) {
  console.error('Delete failed:', error);
}
```

### CRUD Operations Example
```tsx
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function TodoList() {
  // Fetch todos
  const { data: todos, isLoading } = useGetData<Todo[]>({
    baseUrl: 'https://api.example.com',
    endpoint: '/todos',
    options: {
      queryKey: ['todos'],
      staleTime: 30000 // 30 seconds
    }
  });

  // Create todo
  const { mutate: createTodo } = usePostData<Todo, Omit<Todo, 'id'>>({ 
    baseUrl: 'https://api.example.com',
    endpoint: '/todos',
    invalidateQueryKey: 'todos',
    options: {
      onSuccess: (newTodo) => {
        console.log('Created:', newTodo);
      }
    }
  });

  // Update todo
  const { mutate: updateTodo } = usePutData<Todo, Partial<Todo>>({ 
    baseUrl: 'https://api.example.com',
    endpoint: '/todos',
    invalidateQueryKey: 'todos',
    options: {
      onSuccess: (updatedTodo) => {
        console.log('Updated:', updatedTodo);
      }
    }
  });

  // Delete todo
  const { mutate: deleteTodo } = useDeleteData<void>({ 
    baseUrl: 'https://api.example.com',
    endpoint: '/todos',
    invalidateQueryKey: 'todos',
    options: {
      onSuccess: () => {
        console.log('Todo deleted');
      }
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Todo List</h1>
      
      {/* Create todo */}
      <button onClick={() => createTodo({ title: 'New Todo', completed: false })}>
        Add Todo
      </button>

      {/* List todos */}
      <ul>
        {todos?.map(todo => (
          <li key={todo.id}>
            <span>{todo.title}</span>
            
            {/* Toggle completion */}
            <button onClick={() => updateTodo({ 
              id: todo.id, 
              completed: !todo.completed 
            })}>
              {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>

            {/* Delete todo */}
            <button onClick={() => deleteTodo()}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```
## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
