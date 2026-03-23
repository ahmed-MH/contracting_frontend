import apiClient from '../../../services/api.client';
import type { ContractEarlyBooking, UpdateContractEarlyBookingPayload } from '../../catalog/early-bookings/types/early-bookings.types';

export const contractEarlyBookingService = {
    getByContract: async (contractId: number): Promise<ContractEarlyBooking[]> => {
        const response = await apiClient.get(`/contracts/${contractId}/early-bookings`);
        return response.data;
    },

    importFromTemplate: async (contractId: number, templateId: number): Promise<ContractEarlyBooking> => {
        const response = await apiClient.post(`/contracts/${contractId}/early-bookings/import`, {
            templateId,
        });
        return response.data;
    },

    update: async (id: number, payload: UpdateContractEarlyBookingPayload): Promise<ContractEarlyBooking> => {
        const response = await apiClient.patch(`/contracts/early-bookings/${id}`, payload);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/contracts/early-bookings/${id}`);
    },
};
