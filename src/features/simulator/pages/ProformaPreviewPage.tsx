import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetProforma, useDownloadProformaPdf, useUpdateProformaPreviewSettings } from '../hooks/useProforma';
import { useHotel } from '../../hotel/context/HotelContext';
import { useExchangeRates } from '../../exchange-rates/hooks/useExchangeRates';
import { Spinner } from '../../../components/ui/Spinner';
import {
    ProformaPreviewDocument,
    type ProformaPreviewLanguage,
} from '../components/ProformaPreviewDocument';
import { ProformaPreviewToolbar } from '../components/ProformaPreviewToolbar';
import { normalizeProformaLanguage } from '../utils/proformaFormatting';
import type { ProformaInvoice } from '../types/simulator.types';

function buildMissingReasons(proforma: ProformaInvoice | null | undefined, selectedCurrency: string) {
    const reasons: string[] = [];

    if (!proforma) {
        return ['Missing invoice data'];
    }

    if (proforma.status !== 'DRAFT' && proforma.status !== 'ISSUED' && proforma.status !== 'GENERATED') {
        reasons.push('Invoice status is not ready for preview');
    }

    if (!proforma.customerName?.trim()) {
        reasons.push('Missing customer or partner');
    }

    if (!selectedCurrency) {
        reasons.push('Missing currency');
    }

    if (!proforma.checkIn || !proforma.checkOut) {
        reasons.push('Missing stay dates');
    }

    if (!proforma.totalsSnapshot || typeof proforma.totalsSnapshot.grandTotal !== 'number') {
        reasons.push('Missing invoice totals');
    }

    if (!Array.isArray(proforma.roomingSummary) || proforma.roomingSummary.length === 0) {
        reasons.push('Missing rooming summary');
    }

    return reasons;
}

