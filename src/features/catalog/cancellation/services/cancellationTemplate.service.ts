import apiClient from '../../../../services/api.client';
import type { PaginatedResult } from '../../../../types';
import type {
    TemplateCancellationRule,
    CreateTemplateCancellationRulePayload,
    UpdateContractCancellationRulePayload
} from '../types/cancellation.types';

export type { TemplateCancellationRule, CreateTemplateCancellationRulePayload, UpdateContractCancellationRulePayload };

export const templateCancellationService = {
    getAll: async (hotelId: number, params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<TemplateCancellationRule>> => {
        const { data } = await apiClient.get(`/hotels/${hotelId}/catalog/cancellation-rules`, { params });
        return data;
    },

    getArchived: async (hotelId: number): Promise<TemplateCancellationRule[]> => {
        const { data } = await apiClient.get(`/hotels/${hotelId}/catalog/cancellation-rules/archived`);
        return data;
    },

    create: async (hotelId: number, payload: CreateTemplateCancellationRulePayload): Promise<TemplateCancellationRule> => {
        const { data } = await apiClient.post(`/hotels/${hotelId}/catalog/cancellation-rules`, payload);
        return data;
    },

    update: async (hotelId: number, id: number, payload: UpdateContractCancellationRulePayload): Promise<TemplateCancellationRule> => {
        const { data } = await apiClient.patch(`/hotels/${hotelId}/catalog/cancellation-rules/${id}`, payload);
        return data;
    },

    delete: async (hotelId: number, id: number): Promise<void> => {
        await apiClient.delete(`/hotels/${hotelId}/catalog/cancellation-rules/${id}`);
    },

    restore: async (hotelId: number, id: number): Promise<void> => {
        await apiClient.patch(`/hotels/${hotelId}/catalog/cancellation-rules/${id}/restore`);
    }
};
