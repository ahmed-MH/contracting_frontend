import type { ContractRoom, Period } from '../../../contracts/types/contract.types';

// ─── Supplement Enums ────────────────────────────────────────────────

export type SupplementCalculationType = 'FIXED' | 'PERCENTAGE' | 'FORMULA' | 'FREE';
export type PricingModifierApplicationType = 'PER_NIGHT_PER_PERSON' | 'PER_NIGHT_PER_ROOM' | 'FLAT_RATE_PER_STAY';
export type SupplementSystemCode = 'SINGLE_OCCUPANCY' | 'GALA_DINNER' | 'MEAL_PLAN' | 'CUSTOM';

// ─── Template Supplements (Catalogue) ────────────────────────────────

export interface TemplateSupplement {
    id: number;
    reference?: string;
    name: string;
    systemCode: SupplementSystemCode;
    type: SupplementCalculationType;
    value: number | null;
    formula: string | null;
    isMandatory: boolean;
    applicationType: PricingModifierApplicationType;
    minAge: number | null;
    maxAge: number | null;
    /** YYYY-MM-DD: if set, only contracts covering this date can import this template. */
    specificDate: string | null;
}

export interface CreateTemplateSupplementPayload {
    name: string;
    systemCode: SupplementSystemCode;
    type: SupplementCalculationType;
    value?: number;
    formula?: string;
    isMandatory?: boolean;
    applicationType: PricingModifierApplicationType;
    minAge: number | null;
    maxAge: number | null;
    /** YYYY-MM-DD: if set, only contracts covering this date can import this template. */
    specificDate?: string | null;
}

export type UpdateTemplateSupplementPayload = Partial<CreateTemplateSupplementPayload>;

// ─── Contract Supplements (Instance) ─────────────────────────────────

export interface ContractSupplementRoomJunction {
    id: number;
    contractRoom: ContractRoom;
}

export interface ContractSupplementPeriodJunction {
    id: number;
    period: Period;
    /** Null = inherit base value from ContractSupplement.value */
    overrideValue: number | null;
}

export interface ContractSupplement {
    id: number;
    reference?: string;
    name: string;
    systemCode: SupplementSystemCode;
    type: SupplementCalculationType;
    value: number | null;
    formula: string | null;
    isMandatory: boolean;
    applicationType: PricingModifierApplicationType;
    minAge: number | null;
    maxAge: number | null;
    templateId: number | null;
    /** YYYY-MM-DD: inherited from template on import, auto-assigns the matching period. */
    specificDate: string | null;
    applicableContractRooms: ContractSupplementRoomJunction[];
    applicablePeriods: ContractSupplementPeriodJunction[];
}

export interface PeriodOverridePayload {
    periodId: number;
    overrideValue?: number | null;
}

export interface UpdateContractSupplementPayload {
    name?: string;
    systemCode?: SupplementSystemCode;
    type?: SupplementCalculationType;
    value?: number;
    formula?: string;
    isMandatory?: boolean;
    applicationType?: PricingModifierApplicationType;
    minAge?: number | null;
    maxAge?: number | null;
    applicableContractRoomIds?: number[];
    /** New: full targeting with seasonal price overrides */
    applicablePeriods?: PeriodOverridePayload[];
    /** @deprecated use applicablePeriods */
    applicablePeriodIds?: number[];
    /** Update the specific event date. */
    specificDate?: string | null;
}