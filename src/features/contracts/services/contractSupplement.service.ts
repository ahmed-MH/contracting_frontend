import apiClient from '../../../services/api.client';
import type {
    ContractSupplement,
    UpdateContractSupplementPayload,
    PeriodOverridePayload,
} from '../../catalog/supplements/types/supplements.types';

export const contractSupplementService = {
    getByContract: (contractId: number) =>
        apiClient
            .get<ContractSupplement[]>(`/contracts/${contractId}/supplements`)
            .then((r) => r.data),

    importFromTemplate: (contractId: number, templateId: number) =>
        apiClient
            .post<ContractSupplement>(`/contracts/${contractId}/supplements/import`, { templateId })
            .then((r) => r.data),

    update: (contractId: number, suppId: number, data: UpdateContractSupplementPayload) =>
        apiClient
            .patch<ContractSupplement>(`/contracts/${contractId}/supplements/${suppId}`, data)
            .then((r) => r.data),

    /**
     * Saves seasonal price overrides for one supplement.
     * Sends applicablePeriods[] containing { periodId, overrideValue? } objects.
     */
    upsertPeriodOverrides: (
        contractId: number,
        suppId: number,
        periods: PeriodOverridePayload[],
    ) =>
        apiClient
            .patch<ContractSupplement>(`/contracts/${contractId}/supplements/${suppId}`, {
                applicablePeriods: periods,
            })
            .then((r) => r.data),

    delete: (contractId: number, suppId: number) =>
        apiClient
            .delete(`/contracts/${contractId}/supplements/${suppId}`)
            .then((r) => r.data),
};
