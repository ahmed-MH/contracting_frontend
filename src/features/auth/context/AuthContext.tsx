import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginResponse } from '../types/auth.types';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const HOTEL_ID_KEY = 'currentHotelId';

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithResponse: (response: LoginResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && !isTokenExpired(storedToken) && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(HOTEL_ID_KEY);
        }
        setIsLoading(false);
    }, []);

    const loginWithResponse = useCallback((response: LoginResponse) => {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setToken(response.accessToken);
        setUser(response.user);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await authService.login(email, password);
        loginWithResponse(response);
    }, [loginWithResponse]);

    const logout = useCallback(() => {
        // 1. Nuke localStorage — auth + hotel selection
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(HOTEL_ID_KEY);

        // 2. Reset React state
        setToken(null);
        setUser(null);

        // 3. Destroy entire React Query cache — prevents ghost data on re-login
        queryClient.clear();
    }, [queryClient]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                loginWithResponse,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
