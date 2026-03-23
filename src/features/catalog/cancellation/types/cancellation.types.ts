export enum CancellationPenaltyType {
    NIGHTS = 'NIGHTS',
    PERCENTAGE = 'PERCENTAGE',
    FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export interface TemplateCancellationRule {
    id: number;
    reference: string;
    name: string;
    daysBeforeArrival: number;
    appliesToNoShow: boolean;
    minStayCondition: number | null;
    penaltyType: CancellationPenaltyType;
    baseValue: number;
    hotelId: number;
}

export interface CreateTemplateCancellationRulePayload {
    name: string;
    daysBeforeArrival: number;
    appliesToNoShow: boolean;
    minStayCondition?: number | null;
    penaltyType: CancellationPenaltyType;
    baseValue: number;
}

export interface ContractCancellationRule {
    id: number;
    reference: string;
    name: string;
    daysBeforeArrival: number;
    appliesToNoShow: boolean;
    minStayCondition: number | null;
    penaltyType: CancellationPenaltyType;
    baseValue: number;
    contractId: number;
    templateCancellationRuleId: number | null;
    applicablePeriods: ContractCancellationRulePeriod[];
    applicableRooms: ContractCancellationRuleRoom[];
}

export interface ContractCancellationRulePeriod {
    id: number;
    periodId?: number; 
    period?: { id: number };
    overrideValue: number | null;
}

export interface ContractCancellationRuleRoom {
    id: number;
    contractRoomId: number;
    contractRoom?: {
        id: number;
        roomType?: {
            id: number;
            code: string;
            name: string;
        };
    };
}

export interface CreateContractCancellationRulePayload extends CreateTemplateCancellationRulePayload {
    contractRoomIds: number[];
    periodIds?: number[];
}

export interface UpdateContractCancellationRulePayload {
    name?: string;
    daysBeforeArrival?: number;
    appliesToNoShow?: boolean;
    minStayCondition?: number | null;
    penaltyType?: CancellationPenaltyType;
    baseValue?: number;
    applicablePeriods?: { periodId: number; overrideValue?: number | null }[];
    contractRoomIds?: number[];
}
