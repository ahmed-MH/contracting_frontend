import apiClient from '../../../services/api.client';
import type { ActivationValidationResult, Contract, Period, ContractRoom, ContractStatus } from '../types/contract.types';

// Re-export types for page consumers
export type { Contract, Period, ContractRoom, ContractStatus };

export interface CreateContractPayload {
    name: string;
    startDate: string;
    endDate: string;
    currency: string;
    affiliateIds: number[];
    paymentCondition?: string;
    depositAmount?: number;
    creditDays?: number;
    paymentMethods?: string[];
    baseArrangementId?: number | null;
}

export interface UpdateContractPayload {
    name?: string;
    startDate?: string;
    endDate?: string;
    currency?: string;
    affiliateIds?: number[];
    status?: ContractStatus;
    paymentCondition?: string;
    depositAmount?: number;
    creditDays?: number;
    paymentMethods?: string[];
    baseArrangementId?: number | null;
}

export interface CreatePeriodPayload {
    name: string;
    startDate: string;
    endDate: string;
    contractId: number;
}

export interface CreateContractRoomPayload {
    reference?: string;
    description?: string;
    contractId: number;
    roomTypeId: number;
}

export interface PriceEntryDto {
    periodId: number;
    contractRoomId: number;
    arrangementId: number;
    amount: number;
    minStay: number;
    releaseDays: number;
}

// Legacy export kept for compatibility (used in old hook)
export interface PriceDto {
    periodId: number;
    contractRoomId: number;
    arrangementId: number;
    amount: number;
    minStay: number;
    releaseDays: number;
}

export interface CellDto {
    periodId: number;
    contractRoomId: number;
    isContracted: boolean;
    allotment?: number;
    prices: PriceEntryDto[];
}

export interface BatchUpsertPricesPayload {
    cells: CellDto[];
}

export interface ContractLineData {
    id: number;
    allotment: number;
    isContracted: boolean;
    period: { id: number; name: string; startDate: string; endDate: string };
    contractRoom: { id: number; roomType: { id: number; name: string } };
    prices: { id: number; amount: number; minStay: number; releaseDays: number; arrangement: { id: number; code: string; name: string } }[];
}

// ─── API Methods ─────────────────────────────────────────────────────

export const contractService = {
    getContracts: () =>
        apiClient.get<Contract[]>('/contracts').then((r) => r.data),

    createContract: (data: CreateContractPayload) =>
        apiClient.post<Contract>('/contracts', data).then((r) => r.data),

    getContractById: (id: number) =>
        apiClient.get<Contract>(`/contracts/${id}`).then((r) => r.data),

    validateActivation: (id: number) =>
        apiClient.get<ActivationValidationResult>(`/contracts/${id}/activation-check`).then((r) => r.data),

    updateContract: (id: number, data: UpdateContractPayload) =>
        apiClient.patch<Contract>(`/contracts/${id}`, data).then((r) => r.data),

    // ─── Periods ──────────────────────────────────────────────────────
    addPeriod: (contractId: number, data: CreatePeriodPayload) =>
        apiClient.post<Period>(`/contracts/${contractId}/periods`, data).then((r) => r.data),

    deletePeriod: (contractId: number, periodId: number) =>
        apiClient.delete(`/contracts/${contractId}/periods/${periodId}`).then((r) => r.data),

    // ─── Contract Rooms ───────────────────────────────────────────────
    addContractRoom: (contractId: number, data: CreateContractRoomPayload) =>
        apiClient.post<ContractRoom>(`/contracts/${contractId}/rooms`, data).then((r) => r.data),

    deleteContractRoom: (contractId: number, roomId: number) =>
        apiClient.delete(`/contracts/${contractId}/rooms/${roomId}`).then((r) => r.data),

    // ─── Prices ───────────────────────────────────────────────────────
    getContractPrices: (contractId: number) =>
        apiClient.get<ContractLineData[]>(`/contracts/${contractId}/prices`).then((r) => r.data),

    batchUpsertPrices: (contractId: number, data: BatchUpsertPricesPayload) =>
        apiClient.post(`/contracts/${contractId}/prices/batch`, data).then((r) => r.data),
};
