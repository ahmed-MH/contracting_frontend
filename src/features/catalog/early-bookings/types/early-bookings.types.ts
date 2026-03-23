import { ContractRoom, Period } from '../../../contracts/types/contract.types';
import { ReductionCalculationType } from '../../reductions/types/reductions.types';
import type { PricingModifierApplicationType } from '../../supplements/types/supplements.types';
export type { PricingModifierApplicationType };

// ─── Template Early Bookings (Catalogue) ─────────────────────────────

export interface TemplateEarlyBooking {
    id: number;
    reference?: string;
    name: string;
    calculationType: ReductionCalculationType;
    value: number;
    applicationType: PricingModifierApplicationType;
    releaseDays: number;
    bookingWindowStart: string | null;
    bookingWindowEnd: string | null;
    stayWindowStart: string | null;
    stayWindowEnd: string | null;
    isPrepaid: boolean;
    prepaymentPercentage: number | null;
    prepaymentDeadlineDate: string | null;
    roomingListDeadlineDate: string | null;
}

export interface CreateTemplateEarlyBookingPayload {
    name: string;
    calculationType: ReductionCalculationType;
    value: number;
    applicationType?: PricingModifierApplicationType;
    releaseDays: number;
    bookingWindowStart?: string | null;
    bookingWindowEnd?: string | null;
    stayWindowStart?: string | null;
    stayWindowEnd?: string | null;
    isPrepaid: boolean;
    prepaymentPercentage?: number | null;
    prepaymentDeadlineDate?: string | null;
    roomingListDeadlineDate?: string | null;
}

export type UpdateTemplateEarlyBookingPayload = Partial<CreateTemplateEarlyBookingPayload>;

// ─── Contract Early Bookings (Instance) ──────────────────────────────────

export interface ContractEarlyBookingRoomJunction {
    id: number;
    contractRoom: ContractRoom;
}

export interface ContractEarlyBookingPeriodJunction {
    id: number;
    period: Period;
    overrideValue?: number | null;
}

export interface ContractEarlyBooking {
    id: number;
    reference?: string;
    name: string;
    calculationType: ReductionCalculationType;
    value: number;
    applicationType: PricingModifierApplicationType;
    releaseDays: number;
    bookingWindowStart: string | null;
    bookingWindowEnd: string | null;
    stayWindowStart: string | null;
    stayWindowEnd: string | null;
    isPrepaid: boolean;
    prepaymentPercentage: number | null;
    prepaymentDeadlineDate: string | null;
    roomingListDeadlineDate: string | null;
    templateId: number | null;
    applicableContractRooms: ContractEarlyBookingRoomJunction[];
    applicablePeriods: ContractEarlyBookingPeriodJunction[];
}

export interface UpdateContractEarlyBookingPayload {
    name?: string;
    calculationType?: ReductionCalculationType;
    value?: number;
    applicationType?: PricingModifierApplicationType;
    releaseDays?: number;
    bookingWindowStart?: string | null;
    bookingWindowEnd?: string | null;
    stayWindowStart?: string | null;
    stayWindowEnd?: string | null;
    isPrepaid?: boolean;
    prepaymentPercentage?: number | null;
    prepaymentDeadlineDate?: string | null;
    roomingListDeadlineDate?: string | null;
    applicableContractRoomIds?: number[];
    applicablePeriods?: { periodId: number; overrideValue?: number | null }[];
}
