import apiClient from '../../../services/api.client';
import type {
    ExchangeRate,
    CreateExchangeRatePayload,
    UpdateExchangeRatePayload,
} from '../types/exchange-rate.types';

export const exchangeRateService = {
    getExchangeRates: (hotelId: number) =>
        apiClient.get<ExchangeRate[]>(`/exchange-rates/hotels/${hotelId}`).then((r) => r.data),

    createExchangeRate: (hotelId: number, data: CreateExchangeRatePayload) =>
        apiClient.post<ExchangeRate>(`/exchange-rates/hotels/${hotelId}`, data).then((r) => r.data),

    updateExchangeRate: (hotelId: number, id: number, data: UpdateExchangeRatePayload) =>
        apiClient.put<ExchangeRate>(`/exchange-rates/hotels/${hotelId}/${id}`, data).then((r) => r.data),

    deleteExchangeRate: (hotelId: number, id: number) =>
        apiClient.delete(`/exchange-rates/hotels/${hotelId}/${id}`).then((r) => r.data),
};
