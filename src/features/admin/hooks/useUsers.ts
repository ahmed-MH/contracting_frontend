import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService, type UserListItem, type UpdateUserPayload } from '../services/user.service';
import i18next from '../../../lib/i18n';

export type { UserListItem, UpdateUserPayload };

const QUERY_KEY = ['users'] as const;

export function useUsers() {
    return useQuery<UserListItem[]>({
        queryKey: [...QUERY_KEY],
        queryFn: userService.getAll,
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

export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: userService.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...QUERY_KEY] });
            toast.success(i18next.t('auto.features.admin.hooks.useusers.toast.success.ea6f670a', { defaultValue: "User suspended successfully" }));
        },
        onError: () => {
            toast.error(i18next.t('auto.features.admin.hooks.useusers.toast.error.4c3aa2d2', { defaultValue: "Unable to suspend the user" }));
        },
    });
}
