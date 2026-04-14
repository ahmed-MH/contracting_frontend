import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Loader2, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useContract } from '../hooks/useContracts';
import { useDownloadContractPdf } from '../hooks/useContractPdf';
import { useHotel } from '../../hotel/context/HotelContext';
import { Spinner } from '../../../components/ui/Spinner';
import apiClient from '../../../services/api.client';
import { contractService, type ContractLineData } from '../services/contract.service';
import { contractSupplementService } from '../services/contractSupplement.service';
import { contractReductionService } from '../services/contractReduction.service';
import { contractEarlyBookingService } from '../services/contractEarlyBooking.service';
import { contractSpoService } from '../services/contractSpo.service';
import { contractMonoparentalService } from '../services/contractMonoparental.service';
import { ContractPreview } from '../preview/ContractPreview';
import type { ContractSupplement } from '../../catalog/supplements/types/supplements.types';
import type { ContractReduction } from '../../catalog/reductions/types/reductions.types';
import type { ContractEarlyBooking } from '../../catalog/early-bookings/types/early-bookings.types';
import type { ContractSpo } from '../../catalog/spos/types/spos.types';
import type { ContractMonoparentalRule } from '../../catalog/monoparental/types/monoparental.types';
import type { ContractCancellationRule } from '../../catalog/cancellation/types/cancellation.types';

const safeFilenamePart = (value?: string | null, fallback = 'Contract') => {
    const cleaned = (value || fallback)
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[. ]+$/g, '');

    return cleaned || fallback;
};

export default function ContractPreviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentHotel } = useHotel();
    const contractId = id ? Number(id) : undefined;
    const { data: contract, isLoading, isError } = useContract(contractId);
    const { mutate: downloadPdf, isPending: isDownloading } = useDownloadContractPdf();
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');

    const { data: prices = [] } = useQuery<ContractLineData[]>({
        queryKey: ['contract-prices', contractId],
        queryFn: () => contractService.getContractPrices(contractId!),
        enabled: !!contractId,
    });

    const { data: supplements = [] } = useQuery<ContractSupplement[]>({
        queryKey: ['contract-supplements-preview', contractId],
        queryFn: () => contractSupplementService.getByContract(contractId!),
        enabled: !!contractId,
    });

    const { data: reductions = [] } = useQuery<ContractReduction[]>({
        queryKey: ['contract-reductions-preview', contractId],
        queryFn: () => contractReductionService.getByContract(contractId!),
        enabled: !!contractId,
    });

    const { data: monoparentalRules = [] } = useQuery<ContractMonoparentalRule[]>({
        queryKey: ['contract-monoparental-preview', contractId],
        queryFn: () => contractMonoparentalService.getByContract(contractId!),
        enabled: !!contractId,
    });

    const { data: earlyBookings = [] } = useQuery<ContractEarlyBooking[]>({
        queryKey: ['contract-eb-preview', contractId],
        queryFn: () => contractEarlyBookingService.getByContract(contractId!),
        enabled: !!contractId,
    });

    const { data: spos = [] } = useQuery<ContractSpo[]>({
        queryKey: ['contract-spos-preview', contractId],
        queryFn: () => contractSpoService.getAll(contractId!),
        enabled: !!contractId,
    });

    const { data: cancellations = [] } = useQuery<ContractCancellationRule[]>({
        queryKey: ['contract-cancellation-preview', contractId],
        queryFn: async () => {
            const { data } = await apiClient.get<ContractCancellationRule[]>(`/contracts/${contractId}/cancellation-rules`);
            return data;
        },
        enabled: !!contractId,
    });

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (isError || !contract) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4">
                <FileText size={48} className="text-brand-slate/40" />
                <p className="text-lg font-semibold text-brand-navy dark:text-brand-light">
                    Contract not found
                </p>
                <button
                    onClick={() => navigate('/contracts')}
                    className="flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-navy/90"
                >
                    <ArrowLeft size={16} />
                    Back to Contracts
                </button>
            </div>
        );
    }

    const selectedPartner = contract.affiliates.find((affiliate) => affiliate.id === selectedPartnerId) ?? null;
    const pdfFilename = selectedPartner
        ? `${safeFilenamePart(contract.name, `Contract-${contract.id}`)} - ${safeFilenamePart(selectedPartner.companyName, 'Partner')}.pdf`
        : `${safeFilenamePart(contract.name, `Contract-${contract.id}`)}.pdf`;

    const handleDownload = () => {
        if (!selectedPartner) return;
        downloadPdf({
            contractId: contract.id,
            partnerId: selectedPartner.id,
            filename: pdfFilename,
        });
    };

    return (
        <main className="contract-preview-shell min-h-screen px-3 py-5 md:px-6 print:bg-white print:p-0">
            <div className="mx-auto mb-5 flex max-w-[210mm] flex-wrap items-end justify-between gap-3 rounded-2xl border border-brand-slate/10 bg-white/88 p-3 shadow-sm backdrop-blur dark:border-brand-light/10 dark:bg-brand-navy/70 print:hidden">
                <button
                    id="contract-preview-back-btn"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-slate/10 bg-white px-3.5 text-sm font-semibold text-brand-navy transition hover:-translate-y-0.5 hover:border-brand-mint/40 hover:shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                >
                    <ArrowLeft size={16} />
                    Back to Contract
                </button>

                <div className="flex flex-1 flex-wrap items-end justify-end gap-2">
                    <label className="flex min-w-[260px] flex-1 max-w-sm">
                        <select
                            id="contract-preview-partner-select"
                            value={selectedPartnerId}
                            onChange={(event) => setSelectedPartnerId(event.target.value ? Number(event.target.value) : '')}
                            className="h-10 rounded-xl border border-brand-slate/10 bg-brand-light px-3 text-sm font-semibold text-brand-navy outline-none transition hover:border-brand-mint/40 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        >
                            <option value="">Select partner</option>
                            {contract.affiliates.map((affiliate) => (
                                <option key={affiliate.id} value={affiliate.id}>
                                    {affiliate.companyName}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        id="contract-print-btn"
                        onClick={() => window.print()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-slate/10 bg-white px-4 text-sm font-semibold text-brand-navy transition hover:-translate-y-0.5 hover:border-brand-mint/40 hover:shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                    <button
                        id="contract-download-pdf-btn"
                        disabled={isDownloading || !selectedPartner}
                        onClick={handleDownload}
                        className="inline-flex h-10 min-w-44 items-center justify-center gap-2 rounded-xl bg-brand-mint px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-mint/90 hover:shadow-sm disabled:cursor-not-allowed disabled:bg-brand-slate/25 disabled:text-brand-slate"
                    >
                        {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {isDownloading ? 'Downloading...' : selectedPartner ? 'Download PDF' : 'Select partner first'}
                    </button>
                </div>
            </div>

            <ContractPreview
                data={{
                    contract,
                    hotel: currentHotel,
                    selectedPartner,
                    prices,
                    supplements,
                    reductions,
                    monoparentalRules,
                    earlyBookings,
                    spos,
                    cancellations,
                }}
            />
        </main>
    );
}
