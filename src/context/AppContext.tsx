

// This component must be used within client components only

import { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshToken?: boolean;
  bearer?: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppContextProviderProps {
  children: ReactNode;
  initialToken?: string | null;
  refreshToken?: boolean;
  bearer?: boolean;
}

/**
 * AppContextProvider manages the authentication token across the application.
 *
 * Usage in layout.tsx:
 * <Providers token={yourToken} queryClient={queryClient}>
 *   {children}
 * </Providers>
 *
 * Usage in components:
 * const { token, setToken, login, logout, isAuthenticated } = useAppContext();
 *
 * - token: Current authentication token
 * - setToken: Manually set the token
 * - login: Set a new token (equivalent to setToken)
 * - logout: Clear the token
 * - isAuthenticated: Boolean indicating if a token exists
 */
export function AppContextProvider({
  children,
  initialToken,
  refreshToken,
  bearer,
}: AppContextProviderProps) {
  const [token, setTokenState] = useState<string | null>(initialToken || null);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
  };

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const isAuthenticated = !!token;

  const value: AppContextType = {
    token,
    setToken,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    bearer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use the AppContext
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}

// Export the context for advanced usage
export { AppContext };
