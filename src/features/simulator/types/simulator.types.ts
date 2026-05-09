export enum OccupantType {
    ADULT = 'ADULT',
    CHILD = 'CHILD',
    INFANT = 'INFANT'
}

export interface OccupantDto {
    paxOrder: number;
    type: OccupantType;
    age: number;
}

export interface RoomingItemDto {
    roomId: number;
    boardTypeId: number;
    occupants: OccupantDto[];
}

export interface SimulationRequest {
    contractId: number;
    affiliateId: number;
    boardTypeId?: number;
    checkIn: string;
    checkOut: string;
    bookingDate?: string;
    includeInactive?: boolean;
    inactiveOverrideReason?: string;
    roomingList: RoomingItemDto[];
}

export interface InactiveContractOverride {
    enabled: boolean;
    contractStatus: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'TERMINATED';
    reason?: string;
}

export interface PromotionAppliedDto {
    name: string;
    amount: number;
}

export interface ModifierDto {
    name: string;
    amount: number;
}

export interface PricingTrace {
    stage: string;
    label: string;
    beforeAmount: number;
    deltaAmount: number;
    afterAmount: number;
    type?: string;
    percent?: number;
    stackMode?: string;
    applicationStep?: string;
    baseAmount?: number;
    discountAmount?: number;
    sourceType?: string;
    sourceId?: number;
    metadata?: Record<string, unknown>;
}

export interface DailyRate {
    date: string;
    baseRate: number;
    reductionsApplied: ModifierDto[];
    netRate: number;
    promotionApplied: PromotionAppliedDto | null;
    promoRate: number;
    supplementsApplied: ModifierDto[];
    finalDailyRate: number;
    perPersonRate: number;
    currency: string;
    isAvailable: boolean;
    reason?: string;
}

export interface RoomBreakdownDto {
    roomIndex: number;
    roomId: number;
    boardTypeId: number;
    roomTotalNet: number;
    dailyRates: DailyRate[];
    pricingTrace: PricingTrace[];
}

export interface ProformaDiscountSource {
    label: string;
    commercialLabel?: string;
    amount: number;
    sourceType?: string;
    sourceId?: number;
    scope?: 'nightly' | 'room' | 'stay' | 'global';
    displayInNightlyRows?: boolean;
    displayInSummary?: boolean;
    roomIndex?: number;
}

export interface ProformaViewDailyRate {
    date: string;
    baseNightlyAmount?: number;
    grossNightlyAmount: number;
    nightlyCommercialAmount?: number;
    nightlyUnitAmount?: number;
    nightlyBasisParts?: Array<{
        type?: string;
        label?: string;
        unitAmount?: number;
        quantity?: number;
        amount?: number;
        percentageOfBase?: number | null;
        reductionPercentage?: number | null;
    }>;
    nightlyDisplayBasis?: string;
    occupancyApplied?: number;
    occupancyAdultsApplied?: number;
    occupancyChildrenApplied?: number;
    rateMode?: string;
    nightlyDiscountAmount: number;
    netNightlyAmount: number;
    commercialNightlyAmount?: number;
    displayDiscountInRow?: boolean;
    supplementsAmount?: number;
    isAvailable?: boolean;
    notes?: string[];
}

export interface ProformaViewRoom {
    roomIndex?: number;
    roomId?: number | null;
    roomTypeName?: string | null;
    occupancyApplied?: number;
    roomGrossAmountBeforeDiscount: number;
    roomDiscountAmount: number;
    roomNetAmountBeforeTax: number;
    discountSummary?: ProformaDiscountSource[];
    dailyRates: ProformaViewDailyRate[];
}

export interface ProformaCommercialView {
    version: number;
    currency: string;
    sourceCurrency?: string;
    documentCurrency?: string;
    exchangeRateUsed?: number | null;
    fxConversionMode?: string;
    nightlyLineMode?: 'gross_before_discount' | string;
    nightlyLineModeLabel?: string;
    discountSemantics?: string;
    discountPresentationRules?: Record<string, string>;
    rooms: ProformaViewRoom[];
    stayAdjustments?: ModifierDto[];
    discountSummary?: ProformaDiscountSource[];
    totals: {
        grossAmountBeforeDiscount: number;
        discountAmount: number;
        netAmountBeforeTax: number;
        taxEnabled?: boolean;
        taxName?: string | null;
        taxAmount?: number | null;
        totalAmount: number;
        currency: string;
        sourceCurrency?: string;
        documentCurrency?: string;
        exchangeRateUsed?: number | null;
        fxConversionMode?: string;
        fxRateDate?: string | null;
    };
}

