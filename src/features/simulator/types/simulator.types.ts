export interface SimulationRequest {
    contractId: number;
    roomId: number;
    boardTypeId: number;
    checkIn: string;
    checkOut: string;
    bookingDate?: string;
    occupants: {
        adults: number;
        childrenAges: number[];
    };
}

export interface ReductionApplied {
    name: string;
    amount: number;
}

export interface DailyRate {
    date: string;
    baseRate: number;
    reductionsApplied: ReductionApplied[];
    netRate: number;
    promotionApplied: { name: string; amount: number } | null;
    promoRate: number;
    supplementsApplied: Array<{ name: string; amount: number }>;
    finalDailyRate: number;
    perPersonRate: number;
    currency: string;
    isAvailable: boolean;
    reason?: string;
}

export interface SimulationResponse {
    contractId: number;
    roomTypeId: number;
    arrangementId: number;
    checkIn: string;
    checkOut: string;
    totalBrut: number;
    totalRemise: number;
    totalGross: number;
    perAdultRate: number;
    perNightRate: number;
    currency: string;
    dailyBreakdown: DailyRate[];
    stayModifiers: Array<{ name: string; amount: number }>;
}
