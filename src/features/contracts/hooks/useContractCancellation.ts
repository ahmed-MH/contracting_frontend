import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../services/api.client';
import { toast } from 'sonner';
import type { 
    ContractCancellationRule, 
    CreateContractCancellationRulePayload, 
    UpdateContractCancellationRulePayload 
} from '../../catalog/cancellation/types/cancellation.types';

export function useContractCancellation(contractId: number) {
    return useQuery<ContractCancellationRule[]>({
        queryKey: ['contract-cancellation', contractId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/contracts/${contractId}/cancellation-rules`);
            return data;
        },
    });
}

export function useCreateContractCancellation(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CreateContractCancellationRulePayload) => {
            const { data } = await apiClient.post(`/contracts/${contractId}/cancellation-rules`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-cancellation', contractId] });
            toast.success('Règle d\'annulation créée');
        },
    });
}

export function useUpdateContractCancellation(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: UpdateContractCancellationRulePayload }) => {
            const { data } = await apiClient.put(`/contracts/${contractId}/cancellation-rules/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-cancellation', contractId] });
            // Toast handled by the grid (like ReductionsGrid pattern)
        },
    });
}

export function useDeleteContractCancellation(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/contracts/${contractId}/cancellation-rules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-cancellation', contractId] });
            toast.success('Règle d\'annulation supprimée');
        },
    });
}

export function useImportCancellation(contractId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (templateId: number) => {
            const { data } = await apiClient.post(`/contracts/${contractId}/cancellation-rules/import`, { templateId });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-cancellation', contractId] });
            toast.success('Règle importée depuis le catalogue');
        },
    });
}
