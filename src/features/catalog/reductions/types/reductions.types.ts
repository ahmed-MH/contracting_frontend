import { ContractRoom, Period } from '../../../contracts/types/contract.types';
import { PricingModifierApplicationType } from '../../supplements/types/supplements.types';

// ─── Reduction Enums ─────────────────────────────────────────────────

export type ReductionCalculationType = 'FIXED' | 'PERCENTAGE' | 'FREE';
export type PaxType = 'FIRST_CHILD' | 'SECOND_CHILD' | 'THIRD_CHILD' | 'THIRD_ADULT';
export type ReductionSystemCode = 'EXTRA_ADULT' | 'CHILD' | 'CUSTOM';

// ─── Template Reductions (Catalogue) ─────────────────────────────────

export interface TemplateReduction {
    id: number;
    reference?: string;
    name: string;
    systemCode: ReductionSystemCode;
    calculationType: ReductionCalculationType;
    value: number | null;
    paxType: PaxType;
    paxOrder: number | null;
    minAge: number;
    maxAge: number;
    applicationType: PricingModifierApplicationType;
}

export interface CreateTemplateReductionPayload {
    name: string;
    systemCode: ReductionSystemCode;
    calculationType: ReductionCalculationType;
    value?: number;
    paxType: PaxType;
    paxOrder: number | null;
    minAge: number;
    maxAge: number;
    applicationType?: PricingModifierApplicationType;
}

export type UpdateTemplateReductionPayload = Partial<CreateTemplateReductionPayload>;

// ─── Contract Reductions (Instance) ──────────────────────────────────

export interface ContractReductionRoomJunction {
    id: number;
    contractRoom: ContractRoom;
}

export interface ContractReductionPeriodJunction {
    id: number;
    period: Period;
    overrideValue?: number | null;
}

export interface ContractReduction {
    id: number;
    reference?: string;
    name: string;
    systemCode: ReductionSystemCode;
    calculationType: ReductionCalculationType;
    value: number | null;
    paxType: PaxType;
    paxOrder: number | null;
    minAge: number;
    maxAge: number;
    applicationType: PricingModifierApplicationType;
    templateId: number | null;
    applicableContractRooms: ContractReductionRoomJunction[];
    applicablePeriods: ContractReductionPeriodJunction[];
}

export interface UpdateContractReductionPayload {
    name?: string;
    systemCode?: ReductionSystemCode;
    calculationType?: ReductionCalculationType;
    value?: number;
    paxType?: PaxType;
    paxOrder?: number | null;
    minAge?: number;
    maxAge?: number;
    applicableContractRoomIds?: number[];
    applicablePeriods?: { periodId: number; overrideValue?: number | null }[];
    applicationType?: PricingModifierApplicationType;
}