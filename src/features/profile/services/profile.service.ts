import apiClient from '../../../services/api.client';
import type { UserRole } from '../../auth/types/auth.types';
import type { Hotel } from '../../hotel/types/hotel.types';

export interface ProfileTenant {
    id: number;
    name: string;
    isActive?: boolean;
}

export interface CurrentProfile {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: UserRole;
    isActive: boolean;
    accountStatus?: 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED';
    tenantId?: number | null;
    tenant?: ProfileTenant | null;
    hotels?: Hotel[];
}

export interface UpdateProfilePayload {
    firstName?: string;
    lastName?: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export interface AvailablePlan {
    id: number;
    name: string;
    description: string;
    billingType: 'RECURRING' | 'ONE_TIME';
    monthlyPrice: number;
    currency: string;
    maxHotels: number;
    maxUsers: number;
    apiAccess: boolean;
    supportTier: string;
    features: string[];
    canSubscribe: boolean;
}

export interface TenantCheckoutSession {
    checkoutUrl?: string;
    sessionId?: string;
    alreadyProcessed?: boolean;
    requiresSync?: boolean;
    resolved?: boolean;
    canRetry?: boolean;
    billingStatus?: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED';
    message?: string;
    sessionStatus?: string | null;
    paymentStatus?: string | null;
}

export interface SetupOrganizationPayload {
    organizationName: string;
}

export interface SetupOrganizationResult {
    tenant: ProfileTenant;
    user: {
        id: number;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        role: UserRole;
        tenantId: number | null;
        tenant: ProfileTenant;
    };
}

export const profileService = {
    getCurrentProfile: () =>
        apiClient.get<CurrentProfile>('/users/me').then((response) => response.data),

    updateProfile: (payload: UpdateProfilePayload) =>
        apiClient.patch<CurrentProfile>('/users/me', payload).then((response) => response.data),

    changePassword: (payload: ChangePasswordPayload) =>
        apiClient.patch<{ message: string }>('/users/me/password', payload).then((response) => response.data),

    listAvailablePlans: () =>
        apiClient.get<AvailablePlan[]>('/subscriptions/available-plans').then((response) => response.data),

    createTenantCheckoutSession: (planId: number) =>
        apiClient.post<TenantCheckoutSession>('/subscriptions/checkout-session', { planId })
            .then((response) => response.data),

    syncTenantCheckoutSession: () =>
        apiClient.post<TenantCheckoutSession>('/subscriptions/sync-checkout')
            .then((response) => response.data),

    setupOrganization: (payload: SetupOrganizationPayload) =>
        apiClient.post<SetupOrganizationResult>('/tenants/setup-my-organization', payload)
            .then((response) => response.data),
};
