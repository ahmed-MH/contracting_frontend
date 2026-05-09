import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../../services/api.client';
import type {
    ProformaInvoice,
    CreateProformaPayload,
    IssuedProformaFilters,
    UpdateProformaPreviewSettingsPayload,
} from '../types/simulator.types';
import type { ProformaPreviewLanguage } from '../utils/proformaFormatting';
import type { PaginatedResult } from '../../../types/pagination.types';

/**
 * Fetch a single proforma invoice by ID.
 */
export function useGetProforma(id: number | undefined) {
    return useQuery<ProformaInvoice>({
        queryKey: ['proforma', id],
        queryFn: async () => {
            const { data } = await apiClient.get<ProformaInvoice>(`/proforma/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

/**
 * Create a proforma invoice from a simulation snapshot.
 */
export function useCreateProforma(onSuccess?: (data: ProformaInvoice) => void) {
    return useMutation({
        mutationFn: async (payload: CreateProformaPayload): Promise<ProformaInvoice> => {
            const { data } = await apiClient.post<ProformaInvoice>('/proforma', payload);
            return data;
        },
        onSuccess: (data) => {
            toast.success(`Draft preview ready for ${data.customerName}`);
            onSuccess?.(data);
        },
    });
}

export function useGetIssuedProformas(filters: IssuedProformaFilters) {
    return useQuery<PaginatedResult<ProformaInvoice>>({
        queryKey: ['proforma-invoices', filters],
        queryFn: async () => {
            const { data } = await apiClient.get<PaginatedResult<ProformaInvoice>>('/proforma/invoices', {
                params: filters,
            });
            return data;
        },
    });
}

export function useGetArchivedIssuedProformas(filters: IssuedProformaFilters, enabled: boolean) {
    return useQuery<PaginatedResult<ProformaInvoice>>({
        queryKey: ['proforma-invoices', 'archived', filters],
        queryFn: async () => {
            const { data } = await apiClient.get<PaginatedResult<ProformaInvoice>>('/proforma/invoices/archived', {
                params: filters,
            });
            return data;
        },
        enabled,
    });
}

export function useUpdateProformaPreviewSettings(id: number | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: UpdateProformaPreviewSettingsPayload): Promise<ProformaInvoice> => {
            if (!id) throw new Error('Missing proforma id');
            const { data } = await apiClient.patch<ProformaInvoice>(`/proforma/${id}/preview-settings`, payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['proforma', data.id], data);
            queryClient.invalidateQueries({ queryKey: ['proforma-invoices'] });
        },
        onError: () => {
            toast.error('Could not update proforma preview');
        },
    });
}

export function useArchiveProforma() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await apiClient.delete(`/proforma/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proforma-invoices'] });
            toast.success('Proforma invoice archived');
        },
        onError: () => {
            toast.error('Could not archive proforma invoice');
        },
    });
}

export function useRestoreProforma() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await apiClient.patch(`/proforma/${id}/restore`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proforma-invoices'] });
            toast.success('Proforma invoice restored');
        },
        onError: () => {
            toast.error('Could not restore proforma invoice');
        },
    });
}

/**
 * Download a proforma invoice as PDF.
 * Uses axios with responseType: 'blob' to handle binary data,
 * then triggers a browser download via a temporary <a> element.
 */
export function useDownloadProformaPdf() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, language }: { id: number; language?: ProformaPreviewLanguage }) => {
            const response = await apiClient.post(`/proforma/${id}/download`, undefined, {
                responseType: 'blob',
                params: language ? { language } : undefined,
            });

            const { data, headers } = response;
            const headerValue = headers['content-disposition'] as string | undefined;
            const filenameMatch = headerValue?.match(/filename="([^"]+)"/i);
            const filename = filenameMatch?.[1] ?? `proforma-${id}.pdf`;
            const reference = (headers['x-proforma-reference'] as string | undefined) ?? filename.replace(/\.pdf$/i, '');
            const issuedNow = String(headers['x-proforma-issued-now'] ?? '0') === '1';

            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { id, reference, issuedNow };
        },
        onSuccess: ({ id, reference, issuedNow }) => {
            queryClient.invalidateQueries({ queryKey: ['proforma', id] });
            queryClient.invalidateQueries({ queryKey: ['proforma-invoices'] });
            toast.success(
                issuedNow
                    ? `Invoice ${reference} downloaded and saved`
                    : `PDF downloaded: ${reference}.pdf`,
            );
        },
    });
}
