import { AlertCircle, CheckCircle2, Download, Loader2, Printer, Receipt, RefreshCw } from 'lucide-react';
import type { ProformaInvoice } from '../types/simulator.types';
import {
    formatFxStatement,
    formatProformaCurrency,
    formatProformaDate,
    type ProformaPreviewLanguage,
} from '../utils/proformaFormatting';
import UpdatedMeta from '../../../components/audit/UpdatedMeta';

interface ProformaPreviewToolbarProps {
    proforma: ProformaInvoice;
    selectedLanguage: ProformaPreviewLanguage;
    selectedCurrency: string;
    currencyOptions: string[];
    canExport: boolean;
    isDownloading: boolean;
    isUpdating: boolean;
    isRefreshing: boolean;
    isIssued: boolean;
    missingReasons: string[];
    taxEnabled: boolean;
    taxName: string;
    taxAmount: string;
    taxInvalid: boolean;
    notes: string;
    voucherNumber: string;
    hotelName?: string | null;
    hotelReference?: string | null;
    onLanguageChange: (language: ProformaPreviewLanguage) => void;
    onCurrencyChange: (currency: string) => void;
    onTaxEnabledChange: (enabled: boolean) => void;
    onTaxNameChange: (name: string) => void;
    onTaxAmountChange: (amount: string) => void;
    onNotesChange: (notes: string) => void;
    onVoucherNumberChange: (voucherNumber: string) => void;
    onRefresh: () => void;
    onPrint: () => void;
    onDownload: () => void;
}

const toolbarSectionClass = 'rounded-lg border border-brand-light/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5';
const labelClass = 'text-[10px] font-black uppercase tracking-[0.16em] text-brand-slate dark:text-brand-light/50';
const selectClass = 'mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-brand-light/70 bg-white px-3 text-sm font-semibold text-brand-navy outline-none transition hover:border-brand-mint/60 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/25 dark:border-white/10 dark:bg-brand-navy/70 dark:text-brand-light';
const inputClass = 'mt-1.5 h-10 w-full rounded-lg border border-brand-light/70 bg-white px-3 text-sm font-semibold text-brand-navy outline-none transition placeholder:text-brand-slate/45 hover:border-brand-mint/60 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/25 dark:border-white/10 dark:bg-brand-navy/70 dark:text-brand-light dark:placeholder:text-brand-light/30';
const textareaClass = 'mt-1.5 w-full resize-none rounded-lg border border-brand-light/70 bg-white px-3 py-2 text-sm font-semibold text-brand-navy outline-none transition placeholder:text-brand-slate/45 hover:border-brand-mint/60 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/25 dark:border-white/10 dark:bg-brand-navy/70 dark:text-brand-light dark:placeholder:text-brand-light/30';

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-b border-brand-light/70 py-2 last:border-b-0 dark:border-white/10">
            <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-slate/70 dark:text-brand-light/40">{label}</dt>
            <dd className="mt-1 text-sm font-semibold leading-5 text-brand-navy dark:text-brand-light">{value}</dd>
        </div>
    );
}

