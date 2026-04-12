import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { affiliateService } from '../services/affiliate.service';
import type { Affiliate, CreateAffiliatePayload, UpdateAffiliatePayload } from '../types/affiliate.types';
import { useHotel } from '../../hotel/context/HotelContext';
import i18next from '../../../lib/i18n';

// Re-export types so consumers only need this hook file
export type { Affiliate, CreateAffiliatePayload, UpdateAffiliatePayload };

// Query key factory — hotelId scopes all cache entries to the active hotel
export const affiliateKeys = {
    all: (hotelId: number | undefined) => ['affiliates', hotelId] as const,
    archived: (hotelId: number | undefined) => ['affiliates', hotelId, 'archived'] as const,
};

/** Fetch active affiliates — automatically scoped to current hotel */
export function useAffiliates() {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<Affiliate[]>({
        queryKey: affiliateKeys.all(hotelId),
        queryFn: affiliateService.getAll,
        enabled: !!hotelId,
    });
}

/** Fetch archived affiliates (lazy — only enabled when `enabled` is true) */
export function useArchivedAffiliates(enabled: boolean) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<Affiliate[]>({
        queryKey: affiliateKeys.archived(hotelId),
        queryFn: affiliateService.getArchived,
        enabled: enabled && !!hotelId,
    });
}

/** Create a new affiliate */
export function useCreateAffiliate(onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: affiliateService.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: affiliateKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.partners.hooks.useaffiliates.toast.success.5495dd3f', { defaultValue: "Partenaire créé avec succès" }));
            onSuccess?.();
        },
    });
}

/** Update an existing affiliate */
export function useUpdateAffiliate(onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAffiliatePayload }) =>
            affiliateService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: affiliateKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.partners.hooks.useaffiliates.toast.success.1990512e', { defaultValue: "Partenaire mis à jour" }));
            onSuccess?.();
        },
    });
}

/** Soft-delete (archive) an affiliate */
export function useDeleteAffiliate() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: affiliateService.remove,
        onSuccess: () => {
            const hid = currentHotel?.id;
            qc.invalidateQueries({ queryKey: affiliateKeys.all(hid) });
            qc.invalidateQueries({ queryKey: affiliateKeys.archived(hid) });
            toast.success(i18next.t('auto.features.partners.hooks.useaffiliates.toast.success.74711f73', { defaultValue: "Partenaire archivé avec succès" }));
        },
    });
}

/** Restore a soft-deleted affiliate */
export function useRestoreAffiliate() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: affiliateService.restore,
        onSuccess: () => {
            const hid = currentHotel?.id;
            qc.invalidateQueries({ queryKey: affiliateKeys.all(hid) });
            qc.invalidateQueries({ queryKey: affiliateKeys.archived(hid) });
            toast.success(i18next.t('auto.features.partners.hooks.useaffiliates.toast.success.f2827e43', { defaultValue: "Partenaire restauré avec succès" }));
        },
    });
}

/** Fetch contracts for a given affiliate */
export function useAffiliateContracts(affiliateId: number | null) {
    return useQuery({
        queryKey: ['affiliateContracts', affiliateId],
        queryFn: () => affiliateService.getContracts(affiliateId!),
        enabled: !!affiliateId,
    });
}