export default function ProformaPreviewPage() {
    const { t, i18n } = useTranslation('common');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentHotel } = useHotel();
    const proformaId = id ? Number(id) : undefined;
    const {
        data: proforma,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetProforma(proformaId);
    const { data: exchangeRates = [] } = useExchangeRates(currentHotel?.id || 0);
    const { mutate: downloadPdf, isPending: isDownloadingPdf } = useDownloadProformaPdf();
    const { mutate: updatePreviewSettings, isPending: isUpdatingSettings } = useUpdateProformaPreviewSettings(proformaId);
    const [selectedLanguage, setSelectedLanguage] = useState<ProformaPreviewLanguage>(() =>
        normalizeProformaLanguage(i18n.resolvedLanguage ?? i18n.language),
    );
    const [selectedCurrency, setSelectedCurrency] = useState('');
    const [taxEnabled, setTaxEnabled] = useState(false);
    const [taxName, setTaxName] = useState('VAT / tax');
    const [taxAmount, setTaxAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [voucherNumber, setVoucherNumber] = useState('');
    const hydratedProformaIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!proforma) {
            hydratedProformaIdRef.current = null;
            return;
        }
        if (hydratedProformaIdRef.current === proforma.id) return;
        hydratedProformaIdRef.current = proforma.id;

        setSelectedCurrency(proforma?.currency?.toUpperCase() ?? '');
        setTaxEnabled(proforma?.taxEnabled === true || proforma?.totalsSnapshot?.taxEnabled === true);
        setTaxName(proforma?.totalsSnapshot?.taxName ?? 'VAT / tax');
        const nextTaxAmount = proforma?.taxAmount ?? proforma?.totalsSnapshot?.taxAmount;
        setTaxAmount(typeof nextTaxAmount === 'number' ? String(nextTaxAmount) : '');
        setNotes(proforma?.notes ?? '');
        setVoucherNumber(proforma?.voucherNumber ?? '');
    }, [proforma]);

    const currencyOptions = useMemo(() => {
        const currencies = new Set<string>();
        if (proforma?.currency) currencies.add(proforma.currency.toUpperCase());
        if (currentHotel?.defaultCurrency) currencies.add(currentHotel.defaultCurrency.toUpperCase());
        exchangeRates.forEach((rate) => {
            currencies.add(rate.fromCurrency.toUpperCase());
            currencies.add(rate.toCurrency.toUpperCase());
        });

        return [...currencies].filter(Boolean).sort();
    }, [currentHotel?.defaultCurrency, exchangeRates, proforma?.currency]);

    const missingReasons = useMemo(
        () => buildMissingReasons(proforma, selectedCurrency),
        [proforma, selectedCurrency],
    );
    const isIssued = proforma?.status === 'ISSUED' || proforma?.status === 'GENERATED';
    const returnPath = isIssued ? '/proforma/invoices' : '/simulator';
    const returnLabel = isIssued ? 'Back to Saved Invoices' : t('pages.proforma.backToSimulator', { defaultValue: 'Back to Simulator' });
    const canExport = Boolean(proforma && missingReasons.length === 0);
    const parsedTaxAmount = useMemo(() => {
        if (!taxEnabled) return undefined;
        const parsed = Number(taxAmount.replace(',', '.'));
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
    }, [taxAmount, taxEnabled]);
    const taxInvalid = taxEnabled && parsedTaxAmount === undefined;

    useEffect(() => {
        if (!proforma || !taxEnabled || taxInvalid || selectedCurrency.toUpperCase() !== proforma.currency.toUpperCase()) return;

        const currentTaxAmount = proforma.taxAmount ?? proforma.totalsSnapshot?.taxAmount ?? 0;
        if (Math.abs((parsedTaxAmount ?? 0) - currentTaxAmount) < 0.005) return;

        const timer = window.setTimeout(() => {
            updatePreviewSettings({
                currency: selectedCurrency,
                taxEnabled: true,
                taxAmount: parsedTaxAmount ?? 0,
                taxName,
                notes,
                voucherNumber,
            });
        }, 450);

        return () => window.clearTimeout(timer);
    }, [notes, parsedTaxAmount, proforma, selectedCurrency, taxEnabled, taxInvalid, taxName, updatePreviewSettings, voucherNumber]);

    useEffect(() => {
        if (!proforma || !taxEnabled || taxInvalid || selectedCurrency.toUpperCase() !== proforma.currency.toUpperCase()) return;

        const normalizedTaxName = taxName.trim() || 'VAT / tax';
        const currentTaxName = proforma.totalsSnapshot?.taxName ?? 'VAT / tax';
        if (normalizedTaxName === currentTaxName) return;

        const timer = window.setTimeout(() => {
            updatePreviewSettings({
                currency: selectedCurrency,
                taxEnabled: true,
                taxAmount: parsedTaxAmount ?? proforma.taxAmount ?? proforma.totalsSnapshot?.taxAmount ?? 0,
                taxName: normalizedTaxName,
                notes,
                voucherNumber,
            });
        }, 450);

        return () => window.clearTimeout(timer);
    }, [notes, parsedTaxAmount, proforma, selectedCurrency, taxEnabled, taxInvalid, taxName, updatePreviewSettings, voucherNumber]);

    useEffect(() => {
        if (!proforma || notes === (proforma.notes ?? '')) return;

        const timer = window.setTimeout(() => {
            updatePreviewSettings({
                currency: selectedCurrency || proforma.currency,
                taxEnabled,
                taxAmount: taxEnabled ? parsedTaxAmount ?? proforma.taxAmount ?? proforma.totalsSnapshot?.taxAmount ?? 0 : undefined,
                taxName: taxEnabled ? taxName : undefined,
                notes,
                voucherNumber,
            });
        }, 650);

        return () => window.clearTimeout(timer);
    }, [notes, parsedTaxAmount, proforma, selectedCurrency, taxEnabled, taxName, updatePreviewSettings, voucherNumber]);

    useEffect(() => {
        if (!proforma || voucherNumber === (proforma.voucherNumber ?? '')) return;

        const timer = window.setTimeout(() => {
            updatePreviewSettings({
                currency: selectedCurrency || proforma.currency,
                taxEnabled,
                taxAmount: taxEnabled ? parsedTaxAmount ?? proforma.taxAmount ?? proforma.totalsSnapshot?.taxAmount ?? 0 : undefined,
                taxName: taxEnabled ? taxName : undefined,
                notes,
                voucherNumber,
            });
        }, 450);

        return () => window.clearTimeout(timer);
    }, [notes, parsedTaxAmount, proforma, selectedCurrency, taxEnabled, taxName, updatePreviewSettings, voucherNumber]);

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (isError || !proforma) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4">
                <FileText size={48} className="text-brand-slate/40" />
                <p className="text-lg font-semibold text-brand-navy dark:text-brand-light">
                    {t('pages.proforma.notFound', { defaultValue: 'Invoice not found' })}
                </p>
                <button
                    onClick={() => navigate(returnPath)}
                    className="flex items-center gap-2 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-navy/90"
                >
                    <ArrowLeft size={16} />
                    {returnLabel}
                </button>
            </div>
        );
    }

    const handleDownload = () => {
        if (!canExport || isUpdatingSettings) return;
        downloadPdf({ id: proforma.id, language: selectedLanguage });
    };

    const handleCurrencyChange = (currency: string) => {
        const normalizedCurrency = currency.toUpperCase();
        setSelectedCurrency(normalizedCurrency);
        if (!proforma || normalizedCurrency === proforma.currency.toUpperCase()) return;
        updatePreviewSettings({
            currency: normalizedCurrency,
            taxEnabled,
            taxAmount: taxEnabled ? parsedTaxAmount ?? proforma.taxAmount ?? proforma.totalsSnapshot?.taxAmount ?? 0 : undefined,
            taxName: taxEnabled ? taxName : undefined,
            notes,
            voucherNumber,
        });
    };

    const handleTaxEnabledChange = (enabled: boolean) => {
        setTaxEnabled(enabled);
        updatePreviewSettings({
            currency: selectedCurrency || proforma.currency,
            taxEnabled: enabled,
            taxAmount: enabled ? parsedTaxAmount ?? 0 : undefined,
            taxName: enabled ? taxName : undefined,
            notes,
            voucherNumber,
        });
    };

    return (
        <main className="contract-preview-shell min-h-screen bg-brand-light px-4 py-8 dark:bg-brand-navy print:bg-white print:p-0">
            <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <section className="min-w-0">
                    <div className="mb-5 flex items-center print:hidden">
                        <button
                            id="proforma-back-btn"
                            onClick={() => navigate(returnPath)}
                            className="group inline-flex h-10 items-center gap-2 rounded-lg border border-brand-light/70 bg-white/90 px-3 text-sm font-semibold text-brand-slate transition hover:border-brand-mint/50 hover:text-brand-navy hover:shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-brand-light/75 dark:hover:text-brand-light"
                        >
                            <ArrowLeft size={16} className="transition group-hover:-translate-x-0.5" />
                            {returnLabel}
                        </button>
                    </div>

                    <div className="mx-auto max-w-[900px] pb-12">
                        <ProformaPreviewDocument
                            proforma={proforma}
                            hotel={currentHotel}
                            language={selectedLanguage}
                            missingReasons={missingReasons}
                        />
                    </div>
                </section>

                <ProformaPreviewToolbar
                    proforma={proforma}
                    selectedLanguage={selectedLanguage}
                    selectedCurrency={selectedCurrency}
                    currencyOptions={currencyOptions}
                    canExport={canExport}
                    isDownloading={isDownloadingPdf}
                    isUpdating={isUpdatingSettings}
                    isRefreshing={isFetching}
                    isIssued={isIssued}
                    missingReasons={missingReasons}
                    taxEnabled={taxEnabled}
                    taxName={taxName}
                    taxAmount={taxAmount}
                    taxInvalid={taxInvalid}
                    notes={notes}
                    voucherNumber={voucherNumber}
                    hotelName={currentHotel?.name}
                    hotelReference={currentHotel?.reference}
                            onLanguageChange={setSelectedLanguage}
                    onCurrencyChange={handleCurrencyChange}
                    onTaxEnabledChange={handleTaxEnabledChange}
                    onTaxNameChange={setTaxName}
                    onTaxAmountChange={setTaxAmount}
                    onNotesChange={setNotes}
                    onVoucherNumberChange={setVoucherNumber}
                    onRefresh={() => {
                        void refetch();
                    }}
                    onPrint={() => {
                        if (canExport) window.print();
                    }}
                    onDownload={handleDownload}
                />
            </div>
        </main>
    );
}