export function ProformaPreviewToolbar({
    proforma,
    selectedLanguage,
    selectedCurrency,
    currencyOptions,
    canExport,
    isDownloading,
    isUpdating,
    isRefreshing,
    isIssued,
    missingReasons,
    taxEnabled,
    taxName,
    taxAmount,
    taxInvalid,
    notes,
    voucherNumber,
    hotelName,
    hotelReference,
    onLanguageChange,
    onCurrencyChange,
    onTaxEnabledChange,
    onTaxNameChange,
    onTaxAmountChange,
    onNotesChange,
    onVoucherNumberChange,
    onRefresh,
    onPrint,
    onDownload,
}: ProformaPreviewToolbarProps) {
    const documentCurrency = proforma.currency.toUpperCase();
    const baseCurrency = (proforma.totalsSnapshot?.sourceCurrency ?? documentCurrency).toUpperCase();
    const outputCurrency = (selectedCurrency || documentCurrency).toUpperCase();
    const isSameCurrency = baseCurrency === outputCurrency;
    const rate = proforma.totalsSnapshot?.exchangeRateUsed ?? proforma.totalsSnapshot?.exchangeRate ?? (isSameCurrency ? 1 : null);
    const rateLabel = rate ? formatFxStatement(baseCurrency, outputCurrency, rate) : 'Not available';
    const statusTone = isIssued
        ? 'border-brand-mint/30 bg-brand-mint/10 text-brand-mint'
        : 'border-amber-300/40 bg-amber-300/10 text-amber-700 dark:text-amber-200';
    const issueLabel = isIssued ? 'Issued' : 'Draft';

    return (
        <aside className="order-first w-full shrink-0 print:hidden xl:sticky xl:top-6 xl:order-none xl:w-[320px]">
            <div className="rounded-lg border border-brand-light/70 bg-brand-light/90 p-4 text-brand-navy shadow-xl shadow-brand-slate/10 dark:border-white/10 dark:bg-brand-navy dark:text-brand-light dark:shadow-black/25">
                <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-mint">Preview tools</p>
                    <h2 className="mt-1 text-lg font-black">Generate proforma</h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-brand-slate dark:text-brand-light/50">
                        Review context, output settings, and export readiness.
                    </p>
                </div>

                <div className="space-y-3">
                    <section className={toolbarSectionClass}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                                Generation
                            </h3>
                            <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusTone}`}>
                                {issueLabel}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className={labelClass}>Customer</span>
                                <div className="mt-1.5 rounded-lg border border-brand-light/70 bg-white px-3 py-2 dark:border-white/10 dark:bg-brand-navy/70">
                                    <p className="text-sm font-black text-brand-navy dark:text-brand-light">{proforma.customerName || 'Not selected'}</p>
                                    <p className="mt-0.5 truncate text-xs font-semibold text-brand-slate dark:text-brand-light/45">
                                        {proforma.customerEmail || 'No email provided'}
                                    </p>
                                </div>
                            </div>

                            <label className="block">
                                <span className={labelClass}>Language</span>
                                <select
                                    id="proforma-preview-language-select"
                                    value={selectedLanguage}
                                    onChange={(event) => onLanguageChange(event.target.value as ProformaPreviewLanguage)}
                                    disabled={isIssued}
                                    className={selectClass}
                                >
                                    <option value="fr">French</option>
                                    <option value="en">English</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className={labelClass}>Currency</span>
                                <select
                                    id="proforma-preview-currency-select"
                                    value={selectedCurrency}
                                    onChange={(event) => onCurrencyChange(event.target.value)}
                                    disabled={isIssued}
                                    className={selectClass}
                                >
                                    {currencyOptions.map((currency) => (
                                        <option key={currency} value={currency}>
                                            {currency}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {missingReasons.length > 0 && (
                            <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-800 dark:text-amber-200">
                                <div className="flex gap-2">
                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    <span>Complete the missing context before exporting.</span>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className={toolbarSectionClass}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                                Final settings
                            </h3>
                            {isUpdating && <Loader2 size={15} className="animate-spin text-brand-mint" />}
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-brand-navy dark:text-brand-light">
                            <input
                                type="checkbox"
                                checked={taxEnabled}
                                onChange={(event) => onTaxEnabledChange(event.target.checked)}
                                disabled={isIssued}
                                className="h-4 w-4 rounded border-brand-light/30 text-brand-mint focus:ring-brand-mint"
                            />
                            <Receipt size={14} className="text-brand-mint" />
                            Add tax to this proforma
                        </label>

                        {taxEnabled && (
                            <div className="mt-3 space-y-3">
                                <label className="block">
                                    <span className={labelClass}>Tax label</span>
                                    <input
                                        id="proforma-preview-tax-name"
                                        type="text"
                                        value={taxName}
                                        maxLength={80}
                                        onChange={(event) => onTaxNameChange(event.target.value)}
                                        disabled={isIssued}
                                        className={inputClass}
                                    />
                                </label>

                                <div>
                                    <label htmlFor="proforma-preview-tax-amount" className={labelClass}>
                                        Tax amount ({outputCurrency || baseCurrency})
                                    </label>
                                    <input
                                        id="proforma-preview-tax-amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={taxAmount}
                                        onChange={(event) => onTaxAmountChange(event.target.value)}
                                        disabled={isIssued}
                                        className={inputClass}
                                    />
                                    {taxInvalid && (
                                        <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-300">
                                            Enter a non-negative tax amount.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <label className="mt-3 block">
                            <span className={labelClass}>Voucher / reservation number</span>
                            <input
                                id="proforma-preview-voucher-number"
                                type="text"
                                value={voucherNumber}
                                maxLength={100}
                                onChange={(event) => onVoucherNumberChange(event.target.value)}
                                disabled={isIssued}
                                placeholder="External reservation number"
                                className={inputClass}
                            />
                        </label>

                        <label className="mt-3 block">
                            <span className={labelClass}>Commercial notes</span>
                            <textarea
                                value={notes}
                                onChange={(event) => onNotesChange(event.target.value)}
                                rows={3}
                                disabled={isIssued}
                                placeholder="Optional notes"
                                className={textareaClass}
                            />
                        </label>

                        <p className="mt-3 rounded-lg border border-brand-light/70 bg-brand-light/70 px-3 py-2 text-xs font-semibold leading-5 text-brand-slate dark:border-white/10 dark:bg-white/5 dark:text-brand-light/60">
                            {isIssued
                                ? 'This invoice is issued and locked. Re-download keeps the frozen commercial document.'
                                : 'Preview totals are recalculated for the draft and only become an official invoice on download.'}
                        </p>
                    </section>

                    <section className={toolbarSectionClass}>
                        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                            Document actions
                        </h3>

                        <div className="mb-3 flex items-start gap-2 rounded-lg border border-brand-light/70 bg-brand-light/70 px-3 py-2 dark:border-white/10 dark:bg-brand-navy/50">
                            {canExport ? (
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-mint" />
                            ) : (
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-300" />
                            )}
                            <div>
                                <p className="text-sm font-black">{isUpdating ? 'Updating totals' : canExport ? 'Ready to export' : 'Incomplete invoice'}</p>
                                <p className="mt-0.5 text-xs font-semibold leading-5 text-brand-slate dark:text-brand-light/50">
                                    {isUpdating
                                        ? 'Backend recalculation in progress.'
                                        : canExport
                                            ? `${selectedLanguage.toUpperCase()} | ${outputCurrency}${isIssued ? ' | already issued' : ' | draft preview'}`
                                            : 'The preview sheet is waiting for valid invoice data.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <button
                                id="proforma-download-btn"
                                disabled={isDownloading || isUpdating || !canExport}
                                onClick={onDownload}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-mint px-4 text-sm font-black text-brand-navy shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:bg-brand-light/70 disabled:text-brand-slate/50 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-brand-light/40"
                            >
                                {isDownloading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                {isDownloading ? 'Generating...' : isIssued ? 'Download again' : 'Issue & Download PDF'}
                            </button>

                            <button
                                id="proforma-print-btn"
                                disabled={isUpdating || !canExport}
                                onClick={onPrint}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-light/70 bg-white px-4 text-sm font-bold text-brand-navy transition hover:border-brand-mint/50 hover:bg-brand-light/80 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-brand-light dark:hover:bg-white/20"
                            >
                                <Printer size={16} />
                                Print
                            </button>

                            <button
                                id="proforma-refresh-btn"
                                disabled={isRefreshing}
                                onClick={onRefresh}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-light/70 bg-transparent px-4 text-sm font-bold text-brand-slate transition hover:border-brand-mint/50 hover:text-brand-navy disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-brand-light/70 dark:hover:text-brand-light"
                            >
                                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : undefined} />
                                Refresh preview
                            </button>
                        </div>
                    </section>

                    <section className={toolbarSectionClass}>
                        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                            Financial info
                        </h3>

                        <dl className="space-y-1">
                            <MetadataRow label="Base currency" value={baseCurrency} />
                            <MetadataRow label="Output currency" value={outputCurrency || 'Not selected'} />
                            <MetadataRow label="FX rate used" value={rateLabel} />
                            <MetadataRow label={taxEnabled ? ((proforma.totalsSnapshot?.taxName ?? taxName) || 'Tax') : 'Tax summary'} value={taxEnabled ? formatProformaCurrency(proforma.totalsSnapshot?.taxAmount, outputCurrency || baseCurrency, selectedLanguage) : 'Not applied'} />
                            <MetadataRow label="Grand total" value={formatProformaCurrency(proforma.totalsSnapshot?.totalAmount ?? proforma.totalsSnapshot?.grandTotal, outputCurrency || baseCurrency, selectedLanguage)} />
                        </dl>

                        <p className="mt-3 rounded-lg border border-brand-light/70 bg-brand-light/70 px-3 py-2 text-xs font-semibold leading-5 text-brand-slate dark:border-white/10 dark:bg-white/5 dark:text-brand-light/60">
                            {isSameCurrency
                                ? `This proforma is stored in ${baseCurrency}; no conversion is applied.`
                                : `This proforma is stored in ${outputCurrency} using backend exchange rates.`}
                        </p>
                    </section>

                    <section className={toolbarSectionClass}>
                        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                            Metadata
                        </h3>

                        <dl>
                            <MetadataRow label={isIssued ? 'Invoice number' : 'Draft status'} value={isIssued ? proforma.reference : 'Not issued yet'} />
                            <MetadataRow label={isIssued ? 'Issued at' : 'Draft created'} value={formatProformaDate((proforma.issuedAt ?? proforma.generatedAt) || proforma.generatedAt, selectedLanguage)} />
                            <MetadataRow label="Due date" value="Not specified" />
                            <MetadataRow label="Voucher / reservation" value={proforma.voucherNumber?.trim() || 'Not specified'} />
                            <MetadataRow label="Hotel / supplier" value={hotelReference || hotelName || `Hotel #${proforma.hotelId}`} />
                        </dl>
                        <UpdatedMeta
                            updatedByName={proforma.issuedByName ?? proforma.updatedByName}
                            updatedAt={proforma.issuedAt ?? proforma.updatedAt}
                            label={false}
                            tone="plain"
                            className="mt-3"
                        />
                    </section>
                </div>
            </div>
        </aside>
    );
}
