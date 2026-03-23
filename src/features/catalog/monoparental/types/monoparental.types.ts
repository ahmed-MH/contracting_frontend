import { ContractRoom, Period } from '../../../contracts/types/contract.types';

// ─── Monoparental Rules Enums ────────────────────────────────────────

export type BaseRateType = 'SINGLE' | 'DOUBLE';
export type ChildSurchargeBase = 'SINGLE' | 'DOUBLE' | 'HALF_SINGLE' | 'HALF_DOUBLE';

// ─── Template Monoparental Rules (Catalogue) ─────────────────────────

export interface TemplateMonoparentalRule {
    id: number;
    reference?: string;
    name: string;
    adultCount: number;
    childCount: number;
    minAge: number;
    maxAge: number;
    baseRateType: BaseRateType;
    childSurchargePercentage: number;
    childSurchargeBase: ChildSurchargeBase;
}

export interface CreateTemplateMonoparentalRulePayload {
    name: string;
    adultCount: number;
    childCount: number;
    minAge: number;
    maxAge: number;
    baseRateType: BaseRateType;
    childSurchargePercentage: number;
    childSurchargeBase: ChildSurchargeBase;
}

export type UpdateTemplateMonoparentalRulePayload = Partial<CreateTemplateMonoparentalRulePayload>;

// ─── Contract Monoparental Rules (Instance) ──────────────────────────

export interface ContractMonoparentalRuleRoomJunction {
    id: number;
    contractRoom: ContractRoom;
}

export interface ContractMonoparentalRulePeriodJunction {
    id: number;
    period: Period;
    overrideBaseRateType?: BaseRateType | null;
    overrideChildSurchargeBase?: ChildSurchargeBase | null;
    overrideChildSurchargeValue?: number | null;
}

export interface ContractMonoparentalRule {
    id: number;
    reference?: string;
    name: string;
    adultCount: number;
    childCount: number;
    minAge: number;
    maxAge: number;
    baseRateType: BaseRateType;
    childSurchargePercentage: number;
    childSurchargeBase: ChildSurchargeBase;
    templateId: number | null;
    applicableContractRooms: ContractMonoparentalRuleRoomJunction[];
    applicablePeriods: ContractMonoparentalRulePeriodJunction[];
}

export interface UpdateContractMonoparentalRulePayload {
    name?: string;
    adultCount?: number;
    childCount?: number;
    minAge?: number;
    maxAge?: number;
    baseRateType?: BaseRateType;
    childSurchargePercentage?: number;
    childSurchargeBase?: ChildSurchargeBase;
    applicableContractRoomIds?: number[];
    applicablePeriods?: {
        periodId: number;
        overrideBaseRateType?: BaseRateType | null;
        overrideChildSurchargeBase?: ChildSurchargeBase | null;
        overrideChildSurchargeValue?: number | null;
    }[];
}