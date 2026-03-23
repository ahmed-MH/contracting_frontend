import apiClient from '../../../services/api.client';
import type { ContractReduction, UpdateContractReductionPayload } from '../../catalog/reductions/types/reductions.types';

export const contractReductionService = {
    getByContract: (contractId: number) =>
        apiClient
            .get<ContractReduction[]>(
                `/contracts/${contractId}/reductions`,
            )
            .then((r) => r.data),

    importFromTemplate: (contractId: number, templateId: number) =>
        apiClient
            .post<ContractReduction>(
                `/contracts/${contractId}/reductions/import`,
                { templateId },
            )
            .then((r) => r.data),

    update: (contractId: number, reductionId: number, data: UpdateContractReductionPayload) =>
        apiClient
            .patch<ContractReduction>(
                `/contracts/${contractId}/reductions/${reductionId}`,
                data,
            )
            .then((r) => r.data),

    delete: (contractId: number, reductionId: number) =>
        apiClient
            .delete(`/contracts/${contractId}/reductions/${reductionId}`)
            .then((r) => r.data),
};
