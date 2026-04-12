import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    templateReductionService,
    type TemplateReduction,
    type CreateTemplateReductionPayload,
    type UpdateTemplateReductionPayload,
} from '../services/reductionTemplate.service';
import { useHotel } from '../../../hotel/context/HotelContext';
import i18next from '../../../../lib/i18n';

export type { TemplateReduction, CreateTemplateReductionPayload, UpdateTemplateReductionPayload };

// Query key factory — hotelId scopes all cache entries to the active hotel
export const templateReductionKeys = {
    all: (hotelId: number | undefined) => ['template-reductions', hotelId] as const,
    paginated: (hotelId: number | undefined, page: number, limit: number, search: string) =>
        ['template-reductions', hotelId, 'paginated', page, limit, search] as const,
    archived: (hotelId: number | undefined) => ['template-reductions', hotelId, 'archived'] as const,
};

export function useTemplateReductions(page: number, limit: number, search: string) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: templateReductionKeys.paginated(hotelId, page, limit, search),
        queryFn: () => templateReductionService.getAll(page, limit, search),
        placeholderData: (prev) => prev,
        enabled: !!hotelId,
    });
}

export function useArchivedTemplateReductions(options?: { enabled?: boolean }) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: templateReductionKeys.archived(hotelId),
        queryFn: templateReductionService.getArchived,
        enabled: (options?.enabled ?? true) && !!hotelId,
    });
}

export function useCreateTemplateReduction() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTemplateReductionPayload) =>
            templateReductionService.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateReductionKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.catalog.reductions.hooks.usetemplatereductions.toast.success.fa960d88', { defaultValue: "Réduction créée" }));
        },
    });
}

export function useUpdateTemplateReduction() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateTemplateReductionPayload }) =>
            templateReductionService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateReductionKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.catalog.reductions.hooks.usetemplatereductions.toast.success.4f58f383', { defaultValue: "Réduction mise à jour" }));
        },
    });
}

export function useDeleteTemplateReduction() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateReductionService.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateReductionKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.catalog.reductions.hooks.usetemplatereductions.toast.success.7d95cd08', { defaultValue: "Réduction archivée" }));
        },
    });
}

export function useRestoreTemplateReduction() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateReductionService.restore(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateReductionKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.catalog.reductions.hooks.usetemplatereductions.toast.success.de980ddb', { defaultValue: "Réduction restaurée" }));
        },
    });
}
