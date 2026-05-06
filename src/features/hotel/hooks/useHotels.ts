import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { hotelService, type Hotel, type CreateHotelPayload, type UpdateHotelPayload } from '../services/hotel.service';
import i18next from '../../../lib/i18n';

export type { Hotel, CreateHotelPayload, UpdateHotelPayload };

export const HOTELS_QUERY_KEY = ['hotels'] as const;
const ARCHIVED_KEY = ['hotels', 'archived'] as const;

/** Fetch active hotels */
export function useHotels() {
    return useQuery<Hotel[]>({
        queryKey: [...HOTELS_QUERY_KEY],
        queryFn: hotelService.getHotels,
    });
}

/** Fetch archived hotels (lazy — only when `enabled` is true) */
export function useArchivedHotels(enabled: boolean) {
    return useQuery<Hotel[]>({
        queryKey: [...ARCHIVED_KEY],
        queryFn: hotelService.getArchivedHotels,
        enabled,
    });
}

/** Create a new hotel */
export function useCreateHotel(onSuccess?: () => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: hotelService.createHotel,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            toast.success(i18next.t('auto.features.hotel.hooks.usehotels.toast.success.cba2c083', { defaultValue: "Hôtel créé avec succès" }));
            onSuccess?.();
        },
    });
}

/** Update an existing hotel */
export function useUpdateHotel(onSuccess?: () => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateHotelPayload }) =>
            hotelService.updateHotel(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            toast.success(i18next.t('auto.features.hotel.hooks.usehotels.toast.success.dd70415d', { defaultValue: "Hôtel mis à jour" }));
            onSuccess?.();
        },
    });
}

/** Upload and persist a hotel logo */
export function useUploadHotelLogo(onSuccess?: (hotel: Hotel) => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, file }: { id: number; file: File }) =>
            hotelService.uploadHotelLogo(id, file),
        onSuccess: (hotel) => {
            const mergeHotel = (existingHotels: Hotel[] | undefined) =>
                existingHotels?.map((entry) => (entry.id === hotel.id ? hotel : entry));

            qc.setQueriesData<Hotel[]>({ queryKey: [...HOTELS_QUERY_KEY] }, mergeHotel);
            qc.setQueriesData<Hotel[]>({ queryKey: [...ARCHIVED_KEY] }, mergeHotel);
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            toast.success(i18next.t('pages.hotel.logoUpload.toast.success', { defaultValue: 'Hotel logo updated' }));
            onSuccess?.(hotel);
        },
    });
}

/** Soft-delete (archive) a hotel */
export function useDeleteHotel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: hotelService.deleteHotel,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [...ARCHIVED_KEY] });
            toast.success(i18next.t('auto.features.hotel.hooks.usehotels.toast.success.a982fcc1', { defaultValue: "Hôtel archivé avec succès" }));
        },
    });
}

/** Restore a soft-deleted hotel */
export function useRestoreHotel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: hotelService.restoreHotel,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [...ARCHIVED_KEY] });
            toast.success(i18next.t('auto.features.hotel.hooks.usehotels.toast.success.df605eb4', { defaultValue: "Hôtel restauré avec succès" }));
        },
    });
}
