import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    contractSupplementService,
} from '../services/contractSupplement.service';
import type {
    ContractSupplement,
    UpdateContractSupplementPayload
} from '../../catalog/supplements/types/supplements.types';
import i18next from '../../../lib/i18n';

export type { ContractSupplement, UpdateContractSupplementPayload };

export const CONTRACT_SUPPLEMENT_KEYS = {
    byContract: (contractId: number) =>
        ['contract-supplements', contractId] as const,
};

export function useContractSupplements(contractId: number) {
    return useQuery({
        queryKey: CONTRACT_SUPPLEMENT_KEYS.byContract(contractId),
        queryFn: () => contractSupplementService.getByContract(contractId),
        enabled: !!contractId,
    });
}

export function useImportSupplement(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (templateId: number) =>
            contractSupplementService.importFromTemplate(contractId, templateId),
        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: CONTRACT_SUPPLEMENT_KEYS.byContract(contractId),
            });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractsupplements.toast.success.e9bd8145', { defaultValue: "Supplément importé" }));
        },
    });
}

export function useUpdateContractSupplement(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            suppId,
            data,
        }: {
            suppId: number;
            data: UpdateContractSupplementPayload;
        }) => contractSupplementService.update(contractId, suppId, data),
        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: CONTRACT_SUPPLEMENT_KEYS.byContract(contractId),
            });
            // Toast handled by the grid component
        },
    });
}

export function useDeleteContractSupplement(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (suppId: number) =>
            contractSupplementService.delete(contractId, suppId),
        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: CONTRACT_SUPPLEMENT_KEYS.byContract(contractId),
            });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractsupplements.toast.success.a0cb2f2b', { defaultValue: "Supplément supprimé" }));
        },
    });
}
