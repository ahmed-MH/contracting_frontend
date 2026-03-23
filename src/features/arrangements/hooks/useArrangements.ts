import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { arrangementService } from '../services/arrangement.service';
import type { Arrangement, CreateArrangementPayload, UpdateArrangementPayload } from '../types/arrangement.types';
import { useHotel } from '../../hotel/context/HotelContext';

export type { Arrangement, CreateArrangementPayload, UpdateArrangementPayload };

// Query key factory — hotelId scopes all cache entries to the active hotel
export const arrangementKeys = {
    all: (hotelId: number | undefined) => ['arrangements', hotelId] as const,
    archived: (hotelId: number | undefined) => ['arrangements', hotelId, 'archived'] as const,
};

/** Fetch active arrangements — automatically scoped to current hotel */
export function useArrangements() {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<Arrangement[]>({
        queryKey: arrangementKeys.all(hotelId),
        queryFn: arrangementService.getArrangements,
        enabled: !!hotelId,
    });
}

/** Fetch archived arrangements (lazy) */
export function useArchivedArrangements(enabled: boolean) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<Arrangement[]>({
        queryKey: arrangementKeys.archived(hotelId),
        queryFn: arrangementService.getArchivedArrangements,
        enabled: enabled && !!hotelId,
    });
}

/** Create a new arrangement */
export function useCreateArrangement(onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: arrangementService.createArrangement,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: arrangementKeys.all(currentHotel?.id) });
            toast.success('Arrangement créé avec succès');
            onSuccess?.();
        },
    });
}

/** Update an existing arrangement */
export function useUpdateArrangement(onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CreateArrangementPayload }) =>
            arrangementService.updateArrangement(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: arrangementKeys.all(currentHotel?.id) });
            toast.success('Arrangement mis à jour');
            onSuccess?.();
        },
    });
}

/** Soft-delete (archive) an arrangement */
export function useDeleteArrangement() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: arrangementService.deleteArrangement,
        onSuccess: () => {
            const hid = currentHotel?.id;
            qc.invalidateQueries({ queryKey: arrangementKeys.all(hid) });
            qc.invalidateQueries({ queryKey: arrangementKeys.archived(hid) });
            toast.success('Arrangement archivé avec succès');
        },
    });
}

/** Restore a soft-deleted arrangement */
export function useRestoreArrangement() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: arrangementService.restoreArrangement,
        onSuccess: () => {
            const hid = currentHotel?.id;
            qc.invalidateQueries({ queryKey: arrangementKeys.all(hid) });
            qc.invalidateQueries({ queryKey: arrangementKeys.archived(hid) });
            toast.success('Arrangement restauré avec succès');
        },
    });
}
