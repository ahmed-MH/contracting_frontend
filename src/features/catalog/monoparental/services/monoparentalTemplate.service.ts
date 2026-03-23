import apiClient from '../../../../services/api.client';
import type {
    TemplateMonoparentalRule,
    CreateTemplateMonoparentalRulePayload,
    UpdateTemplateMonoparentalRulePayload,
    PaginatedResult,
} from '../../../../types';

export const templateMonoparentalService = {
    getAll: (page = 1, limit = 10, search = '') =>
        apiClient
            .get<PaginatedResult<TemplateMonoparentalRule>>('/hotel/monoparental-rules', {
                params: { page, limit, ...(search ? { search } : {}) },
            })
            .then((r) => r.data),

    getArchived: () =>
        apiClient
            .get<TemplateMonoparentalRule[]>('/hotel/monoparental-rules/archived')
            .then((r) => r.data),

    create: (data: CreateTemplateMonoparentalRulePayload) =>
        apiClient
            .post<TemplateMonoparentalRule>('/hotel/monoparental-rules', data)
            .then((r) => r.data),

    update: (id: number, data: UpdateTemplateMonoparentalRulePayload) =>
        apiClient
            .patch<TemplateMonoparentalRule>(`/hotel/monoparental-rules/${id}`, data)
            .then((r) => r.data),

    delete: (id: number) =>
        apiClient.delete(`/hotel/monoparental-rules/${id}`).then((r) => r.data),

    restore: (id: number) =>
        apiClient
            .patch(`/hotel/monoparental-rules/${id}/restore`)
            .then((r) => r.data),
};
