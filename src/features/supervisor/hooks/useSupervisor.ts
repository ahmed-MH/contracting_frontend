import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18next from '../../../lib/i18n';
import {
    supervisorService,
    type CreateSupervisorPlanPayload,
    type CreateSupervisorTenantPayload,
    type SupervisorCheckoutSession,
    type SupervisorPlan,
    type SupervisorSubscription,
    type SupervisorSubscriptionSummary,
    type SupervisorTenant,
    type UpdateSupervisorPlanPayload,
    type UpdateSupervisorSubscriptionStatusPayload,
} from '../services/supervisor.service';

export type {
    CreateSupervisorPlanPayload,
    CreateSupervisorTenantPayload,
    SupervisorPlan,
    SupervisorCheckoutSession,
    SupervisorSubscription,
    SupervisorSubscriptionStatus,
    SupervisorSubscriptionSummary,
    SupervisorTenant,
    UpdateSupervisorPlanPayload,
    UpdateSupervisorSubscriptionStatusPayload,
} from '../services/supervisor.service';

export const SUPERVISOR_TENANTS_QUERY_KEY = ['supervisor', 'tenants'] as const;
export const SUPERVISOR_PLANS_QUERY_KEY = ['supervisor', 'plans'] as const;
export const SUPERVISOR_SUBSCRIPTIONS_QUERY_KEY = ['supervisor', 'subscriptions'] as const;
export const SUPERVISOR_SUBSCRIPTIONS_SUMMARY_QUERY_KEY = ['supervisor', 'subscriptions', 'summary'] as const;

export function useSupervisorTenants() {
    return useQuery<SupervisorTenant[]>({
        queryKey: [...SUPERVISOR_TENANTS_QUERY_KEY],
        queryFn: supervisorService.listTenants,
    });
}

export function useCreateSupervisorTenant(onSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateSupervisorTenantPayload) => supervisorService.createTenant(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SUPERVISOR_TENANTS_QUERY_KEY] });
            toast.success(i18next.t('pages.supervisor.tenants.toasts.created', { defaultValue: 'Tenant created successfully' }));
            onSuccess?.();
        },
    });
}

export function useSuspendSupervisorTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => supervisorService.suspendTenant(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SUPERVISOR_TENANTS_QUERY_KEY] });
            toast.success(i18next.t('pages.supervisor.tenants.toasts.suspended', { defaultValue: 'Tenant suspended successfully' }));
        },
    });
}

export function useSupervisorPlans() {
    return useQuery<SupervisorPlan[]>({
        queryKey: [...SUPERVISOR_PLANS_QUERY_KEY],
        queryFn: supervisorService.listPlans,
    });
}

export function useCreateSupervisorPlan(onSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateSupervisorPlanPayload) => supervisorService.createPlan(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SUPERVISOR_PLANS_QUERY_KEY] });
            toast.success(i18next.t('pages.supervisor.plans.toasts.created', { defaultValue: 'Plan created successfully' }));
            onSuccess?.();
        },
    });
}

export function useUpdateSupervisorPlan(onSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateSupervisorPlanPayload }) =>
            supervisorService.updatePlan(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SUPERVISOR_PLANS_QUERY_KEY] });
            toast.success(i18next.t('pages.supervisor.plans.toasts.updated', { defaultValue: 'Plan updated successfully' }));
            onSuccess?.();
        },
    });
}

export function useDeleteSupervisorPlan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => supervisorService.deletePlan(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SUPERVISOR_PLANS_QUERY_KEY] });
            toast.success(i18next.t('pages.supervisor.plans.toasts.deleted', { defaultValue: 'Plan deleted successfully' }));
        },
    });
}

export function useSupervisorSubscriptions() {
    return useQuery<SupervisorSubscription[]>({
        queryKey: [...SUPERVISOR_SUBSCRIPTIONS_QUERY_KEY],
        queryFn: supervisorService.listSubscriptions,
    });
}

export function useSupervisorSubscriptionSummary() {
    return useQuery<SupervisorSubscriptionSummary>({
        queryKey: [...SUPERVISOR_SUBSCRIPTIONS_SUMMARY_QUERY_KEY],
        queryFn: supervisorService.getSubscriptionsSummary,
    });
}

export function useUpdateSupervisorSubscriptionStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateSupervisorSubscriptionStatusPayload }) =>
            supervisorService.updateSubscriptionStatus(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...SUPERVISOR_SUBSCRIPTIONS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [...SUPERVISOR_SUBSCRIPTIONS_SUMMARY_QUERY_KEY] });
            toast.success(i18next.t('pages.supervisor.subscriptions.toasts.updated', { defaultValue: 'Subscription status updated' }));
        },
    });
}

export function useCreateSupervisorCheckoutSession() {
    return useMutation<SupervisorCheckoutSession, Error, { tenantId: number; planId: number }>({
        mutationFn: ({ tenantId, planId }) => supervisorService.createCheckoutSession(tenantId, planId),
        onError: (error) => {
            toast.error(error.message || i18next.t('pages.supervisor.billing.toasts.checkoutFailed', { defaultValue: 'Unable to start Stripe checkout' }));
        },
    });
}
