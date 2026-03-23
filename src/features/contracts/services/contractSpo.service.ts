import apiClient from '../../../services/api.client';
import type { ContractSpo, CreateContractSpoPayload, UpdateContractSpoPayload } from '../../catalog/spos/types/spos.types';

export const contractSpoService = {
    getAll: async (contractId: number): Promise<ContractSpo[]> => {
        const response = await apiClient.get<ContractSpo[]>(`/contracts/${contractId}/spos`);
        return response.data;
    },

    create: async (contractId: number, payload: CreateContractSpoPayload): Promise<ContractSpo> => {
        const response = await apiClient.post<ContractSpo>(`/contracts/${contractId}/spos`, payload);
        return response.data;
    },

    import: async (contractId: number, templateId: number): Promise<ContractSpo> => {
        const response = await apiClient.post<ContractSpo>(`/contracts/${contractId}/spos/import`, { templateId });
        return response.data;
    },

    update: async (contractId: number, id: number, payload: UpdateContractSpoPayload): Promise<ContractSpo> => {
        const response = await apiClient.patch<ContractSpo>(`/contracts/${contractId}/spos/${id}`, payload);
        return response.data;
    },

    delete: async (contractId: number, id: number): Promise<void> => {
        await apiClient.delete(`/contracts/${contractId}/spos/${id}`);
    }
};
