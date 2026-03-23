import apiClient from '../../../../services/api.client';
import {
    TemplateEarlyBooking,
    CreateTemplateEarlyBookingPayload,
    UpdateTemplateEarlyBookingPayload,
} from '../../../../types';

export const templateEarlyBookingService = {
    // ─── TEMPLATES (Catalogue) ─────────────────────────

    async getTemplates(
        params: { page?: number; limit?: number; search?: string } = {}
    ): Promise<{ data: TemplateEarlyBooking[]; meta: any }> {
        const response = await apiClient.get('/hotel/early-bookings', { params });
        return response.data;
    },

    async getArchivedTemplates(): Promise<TemplateEarlyBooking[]> {
        const response = await apiClient.get('/hotel/early-bookings/archived');
        return response.data;
    },

    async createTemplate(payload: CreateTemplateEarlyBookingPayload): Promise<TemplateEarlyBooking> {
        const response = await apiClient.post('/hotel/early-bookings', payload);
        return response.data;
    },

    async updateTemplate(id: number, payload: UpdateTemplateEarlyBookingPayload): Promise<TemplateEarlyBooking> {
        const response = await apiClient.patch(`/hotel/early-bookings/${id}`, payload);
        return response.data;
    },

    async deleteTemplate(id: number): Promise<void> {
        await apiClient.delete(`/hotel/early-bookings/${id}`);
    },

    async restoreTemplate(id: number): Promise<void> {
        await apiClient.patch(`/hotel/early-bookings/${id}/restore`);
    },
};
