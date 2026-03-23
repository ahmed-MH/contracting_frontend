import apiClient from '../../../services/api.client';
import type { RoomType, CreateRoomTypePayload, UpdateRoomTypePayload } from '../types/room.types';

export const roomService = {
    getRoomTypes: () =>
        apiClient.get<RoomType[]>('/hotel/room-types').then((r) => r.data),

    getArchivedRoomTypes: () =>
        apiClient.get<RoomType[]>('/hotel/room-types/archived').then((r) => r.data),

    createRoomType: (data: CreateRoomTypePayload) =>
        apiClient.post<RoomType>('/hotel/room-types', data).then((r) => r.data),

    updateRoomType: (id: number, data: UpdateRoomTypePayload) =>
        apiClient.patch<RoomType>(`/hotel/room-types/${id}`, data).then((r) => r.data),

    deleteRoomType: (id: number) =>
        apiClient.delete(`/hotel/room-types/${id}`).then((r) => r.data),

    restoreRoomType: (id: number) =>
        apiClient.patch(`/hotel/room-types/${id}/restore`).then((r) => r.data),
};
