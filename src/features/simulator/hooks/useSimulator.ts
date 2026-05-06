import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../../../services/api.client';
import { SimulationContractMatchResponse, SimulationRequest, SimulationResponse } from '../types/simulator.types';

interface ContractMatchParams {
    affiliateId?: number;
    checkIn?: string;
    checkOut?: string;
    includeInactive?: boolean;
}

export const useSimulationContractMatches = ({ affiliateId, checkIn, checkOut, includeInactive }: ContractMatchParams) => {
    return useQuery<SimulationContractMatchResponse>({
        queryKey: ['simulation-contract-matches', affiliateId, checkIn, checkOut, includeInactive],
        enabled: Boolean(affiliateId && checkIn && checkOut),
        queryFn: async () => {
            const { data } = await apiClient.get<SimulationContractMatchResponse>('/simulation/contracts/matches', {
                params: { affiliateId, checkIn, checkOut, includeInactive },
            });
            return data;
        },
    });
};

export const useCalculateSimulation = () => {
    return useMutation({
        mutationFn: async (dto: SimulationRequest): Promise<SimulationResponse> => {
            const { data } = await apiClient.post<SimulationResponse>('/simulation/calculate', dto);
            return data;
        },
    });
};
