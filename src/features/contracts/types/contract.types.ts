import { RoomType } from '../../rooms/types/room.types';
import type { AuditMetadata } from '../../../types/audit';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
export type PaymentConditionType =
    | 'FULL_PREPAYMENT'
    | 'PARTIAL_DEPOSIT'
    | 'CREDIT_DAYS_FROM_INVOICE'
    | 'PAYMENT_ON_ARRIVAL'
    | 'PAYMENT_ON_DEPARTURE'
    | 'CUSTOM'
    | 'DEPOSIT'
    | 'PREPAYMENT_100';
export type PaymentMethodType =
    | 'BANK_TRANSFER'
    | 'SWIFT_TRANSFER'
    | 'BANK_CHECK'
    | 'BANK_DRAFT'
    | 'CASH'
    | 'CREDIT_CARD'
    | 'PAYMENT_GATEWAY'
    | 'OTHER';
export type ContractMarketScope = 'INTERNATIONAL' | 'NATIONAL' | 'MIXED';
export type PaymentDepositType = 'AMOUNT' | 'PERCENTAGE';
export type PaymentDueTrigger = 'BOOKING_CONFIRMATION' | 'BEFORE_CHECK_IN' | 'INVOICE_ISSUE' | 'CUSTOM';
export type PaymentConditionBasis = 'INVOICE_ISSUE' | 'INVOICE_RECEIPT' | 'CHECK_OUT';

export interface ContractPaymentMethodPolicy {
    type: PaymentMethodType;
    isPrimary?: boolean;
}

export interface ContractPaymentConditionPolicy {
    type: PaymentConditionType;
    percentage?: number;
    days?: number;
    basis?: PaymentConditionBasis;
    label?: string;
    notes?: string;
}

export interface ContractPaymentDepositPolicy {
    type: PaymentDepositType;
    value: number;
    currency?: string;
    dueTrigger?: PaymentDueTrigger;
    dueDays?: number;
    refundable?: boolean;
}

export interface ContractPaymentPolicy {
    marketScope: ContractMarketScope;
    methods: ContractPaymentMethodPolicy[];
    conditions: ContractPaymentConditionPolicy[];
    deposit?: ContractPaymentDepositPolicy | null;
    selectedHotelBankAccountId?: number | null;
    notes?: string | null;
}

export interface Contract extends AuditMetadata {
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
    paymentPolicy?: ContractPaymentPolicy | null;
    selectedHotelBankAccountId?: number | null;

    baseArrangement?: {
        id: number;
        name: string;
        code: string;
        level?: number;
    } | null;
    baseArrangementId?: number | null;
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

