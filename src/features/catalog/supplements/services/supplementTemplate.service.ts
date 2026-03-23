import apiClient from '../../../../services/api.client';
import type {
    TemplateSupplement,
    CreateTemplateSupplementPayload,
    UpdateTemplateSupplementPayload,
    PaginatedResult,
} from '../../../../types';

// Re-export types for page consumers
export type {
    TemplateSupplement,
    CreateTemplateSupplementPayload,
    UpdateTemplateSupplementPayload,
};

// ─── Template Supplement Service (Hotel Catalogue) ────────────────────

export const templateSupplementService = {
    getAll: (page = 1, limit = 10, search = '') =>
        apiClient
            .get<PaginatedResult<TemplateSupplement>>('/hotel/supplements', {
                params: { page, limit, ...(search ? { search } : {}) },
            })
            .then((r) => r.data),

    getArchived: () =>
        apiClient
            .get<TemplateSupplement[]>('/hotel/supplements/archived')
            .then((r) => r.data),

    create: (data: CreateTemplateSupplementPayload) =>
        apiClient
            .post<TemplateSupplement>('/hotel/supplements', data)
            .then((r) => r.data),

    update: (id: number, data: UpdateTemplateSupplementPayload) =>
        apiClient
            .patch<TemplateSupplement>(`/hotel/supplements/${id}`, data)
            .then((r) => r.data),

    delete: (id: number) =>
        apiClient.delete(`/hotel/supplements/${id}`).then((r) => r.data),

    restore: (id: number) =>
        apiClient
            .patch(`/hotel/supplements/${id}/restore`)
            .then((r) => r.data),
};
