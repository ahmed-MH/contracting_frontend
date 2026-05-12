export type IntegrationApiUserStatus = 'ACTIVE' | 'INACTIVE';
export type IntegrationApiKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type IntegrationApiKeyEnvironment = 'TEST' | 'PRODUCTION';
export type IntegrationEndpointStatus = 'ACTIVE' | 'INACTIVE';
export type IntegrationPermission = 'RESERVATIONS_QUOTE';

export interface IntegrationHotelRef {
    id: number;
    name: string;
}

export interface IntegrationApiUser {
    id: number;
    name: string;
    description: string | null;
    status: IntegrationApiUserStatus;
    permissions: IntegrationPermission[];
    allowedHotels: IntegrationHotelRef[];
    updatedAt: string;
}

export interface IntegrationApiKey {
    id: number;
    name: string;
    prefix: string;
    status: IntegrationApiKeyStatus;
    environment: IntegrationApiKeyEnvironment;
    expiresAt: string | null;
    lastUsedAt: string | null;
    allowedIps: string[] | null;
    rotatedFromKeyId: number | null;
    rotatedToKeyId: number | null;
    rotatedFrom?: Pick<IntegrationApiKey, 'id' | 'prefix'> | null;
    rotatedTo?: Pick<IntegrationApiKey, 'id' | 'prefix'> | null;
    apiUserId: number;
    apiUser?: Pick<IntegrationApiUser, 'id' | 'name'>;
    updatedAt: string;
}

export interface IntegrationEndpoint {
    id: number;
    code: string;
    method: string;
    path: string;
    version: string;
    status: IntegrationEndpointStatus;
    requiresApiKey: boolean;
    rateLimitPerMinute: number;
    updatedAt: string;
    updatedByName?: string | null;
}

export interface IntegrationUsageLog {
    id: number;
    endpointCode: string;
    source?: 'PUBLIC_API' | 'PLAYGROUND';
    requestId: string | null;
    externalReservationCode: string | null;
    statusCode: number;
    success: boolean;
    errorCode: string | null;
    errorMessage: string | null;
    durationMs: number;
    ipAddress: string | null;
    apiKeyEnvironment: IntegrationApiKeyEnvironment | null;
    requestJson?: Record<string, unknown> | null;
    responseJson?: Record<string, unknown> | null;
    createdAt: string;
    apiUser?: Pick<IntegrationApiUser, 'id' | 'name'> | null;
    apiKey?: Pick<IntegrationApiKey, 'id' | 'prefix' | 'environment' | 'rotatedFromKeyId' | 'rotatedToKeyId'> | null;
    hotel?: IntegrationHotelRef | null;
}

export interface IntegrationUsageLogFilters {
    endpointCode?: string;
    apiUserId?: number;
    hotelId?: number;
    success?: boolean;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface IntegrationApiUserPayload {
    name: string;
    description?: string;
    status: IntegrationApiUserStatus;
    permissions: IntegrationPermission[];
    allowedHotelIds: number[];
}

export interface IntegrationApiKeyPayload {
    apiUserId: number;
    name: string;
    expiresAt?: string | null;
    environment?: IntegrationApiKeyEnvironment;
    allowedIps?: string[];
}

export interface IntegrationApiKeyUpdatePayload {
    name?: string;
    expiresAt?: string | null;
    allowedIps?: string[];
}

export interface IntegrationApiKeyRotatePayload {
    name?: string;
    expiresAt?: string | null;
    allowedIps?: string[];
}

export interface IntegrationEndpointPayload {
    status: IntegrationEndpointStatus;
    requiresApiKey: boolean;
    rateLimitPerMinute: number;
}

export interface CreateIntegrationApiKeyResponse {
    apiKey: IntegrationApiKey;
    rawKey: string;
}

export interface IntegrationEndpointHealth {
    endpointCode: string;
    status: IntegrationEndpointStatus;
    lastSuccessfulCall: string | null;
    lastFailedCall: string | null;
    successRateToday: number;
    averageDurationToday: number;
    rateLimitHitsToday: number;
    currentRateLimitPerMinute: number;
}

export interface IntegrationAlert {
    code: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
}

export interface IntegrationOverview {
    totalsToday: number;
    successRateToday: number;
    averageDurationToday: number;
    failedToday: number;
    rateLimitedToday: number;
    activeApiUsers: number;
    activeApiKeys: number;
    endpointHealth: IntegrationEndpointHealth[];
    topErrorCodes: Array<{ errorCode: string; count: number }>;
    recentUsageLogs: IntegrationUsageLog[];
    lastSuccessfulQuote: IntegrationUsageLog | null;
    lastFailedQuote: IntegrationUsageLog | null;
    alerts: IntegrationAlert[];
}

export interface IntegrationPlaygroundRequest {
    requestId: string;
    hotelCode: string;
    partnerCode: string;
    reservationDate: string;
    checkIn: string;
    checkOut: string;
    currency: string;
    roomTypeCode: string;
    boardCode: string;
    adults: number;
    childrenAges: number[];
}

export interface IntegrationPlaygroundFailureResponse {
    requestId: string | null;
    status: 'FAILED';
    errorCode: string;
    message: string;
    error: {
        code: string;
        message: string;
    };
}

export interface IntegrationPlaygroundSuccessResponse {
    requestId: string;
    status: 'QUOTED';
    hotelCode: string;
    partnerCode: string;
    contract: string;
    stay: {
        checkIn: string;
        checkOut: string;
        nights: number;
    };
    pricing: {
        currency: string;
        nightlyLineMode: string;
        nightlyLineModeLabel: string;
        nightlyRates: Array<{
            date: string;
            roomTypeCode: string;
            boardCode: string;
            baseRate: number;
            occupancy: {
                adults: number;
                children: number;
                total: number;
                amount: number;
                pricingBasisParts: Array<{
                    type: string;
                    label: string;
                    unitAmount: number;
                    quantity: number;
                    amount: number;
                    percentageOfBase?: number | null;
                    reductionPercentage?: number | null;
                }>;
            };
            discountAmount: number;
            supplementsAmount: number;
            totalBeforeTax: number;
        }>;
        discounts: Array<{ name: string; amount: number }>;
        reductions: Array<{ name: string; amount: number }>;
        supplements: Array<{ name: string; amount: number }>;
        taxes: Array<Record<string, unknown>>;
        totalBeforeDiscount: number;
        discountAmount: number;
        totalBeforeTax: number;
        taxAmount: number;
        grandTotal: number;
    };
    warnings: string[];
}

export type IntegrationPlaygroundResponse =
    | IntegrationPlaygroundSuccessResponse
    | IntegrationPlaygroundFailureResponse;

export interface IntegrationPlaygroundTrace {
    endpointCode: string;
    source: 'PLAYGROUND' | 'PUBLIC_API' | string;
    requestId: string | null;
    durationMs: number | null;
    errorCode: string | null;
}

export interface IntegrationPlaygroundRunResult {
    statusCode: number;
    payload: IntegrationPlaygroundResponse;
    trace: IntegrationPlaygroundTrace;
}
