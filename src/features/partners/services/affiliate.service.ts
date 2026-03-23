import apiClient from '../../../services/api.client';
import { Affiliate, CreateAffiliatePayload, UpdateAffiliatePayload } from '../types/affiliate.types';

// ─── Service ──────────────────────────────────────────────────────

export const affiliateService = {
    getAll: () =>
        apiClient.get<Affiliate[]>('/affiliates').then(r => r.data),

    getArchived: () =>
        apiClient.get<Affiliate[]>('/affiliates/archived').then(r => r.data),

    create: (data: CreateAffiliatePayload) =>
        apiClient.post<Affiliate>('/affiliates', data).then(r => r.data),

    update: (id: number, data: UpdateAffiliatePayload) =>
        apiClient.patch<Affiliate>(`/affiliates/${id}`, data).then(r => r.data),

    remove: (id: number) =>
        apiClient.delete(`/affiliates/${id}`).then(r => r.data),

    restore: (id: number) =>
        apiClient.patch(`/affiliates/${id}/restore`).then(r => r.data),

    getContracts: (affiliateId: number) =>
        apiClient.get<import('../../contracts/types/contract.types').Contract[]>(`/affiliates/${affiliateId}/contracts`).then(r => r.data),
};
