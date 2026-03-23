import { useMutation } from '@tanstack/react-query';
import apiClient from '../../../services/api.client';
import { SimulationRequest, SimulationResponse } from '../types/simulator.types';

export const useCalculateSimulation = () => {
    return useMutation({
        mutationFn: async (dto: SimulationRequest): Promise<SimulationResponse> => {
            const { data } = await apiClient.post<SimulationResponse>('/simulation/calculate', dto);
            return data;
        },
    });
};
