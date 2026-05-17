import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService, type TenantUsage, type UserListItem, type UpdateUserPayload } from '../services/user.service';
import i18next from '../../../lib/i18n';

export type { TenantUsage, UserListItem, UpdateUserPayload };

const QUERY_KEY = ['users'] as const;
export const TENANT_USAGE_QUERY_KEY = ['tenant-usage'] as const;

export function useUsers() {
    return useQuery<UserListItem[]>({
        queryKey: [...QUERY_KEY],
        queryFn: userService.getAll,
    });
}

export function useTenantUsage() {
    return useQuery<TenantUsage>({
        queryKey: [...TENANT_USAGE_QUERY_KEY],
        queryFn: userService.getUsage,
        retry: false,
    });
}

export function useUpdateUser(onSuccess?: () => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserPayload }) =>
            userService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...QUERY_KEY] });
            toast.success(i18next.t('auto.features.admin.hooks.useusers.toast.success.8691680c', { defaultValue: "User updated successfully" }));
            onSuccess?.();
        },
    });
}

export function useSuspendUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: userService.suspend,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...QUERY_KEY] });
            toast.success(i18next.t('auto.features.admin.hooks.useusers.toast.success.ea6f670a', { defaultValue: "User suspended successfully" }));
        },
        onError: () => {
            toast.error(i18next.t('auto.features.admin.hooks.useusers.toast.error.4c3aa2d2', { defaultValue: "Unable to suspend the user" }));
        },
    });
}

export function useReactivateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: userService.reactivate,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...QUERY_KEY] });
            toast.success(i18next.t('pages.users.toast.reactivated', { defaultValue: 'User reactivated successfully' }));
        },
        onError: () => {
            toast.error(i18next.t('pages.users.toast.reactivateFailed', { defaultValue: 'Unable to reactivate the user' }));
        },
    });
}

export function useRemovePendingInvite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: userService.removePendingInvite,
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: [...QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [...TENANT_USAGE_QUERY_KEY] });
            toast.success(result.message);
        },
        onError: () => {
            toast.error(i18next.t('pages.users.toast.removeInviteFailed', { defaultValue: 'Unable to remove the pending invite' }));
        },
    });
}

export const useDeleteUser = useSuspendUser;
