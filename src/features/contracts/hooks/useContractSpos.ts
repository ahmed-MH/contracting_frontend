import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractSpoService } from '../services/contractSpo.service';
import type { CreateContractSpoPayload, UpdateContractSpoPayload } from '../../catalog/spos/types/spos.types';
import { toast } from 'sonner';

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
            toast.success('Offre Spéciale ajoutée avec succès');
        },
        onError: () => toast.error('Erreur lors de l\'ajout')
    });
}

export function useImportContractSpo(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (templateId: number) => contractSpoService.import(contractId, templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contractSpos', contractId] });
            toast.success('Offre Spéciale importée avec succès');
        },
        onError: () => toast.error('Erreur lors de l\'importation')
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
        onError: () => toast.error('Erreur lors de la mise à jour')
    });
}

export function useDeleteContractSpo(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => contractSpoService.delete(contractId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contractSpos', contractId] });
            toast.success('Offre Spéciale supprimée');
        },
        onError: () => toast.error('Erreur lors de la suppression')
    });
}
