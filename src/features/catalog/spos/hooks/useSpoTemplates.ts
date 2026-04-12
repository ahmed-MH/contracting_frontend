import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spoTemplateService } from '../services/spoTemplate.service';
import type { CreateTemplateSpoPayload, UpdateTemplateSpoPayload } from '../types/spos.types';
import { toast } from 'sonner';
import i18next from '../../../../lib/i18n';

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
            toast.success(i18next.t('auto.features.catalog.spos.hooks.usespotemplates.toast.success.67d6fe47', { defaultValue: "Offre Spéciale créée avec succès" }));
        },
        onError: () => toast.error(i18next.t('auto.features.catalog.spos.hooks.usespotemplates.toast.error.8d7bacaf', { defaultValue: "Erreur lors de la création de l'offre spéciale" }))
    });
}

export function useUpdateSpoTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateTemplateSpoPayload }) =>
            spoTemplateService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spoTemplates'] });
            toast.success(i18next.t('auto.features.catalog.spos.hooks.usespotemplates.toast.success.1db14906', { defaultValue: "Offre Spéciale mise à jour avec succès" }));
        },
        onError: () => toast.error(i18next.t('auto.features.catalog.spos.hooks.usespotemplates.toast.error.84be05af', { defaultValue: "Erreur lors de la mise à jour" }))
    });
}

export function useDeleteSpoTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => spoTemplateService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spoTemplates'] });
            toast.success(i18next.t('auto.features.catalog.spos.hooks.usespotemplates.toast.success.0804141c', { defaultValue: "Offre Spéciale archivée" }));
        },
        onError: () => toast.error(i18next.t('auto.features.catalog.spos.hooks.usespotemplates.toast.error.6ffff313', { defaultValue: "Erreur lors de l'archivage" }))
    });
}

export function useRestoreSpoTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => spoTemplateService.restore(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spoTemplates'] });
            toast.success(i18next.t('auto.features.catalog.spos.hooks.usespotemplates.toast.success.18470030', { defaultValue: "Offre Spéciale restaurée" }));
        },
        onError: () => toast.error(i18next.t('auto.features.catalog.spos.hooks.usespotemplates.toast.error.ce13c431', { defaultValue: "Erreur lors de la restauration" }))
    });
}
