import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { templateMonoparentalService } from '../services/monoparentalTemplate.service';
import { useHotel } from '../../../hotel/context/HotelContext';
import type {
    CreateTemplateMonoparentalRulePayload,
    UpdateTemplateMonoparentalRulePayload,
} from '../../../../types';

export const templateMonoparentalKeys = {
    all: (hotelId: number | undefined) => ['template-monoparental', hotelId] as const,
    paginated: (hotelId: number | undefined, page: number, limit: number, search: string) =>
        ['template-monoparental', hotelId, 'paginated', page, limit, search] as const,
    archived: (hotelId: number | undefined) => ['template-monoparental', hotelId, 'archived'] as const,
};

export function useTemplateMonoparentalRules(page: number, limit: number, search: string) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: templateMonoparentalKeys.paginated(hotelId, page, limit, search),
        queryFn: () => templateMonoparentalService.getAll(page, limit, search),
        placeholderData: (prev) => prev,
        enabled: !!hotelId,
    });
}

export function useArchivedTemplateMonoparentalRules(options?: { enabled?: boolean }) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: templateMonoparentalKeys.archived(hotelId),
        queryFn: templateMonoparentalService.getArchived,
        enabled: (options?.enabled ?? true) && !!hotelId,
    });
}

export function useCreateTemplateMonoparentalRule() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTemplateMonoparentalRulePayload) =>
            templateMonoparentalService.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateMonoparentalKeys.all(currentHotel?.id) });
            toast.success('Règle monoparentale créée');
        },
    });
}

export function useUpdateTemplateMonoparentalRule() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateTemplateMonoparentalRulePayload }) =>
            templateMonoparentalService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateMonoparentalKeys.all(currentHotel?.id) });
            toast.success('Règle monoparentale mise à jour');
        },
    });
}

export function useDeleteTemplateMonoparentalRule() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateMonoparentalService.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateMonoparentalKeys.all(currentHotel?.id) });
            toast.success('Règle monoparentale archivée');
        },
    });
}

export function useRestoreTemplateMonoparentalRule() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateMonoparentalService.restore(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateMonoparentalKeys.all(currentHotel?.id) });
            toast.success('Règle monoparentale restaurée');
        },
    });
}
