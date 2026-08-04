import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractSpoService } from '../services/contractSpo.service';
import type { CreateContractSpoPayload, UpdateContractSpoPayload } from '../../catalog/spos/types/spos.types';
import { toast } from 'sonner';
import i18next from '../../../lib/i18n';

export function useContractSpos(contractId: number) {
    return useQuery({
        queryKey: ['contractSpos', contractId],
        queryFn: () => contractSpoService.getAll(contractId),
        enabled: !!contractId,
    });
}

export function useCreateContractSpo(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateContractSpoPayload) => contractSpoService.create(contractId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contractSpos', contractId] });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractspos.toast.success.2fb61a17', { defaultValue: 'Special offer added successfully' }));
        },
        onError: () => toast.error(i18next.t('auto.features.contracts.hooks.usecontractspos.toast.error.7df53e5e', { defaultValue: 'Unable to add the special offer' }))
    });
}

export function useImportContractSpo(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (templateId: number) => contractSpoService.import(contractId, templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contractSpos', contractId] });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractspos.toast.success.d2a1622f', { defaultValue: 'Special offer imported successfully' }));
        },
        onError: () => toast.error(i18next.t('auto.features.contracts.hooks.usecontractspos.toast.error.309da778', { defaultValue: 'Unable to import the special offer' }))
    });
}

export function useUpdateContractSpo(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateContractSpoPayload }) =>
            contractSpoService.update(contractId, id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contractSpos', contractId] });
            // Toast handled by the grid component
        },
        onError: () => toast.error(i18next.t('auto.features.contracts.hooks.usecontractspos.toast.error.8f9900a1', { defaultValue: 'Unable to update the special offer' }))
    });
}

export function useDeleteContractSpo(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => contractSpoService.delete(contractId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contractSpos', contractId] });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractspos.toast.success.7026991c', { defaultValue: 'Special offer removed' }));
        },
        onError: () => toast.error(i18next.t('auto.features.contracts.hooks.usecontractspos.toast.error.6112f0df', { defaultValue: 'Unable to remove the special offer' }))
    });
}
