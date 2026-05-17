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
    billingType?: 'RECURRING' | 'ONE_TIME';
    monthlyRecurringRevenue: number;
    oneTimeRevenue?: number;
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
    oneTimeRevenue?: number;
    currency: string;
}

export interface UpdateSupervisorSubscriptionStatusPayload {
    status: SupervisorSubscriptionStatus;
    reason?: string;
    renewalDate?: string;
}

export interface AssignSupervisorTenantPlanPayload {
    tenantId: number;
    planId: number;
    status?: SupervisorSubscriptionStatus;
}

export type SupervisorPublicSignupStatus = 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'FAILED';

export interface SupervisorPublicSignup {
    id: number;
    companyName: string;
    adminFullName: string;
    adminEmail: string;
    phone: string | null;
    planId: number;
    planName: string;
    billingType: 'RECURRING' | 'ONE_TIME';
    status: SupervisorPublicSignupStatus;
    failureReason: string | null;
    stripeCheckoutSessionId: string | null;
    tenantId: number | null;
    adminUserId: number | null;
    subscriptionId: number | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ListSupervisorPublicSignupsParams {
    status?: SupervisorPublicSignupStatus;
    limit?: number;
    page?: number;
}

export interface SupervisorCheckoutSession {
    checkoutUrl: string;
    sessionId: string;
}

export type SupervisorAuditLogCategory =
    | 'AUTH'
    | 'TENANT'
    | 'PLAN'
    | 'SUBSCRIPTION'
    | 'BILLING'
    | 'WEBHOOK'
    | 'INVITE'
    | 'ENTITLEMENT'
    | 'SYSTEM';

export type SupervisorAuditLogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface SupervisorSystemLog {
    id: number;
    eventType: string;
    category: SupervisorAuditLogCategory;
    severity: SupervisorAuditLogSeverity;
    message: string;
    actorUserId: number | null;
    actorEmail: string | null;
    actorRole: string | null;
    tenantId: number | null;
    tenantName: string | null;
    targetType: string | null;
    targetId: string | null;
    metadata: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
}

export interface ListSupervisorSystemLogsParams {
    page?: number;
    limit?: number;
    category?: SupervisorAuditLogCategory | '';
    severity?: SupervisorAuditLogSeverity | '';
    tenantId?: number;
    search?: string;
    from?: string;
    to?: string;
}

export interface PaginatedSupervisorSystemLogs {
    items: SupervisorSystemLog[];
    page: number;
    limit: number;
    total: number;
}

export const supervisorService = {
    listTenants: () =>
        apiClient.get<SupervisorTenant[]>('/tenants').then((response) => response.data),

    createTenant: (payload: CreateSupervisorTenantPayload) =>
        apiClient.post<SupervisorTenant>('/tenants', payload).then((response) => response.data),

    suspendTenant: (id: number) =>
        apiClient.patch<SupervisorTenant>(`/tenants/${id}/suspend`).then((response) => response.data),

    reactivateTenant: (id: number) =>
        apiClient.patch<SupervisorTenant>(`/tenants/${id}/reactivate`).then((response) => response.data),

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

    assignTenantPlan: (payload: AssignSupervisorTenantPlanPayload) =>
        apiClient.post<SupervisorSubscription>('/subscriptions/assign-plan', payload).then((response) => response.data),

    listPublicSignups: (params?: ListSupervisorPublicSignupsParams) =>
        apiClient.get<SupervisorPublicSignup[]>('/public-signups', { params }).then((response) => response.data),

    getPublicSignup: (id: number) =>
        apiClient.get<SupervisorPublicSignup>(`/public-signups/${id}`).then((response) => response.data),

    createCheckoutSession: (tenantId: number, planId: number) =>
        apiClient.post<SupervisorCheckoutSession>('/billing/checkout-session', { tenantId, planId }).then((response) => response.data),

    listSystemLogs: (params?: ListSupervisorSystemLogsParams) =>
        apiClient.get<PaginatedSupervisorSystemLogs>('/system-logs', { params }).then((response) => response.data),
};
