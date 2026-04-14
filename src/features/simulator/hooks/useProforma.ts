import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../../services/api.client';
import type { ProformaInvoice, CreateProformaPayload } from '../types/simulator.types';

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
            toast.success(`Proforma ${data.reference} created successfully`);
            onSuccess?.(data);
        },
    });
}

/**
 * Download a proforma invoice as PDF.
 * Uses axios with responseType: 'blob' to handle binary data,
 * then triggers a browser download via a temporary <a> element.
 */
export function useDownloadProformaPdf() {
    return useMutation({
        mutationFn: async ({ id, reference }: { id: number; reference: string }) => {
            const { data } = await apiClient.get(`/proforma/${id}/pdf`, {
                responseType: 'blob',
            });

            // Create a download link
            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reference}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { id, reference };
        },
        onSuccess: ({ reference }) => {
            toast.success(`PDF downloaded: ${reference}.pdf`);
        },
    });
}
