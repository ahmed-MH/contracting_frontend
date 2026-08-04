import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    contractService,
    type Contract,
    type ContractListParams,
    type CreateContractPayload,
    type CreateContractRoomPayload,
    type CreatePeriodPayload,
    type UpdateContractPayload,
} from '../services/contract.service';
import { toast } from 'sonner';
import { useHotel } from '../../hotel/context/HotelContext';
import i18next from '../../../lib/i18n';
import type { PaginatedResult } from '../../../types/pagination.types';

function getErrorMessage(error: any, defaultMessage: string): string {
    const activationErrors = error?.response?.data?.validation?.errors;
    if (Array.isArray(activationErrors) && activationErrors.length > 0) {
        return activationErrors[0]?.message ?? defaultMessage;
    }
    if (error?.response?.data?.message) {
        const msg = error.response.data.message;
        return Array.isArray(msg) ? msg.join(', ') : msg;
    }
    return defaultMessage;
}

export const contractKeys = {
    all: (hotelId: number | undefined) => ['contracts', hotelId] as const,
    list: (hotelId: number | undefined, params: ContractListParams) => ['contracts', hotelId, params] as const,
    archived: (hotelId: number | undefined, params: ContractListParams) => ['contracts', hotelId, 'archived', params] as const,
    detail: (hotelId: number | undefined, contractId: number | undefined) => ['contract', hotelId, contractId] as const,
};

export function useContracts(params: ContractListParams = {}) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<PaginatedResult<Contract>>({
        queryKey: contractKeys.list(hotelId, params),
        queryFn: () => contractService.getContracts(params),
        enabled: !!hotelId,
    });
}

export function useArchivedContracts(params: ContractListParams = {}, enabled: boolean) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<PaginatedResult<Contract>>({
        queryKey: contractKeys.archived(hotelId, params),
        queryFn: () => contractService.getArchivedContracts(params),
        enabled: !!hotelId && enabled,
    });
}

export function useContract(id: number | undefined) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery<Contract>({
        queryKey: contractKeys.detail(hotelId, id),
        queryFn: () => contractService.getContractById(id!),
        enabled: !!hotelId && !!id,
    });
}

export function useContractActivationCheck(contractId: number | undefined, enabled = false) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    return useQuery({
        queryKey: [...contractKeys.detail(hotelId, contractId), 'activation-check'],
        queryFn: () => contractService.validateActivation(contractId!),
        enabled: !!hotelId && !!contractId && enabled,
    });
}

export function useCreateContract() {
    const { currentHotel } = useHotel();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateContractPayload) => contractService.createContract(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractKeys.all(currentHotel?.id) });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontracts.toast.success.b9325d34', { defaultValue: 'Contract created successfully' }));
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, 'Unable to create the contract'));
        },
    });
}

export function useArchiveContract() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => contractService.archiveContract(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all(currentHotel?.id) });
            toast.success('Contract archived');
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Could not archive contract')),
    });
}

export function useRestoreContract() {
    const { currentHotel } = useHotel();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => contractService.restoreContract(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.all(currentHotel?.id) });
            toast.success('Contract restored');
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Could not restore contract')),
    });
}

export function useUpdateContract(contractId: number, onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateContractPayload) => contractService.updateContract(contractId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contractKeys.detail(hotelId, contractId) });
            qc.invalidateQueries({ queryKey: contractKeys.all(hotelId) });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontracts.toast.success.5bfb7f2b', { defaultValue: 'Contract updated' }));
            onSuccess?.();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Unable to update the contract')),
    });
}

export function useAddPeriod(contractId: number, onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePeriodPayload) => contractService.addPeriod(contractId, data),
        onSuccess: (period) => {
            const detailKey = contractKeys.detail(hotelId, contractId);
            qc.setQueryData<Contract>(detailKey, (current) => current
                ? {
                    ...current,
                    periods: [
                        ...(current.periods ?? []).filter((item) => item.id !== period.id),
                        period,
                    ],
                }
                : current);
            qc.invalidateQueries({ queryKey: detailKey });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontracts.toast.success.2cc43dfd', { defaultValue: 'Pricing period added' }));
            onSuccess?.();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Unable to add the pricing period')),
    });
}

export function useDeletePeriod(contractId: number) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (periodId: number) => contractService.deletePeriod(contractId, periodId),
        onSuccess: (_result, periodId) => {
            const detailKey = contractKeys.detail(hotelId, contractId);
            qc.setQueryData<Contract>(detailKey, (current) => current
                ? {
                    ...current,
                    periods: (current.periods ?? []).filter((period) => period.id !== periodId),
                }
                : current);
            qc.invalidateQueries({ queryKey: detailKey });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontracts.toast.success.0d13dae8', { defaultValue: 'Pricing period deleted' }));
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Unable to delete this pricing period. It is probably used by an active rule.')),
    });
}

export function useAddContractRoom(contractId: number, onSuccess?: () => void) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateContractRoomPayload) => contractService.addContractRoom(contractId, data),
        onSuccess: (contractRoom) => {
            const detailKey = contractKeys.detail(hotelId, contractId);
            qc.setQueryData<Contract>(detailKey, (current) => current
                ? {
                    ...current,
                    contractRooms: [
                        ...(current.contractRooms ?? []).filter((item) => item.id !== contractRoom.id),
                        contractRoom,
                    ],
                }
                : current);
            qc.invalidateQueries({ queryKey: detailKey });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontracts.toast.success.7ddb5960', { defaultValue: 'Contract room added' }));
            onSuccess?.();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Unable to add the contract room')),
    });
}

export function useDeleteContractRoom(contractId: number) {
    const { currentHotel } = useHotel();
    const hotelId = currentHotel?.id;
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (roomId: number) => contractService.deleteContractRoom(contractId, roomId),
        onSuccess: (_result, roomId) => {
            const detailKey = contractKeys.detail(hotelId, contractId);
            qc.setQueryData<Contract>(detailKey, (current) => current
                ? {
                    ...current,
                    contractRooms: (current.contractRooms ?? []).filter((room) => room.id !== roomId),
                }
                : current);
            qc.invalidateQueries({ queryKey: detailKey });
            toast.success(i18next.t('auto.features.contracts.hooks.usecontracts.toast.success.ea857a1e', { defaultValue: 'Contract room removed' }));
        },
        onError: (error: any) => toast.error(getErrorMessage(error, 'Unable to remove this room. It is probably linked to active rules.')),
    });
}
