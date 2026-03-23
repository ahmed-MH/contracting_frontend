import apiClient from '../../../services/api.client';

// ─── Types ────────────────────────────────────────────────────────

export interface UserListItem {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isActive: boolean;
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

    remove: (id: number) =>
        apiClient.delete(`/users/${id}`).then(r => r.data),
};
