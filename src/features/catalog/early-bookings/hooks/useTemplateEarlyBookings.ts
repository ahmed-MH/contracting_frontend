import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { templateEarlyBookingService } from '../services/earlyBookingTemplate.service';
import { useHotel } from '../../../hotel/context/HotelContext';
import type {
    CreateTemplateEarlyBookingPayload,
    UpdateTemplateEarlyBookingPayload,
} from '../../../../types';

export const templateEarlyBookingKeys = {
    all: (hotelId: number | undefined) => ['template-early-booking', hotelId] as const,
    paginated: (hotelId: number | undefined, page: number, limit: number, search: string) =>
        ['template-early-booking', hotelId, 'paginated', page, limit, search] as const,
    archived: (hotelId: number | undefined) => ['template-early-booking', hotelId, 'archived'] as const,
};

export function useTemplateEarlyBookings(page: number, limit: number, search: string) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: templateEarlyBookingKeys.paginated(hotelId, page, limit, search),
        queryFn: () => templateEarlyBookingService.getTemplates({ page, limit, search }),
        placeholderData: (prev) => prev,
        enabled: !!hotelId,
    });
}

export function useArchivedTemplateEarlyBookings(options?: { enabled?: boolean }) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: templateEarlyBookingKeys.archived(hotelId),
        queryFn: templateEarlyBookingService.getArchivedTemplates,
        enabled: (options?.enabled ?? true) && !!hotelId,
    });
}

export function useCreateTemplateEarlyBooking() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTemplateEarlyBookingPayload) => templateEarlyBookingService.createTemplate(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateEarlyBookingKeys.all(currentHotel?.id) });
            toast.success('Early Booking créé');
        },
    });
}

export function useUpdateTemplateEarlyBooking() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateTemplateEarlyBookingPayload }) =>
            templateEarlyBookingService.updateTemplate(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateEarlyBookingKeys.all(currentHotel?.id) });
            toast.success('Early Booking mis à jour');
        },
    });
}

export function useDeleteTemplateEarlyBooking() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateEarlyBookingService.deleteTemplate(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateEarlyBookingKeys.all(currentHotel?.id) });
            toast.success('Early Booking archivé');
        },
    });
}

export function useRestoreTemplateEarlyBooking() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => templateEarlyBookingService.restoreTemplate(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: templateEarlyBookingKeys.all(currentHotel?.id) });
            toast.success('Early Booking restauré');
        },
    });
}
