import apiClient from '../../../services/api.client';
import type { UserRole } from '../../auth/types/auth.types';
import type { Hotel } from '../../hotel/types/hotel.types';

export interface ProfileTenant {
    id: number;
    name: string;
    isActive?: boolean;
}

export interface CurrentProfile {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: UserRole;
    isActive: boolean;
    accountStatus?: 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED';
    tenantId?: number | null;
    tenant?: ProfileTenant | null;
    hotels?: Hotel[];
}

export interface UpdateProfilePayload {
    firstName?: string;
    lastName?: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export const profileService = {
    getCurrentProfile: () =>
        apiClient.get<CurrentProfile>('/users/me').then((response) => response.data),

    updateProfile: (payload: UpdateProfilePayload) =>
        apiClient.patch<CurrentProfile>('/users/me', payload).then((response) => response.data),

    changePassword: (payload: ChangePasswordPayload) =>
        apiClient.patch<{ message: string }>('/users/me/password', payload).then((response) => response.data),
};
