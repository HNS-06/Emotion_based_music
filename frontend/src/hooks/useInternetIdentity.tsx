import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the context shape
export type LoginStatus = 'idle' | 'logging-in' | 'success' | 'error';

interface InternetIdentityContextType {
  identity: Identity | null;
  isAuthenticated: boolean;
  authClient: AuthClient | null;
  login: () => void;
  logout: () => void;
  loginStatus: LoginStatus;
}

// Create the context
const InternetIdentityContext = createContext<InternetIdentityContextType | null>(null);

// Provider component
export const InternetIdentityProvider = ({ children }: { children: ReactNode }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');

  useEffect(() => {
    // Initialize AuthClient
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      const isAuth = await client.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        setIdentity(client.getIdentity());
        setLoginStatus('success');
      }
    });
  }, []);

  const login = async () => {
    if (!authClient) return;

    setLoginStatus('logging-in');

    // Determine the identity provider URL
    const identityProvider = process.env.DFX_NETWORK === 'local'
      ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943` // Default local II canister ID
      : 'https://identity.ic0.app';

    await authClient.login({
      identityProvider,
      onSuccess: () => {
        setIsAuthenticated(true);
        setIdentity(authClient.getIdentity());
        setLoginStatus('success');
      },
      onError: (err) => {
        console.error('Login failed', err);
        setLoginStatus('error');
      },
    });
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
    setIdentity(null);
    setLoginStatus('idle');
  };

  return (
    <InternetIdentityContext.Provider value={{ identity, isAuthenticated, authClient, login, logout, loginStatus }}>
      {children}
    </InternetIdentityContext.Provider>
  );
};

// Hook to use the context
export const useInternetIdentity = () => {
  const context = useContext(InternetIdentityContext);
  if (!context) {
    throw new Error('useInternetIdentity must be used within an InternetIdentityProvider');
  }
  return context;
};
