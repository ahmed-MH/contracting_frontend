import { useDeferredValue, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ExternalLink, FileText, Search } from 'lucide-react';
import { GuidedPageHeader, SectionCard, WorkspaceContainer } from '../../../components/layout/Workspace';
import UpdatedByCell from '../../../components/audit/UpdatedByCell';
import { useAffiliates } from '../../partners/hooks/useAffiliates';
import { useDownloadProformaPdf, useGetIssuedProformas } from '../hooks/useProforma';

function formatDate(iso?: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount?: number | null, currency?: string | null) {
    const numeric = typeof amount === 'number' ? amount : 0;
    const code = (currency || 'EUR').toUpperCase();
    return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric)} ${code}`;
}

export default function SavedProformaInvoicesPage() {
    const navigate = useNavigate();
    const { data: affiliates = [] } = useAffiliates();
    const [search, setSearch] = useState('');
    const [affiliateId, setAffiliateId] = useState('');
    const [issuedFrom, setIssuedFrom] = useState('');
    const [issuedTo, setIssuedTo] = useState('');
    const deferredSearch = useDeferredValue(search.trim());
    const filters = useMemo(() => ({
        search: deferredSearch || undefined,
        affiliateId: affiliateId ? Number(affiliateId) : undefined,
        issuedFrom: issuedFrom || undefined,
        issuedTo: issuedTo || undefined,
    }), [affiliateId, deferredSearch, issuedFrom, issuedTo]);

    const {
        data: invoices = [],
        isLoading,
        isError,
    } = useGetIssuedProformas(filters);
    const { mutate: downloadPdf, isPending: isDownloading } = useDownloadProformaPdf();

    return (
        <WorkspaceContainer className="space-y-6">
            <GuidedPageHeader
                icon={FileText}
                kicker="Commercial Archive"
                title="Saved Proforma Invoices"
                description="Issued proforma invoices are frozen on download and can be viewed or re-downloaded from this workspace."
            />

            <SectionCard
                title="Issued invoices"
                description="Search by invoice number or partner, then reopen the frozen commercial document when you need it."
                bodyClassName="space-y-4"
            >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_180px_180px]">
                    <label className="relative block">
                        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search invoice no or partner"
                            className="h-11 w-full rounded-lg border border-brand-light/70 bg-brand-light/80 pl-10 pr-4 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        />
                    </label>

                    <select
                        value={affiliateId}
                        onChange={(event) => setAffiliateId(event.target.value)}
                        className="h-11 rounded-lg border border-brand-light/70 bg-brand-light/80 px-4 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    >
                        <option value="">All partners</option>
                        {affiliates.map((affiliate) => (
                            <option key={affiliate.id} value={affiliate.id}>
                                {affiliate.companyName}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={issuedFrom}
                        onChange={(event) => setIssuedFrom(event.target.value)}
                        className="h-11 rounded-lg border border-brand-light/70 bg-brand-light/80 px-4 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    />

                    <input
                        type="date"
                        value={issuedTo}
                        onChange={(event) => setIssuedTo(event.target.value)}
                        className="h-11 rounded-lg border border-brand-light/70 bg-brand-light/80 px-4 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    />
                </div>

                {isLoading && (
                    <div className="flex h-44 items-center justify-center">
                        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                    </div>
                )}

                {isError && (
                    <div className="rounded-lg border border-brand-slate/20 bg-brand-slate/5 px-4 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/70">
                        Unable to load issued invoices right now.
                    </div>
                )}

                {!isLoading && !isError && invoices.length === 0 && (
                    <div className="rounded-lg border border-dashed border-brand-slate/20 px-6 py-14 text-center dark:border-brand-light/10">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint">
                            <FileText size={26} />
                        </div>
                        <h2 className="mt-5 text-lg font-semibold text-brand-navy dark:text-brand-light">
                            No issued proforma invoices yet
                        </h2>
                        <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/70">
                            Draft previews appear here only after the PDF is downloaded and the invoice is issued.
                        </p>
                    </div>
                )}

                {!isLoading && !isError && invoices.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-brand-light/70 dark:border-brand-light/10">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-brand-light/70 text-brand-slate dark:bg-brand-light/5">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Invoice</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Partner</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Stay</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Amount</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Tax</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Issued by</th>
                                        <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="bg-brand-light/35 transition hover:bg-brand-light/60 dark:bg-transparent dark:hover:bg-brand-light/5">
                                            <td className="px-5 py-4 align-top">
                                                <p className="font-semibold text-brand-navy dark:text-brand-light">{invoice.reference}</p>
                                                <p className="mt-1 text-xs font-medium text-brand-slate dark:text-brand-light/65">
                                                    {invoice.status}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <p className="font-semibold text-brand-navy dark:text-brand-light">{invoice.customerName}</p>
                                                <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/65">
                                                    {invoice.customerEmail || 'No email provided'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 align-top text-brand-slate dark:text-brand-light/70">
                                                <p>{formatDate(invoice.checkIn)} → {formatDate(invoice.checkOut)}</p>
                                                <p className="mt-1 text-xs">
                                                    Booking: {formatDate(invoice.bookingDate)}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <p className="font-semibold text-brand-navy dark:text-brand-light">
                                                    {formatAmount(invoice.totalsSnapshot?.totalAmount ?? invoice.totalsSnapshot?.grandTotal, invoice.currency)}
                                                </p>
                                                <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/65">
                                                    {invoice.currency}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 align-top text-brand-slate dark:text-brand-light/70">
                                                {invoice.totalsSnapshot?.taxEnabled
                                                    ? `${invoice.totalsSnapshot?.taxName ?? 'Tax'} · ${formatAmount(invoice.totalsSnapshot?.taxAmount ?? 0, invoice.currency)}`
                                                    : 'Not applied'}
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <UpdatedByCell
                                                    updatedByName={invoice.issuedByName ?? invoice.updatedByName}
                                                    updatedAt={invoice.issuedAt ?? invoice.updatedAt}
                                                />
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/proforma/${invoice.id}`)}
                                                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-mint/10 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-brand-light"
                                                    >
                                                        <ExternalLink size={14} />
                                                        View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isDownloading}
                                                        onClick={() => downloadPdf({ id: invoice.id })}
                                                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-light/70 bg-brand-light/70 px-4 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                                    >
                                                        <Download size={14} />
                                                        Download
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </SectionCard>
        </WorkspaceContainer>
    );
}
