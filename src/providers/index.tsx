/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppContextProvider } from '../context/AppContext';

export function Providers({
  children,
  queryClient,
  token,
  refreshToken = false,
  bearer,
}: {
  children: React.ReactNode;
  queryClient?: any;
  token?: any;
  refreshToken?: boolean;
  bearer?: boolean;
}) {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      ...queryClient,
    },
  });

  return (
    <AppContextProvider bearer={bearer} initialToken={token} refreshToken={refreshToken}>
      <QueryClientProvider client={defaultQueryClient}>{children}</QueryClientProvider>
    </AppContextProvider>
  );
}
