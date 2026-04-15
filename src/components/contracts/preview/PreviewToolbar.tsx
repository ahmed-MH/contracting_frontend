import { AlertCircle, CheckCircle2, Download, Loader2, Printer } from 'lucide-react';
import type { Contract } from '../../../features/contracts/types/contract.types';
import type {
    ContractPresentationContext,
    ContractPreviewLanguage,
} from '../../../features/contracts/preview/contractPresentation';

type Partner = Contract['affiliates'][number];

interface PreviewToolbarProps {
    contract: Contract;
    partners: Partner[];
    selectedPartnerId: number | '';
    selectedLanguage: ContractPreviewLanguage;
    selectedCurrency: string;
    currencyOptions: string[];
    presentation: ContractPresentationContext;
    canExport: boolean;
    isDownloading: boolean;
    conversionNote: string | null;
    onPartnerChange: (partnerId: number | '') => void;
    onLanguageChange: (language: ContractPreviewLanguage) => void;
    onCurrencyChange: (currency: string) => void;
    onPrint: () => void;
    onDownload: () => void;
}

const toolbarSectionClass = 'rounded-lg border border-white/10 bg-white/5 p-4';
const labelClass = 'text-[10px] font-black uppercase tracking-[0.16em] text-brand-light/50';
const selectClass = 'mt-1.5 h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-brand-navy/70 px-3 text-sm font-semibold text-brand-light outline-none transition hover:border-brand-mint/60 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/25';

function formatDate(value?: string | Date | null, language: ContractPreviewLanguage = 'en') {
    if (!value) return 'Not specified';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not specified';
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-b border-white/10 py-2 last:border-b-0">
            <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-light/40">{label}</dt>
            <dd className="mt-1 text-sm font-semibold leading-5 text-brand-light">{value}</dd>
        </div>
    );
}

export function PreviewToolbar({
    contract,
    partners,
    selectedPartnerId,
    selectedLanguage,
    selectedCurrency,
    currencyOptions,
    presentation,
    canExport,
    isDownloading,
    conversionNote,
    onPartnerChange,
    onLanguageChange,
    onCurrencyChange,
    onPrint,
    onDownload,
}: PreviewToolbarProps) {
    const hasPartner = selectedPartnerId !== '';
    const baseCurrency = contract.currency.toUpperCase();
    const outputCurrency = selectedCurrency.toUpperCase();
    const rateLabel = presentation.fx.isConvertible
        ? presentation.fx.rate.toFixed(6)
        : 'Missing';
    const rateDate = presentation.fx.isConvertible
        ? presentation.fx.rateDate
        : 'Add exchange rate';

    return (
        <aside className="order-first w-full shrink-0 print:hidden xl:sticky xl:top-6 xl:order-none xl:w-[320px]">
            <div className="rounded-lg border border-white/10 bg-brand-navy p-4 text-brand-light shadow-xl shadow-black/25">
                <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-mint">Preview tools</p>
                    <h2 className="mt-1 text-lg font-black">Generate document</h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-brand-light/50">
                        Select the exact output before printing or exporting.
                    </p>
                </div>

                <div className="space-y-3">
                    <section className={toolbarSectionClass}>
                        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                            Generation
                        </h3>

                        <div className="space-y-3">
                            <label className="block">
                                <span className={labelClass}>Partner</span>
                                <select
                                    id="contract-preview-partner-select"
                                    value={selectedPartnerId}
                                    onChange={(event) => onPartnerChange(event.target.value ? Number(event.target.value) : '')}
                                    className={selectClass}
                                >
                                    <option value="">Select partner...</option>
                                    {partners.map((partner) => (
                                        <option key={partner.id} value={partner.id}>
                                            {partner.companyName}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className={labelClass}>Language</span>
                                <select
                                    id="contract-preview-language-select"
                                    value={selectedLanguage}
                                    onChange={(event) => onLanguageChange(event.target.value as ContractPreviewLanguage)}
                                    className={selectClass}
                                >
                                    <option value="fr">French</option>
                                    <option value="en">English</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className={labelClass}>Currency</span>
                                <select
                                    id="contract-preview-currency-select"
                                    value={selectedCurrency}
                                    onChange={(event) => onCurrencyChange(event.target.value)}
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

                        {!hasPartner && (
                            <div className="mt-3 flex gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-200">
                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                Select a partner to generate the contract
                            </div>
                        )}
                    </section>

                    <section className={toolbarSectionClass}>
                        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                            Document actions
                        </h3>

                        <div className="mb-3 flex items-start gap-2 rounded-lg border border-white/10 bg-brand-navy/50 px-3 py-2">
                            {canExport ? (
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-mint" />
                            ) : (
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-300" />
                            )}
                            <div>
                                <p className="text-sm font-black">{canExport ? 'Ready to export' : 'Incomplete selection'}</p>
                                <p className="mt-0.5 text-xs font-semibold leading-5 text-brand-light/50">
                                    {canExport ? `${selectedLanguage.toUpperCase()} | ${outputCurrency}` : 'Complete the required selections first.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <button
                                id="contract-print-btn"
                                disabled={!canExport}
                                onClick={onPrint}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-sm font-bold text-brand-light transition hover:border-brand-mint/50 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Printer size={16} />
                                Print
                            </button>

                            <button
                                id="contract-download-pdf-btn"
                                disabled={isDownloading || !canExport}
                                onClick={onDownload}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-mint px-4 text-sm font-black text-brand-navy shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-brand-light/40 disabled:shadow-none"
                            >
                                {isDownloading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                {isDownloading ? 'Generating...' : 'Download PDF'}
                            </button>
                        </div>
                    </section>

                    <section className={toolbarSectionClass}>
                        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                            Conversion info
                        </h3>

                        <dl className="space-y-1">
                            <MetadataRow label="Base currency" value={baseCurrency} />
                            <MetadataRow label="Output currency" value={outputCurrency || 'Not selected'} />
                            <MetadataRow label="FX rate used" value={rateLabel} />
                            <MetadataRow label="FX rate date" value={rateDate} />
                        </dl>

                        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold leading-5 text-brand-light/60">
                            {conversionNote ?? `Stored commercial rates remain in ${baseCurrency}.`}
                        </p>
                    </section>

                    <section className={toolbarSectionClass}>
                        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-mint">
                            Metadata
                        </h3>

                        <dl>
                            <MetadataRow label="Contract reference" value={contract.reference || `CTR-${contract.id}`} />
                            <MetadataRow label="Season" value={contract.name || `Contract ${contract.id}`} />
                            <MetadataRow
                                label="Validity dates"
                                value={`${formatDate(contract.startDate, selectedLanguage)} - ${formatDate(contract.endDate, selectedLanguage)}`}
                            />
                        </dl>
                    </section>
                </div>
            </div>
        </aside>
    );
}
