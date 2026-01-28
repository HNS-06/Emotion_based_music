import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { backend } from '../backend'; // Import the mock backend

// Define the context shape
interface ActorContextType {
    actor: typeof backend | null;
    isFetching: boolean;
}

const ActorContext = createContext<ActorContextType | null>(null);

export const ActorProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useInternetIdentity();
    const [actor, setActor] = useState<typeof backend | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        // Always set the mock actor to allow the app to function without login
        setActor(backend);
    }, []);

    return (
        <ActorContext.Provider value={{ actor, isFetching }}>
            {children}
        </ActorContext.Provider>
    );
};

export const useActor = () => {
    const context = useContext(ActorContext);
    if (!context) {
        // throw new Error('useActor must be used within an ActorProvider');
        // Fallback for parts of the app that might use it outside provider or initialization
        return { actor: backend, isFetching: false };
    }
    return context;
};
