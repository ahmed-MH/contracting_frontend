import apiClient from '../../../../services/api.client';
import type {
    TemplateReduction,
    CreateTemplateReductionPayload,
    UpdateTemplateReductionPayload,
    PaginatedResult,
} from '../../../../types';

// Re-export types for page consumers
export type {
    TemplateReduction,
    CreateTemplateReductionPayload,
    UpdateTemplateReductionPayload,
};

// ─── Template Reduction Service (Hotel Catalogue) ─────────────────────

export const templateReductionService = {
    getAll: (page = 1, limit = 10, search = '') =>
        apiClient
            .get<PaginatedResult<TemplateReduction>>('/hotel/reductions', {
                params: { page, limit, ...(search ? { search } : {}) },
            })
            .then((r) => r.data),

    getArchived: () =>
        apiClient
            .get<TemplateReduction[]>('/hotel/reductions/archived')
            .then((r) => r.data),

    create: (data: CreateTemplateReductionPayload) =>
        apiClient
            .post<TemplateReduction>('/hotel/reductions', data)
            .then((r) => r.data),

    update: (id: number, data: UpdateTemplateReductionPayload) =>
        apiClient
            .patch<TemplateReduction>(`/hotel/reductions/${id}`, data)
            .then((r) => r.data),

    delete: (id: number) =>
        apiClient.delete(`/hotel/reductions/${id}`).then((r) => r.data),

    restore: (id: number) =>
        apiClient
            .patch(`/hotel/reductions/${id}/restore`)
            .then((r) => r.data),
};
