import apiClient from '../../../services/api.client';
import type {
    Hotel,
    CreateHotelPayload,
    UpdateHotelPayload,
} from '../types/hotel.types';

export type { Hotel, CreateHotelPayload, UpdateHotelPayload };

export const hotelService = {
    // ── Hotels ────────────────────────────────────────────────────
    getHotels: () =>
        apiClient.get<Hotel[]>('/hotel').then((r) => r.data),

    getMyHotels: () =>
        apiClient.get<Hotel[]>('/users/me/hotels').then((r) => r.data),

    getArchivedHotels: () =>
        apiClient.get<Hotel[]>('/hotel/archived').then((r) => r.data),

    createHotel: (data: CreateHotelPayload) =>
        apiClient.post<Hotel>('/hotel', data).then((r) => r.data),

    updateHotel: (id: number, data: UpdateHotelPayload) =>
        apiClient.patch<Hotel>(`/hotel/${id}`, data).then((r) => r.data),

    deleteHotel: (id: number) =>
        apiClient.delete(`/hotel/${id}`).then((r) => r.data),

    restoreHotel: (id: number) =>
        apiClient.patch(`/hotel/${id}/restore`).then((r) => r.data),
};
