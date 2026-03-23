import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spoTemplateService } from '../services/spoTemplate.service';
import type { CreateTemplateSpoPayload, UpdateTemplateSpoPayload } from '../types/spos.types';
import { toast } from 'sonner';

export function useSpoTemplates(params?: { page?: number; limit?: number; search?: string }) {
    return useQuery({
        queryKey: ['spoTemplates', params],
        queryFn: () => spoTemplateService.getAll(params),
    });
}

export function useArchivedSpoTemplates(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['spoTemplates', 'archived'],
        queryFn: () => spoTemplateService.getArchived(),
        ...options
    });
}

export function useCreateSpoTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateTemplateSpoPayload) => spoTemplateService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spoTemplates'] });
            toast.success('Offre Spéciale créée avec succès');
        },
        onError: () => toast.error('Erreur lors de la création de l\'offre spéciale')
    });
}

export function useUpdateSpoTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateTemplateSpoPayload }) =>
            spoTemplateService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spoTemplates'] });
            toast.success('Offre Spéciale mise à jour avec succès');
        },
        onError: () => toast.error('Erreur lors de la mise à jour')
    });
}

export function useDeleteSpoTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => spoTemplateService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spoTemplates'] });
            toast.success('Offre Spéciale archivée');
        },
        onError: () => toast.error('Erreur lors de l\'archivage')
    });
}

export function useRestoreSpoTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => spoTemplateService.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spoTemplates'] });
            toast.success('Offre Spéciale restaurée');
        },
        onError: () => toast.error('Erreur lors de la restauration')
    });
}
