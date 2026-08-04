import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    profileService,
    type ChangePasswordPayload,
    type CurrentProfile,
    type UpdateProfilePayload,
} from '../services/profile.service';

export type {
    ChangePasswordPayload,
    CurrentProfile,
    UpdateProfilePayload,
};

export const CURRENT_PROFILE_QUERY_KEY = ['current-profile'] as const;

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
