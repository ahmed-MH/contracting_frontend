import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contractEarlyBookingService } from '../services/contractEarlyBooking.service';
import type { UpdateContractEarlyBookingPayload } from '../../catalog/early-bookings/types/early-bookings.types';
import i18next from '../../../lib/i18n';

export const contractEarlyBookingKeys = {
    all: (contractId: number) => ['contract-early-booking', contractId] as const,
};

export function useContractEarlyBookings(contractId: number) {
    return useQuery({
        queryKey: contractEarlyBookingKeys.all(contractId),
        queryFn: () => contractEarlyBookingService.getByContract(contractId),
        enabled: !!contractId,
    });
}

export function useImportEarlyBooking(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (templateId: number) => contractEarlyBookingService.importFromTemplate(contractId, templateId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractEarlyBookingKeys.all(contractId) });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractearlybookings.toast.success.af1a198d', { defaultValue: "Early Booking importé avec succès" }));
        },
    });
}

export function useUpdateContractEarlyBooking(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ ebId, data }: { ebId: number; data: UpdateContractEarlyBookingPayload }) =>
            contractEarlyBookingService.update(ebId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractEarlyBookingKeys.all(contractId) });
            // Toast handled by the grid component
        },
    });
}

export function useDeleteContractEarlyBooking(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ebId: number) => contractEarlyBookingService.delete(ebId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractEarlyBookingKeys.all(contractId) });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontractearlybookings.toast.success.becac6d2', { defaultValue: "Early Booking supprimé du contrat" }));
        },
    });
}
