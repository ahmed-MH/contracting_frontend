import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TENANT_USAGE_QUERY_KEY } from '../../admin/hooks/useUsers';
import {
    profileService,
    type AvailablePlan,
    type ChangePasswordPayload,
    type CurrentProfile,
    type SetupOrganizationPayload,
    type SetupOrganizationResult,
    type TenantCheckoutSession,
    type UpdateProfilePayload,
} from '../services/profile.service';

export type {
    AvailablePlan,
    ChangePasswordPayload,
    CurrentProfile,
    SetupOrganizationPayload,
    SetupOrganizationResult,
    TenantCheckoutSession,
    UpdateProfilePayload,
};

export const CURRENT_PROFILE_QUERY_KEY = ['current-profile'] as const;
export const AVAILABLE_PLANS_QUERY_KEY = ['subscriptions', 'available-plans'] as const;

export function useCurrentProfile() {
    return useQuery<CurrentProfile>({
        queryKey: [...CURRENT_PROFILE_QUERY_KEY],
        queryFn: profileService.getCurrentProfile,
    });
}

export function useUpdateProfile(onSuccess?: (profile: CurrentProfile) => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateProfilePayload) => profileService.updateProfile(payload),
        onSuccess: (profile) => {
            queryClient.setQueryData([...CURRENT_PROFILE_QUERY_KEY], profile);
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Profile updated');
            onSuccess?.(profile);
        },
    });
}

export function useChangePassword(onSuccess?: () => void) {
    return useMutation({
        mutationFn: (payload: ChangePasswordPayload) => profileService.changePassword(payload),
        onSuccess: (result) => {
            toast.success(result.message);
            onSuccess?.();
        },
    });
}

export function useAvailablePlans() {
    return useQuery<AvailablePlan[]>({
        queryKey: [...AVAILABLE_PLANS_QUERY_KEY],
        queryFn: profileService.listAvailablePlans,
    });
}

export function useCreateTenantCheckoutSession() {
    const queryClient = useQueryClient();

    return useMutation<TenantCheckoutSession, Error, number>({
        mutationFn: (planId: number) => profileService.createTenantCheckoutSession(planId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...TENANT_USAGE_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(error.message || 'Unable to start checkout');
        },
    });
}

export function useSetupOrganization(onSuccess?: (result: SetupOrganizationResult) => void) {
    const queryClient = useQueryClient();

    return useMutation<SetupOrganizationResult, Error, SetupOrganizationPayload>({
        mutationFn: (payload) => profileService.setupOrganization(payload),
        onSuccess: (result) => {
            queryClient.setQueryData([...CURRENT_PROFILE_QUERY_KEY], (current: CurrentProfile | undefined) => current
                ? {
                    ...current,
                    tenantId: result.user.tenantId,
                    tenant: result.tenant,
                }
                : current);
            queryClient.invalidateQueries({ queryKey: [...CURRENT_PROFILE_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [...TENANT_USAGE_QUERY_KEY] });
            toast.success('Organization created. You can now choose a plan.');
            onSuccess?.(result);
        },
        onError: (error) => {
            toast.error(error.message || 'Unable to create organization');
        },
    });
}
