import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18next from '../../../lib/i18n';
import { integrationsService } from '../services/integrations.service';
import type {
    IntegrationApiKeyPayload,
    IntegrationApiKeyRotatePayload,
    IntegrationApiKeyUpdatePayload,
    IntegrationApiUserPayload,
    IntegrationEndpointPayload,
    IntegrationPlaygroundRequest,
    IntegrationUsageLogFilters,
} from '../types/integrations.types';

export const INTEGRATION_API_USERS_QUERY_KEY = ['integrations', 'api-users'] as const;
export const INTEGRATION_API_KEYS_QUERY_KEY = ['integrations', 'api-keys'] as const;
export const INTEGRATION_ENDPOINTS_QUERY_KEY = ['integrations', 'endpoints'] as const;
export const INTEGRATION_OVERVIEW_QUERY_KEY = ['integrations', 'overview'] as const;

export function useIntegrationOverview() {
    return useQuery({
        queryKey: [...INTEGRATION_OVERVIEW_QUERY_KEY],
        queryFn: integrationsService.getOverview,
    });
}

export function useIntegrationApiUsers() {
    return useQuery({
        queryKey: [...INTEGRATION_API_USERS_QUERY_KEY],
        queryFn: integrationsService.getApiUsers,
    });
}

export function useCreateIntegrationApiUser(onSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IntegrationApiUserPayload) => integrationsService.createApiUser(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_API_USERS_QUERY_KEY] });
            toast.success(i18next.t('pages.integrations.users.toasts.created'));
            onSuccess?.();
        },
    });
}

export function useUpdateIntegrationApiUser(onSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<IntegrationApiUserPayload> }) =>
            integrationsService.updateApiUser(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_API_USERS_QUERY_KEY] });
            toast.success(i18next.t('pages.integrations.users.toasts.updated'));
            onSuccess?.();
        },
    });
}

export function useIntegrationApiKeys() {
    return useQuery({
        queryKey: [...INTEGRATION_API_KEYS_QUERY_KEY],
        queryFn: integrationsService.getApiKeys,
    });
}

export function useCreateIntegrationApiKey(onSuccess?: (rawKey: string) => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IntegrationApiKeyPayload) => integrationsService.createApiKey(payload),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_API_KEYS_QUERY_KEY] });
            toast.success(i18next.t('pages.integrations.keys.toasts.created'));
            onSuccess?.(result.rawKey);
        },
    });
}

export function useUpdateIntegrationApiKey(onSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: IntegrationApiKeyUpdatePayload }) =>
            integrationsService.updateApiKey(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_API_KEYS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_OVERVIEW_QUERY_KEY] });
            toast.success(i18next.t('pages.integrations.keys.toasts.updated'));
            onSuccess?.();
        },
    });
}

export function useRotateIntegrationApiKey(onSuccess?: (rawKey: string) => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: IntegrationApiKeyRotatePayload }) =>
            integrationsService.rotateApiKey(id, payload),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_API_KEYS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_OVERVIEW_QUERY_KEY] });
            toast.success(i18next.t('pages.integrations.keys.toasts.rotated'));
            onSuccess?.(result.rawKey);
        },
    });
}

export function useRevokeIntegrationApiKey() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => integrationsService.revokeApiKey(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_API_KEYS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_OVERVIEW_QUERY_KEY] });
            toast.success(i18next.t('pages.integrations.keys.toasts.revoked'));
        },
    });
}

export function useIntegrationEndpoints() {
    return useQuery({
        queryKey: [...INTEGRATION_ENDPOINTS_QUERY_KEY],
        queryFn: integrationsService.getEndpoints,
    });
}

export function useUpdateIntegrationEndpoint(onSuccess?: () => void) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<IntegrationEndpointPayload> }) =>
            integrationsService.updateEndpoint(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...INTEGRATION_ENDPOINTS_QUERY_KEY] });
            toast.success(i18next.t('pages.integrations.endpoints.toasts.updated'));
            onSuccess?.();
        },
    });
}

export function useIntegrationUsageLogs(filters: IntegrationUsageLogFilters) {
    return useQuery({
        queryKey: ['integrations', 'usage-logs', filters],
        queryFn: () => integrationsService.getUsageLogs(filters),
    });
}

export function useIntegrationPlaygroundHotels() {
    return useQuery({
        queryKey: ['integrations', 'playground', 'hotels'],
        queryFn: integrationsService.getPlaygroundHotels,
    });
}

export function useIntegrationPlaygroundAffiliates(hotelId: number | null) {
    return useQuery({
        queryKey: ['integrations', 'playground', 'affiliates', hotelId],
        queryFn: () => integrationsService.getPlaygroundAffiliates(hotelId!),
        enabled: !!hotelId,
    });
}

export function useIntegrationPlaygroundRoomTypes(hotelId: number | null) {
    return useQuery({
        queryKey: ['integrations', 'playground', 'room-types', hotelId],
        queryFn: () => integrationsService.getPlaygroundRoomTypes(hotelId!),
        enabled: !!hotelId,
    });
}

export function useIntegrationPlaygroundArrangements(hotelId: number | null) {
    return useQuery({
        queryKey: ['integrations', 'playground', 'arrangements', hotelId],
        queryFn: () => integrationsService.getPlaygroundArrangements(hotelId!),
        enabled: !!hotelId,
    });
}

export function useRunIntegrationPlaygroundQuote() {
    return useMutation({
        mutationFn: ({ hotelId, payload }: { hotelId: number; payload: IntegrationPlaygroundRequest }) =>
            integrationsService.runPlaygroundReservationQuote(hotelId, payload),
    });
}
