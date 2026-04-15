import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useContract } from '../hooks/useContracts';
import { useDownloadContractPdf } from '../hooks/useContractPdf';
import { useHotel } from '../../hotel/context/HotelContext';
import { useExchangeRates } from '../../exchange-rates/hooks/useExchangeRates';
import { Spinner } from '../../../components/ui/Spinner';
import { PreviewToolbar } from '../../../components/contracts/preview/PreviewToolbar';
import apiClient from '../../../services/api.client';
import { contractService, type ContractLineData } from '../services/contract.service';
import { contractSupplementService } from '../services/contractSupplement.service';
import { contractReductionService } from '../services/contractReduction.service';
import { contractEarlyBookingService } from '../services/contractEarlyBooking.service';
import { contractSpoService } from '../services/contractSpo.service';
import { contractMonoparentalService } from '../services/contractMonoparental.service';
import { ContractPreview } from '../preview/ContractPreview';
import {
    type ContractPreviewLanguage,
    type ContractPresentationContext,
    conversionNote,
    resolveFxContext,
} from '../preview/contractPresentation';
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

const normalizeLanguage = (language?: string): ContractPreviewLanguage => (
    language?.toLowerCase().startsWith('en') ? 'en' : 'fr'
);

const slugFilenamePart = (value?: string | null, fallback = 'contract') => safeFilenamePart(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || fallback;

export default function ContractPreviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const { currentHotel } = useHotel();
    const contractId = id ? Number(id) : undefined;
    const { data: contract, isLoading, isError } = useContract(contractId);
    const { data: exchangeRates = [] } = useExchangeRates(currentHotel?.id || 0);
    const { mutate: downloadPdf, isPending: isDownloading } = useDownloadContractPdf();
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
    const [selectedLanguage, setSelectedLanguage] = useState<ContractPreviewLanguage>(() => normalizeLanguage(i18n.resolvedLanguage ?? i18n.language));
    const [selectedCurrency, setSelectedCurrency] = useState<string>('');

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

    const outputCurrency = selectedCurrency || contract?.currency || '';
    const selectedPartner = contract?.affiliates.find((affiliate) => affiliate.id === selectedPartnerId) ?? null;
    const currencyOptions = useMemo(() => {
        if (!contract) return [];
        const currencies = new Set<string>();
        currencies.add(contract.currency.toUpperCase());
        if (currentHotel?.defaultCurrency) currencies.add(currentHotel.defaultCurrency.toUpperCase());
        exchangeRates.forEach((rate) => {
            currencies.add(rate.fromCurrency.toUpperCase());
            currencies.add(rate.toCurrency.toUpperCase());
        });
        return [...currencies].filter(Boolean).sort();
    }, [contract, currentHotel?.defaultCurrency, exchangeRates]);

    const presentation: ContractPresentationContext = useMemo(() => ({
        language: selectedLanguage,
        sourceCurrency: contract?.currency.toUpperCase() ?? '',
        outputCurrency: outputCurrency.toUpperCase(),
        fx: resolveFxContext({
            sourceCurrency: contract?.currency ?? '',
            outputCurrency,
            hotelCurrency: currentHotel?.defaultCurrency,
            rates: exchangeRates,
        }),
    }), [selectedLanguage, contract?.currency, outputCurrency, currentHotel?.defaultCurrency, exchangeRates]);

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
                    className="flex items-center gap-2 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-navy/90"
                >
                    <ArrowLeft size={16} />
                    Back to Contracts
                </button>
            </div>
        );
    }

    const pdfFilename = selectedPartner
        ? `contract-${slugFilenamePart(contract.name, String(contract.id))}-${slugFilenamePart(selectedPartner.companyName, 'partner')}-${selectedLanguage}-${outputCurrency.toLowerCase()}.pdf`
        : `contract-${slugFilenamePart(contract.name, String(contract.id))}-${selectedLanguage}-${outputCurrency.toLowerCase()}.pdf`;

    const canExport = Boolean(selectedPartner && selectedLanguage && outputCurrency && presentation.fx.isConvertible);
    const handleDownload = () => {
        if (!selectedPartner || !selectedLanguage || !outputCurrency || !presentation.fx.isConvertible) return;
        downloadPdf({
            contractId: contract.id,
            partnerId: selectedPartner.id,
            language: selectedLanguage,
            currency: outputCurrency,
            filename: pdfFilename,
        });
    };

    return (
        <main className="contract-preview-shell min-h-screen bg-brand-navy px-4 py-8 print:bg-white print:p-0">
            <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <section className="min-w-0">
                    <div className="mb-5 flex items-center print:hidden">
                        <button
                            id="contract-preview-back-btn"
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                            className="group inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-semibold text-brand-light/75 transition hover:border-brand-mint/50 hover:text-brand-light hover:shadow-sm"
                        >
                            <ArrowLeft size={16} className="transition group-hover:-translate-x-0.5" />
                            Back to contract
                        </button>
                    </div>

                    <div className="mx-auto max-w-[900px] pb-12">
                        {selectedPartner ? (
                            <ContractPreview
                                data={{
                                    contract,
                                    hotel: currentHotel,
                                    selectedPartner,
                                    presentation,
                                    prices,
                                    supplements,
                                    reductions,
                                    monoparentalRules,
                                    earlyBookings,
                                    spos,
                                    cancellations,
                                }}
                            />
                        ) : (
                            <div className="mx-auto flex min-h-[70vh] w-full max-w-[210mm] items-center justify-center bg-white px-8 py-16 text-center text-slate-900 shadow-xl ring-1 ring-slate-200">
                                <div className="max-w-sm">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-brand-mint/30 bg-brand-mint/10 text-brand-navy">
                                        <FileText size={26} />
                                    </div>
                                    <h1 className="mt-5 text-2xl font-black text-brand-navy">
                                        Select a partner to generate the contract
                                    </h1>
                                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                                        The preview will render the selected partner details, language, and currency instantly.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <PreviewToolbar
                    contract={contract}
                    partners={contract.affiliates}
                    selectedPartnerId={selectedPartnerId}
                    selectedLanguage={selectedLanguage}
                    selectedCurrency={outputCurrency}
                    currencyOptions={currencyOptions}
                    presentation={presentation}
                    canExport={canExport}
                    isDownloading={isDownloading}
                    conversionNote={conversionNote(presentation)}
                    onPartnerChange={setSelectedPartnerId}
                    onLanguageChange={setSelectedLanguage}
                    onCurrencyChange={setSelectedCurrency}
                    onPrint={() => {
                        if (canExport) window.print();
                    }}
                    onDownload={handleDownload}
                />
            </div>
        </main>
    );
}
