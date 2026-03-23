import apiClient from '../../../services/api.client';
import type { Arrangement, CreateArrangementPayload, UpdateArrangementPayload } from '../types/arrangement.types';

export const arrangementService = {
    getArrangements: () =>
        apiClient.get<Arrangement[]>('/hotel/arrangements').then((r) => r.data),

    getArchivedArrangements: () =>
        apiClient.get<Arrangement[]>('/hotel/arrangements/archived').then((r) => r.data),

    createArrangement: (data: CreateArrangementPayload) =>
        apiClient.post<Arrangement>('/hotel/arrangements', data).then((r) => r.data),

    updateArrangement: (id: number, data: UpdateArrangementPayload) =>
        apiClient.patch<Arrangement>(`/hotel/arrangements/${id}`, data).then((r) => r.data),

    deleteArrangement: (id: number) =>
        apiClient.delete(`/hotel/arrangements/${id}`).then((r) => r.data),

    restoreArrangement: (id: number) =>
        apiClient.patch(`/hotel/arrangements/${id}/restore`).then((r) => r.data),
};
