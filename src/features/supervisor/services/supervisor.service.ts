import apiClient from '../../../services/api.client';

export interface SupervisorTenant {
    id: number;
    name: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateSupervisorTenantPayload {
    name: string;
    isActive?: boolean;
}

export interface SupervisorPlan {
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
    isActive: boolean;
    stripeProductId?: string | null;
    stripePriceId?: string | null;
    updatedAt: string;
}

export type CreateSupervisorPlanPayload = Omit<SupervisorPlan, 'id' | 'updatedAt'>;
export type UpdateSupervisorPlanPayload = Partial<CreateSupervisorPlanPayload>;

export type SupervisorSubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED';

export interface SupervisorSubscription {
    id: number;
    tenantId: number;
    organizationName: string;
    planId: number;
    planName: string;
    monthlyRecurringRevenue: number;
    currency: string;
    status: SupervisorSubscriptionStatus;
    renewalDate: string;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    hotelUsage: number;
    userUsage: number;
    note?: string;
}

export interface SupervisorSubscriptionSummary {
    totalSubscriptions: number;
    activeSubscriptions: number;
    pastDueSubscriptions: number;
    suspendedSubscriptions: number;
    monthlyRecurringRevenue: number;
    atRiskMonthlyRecurringRevenue: number;
    currency: string;
}

export interface UpdateSupervisorSubscriptionStatusPayload {
    status: SupervisorSubscriptionStatus;
    reason?: string;
    renewalDate?: string;
}

export interface SupervisorCheckoutSession {
    checkoutUrl: string;
    sessionId: string;
}

export const supervisorService = {
    listTenants: () =>
        apiClient.get<SupervisorTenant[]>('/tenants').then((response) => response.data),

    createTenant: (payload: CreateSupervisorTenantPayload) =>
        apiClient.post<SupervisorTenant>('/tenants', payload).then((response) => response.data),

    suspendTenant: (id: number) =>
        apiClient.patch<SupervisorTenant>(`/tenants/${id}/suspend`).then((response) => response.data),

    listPlans: () =>
        apiClient.get<SupervisorPlan[]>('/plans').then((response) => response.data),

    createPlan: (payload: CreateSupervisorPlanPayload) =>
        apiClient.post<SupervisorPlan>('/plans', payload).then((response) => response.data),

    updatePlan: (id: number, payload: UpdateSupervisorPlanPayload) =>
        apiClient.patch<SupervisorPlan>(`/plans/${id}`, payload).then((response) => response.data),

    deletePlan: (id: number) =>
        apiClient.delete<{ success: true }>(`/plans/${id}`).then((response) => response.data),

    listSubscriptions: () =>
        apiClient.get<SupervisorSubscription[]>('/subscriptions').then((response) => response.data),

    getSubscriptionsSummary: () =>
        apiClient.get<SupervisorSubscriptionSummary>('/subscriptions/summary').then((response) => response.data),

    updateSubscriptionStatus: (id: number, payload: UpdateSupervisorSubscriptionStatusPayload) =>
        apiClient.patch<SupervisorSubscription>(`/subscriptions/${id}/status`, payload).then((response) => response.data),

    createCheckoutSession: (tenantId: number, planId: number) =>
        apiClient.post<SupervisorCheckoutSession>('/billing/checkout-session', { tenantId, planId }).then((response) => response.data),
};
