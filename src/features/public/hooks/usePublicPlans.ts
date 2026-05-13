import { useMutation, useQuery } from '@tanstack/react-query';
import {
    publicPlansService,
    type CreatePublicOnboardingCheckoutPayload,
    type PublicOnboardingCheckoutSession,
    type PublicPlan,
} from '../services/publicPlans.service';

export type {
    CreatePublicOnboardingCheckoutPayload,
    PublicOnboardingCheckoutSession,
    PublicPlan,
} from '../services/publicPlans.service';

export const PUBLIC_PLANS_QUERY_KEY = ['public', 'plans'] as const;

export function usePublicPlans() {
    return useQuery<PublicPlan[]>({
        queryKey: [...PUBLIC_PLANS_QUERY_KEY],
        queryFn: publicPlansService.listPublicPlans,
    });
}

export function useCreatePublicOnboardingCheckoutSession() {
    return useMutation<PublicOnboardingCheckoutSession, Error, CreatePublicOnboardingCheckoutPayload>({
        mutationFn: publicPlansService.createPublicOnboardingCheckoutSession,
    });
}
