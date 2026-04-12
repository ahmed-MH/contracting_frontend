import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    templateSupplementService,
    type TemplateSupplement,
    type CreateTemplateSupplementPayload,
    type UpdateTemplateSupplementPayload,
} from '../services/supplementTemplate.service';
import { useHotel } from '../../../hotel/context/HotelContext';
import i18next from '../../../../lib/i18n';

export type { TemplateSupplement, CreateTemplateSupplementPayload, UpdateTemplateSupplementPayload };

// Query key factory — hotelId scopes all cache entries to the active hotel
export const templateSupplementKeys = {
    all: (hotelId: number | undefined) => ['template-supplements', hotelId] as const,
    paginated: (hotelId: number | undefined, page: number, limit: number, search: string) =>
        ['template-supplements', hotelId, 'paginated', page, limit, search] as const,
    archived: (hotelId: number | undefined) => ['template-supplements', hotelId, 'archived'] as const,
};

export function useTemplateSupplements(page: number, limit: number, search: string) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: templateSupplementKeys.paginated(hotelId, page, limit, search),
        queryFn: () => templateSupplementService.getAll(page, limit, search),
        placeholderData: (prev) => prev,
        enabled: !!hotelId,
    });
}

export function useArchivedTemplateSupplements(options?: { enabled?: boolean }) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: templateSupplementKeys.archived(hotelId),
        queryFn: templateSupplementService.getArchived,
        enabled: (options?.enabled ?? true) && !!hotelId,
    });
}

export function useCreateTemplateSupplement() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTemplateSupplementPayload) =>
            templateSupplementService.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateSupplementKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.catalog.supplements.hooks.usetemplatesupplements.toast.success.cae80751', { defaultValue: "Supplément créé" }));
        },
    });
}

export function useUpdateTemplateSupplement() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateTemplateSupplementPayload }) =>
            templateSupplementService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateSupplementKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.catalog.supplements.hooks.usetemplatesupplements.toast.success.dfd6e11b', { defaultValue: "Supplément mis à jour" }));
        },
    });
}

export function useDeleteTemplateSupplement() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateSupplementService.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateSupplementKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.catalog.supplements.hooks.usetemplatesupplements.toast.success.df1b8517', { defaultValue: "Supplément archivé" }));
        },
    });
}

export function useRestoreTemplateSupplement() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateSupplementService.restore(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateSupplementKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.catalog.supplements.hooks.usetemplatesupplements.toast.success.54d6cf37', { defaultValue: "Supplément restauré" }));
        },
    });
}
