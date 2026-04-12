import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roomService } from '../services/room.service';
import type { RoomType, CreateRoomTypePayload, UpdateRoomTypePayload } from '../types/room.types';
import { useHotel } from '../../hotel/context/HotelContext';
import i18next from '../../../lib/i18n';

export type { RoomType, CreateRoomTypePayload, UpdateRoomTypePayload };

// Query key factory — hotelId scopes all cache entries to the active hotel
export const roomTypeKeys = {
    all: (hotelId: number | undefined) => ['roomTypes', hotelId] as const,
    archived: (hotelId: number | undefined) => ['roomTypes', hotelId, 'archived'] as const,
};

/** Fetch active room types — automatically scoped to current hotel */
export function useRoomTypes() {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<RoomType[]>({
        queryKey: roomTypeKeys.all(hotelId),
        queryFn: roomService.getRoomTypes,
        enabled: !!hotelId,
    });
}

/** Fetch archived room types (lazy — only when enabled) */
export function useArchivedRoomTypes(enabled: boolean) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<RoomType[]>({
        queryKey: roomTypeKeys.archived(hotelId),
        queryFn: roomService.getArchivedRoomTypes,
        enabled: enabled && !!hotelId,
    });
}

/** Create a new room type */
export function useCreateRoomType(onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: roomService.createRoomType,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: roomTypeKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.rooms.hooks.useroomtypes.toast.success.bd978808', { defaultValue: "Chambre créée avec succès" }));
            onSuccess?.();
        },
    });
}

/** Update an existing room type */
export function useUpdateRoomType(onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateRoomTypePayload }) =>
            roomService.updateRoomType(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: roomTypeKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.rooms.hooks.useroomtypes.toast.success.94e7e417', { defaultValue: "Chambre mise à jour" }));
            onSuccess?.();
        },
    });
}

/** Soft-delete (archive) a room type */
export function useDeleteRoomType() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: roomService.deleteRoomType,
        onSuccess: () => {
            const hid = currentHotel?.id;
            qc.invalidateQueries({ queryKey: roomTypeKeys.all(hid) });
            qc.invalidateQueries({ queryKey: roomTypeKeys.archived(hid) });
            toast.success(i18next.t('auto.features.rooms.hooks.useroomtypes.toast.success.d36e3358', { defaultValue: "Chambre archivée avec succès" }));
        },
    });
}

/** Restore a soft-deleted room type */
export function useRestoreRoomType() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: roomService.restoreRoomType,
        onSuccess: () => {
            const hid = currentHotel?.id;
            qc.invalidateQueries({ queryKey: roomTypeKeys.all(hid) });
            qc.invalidateQueries({ queryKey: roomTypeKeys.archived(hid) });
            toast.success(i18next.t('auto.features.rooms.hooks.useroomtypes.toast.success.55744ca1', { defaultValue: "Chambre restaurée avec succès" }));
        },
    });
}
