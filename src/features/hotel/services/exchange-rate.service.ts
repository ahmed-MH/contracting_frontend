import apiClient from '../../../services/api.client';
import type {
    ExchangeRate,
    CreateExchangeRatePayload,
    UpdateExchangeRatePayload,
} from '../types/exchange-rate.types';

export const exchangeRateService = {
    getExchangeRates: (hotelId: number) =>
        apiClient.get<ExchangeRate[]>(`/hotel/${hotelId}/exchange-rates`).then((r) => r.data),

    createExchangeRate: (hotelId: number, data: CreateExchangeRatePayload) =>
        apiClient.post<ExchangeRate>(`/hotel/${hotelId}/exchange-rates`, data).then((r) => r.data),

    updateExchangeRate: (hotelId: number, id: number, data: UpdateExchangeRatePayload) =>
        apiClient.put<ExchangeRate>(`/hotel/${hotelId}/exchange-rates/${id}`, data).then((r) => r.data),

    deleteExchangeRate: (hotelId: number, id: number) =>
        apiClient.delete(`/hotel/${hotelId}/exchange-rates/${id}`).then((r) => r.data),
};
