import { RoomType } from '../../rooms/types/room.types';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
export type PaymentConditionType = 'DEPOSIT' | 'PREPAYMENT_100';
export type PaymentMethodType = 'BANK_TRANSFER' | 'BANK_CHECK';

export interface Contract {
    id: number;
    reference?: string;
    name: string;
    startDate: string;
    endDate: string;
    currency: string;
    status: ContractStatus;
    affiliates: {
        id: number;
        reference?: string;
        companyName: string;
        representativeName?: string | null;
        address?: string | null;
        phone?: string | null;
        emails?: { label: string; address: string }[];
    }[];
    periods: Period[];
    contractRooms: ContractRoom[];

    // Payment Policy
    paymentCondition?: PaymentConditionType;
    depositAmount?: number;
    creditDays?: number;
    paymentMethods?: PaymentMethodType[];

    baseArrangement?: {
        id: number;
        name: string;
        code: string;
        level?: number;
    } | null;
    baseArrangementId?: number | null;
    createdAt: string;
}

export interface ContractRoom {
    id: number;
    reference?: string;
    description?: string;
    roomType: RoomType;
}

export interface Period {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
}

export interface ActivationValidationIssue {
    code: string;
    message: string;
    details?: unknown;
}

export interface ActivationDateRange {
    startDate: string;
    endDate: string;
}

export interface ActivationMissingRate {
    periodId: number;
    periodName: string;
    contractRoomId: number;
    roomName: string;
}

export interface ActivationValidationResult {
    isValid: boolean;
    errors: ActivationValidationIssue[];
    warnings: ActivationValidationIssue[];
    summary: {
        missingPeriods: boolean;
        uncoveredDateRanges: ActivationDateRange[];
        missingRooms: boolean;
        missingRates: ActivationMissingRate[];
        invalidTargets: ActivationValidationIssue[];
    };
}

