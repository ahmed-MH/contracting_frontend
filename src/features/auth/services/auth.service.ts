import apiClient from '../../../services/api.client';
import type { AuthUser, LoginResponse } from '../types/auth.types';

// Re-export auth-only types for consumers
export type { AuthUser, LoginResponse };

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
        return data;
    },

    invite: async (payload: { email: string; role: string; hotelIds?: number[] }): Promise<{ message: string }> => {
        const { data } = await apiClient.post<{ message: string }>('/auth/invite', payload);
        return data;
    },

    acceptInvite: async (payload: {
        token: string;
        firstName: string;
        lastName: string;
        password: string;
    }): Promise<LoginResponse> => {
        const { data } = await apiClient.post<LoginResponse>('/auth/accept-invite', payload);
        return data;
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
        return data;
    },

    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
        return data;
    },

    getMe: async (): Promise<{ id: number; email: string; role: string }> => {
        const { data } = await apiClient.get('/auth/me');
        return data;
    },
};
