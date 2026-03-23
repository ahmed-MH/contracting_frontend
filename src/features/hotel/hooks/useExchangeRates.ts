import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeRateService } from '../services/exchange-rate.service';
import type {
    CreateExchangeRatePayload,
    UpdateExchangeRatePayload,
} from '../types/exchange-rate.types';
import { toast } from 'sonner';

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
            toast.success('Taux de change ajouté avec succès');
            onSuccess?.();
        },
        onError: () => toast.error('Erreur lors de l\'ajout du taux de change'),
    });
}

export function useUpdateExchangeRate(hotelId: number, onSuccess?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateExchangeRatePayload }) =>
            exchangeRateService.updateExchangeRate(hotelId, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXCHANGE_RATES_KEY, hotelId] });
            toast.success('Taux de change mis à jour avec succès');
            onSuccess?.();
        },
        onError: () => toast.error('Erreur lors de la mise à jour du taux de change'),
    });
}

export function useDeleteExchangeRate(hotelId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => exchangeRateService.deleteExchangeRate(hotelId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EXCHANGE_RATES_KEY, hotelId] });
            toast.success('Taux de change supprimé avec succès');
        },
        onError: () => toast.error('Erreur lors de la suppression du taux de change'),
    });
}
