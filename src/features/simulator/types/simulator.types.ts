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
    occupants: OccupantDto[];
}

export interface SimulationRequest {
    contractId: number;
    boardTypeId: number;
    checkIn: string;
    checkOut: string;
    bookingDate?: string;
    roomingList: RoomingItemDto[];
}

export interface PromotionAppliedDto {
    name: string;
    amount: number;
}

export interface ModifierDto {
    name: string;
    amount: number;
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
    roomTotalNet: number;
    dailyRates: DailyRate[];
}

export interface SimulationResponse {
    contractId: number;
    checkIn: string;
    checkOut: string;
    currency: string;
    
    totalBrut: number;
    totalRemise: number;
    totalGross: number;
    totalNet: number;
    
    roomsBreakdown: RoomBreakdownDto[];
    stayModifiers: ModifierDto[];
}
