import apiClient from '../../../services/api.client';
import type {
    AffiliateEmailSpo,
    CreateAffiliateEmailSpoPayload,
    UpdateAffiliateEmailSpoPayload,
} from '../types/affiliate-email-spo.types';

export const affiliateEmailSpoService = {
    getAll: (affiliateId: number) =>
        apiClient.get<AffiliateEmailSpo[]>(`/affiliates/${affiliateId}/email-spo`).then((response) => response.data),

    create: (affiliateId: number, data: CreateAffiliateEmailSpoPayload) =>
        apiClient.post<AffiliateEmailSpo>(`/affiliates/${affiliateId}/email-spo`, data).then((response) => response.data),

    update: (affiliateId: number, emailSpoId: number, data: UpdateAffiliateEmailSpoPayload) =>
        apiClient.patch<AffiliateEmailSpo>(`/affiliates/${affiliateId}/email-spo/${emailSpoId}`, data).then((response) => response.data),

    remove: (affiliateId: number, emailSpoId: number) =>
        apiClient.delete(`/affiliates/${affiliateId}/email-spo/${emailSpoId}`).then((response) => response.data),
};
