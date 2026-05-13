import apiClient from '../../../services/api.client';

export interface PublicPlan {
    id: number;
    name: string;
    description: string;
    monthlyPrice: number;
    billingType: 'RECURRING' | 'ONE_TIME';
    currency: string;
    maxHotels: number;
    maxUsers: number;
    apiAccess: boolean;
    supportTier: string;
    features: string[];
    canSubscribe: boolean;
}

export interface CreatePublicOnboardingCheckoutPayload {
    planId: number;
    companyName: string;
    adminFullName: string;
    adminEmail: string;
    phone?: string;
}

export interface PublicOnboardingCheckoutSession {
    checkoutUrl: string;
    sessionId: string;
}

export const publicPlansService = {
    listPublicPlans: () =>
        apiClient.get<PublicPlan[]>('/public/plans').then((response) => response.data),
    createPublicOnboardingCheckoutSession: (payload: CreatePublicOnboardingCheckoutPayload) =>
        apiClient.post<PublicOnboardingCheckoutSession>('/public/onboarding/checkout-session', payload)
            .then((response) => response.data),
};
