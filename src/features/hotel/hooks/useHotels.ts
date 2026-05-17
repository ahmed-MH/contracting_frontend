import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18next from '../../../lib/i18n';
import { TENANT_USAGE_QUERY_KEY } from '../../admin/hooks/useUsers';
import { hotelService, type CreateHotelPayload, type Hotel, type UpdateHotelPayload } from '../services/hotel.service';

export type { CreateHotelPayload, Hotel, UpdateHotelPayload };

export const HOTELS_QUERY_KEY = ['hotels'] as const;
const ARCHIVED_KEY = ['hotels', 'archived'] as const;

export function useHotels() {
    return useQuery<Hotel[]>({
        queryKey: [...HOTELS_QUERY_KEY],
        queryFn: hotelService.getHotels,
    });
}

export function useArchivedHotels(enabled: boolean) {
    return useQuery<Hotel[]>({
        queryKey: [...ARCHIVED_KEY],
        queryFn: hotelService.getArchivedHotels,
        enabled,
    });
}

export function useCreateHotel(onSuccess?: () => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: hotelService.createHotel,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [...TENANT_USAGE_QUERY_KEY] });
            toast.success(i18next.t('auto.features.hotel.hooks.usehotels.toast.success.cba2c083', { defaultValue: 'Hotel created successfully' }));
            onSuccess?.();
        },
    });
}

export function useUpdateHotel(onSuccess?: () => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateHotelPayload }) =>
            hotelService.updateHotel(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            toast.success(i18next.t('auto.features.hotel.hooks.usehotels.toast.success.dd70415d', { defaultValue: 'Hotel updated' }));
            onSuccess?.();
        },
    });
}

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

export function useDeleteHotel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: hotelService.deleteHotel,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [...ARCHIVED_KEY] });
            qc.invalidateQueries({ queryKey: [...TENANT_USAGE_QUERY_KEY] });
            toast.success(i18next.t('auto.features.hotel.hooks.usehotels.toast.success.a982fcc1', { defaultValue: 'Hotel archived successfully' }));
        },
    });
}

export function useRestoreHotel() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: hotelService.restoreHotel,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...HOTELS_QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [...ARCHIVED_KEY] });
            qc.invalidateQueries({ queryKey: [...TENANT_USAGE_QUERY_KEY] });
            toast.success(i18next.t('auto.features.hotel.hooks.usehotels.toast.success.df605eb4', { defaultValue: 'Hotel restored successfully' }));
        },
    });
}
