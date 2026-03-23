import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    templateCancellationService,
    type TemplateCancellationRule,
    type CreateTemplateCancellationRulePayload,
    type UpdateContractCancellationRulePayload,
} from '../services/cancellationTemplate.service';
import { useHotel } from '../../../hotel/context/HotelContext';

export type { TemplateCancellationRule, CreateTemplateCancellationRulePayload, UpdateContractCancellationRulePayload };

export const templateCancellationKeys = {
    all: (hotelId: number | undefined, params?: any) => ['template-cancellations', hotelId, params] as const,
    archived: (hotelId: number | undefined) => ['template-cancellations', 'archived', hotelId] as const,
};

export function useTemplateCancellations(page?: number, limit?: number, search?: string) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    const params = { page, limit, search };
    
    return useQuery({
        queryKey: templateCancellationKeys.all(hotelId, params),
        queryFn: () => templateCancellationService.getAll(hotelId!, params),
        enabled: !!hotelId,
    });
}

export function useArchivedTemplateCancellations(options?: { enabled?: boolean }) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    
    return useQuery({
        queryKey: templateCancellationKeys.archived(hotelId),
        queryFn: () => templateCancellationService.getArchived(hotelId!),
        enabled: !!hotelId && (options?.enabled ?? true),
    });
}

export function useCreateTemplateCancellation() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTemplateCancellationRulePayload) =>
            templateCancellationService.create(currentHotel!.id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['template-cancellations'] });
            toast.success('Règle d\'annulation créée');
        },
    });
}

export function useUpdateTemplateCancellation() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateContractCancellationRulePayload }) =>
            templateCancellationService.update(currentHotel!.id, id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['template-cancellations'] });
            toast.success('Règle d\'annulation mise à jour');
        },
    });
}

export function useDeleteTemplateCancellation() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateCancellationService.delete(currentHotel!.id, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['template-cancellations'] });
            toast.success('Règle d\'annulation supprimée');
        },
    });
}

export function useRestoreTemplateCancellation() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateCancellationService.restore(currentHotel!.id, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['template-cancellations'] });
            toast.success('Règle d\'annulation restaurée');
        },
    });
}
