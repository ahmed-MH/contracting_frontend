import apiClient from '../../../../services/api.client';
import type { PaginatedResult } from '../../../../types';
import type { TemplateSpo, CreateTemplateSpoPayload, UpdateTemplateSpoPayload } from '../types/spos.types';

export const spoTemplateService = {
    getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<TemplateSpo>> => {
        const response = await apiClient.get<PaginatedResult<TemplateSpo>>('/hotel/spos', { params });
        return response.data;
    },

    getArchived: async (): Promise<TemplateSpo[]> => {
        const response = await apiClient.get<TemplateSpo[]>('/hotel/spos/archived');
        return response.data;
    },

    create: async (payload: CreateTemplateSpoPayload): Promise<TemplateSpo> => {
        const response = await apiClient.post<TemplateSpo>('/hotel/spos', payload);
        return response.data;
    },

    update: async (id: number, payload: UpdateTemplateSpoPayload): Promise<TemplateSpo> => {
        const response = await apiClient.patch<TemplateSpo>(`/hotel/spos/${id}`, payload);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/hotel/spos/${id}`);
    },

    restore: async (id: number): Promise<void> => {
        await apiClient.patch(`/hotel/spos/${id}/restore`);
    }
};
