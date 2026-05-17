import apiClient from '../../../services/api.client';

// ─── Types ────────────────────────────────────────────────────────

export interface UserListItem {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isActive: boolean;
    accountStatus?: 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED';
    hotels?: { id: number; name: string }[];
    createdAt: string;
}

export interface UpdateUserPayload {
    firstName?: string;
    lastName?: string;
    role?: string;
    hotelIds?: number[];
}

export interface TenantUsage {
    hasTenant: boolean;
    requiresOrganizationSetup: boolean;
    tenantId: number | null;
    tenantName: string | null;
    hasPlan: boolean;
    plan: {
        id: number;
        name: string;
        description: string;
        billingType: 'RECURRING' | 'ONE_TIME';
        monthlyPrice: number;
        currency: string;
        maxHotels: number;
        maxUsers: number;
        apiAccess: boolean;
        supportTier: string;
        features: string[];
    } | null;
    planName: string | null;
    billingStatus: string;
    apiAccess: boolean;
    canUseApiAccess: boolean;
    users: {
        used: number | null;
        limit: number | null;
        active: number | null;
        pendingInvites: number | null;
    };
    hotels: {
        used: number | null;
        limit: number | null;
    };
}

// ─── Service ──────────────────────────────────────────────────────

export const userService = {
    getAll: () =>
        apiClient.get<UserListItem[]>('/users').then(r => r.data),

    getUsage: () =>
        apiClient.get<TenantUsage>('/subscriptions/usage').then(r => r.data),

    update: (id: number, data: UpdateUserPayload) =>
        apiClient.patch<UserListItem>(`/users/${id}`, data).then(r => r.data),

    suspend: (id: number) =>
        apiClient.patch<UserListItem>(`/users/${id}/suspend`).then(r => r.data),

    reactivate: (id: number) =>
        apiClient.patch<UserListItem>(`/users/${id}/reactivate`).then(r => r.data),

    removePendingInvite: (id: number) =>
        apiClient.delete<{ message: string; userId: number }>(`/users/invites/${id}`).then(r => r.data),

    remove: (id: number) =>
        apiClient.delete(`/users/${id}`).then(r => r.data),
};
