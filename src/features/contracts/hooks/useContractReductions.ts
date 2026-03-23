import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    contractReductionService,
} from '../services/contractReduction.service';
import type {
    ContractReduction,
    UpdateContractReductionPayload
} from '../../catalog/reductions/types/reductions.types';

export type { ContractReduction, UpdateContractReductionPayload };

export const CONTRACT_REDUCTION_KEYS = {
    byContract: (contractId: number) =>
        ['contract-reductions', contractId] as const,
};

export function useContractReductions(contractId: number) {
    return useQuery({
        queryKey: CONTRACT_REDUCTION_KEYS.byContract(contractId),
        queryFn: () => contractReductionService.getByContract(contractId),
        enabled: !!contractId,
    });
}

export function useImportReduction(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (templateId: number) =>
            contractReductionService.importFromTemplate(contractId, templateId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CONTRACT_REDUCTION_KEYS.byContract(contractId) });
            toast.success('Réduction importée dans le contrat');
        },
    });
}

export function useUpdateContractReduction(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ reductionId, data }: { reductionId: number; data: UpdateContractReductionPayload }) =>
            contractReductionService.update(contractId, reductionId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CONTRACT_REDUCTION_KEYS.byContract(contractId) });
            // Toast handled by the grid component
        },
    });
}

export function useDeleteContractReduction(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reductionId: number) =>
            contractReductionService.delete(contractId, reductionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CONTRACT_REDUCTION_KEYS.byContract(contractId) });
            toast.success('Réduction supprimée du contrat');
        },
    });
}
