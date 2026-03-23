import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    contractService,
    type CreateContractPayload,
    type UpdateContractPayload,
    type CreatePeriodPayload,
    type CreateContractRoomPayload,
    type Contract,
} from '../services/contract.service';
import { toast } from 'sonner';
import { useHotel } from '../../hotel/context/HotelContext';

function getErrorMessage(error: any, defaultMessage: string): string {
    if (error?.response?.data?.message) {
        const msg = error.response.data.message;
        return Array.isArray(msg) ? msg.join(', ') : msg;
    }
    return defaultMessage;
}

// Query key factory — hotelId scopes contract list to the active hotel
export const contractKeys = {
    all: (hotelId: number | undefined) => ['contracts', hotelId] as const,
    detail: (contractId: number | undefined) => ['contract', contractId] as const,
};

export function useContracts() {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<Contract[]>({
        queryKey: contractKeys.all(hotelId),
        queryFn: contractService.getContracts,
        enabled: !!hotelId,
    });
}

export function useContract(id: number | undefined) {
    return useQuery<Contract>({
        queryKey: contractKeys.detail(id),
        queryFn: () => contractService.getContractById(id!),
        enabled: !!id,
    });
}

export function useCreateContract() {
    const { currentHotel } = useHotel();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateContractPayload) => contractService.createContract(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractKeys.all(currentHotel?.id) });
            toast.success('Contrat créé avec succès');
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Erreur lors de la création du contrat'));
        }
    });
}

// ─── Update Contract ──────────────────────────────────────────────────

export function useUpdateContract(contractId: number, onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateContractPayload) => contractService.updateContract(contractId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
            qc.invalidateQueries({ queryKey: contractKeys.all(currentHotel?.id) });
            toast.success('Contrat mis à jour');
            onSuccess?.();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Erreur lors de la mise à jour du contrat')),
    });
}

// ─── Periods ──────────────────────────────────────────────────────────

export function useAddPeriod(contractId: number, onSuccess?: () => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePeriodPayload) => contractService.addPeriod(contractId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
            toast.success('Période ajoutée');
            onSuccess?.();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, "Erreur lors de l'ajout de la période")),
    });
}

export function useDeletePeriod(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (periodId: number) => contractService.deletePeriod(contractId, periodId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
            toast.success('Période supprimée');
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Impossible de supprimer cette période. Elle est probablement ciblée par un supplément, réduction ou autre règle active.')),
    });
}

// ─── Contract Rooms ───────────────────────────────────────────────────

export function useAddContractRoom(contractId: number, onSuccess?: () => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateContractRoomPayload) => contractService.addContractRoom(contractId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
            toast.success('Chambre ajoutée au contrat');
            onSuccess?.();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, "Erreur lors de l'ajout de la chambre")),
    });
}

export function useDeleteContractRoom(contractId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (roomId: number) => contractService.deleteContractRoom(contractId, roomId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
            toast.success('Chambre retirée du contrat');
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Impossible de supprimer cette chambre. Elle est probablement attachée à des règles.')),
    });
}

