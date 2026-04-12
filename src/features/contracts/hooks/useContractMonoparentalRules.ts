import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contractMonoparentalService } from '../services/contractMonoparental.service';
import type { UpdateContractMonoparentalRulePayload } from '../../catalog/monoparental/types/monoparental.types';
import i18next from '../../../lib/i18n';

export const contractMonoparentalKeys = {
    all: (contractId: number) => ['contract-monoparental', contractId] as const,
};

export function useContractMonoparentalRules(contractId: number) {
    return useQuery({
        queryKey: contractMonoparentalKeys.all(contractId),
        queryFn: () => contractMonoparentalService.getByContract(contractId),
        enabled: !!contractId,
    });
}

export function useImportMonoparentalRule(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (templateId: number) =>
            contractMonoparentalService.importFromTemplate(contractId, templateId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractMonoparentalKeys.all(contractId) });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractmonoparentalrules.toast.success.e9253375', { defaultValue: "Règle importée avec succès" }));
        },
    });
}

export function useUpdateContractMonoparentalRule(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ ruleId, data }: { ruleId: number; data: UpdateContractMonoparentalRulePayload }) =>
            contractMonoparentalService.update(contractId, ruleId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractMonoparentalKeys.all(contractId) });
            // Toast handled by the grid component
        },
    });
}

export function useDeleteContractMonoparentalRule(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ruleId: number) => contractMonoparentalService.delete(contractId, ruleId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractMonoparentalKeys.all(contractId) });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractmonoparentalrules.toast.success.99c23aee', { defaultValue: "Règle supprimée du contrat" }));
        },
    });
}
