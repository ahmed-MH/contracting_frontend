import apiClient from '../../../services/api.client';
import type { Arrangement } from '../../arrangements/types/arrangement.types';
import type { Hotel } from '../../hotel/types/hotel.types';
import type { Affiliate } from '../../partners/types/affiliate.types';
import type { RoomType } from '../../rooms/types/room.types';
import type {
    CreateIntegrationApiKeyResponse,
    IntegrationApiKey,
    IntegrationApiKeyPayload,
    IntegrationApiKeyRotatePayload,
    IntegrationApiKeyUpdatePayload,
    IntegrationPlaygroundRequest,
    IntegrationPlaygroundRunResult,
    IntegrationApiUser,
    IntegrationApiUserPayload,
    IntegrationEndpoint,
    IntegrationEndpointPayload,
    IntegrationOverview,
    IntegrationUsageLog,
    IntegrationUsageLogFilters,
} from '../types/integrations.types';

const toQueryString = (filters: IntegrationUsageLogFilters) => {
    const params = new URLSearchParams();
    if (filters.endpointCode) params.set('endpointCode', filters.endpointCode);
    if (filters.apiUserId) params.set('apiUserId', String(filters.apiUserId));
    if (filters.hotelId) params.set('hotelId', String(filters.hotelId));
    if (filters.success !== undefined) params.set('success', String(filters.success));
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    return params.toString();
};

export const integrationsService = {
    getOverview: () =>
        apiClient.get<IntegrationOverview>('/admin/integrations/overview').then((response) => response.data),

    getApiUsers: () =>
        apiClient.get<IntegrationApiUser[]>('/integrations/api-users').then((response) => response.data),

    createApiUser: (payload: IntegrationApiUserPayload) =>
        apiClient.post<IntegrationApiUser>('/integrations/api-users', payload).then((response) => response.data),

    updateApiUser: (id: number, payload: Partial<IntegrationApiUserPayload>) =>
        apiClient.patch<IntegrationApiUser>(`/integrations/api-users/${id}`, payload).then((response) => response.data),

    getApiKeys: () =>
        apiClient.get<IntegrationApiKey[]>('/integrations/api-keys').then((response) => response.data),

    createApiKey: (payload: IntegrationApiKeyPayload) =>
        apiClient.post<CreateIntegrationApiKeyResponse>('/integrations/api-keys', payload).then((response) => response.data),

    updateApiKey: (id: number, payload: IntegrationApiKeyUpdatePayload) =>
        apiClient.patch<IntegrationApiKey>(`/integrations/api-keys/${id}`, payload).then((response) => response.data),

    rotateApiKey: (id: number, payload: IntegrationApiKeyRotatePayload) =>
        apiClient.post<CreateIntegrationApiKeyResponse>(`/integrations/api-keys/${id}/rotate`, payload).then((response) => response.data),

    revokeApiKey: (id: number) =>
        apiClient.patch<IntegrationApiKey>(`/integrations/api-keys/${id}/revoke`).then((response) => response.data),

    getEndpoints: () =>
        apiClient.get<IntegrationEndpoint[]>('/integrations/endpoints').then((response) => response.data),

    updateEndpoint: (id: number, payload: Partial<IntegrationEndpointPayload>) =>
        apiClient.patch<IntegrationEndpoint>(`/integrations/endpoints/${id}`, payload).then((response) => response.data),

    getUsageLogs: (filters: IntegrationUsageLogFilters) =>
        apiClient.get<IntegrationUsageLog[]>(`/integrations/usage-logs?${toQueryString(filters)}`).then((response) => response.data),

    getPlaygroundHotels: () =>
        apiClient.get<Hotel[]>('/hotel').then((response) => response.data),

    getPlaygroundAffiliates: (hotelId: number) =>
        apiClient.get<Affiliate[]>('/affiliates', {
            headers: { 'x-hotel-id': String(hotelId) },
        }).then((response) => response.data),

    getPlaygroundRoomTypes: (hotelId: number) =>
        apiClient.get<RoomType[]>('/hotel/room-types', {
            headers: { 'x-hotel-id': String(hotelId) },
        }).then((response) => response.data),

    getPlaygroundArrangements: (hotelId: number) =>
        apiClient.get<Arrangement[]>('/hotel/arrangements', {
            headers: { 'x-hotel-id': String(hotelId) },
        }).then((response) => response.data),

    runPlaygroundReservationQuote: (hotelId: number, payload: IntegrationPlaygroundRequest) =>
        apiClient.post(
            '/admin/integrations/playground/reservations/quote',
            payload,
            {
                headers: { 'x-hotel-id': String(hotelId) },
                validateStatus: () => true,
            },
        ).then((response) => ({
            statusCode: response.status,
            payload: response.data,
            trace: {
                endpointCode: String(response.headers['x-integration-endpoint-code'] ?? 'reservations.quote'),
                source: String(response.headers['x-integration-source'] ?? 'PLAYGROUND'),
                requestId: response.headers['x-integration-request-id']
                    ? String(response.headers['x-integration-request-id'])
                    : (response.data?.requestId ?? null),
                durationMs: response.headers['x-integration-duration-ms']
                    ? Number(response.headers['x-integration-duration-ms'])
                    : null,
                errorCode: response.headers['x-integration-error-code']
                    ? String(response.headers['x-integration-error-code'])
                    : (response.data?.errorCode ?? null),
            },
        }) as IntegrationPlaygroundRunResult),
};
