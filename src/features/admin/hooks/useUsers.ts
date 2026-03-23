import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService, type UserListItem, type UpdateUserPayload } from '../services/user.service';

// Re-export types so consumers only need this hook file
export type { UserListItem, UpdateUserPayload };

const QUERY_KEY = ['users'] as const;

/** Fetch all users */
export function useUsers() {
    return useQuery<UserListItem[]>({
        queryKey: [...QUERY_KEY],
        queryFn: userService.getAll,
    });
}

/** Update an existing user */
export function useUpdateUser(onSuccess?: () => void) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserPayload }) =>
            userService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...QUERY_KEY] });
            toast.success('Utilisateur mis à jour avec succès');
            onSuccess?.();
        },
    });
}

/** Soft-delete (suspend) a user */
export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: userService.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...QUERY_KEY] });
            toast.success('Utilisateur suspendu avec succès');
        },
        onError: () => {
            toast.error("Impossible de suspendre l'utilisateur");
        },
    });
}
