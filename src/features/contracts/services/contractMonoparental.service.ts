import apiClient from '../../../services/api.client';
import type { ContractMonoparentalRule, UpdateContractMonoparentalRulePayload } from '../../catalog/monoparental/types/monoparental.types';

export const contractMonoparentalService = {
    getByContract: (contractId: number) =>
        apiClient
            .get<ContractMonoparentalRule[]>(`/contracts/${contractId}/monoparental-rules`)
            .then((r) => r.data),

    importFromTemplate: (contractId: number, templateId: number) =>
        apiClient
            .post<ContractMonoparentalRule>(`/contracts/${contractId}/monoparental-rules/import`, { templateId })
            .then((r) => r.data),

    update: (contractId: number, ruleId: number, data: UpdateContractMonoparentalRulePayload) =>
        apiClient
            .patch<ContractMonoparentalRule>(`/contracts/${contractId}/monoparental-rules/${ruleId}`, data)
            .then((r) => r.data),

    delete: (contractId: number, ruleId: number) =>
        apiClient
            .delete(`/contracts/${contractId}/monoparental-rules/${ruleId}`)
            .then((r) => r.data),
};
