import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18next from '../../../lib/i18n';
import { exchangeRateService } from '../services/exchange-rate.service';
import type {
    CreateExchangeRatePayload,
    UpdateExchangeRatePayload,
} from '../types/exchange-rate.types';

const EXCHANGE_RATES_KEY = 'exchangeRates';

export function useExchangeRates(hotelId: number) {
    return useQuery({
        queryKey: [EXCHANGE_RATES_KEY, hotelId],
        queryFn: () => exchangeRateService.getExchangeRates(hotelId),
        enabled: !!hotelId,
    });
}

export function useCreateExchangeRate(hotelId: number, onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateExchangeRatePayload) => exchangeRateService.createExchangeRate(hotelId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXCHANGE_RATES_KEY, hotelId] });
            toast.success(i18next.t('pages.exchangeRates.toast.created', { defaultValue: 'Exchange rate added' }));
            onSuccess?.();
        },
        onError: () => toast.error(i18next.t('pages.exchangeRates.toast.createError', { defaultValue: 'Could not add exchange rate' })),
    });
}

export function useUpdateExchangeRate(hotelId: number, onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateExchangeRatePayload }) =>
            exchangeRateService.updateExchangeRate(hotelId, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXCHANGE_RATES_KEY, hotelId] });
            toast.success(i18next.t('pages.exchangeRates.toast.updated', { defaultValue: 'Exchange rate updated' }));
            onSuccess?.();
        },
        onError: () => toast.error(i18next.t('pages.exchangeRates.toast.updateError', { defaultValue: 'Could not update exchange rate' })),
    });
}

export function useDeleteExchangeRate(hotelId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => exchangeRateService.deleteExchangeRate(hotelId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXCHANGE_RATES_KEY, hotelId] });
            toast.success(i18next.t('pages.exchangeRates.toast.deleted', { defaultValue: 'Exchange rate deleted' }));
        },
        onError: () => toast.error(i18next.t('pages.exchangeRates.toast.deleteError', { defaultValue: 'Could not delete exchange rate' })),
    });
}