export interface SimulationResponse {
    contractId: number;
    contractStatus: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'TERMINATED';
    checkIn: string;
    checkOut: string;
    currency: string;
    inactiveContractOverride?: InactiveContractOverride;
    
    totalBrut: number;
    totalRemise: number;
    totalGross: number;
    totalNet: number;
    
    roomsBreakdown: RoomBreakdownDto[];
    stayModifiers: ModifierDto[];
}

export type SimulationContractMatchStatus = 'none' | 'single' | 'multiple';

export interface SimulationContractCandidate {
    contractId: number;
    reference?: string | null;
    name: string;
    status: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'TERMINATED';
    startDate: string;
    endDate: string;
    currency: string;
    baseArrangement?: {
        id: number;
        name: string;
        code: string;
    } | null;
    affiliate?: {
        id: number;
        companyName: string;
    } | null;
}

export interface SimulationContractMatchResponse {
    status: SimulationContractMatchStatus;
    candidates: SimulationContractCandidate[];
    autoSelectedContractId?: number;
    reason?: string;
}

// ─── Proforma Invoice ────────────────────────────────────────────────

export interface ProformaInvoice extends AuditMetadata {
    id: number;
    hotelId: number;
    affiliateId: number;
    contractId: number;
    reference: string;
    status: 'DRAFT' | 'ISSUED' | 'GENERATED' | 'CANCELLED';
    currency: string;
    customerName: string;
    customerEmail?: string;
    affiliate?: {
        companyName?: string;
        address?: string | null;
        emails?: { label?: string; address: string }[];
    } | null;
    checkIn: string;
    checkOut: string;
    bookingDate: string;
    voucherNumber?: string | null;
    boardTypeName: string;
    roomingSummary: any;
    simulationInputSnapshot: any;
    calculationSnapshot: any & {
        proformaView?: ProformaCommercialView;
    };
    totalsSnapshot: {
        grossAmountBeforeDiscount?: number;
        subtotal: number;
        discountAmount?: number;
        discountTotal: number;
        netBeforeTax?: number;
        netAmountBeforeTax?: number;
        taxEnabled?: boolean;
        taxName?: string | null;
        taxAmount?: number | null;
        taxCurrency?: string;
        grandTotal: number;
        totalAmount?: number;
        sourceCurrency?: string;
        documentCurrency?: string;
        exchangeRate?: number | null;
        exchangeRateUsed?: number | null;
        exchangeRateType?: string;
        fxConversionMode?: string;
        exchangeRateDate?: string | null;
        fxRateDate?: string | null;
        exchangeRatePivotCurrency?: string | null;
        discountSources?: ProformaDiscountSource[];
        discountSemantics?: string;
        pricingLineMode?: string;
    };
    taxEnabled?: boolean;
    taxAmount?: number | null;
    documentLogoUrl?: string | null;
    documentThemeColor?: string | null;
    documentSnapshot?: {
        hotel?: {
            id?: number | null;
            name?: string | null;
            reference?: string | null;
            address?: string | null;
            phone?: string | null;
            emails?: { label?: string; address: string }[];
            logoUrl?: string | null;
            themeColor?: string | null;
        } | null;
        affiliate?: {
            id?: number | null;
            companyName?: string | null;
            reference?: string | null;
            address?: string | null;
            emails?: { label?: string; address: string }[];
        } | null;
    } | null;
    notes?: string;
    generatedByUserId: number | null;
    generatedAt: string;
    issuedAt?: string | null;
    issuedByUserId?: number | null;
    issuedByName?: string | null;
    issuedByEmail?: string | null;
    deletedAt?: string | null;
}

export interface CreateProformaPayload {
    affiliateId: number;
    contractId: number;
    customerName: string;
    customerEmail?: string;
    checkIn: string;
    checkOut: string;
    bookingDate: string;
    boardTypeName: string;
    currency: string;
    taxEnabled?: boolean;
    taxAmount?: number;
    roomingSummary: any;
    simulationInput: any;
    calculationResult: any;
    totals: {
        subtotal: number;
        discountTotal: number;
        grandTotal: number;
    };
    notes?: string;
    voucherNumber?: string;
}

export interface UpdateProformaPreviewSettingsPayload {
    currency?: string;
    taxEnabled?: boolean;
    taxAmount?: number;
    taxName?: string;
    notes?: string;
    voucherNumber?: string;
}

export interface IssuedProformaFilters {
    search?: string;
    affiliateId?: number;
    issuedFrom?: string;
    issuedTo?: string;
    page?: number;
    limit?: number;
}

import type { AuditMetadata } from '../../../types/audit';
