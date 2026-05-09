import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18next from '../../../lib/i18n';
import { useHotel } from '../../hotel/context/HotelContext';
import { affiliateEmailSpoService } from '../services/affiliate-email-spo.service';
import type {
    AffiliateEmailSpo,
    BulkCreateAffiliateEmailSpoPayload,
    CreateAffiliateEmailSpoPayload,
    UpdateAffiliateEmailSpoPayload,
} from '../types/affiliate-email-spo.types';

export type {
    AffiliateEmailSpo,
    BulkCreateAffiliateEmailSpoPayload,
    CreateAffiliateEmailSpoPayload,
    UpdateAffiliateEmailSpoPayload,
};

export const affiliateEmailSpoKeys = {
    all: (hotelId: number | undefined, affiliateId: number | null) => ['affiliate-email-spos', hotelId, affiliateId] as const,
};

export function useAffiliateEmailSpos(affiliateId: number | null, enabled = true) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;

    return useQuery<AffiliateEmailSpo[]>({
        queryKey: affiliateEmailSpoKeys.all(hotelId, affiliateId),
        queryFn: () => affiliateEmailSpoService.getAll(affiliateId!),
        enabled: enabled && !!hotelId && !!affiliateId,
    });
}

export function useCreateAffiliateEmailSpo(affiliateId: number | null, onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAffiliateEmailSpoPayload) => affiliateEmailSpoService.create(affiliateId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: affiliateEmailSpoKeys.all(currentHotel?.id, affiliateId) });
            toast.success(i18next.t('pages.affiliates.emailSpo.toast.create', { defaultValue: 'Email SPO created' }));
            onSuccess?.();
        },
    });
}

export function useBulkCreateAffiliateEmailSpo(onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BulkCreateAffiliateEmailSpoPayload) => affiliateEmailSpoService.createBulk(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['affiliate-email-spos', currentHotel?.id] });

            if (result.created.length > 0) {
                toast.success(i18next.t('pages.affiliates.emailSpo.toast.bulkCreate', {
                    defaultValue: '{{count}} Email SPO created',
                    count: result.created.length,
                }));
            }

            if (result.skipped.length > 0) {
                toast.warning(i18next.t('pages.affiliates.emailSpo.toast.bulkSkipped', {
                    defaultValue: '{{count}} partner(s) skipped because they already have an overlapping active Email SPO.',
                    count: result.skipped.length,
                }));
            }

            onSuccess?.();
        },
    });
}

export function useUpdateAffiliateEmailSpo(affiliateId: number | null, onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ emailSpoId, data }: { emailSpoId: number; data: UpdateAffiliateEmailSpoPayload }) =>
            affiliateEmailSpoService.update(affiliateId!, emailSpoId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: affiliateEmailSpoKeys.all(currentHotel?.id, affiliateId) });
            toast.success(i18next.t('pages.affiliates.emailSpo.toast.update', { defaultValue: 'Email SPO updated' }));
            onSuccess?.();
        },
    });
}

export function useDeleteAffiliateEmailSpo(affiliateId: number | null) {
    const { currentHotel } = useHotel();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (emailSpoId: number) => affiliateEmailSpoService.remove(affiliateId!, emailSpoId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: affiliateEmailSpoKeys.all(currentHotel?.id, affiliateId) });
            toast.success(i18next.t('pages.affiliates.emailSpo.toast.delete', { defaultValue: 'Email SPO deleted' }));
        },
    });
}
