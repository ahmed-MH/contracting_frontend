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

// ─── Service ──────────────────────────────────────────────────────

export const userService = {
    getAll: () =>
        apiClient.get<UserListItem[]>('/users').then(r => r.data),

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
