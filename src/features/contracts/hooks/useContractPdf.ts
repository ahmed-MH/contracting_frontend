import { useMutation } from '@tanstack/react-query';
import apiClient from '../../../services/api.client';
import { toast } from 'sonner';

/**
 * Download a contract PDF by streaming the blob and triggering a browser download.
 */
export function useDownloadContractPdf() {
    return useMutation({
        mutationFn: async ({ contractId, partnerId, filename }: { contractId: number; partnerId: number; filename: string }) => {
            const response = await apiClient.get(`/contracts/${contractId}/pdf`, {
                responseType: 'blob',
                params: { partnerId },
            });
            return { blob: response.data as Blob, filename };
        },
        onSuccess: ({ blob, filename }) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('PDF downloaded successfully');
        },
        onError: () => {
            toast.error('Failed to download contract PDF');
        },
    });
}
