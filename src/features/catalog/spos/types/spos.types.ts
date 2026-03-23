import { PricingModifierApplicationType } from '../../supplements/types/supplements.types';

export type SpoConditionType =
    | 'MIN_NIGHTS'
    | 'HONEYMOONER'
    | 'EARLY_BIRD'
    | 'LONG_STAY'
    | 'NONE';

export type SpoBenefitType =
    | 'PERCENTAGE_DISCOUNT'
    | 'FIXED_DISCOUNT'
    | 'FREE_NIGHTS'
    | 'FREE_ROOM_UPGRADE'
    | 'FREE_BOARD_UPGRADE'
    | 'KIDS_GO_FREE';

export interface TemplateSpo {
    id: number;
    reference?: string;
    name: string;
    conditionType: SpoConditionType;
    conditionValue?: number;
    benefitType: SpoBenefitType;
    benefitValue?: number;
    value: number;
    applicationType: PricingModifierApplicationType;
    stayNights: number;
    payNights: number;
}

export interface ContractSpo {
    id: number;
    reference?: string;
    name: string;
    conditionType: SpoConditionType;
    conditionValue?: number;
    benefitType: SpoBenefitType;
    benefitValue?: number;
    value: number;
    applicationType: PricingModifierApplicationType;
    stayNights: number;
    payNights: number;

    // Targeting
    applicablePeriods?: {
        id: number;
        period: { id: number; name: string; startDate: string; endDate: string };
        overrideValue?: number | null;
    }[];
    applicableContractRooms?: { id: number; contractRoom: { id: number; roomType: { name: string; code: string } } }[];
    applicableArrangements?: { id: number; arrangement: { id: number; name: string; code: string } }[];

    templateSpo?: TemplateSpo;
    templateSpoId?: number | null;
}

export interface CreateTemplateSpoPayload {
    name: string;
    conditionType: SpoConditionType;
    conditionValue?: number;
    benefitType: SpoBenefitType;
    benefitValue?: number;
    value?: number;
    applicationType?: PricingModifierApplicationType;
    stayNights?: number;
    payNights?: number;
}

export type UpdateTemplateSpoPayload = Partial<CreateTemplateSpoPayload>;

export interface CreateContractSpoPayload {
    name: string;
    conditionType: SpoConditionType;
    conditionValue?: number;
    benefitType: SpoBenefitType;
    benefitValue?: number;
    value?: number;
    applicationType?: PricingModifierApplicationType;
    stayNights?: number;
    payNights?: number;
    periodIds: number[];
    contractRoomIds: number[];
    arrangementIds: number[];
}

export interface UpdateContractSpoPayload extends Partial<CreateContractSpoPayload> {
    applicablePeriods?: { periodId: number; overrideValue?: number | null }[];
}
