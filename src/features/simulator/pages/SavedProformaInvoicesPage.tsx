import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ChevronDown, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, RotateCcw, Search } from 'lucide-react';
import { GuidedPageHeader, SectionCard, WorkspaceContainer } from '../../../components/layout/Workspace';
import UpdatedByCell from '../../../components/audit/UpdatedByCell';
import { useAffiliates } from '../../partners/hooks/useAffiliates';
import { useArchiveProforma, useDownloadProformaPdf, useGetArchivedIssuedProformas, useGetIssuedProformas, useRestoreProforma } from '../hooks/useProforma';
import { useConfirm } from '../../../context/ConfirmContext';
import type { PageMeta } from '../../../types/pagination.types';

function formatDate(iso?: string | null) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount?: number | null, currency?: string | null) {
    const numeric = typeof amount === 'number' ? amount : 0;
    const code = (currency || 'EUR').toUpperCase();
    return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric)} ${code}`;
}

const filterLabelClass = 'mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-brand-slate dark:text-brand-light/50';
const filterControlClass = 'h-11 w-full rounded-lg border border-brand-light/70 bg-brand-light/80 px-4 text-sm text-brand-navy shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light';
const pageSize = 10;

function PaginationControls({
    meta,
    onPageChange,
}: {
    meta?: PageMeta;
    onPageChange: (page: number) => void;
}) {
    if (!meta || meta.lastPage <= 1) return null;

    return (
        <div className="flex items-center justify-between gap-3 border-t border-brand-light/70 px-5 py-4 text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">
            <span>
                Page {meta.page} of {meta.lastPage} - {meta.total} total
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => onPageChange(meta.page - 1)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-brand-light/70 bg-brand-light/70 px-3 font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                >
                    <ChevronLeft size={14} />
                    Previous
                </button>
                <button
                    type="button"
                    disabled={meta.page >= meta.lastPage}
                    onClick={() => onPageChange(meta.page + 1)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-brand-light/70 bg-brand-light/70 px-3 font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                >
                    Next
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

export default function SavedProformaInvoicesPage() {
    const navigate = useNavigate();
    const { confirm } = useConfirm();
    const { data: affiliates = [] } = useAffiliates();
    const [search, setSearch] = useState('');
    const [affiliateId, setAffiliateId] = useState('');
    const [issuedFrom, setIssuedFrom] = useState('');
    const [issuedTo, setIssuedTo] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [page, setPage] = useState(1);
    const [archivedPage, setArchivedPage] = useState(1);
    const deferredSearch = useDeferredValue(search.trim());
    const filters = useMemo(() => ({
        search: deferredSearch || undefined,
        affiliateId: affiliateId ? Number(affiliateId) : undefined,
        issuedFrom: issuedFrom || undefined,
        issuedTo: issuedTo || undefined,
        page,
        limit: pageSize,
    }), [affiliateId, deferredSearch, issuedFrom, issuedTo, page]);
    const archivedFilters = useMemo(() => ({
        search: deferredSearch || undefined,
        affiliateId: affiliateId ? Number(affiliateId) : undefined,
        issuedFrom: issuedFrom || undefined,
        issuedTo: issuedTo || undefined,
        page: archivedPage,
        limit: pageSize,
    }), [affiliateId, archivedPage, deferredSearch, issuedFrom, issuedTo]);

    const {
        data: invoicesPage,
        isLoading,
        isError,
    } = useGetIssuedProformas(filters);
    const { data: archivedInvoicesPage } = useGetArchivedIssuedProformas(archivedFilters, showArchived);
    const invoices = invoicesPage?.data ?? [];
    const archivedInvoices = archivedInvoicesPage?.data ?? [];
    const { mutate: downloadPdf, isPending: isDownloading } = useDownloadProformaPdf();
    const archiveMutation = useArchiveProforma();
    const restoreMutation = useRestoreProforma();

    useEffect(() => {
        setPage(1);
        setArchivedPage(1);
    }, [affiliateId, deferredSearch, issuedFrom, issuedTo]);

    const handleArchive = async (invoice: typeof invoices[number]) => {
        if (await confirm({
            title: `Archive invoice "${invoice.reference}"?`,
            description: 'This invoice will move out of the active commercial archive until it is restored.',
            confirmLabel: 'Archive',
            variant: 'danger',
        })) {
            archiveMutation.mutate(invoice.id);
        }
    };

    const handleRestore = async (invoice: typeof invoices[number]) => {
        if (await confirm({
            title: `Restore invoice "${invoice.reference}"?`,
            description: 'This invoice will return to the active issued invoice archive.',
            confirmLabel: 'Restore',
            variant: 'info',
        })) {
            restoreMutation.mutate(invoice.id);
        }
    };

    return (
        <WorkspaceContainer className="space-y-6">
            <GuidedPageHeader
                icon={FileText}
                kicker="Commercial Archive"
                title="Saved Invoices"
                description="Issued invoices are frozen on download and can be viewed or re-downloaded from this workspace."
            />

            <SectionCard
                title="Issued invoices"
                description="Search by invoice number or partner, then reopen the frozen commercial document when you need it."
                bodyClassName="space-y-4"
            >
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_180px_180px]">
                    <label className="block">
                        <span className={filterLabelClass}>Search</span>
                        <span className="relative block">
                            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Invoice no or partner"
                                className={`${filterControlClass} pl-10 pr-4`}
                            />
                        </span>
                    </label>

                    <label className="block">
                        <span className={filterLabelClass}>Partner</span>
                        <select
                            value={affiliateId}
                            onChange={(event) => setAffiliateId(event.target.value)}
                            className={filterControlClass}
                        >
                            <option value="">All partners</option>
                            {affiliates.map((affiliate) => (
                                <option key={affiliate.id} value={affiliate.id}>
                                    {affiliate.companyName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className={filterLabelClass}>Issued from</span>
                        <input
                            type="date"
                            value={issuedFrom}
                            onChange={(event) => setIssuedFrom(event.target.value)}
                            className={filterControlClass}
                        />
                    </label>

                    <label className="block">
                        <span className={filterLabelClass}>Issued to</span>
                        <input
                            type="date"
                            value={issuedTo}
                            onChange={(event) => setIssuedTo(event.target.value)}
                            className={filterControlClass}
                        />
                    </label>
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
                            No issued invoices yet
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
                                                <p>{formatDate(invoice.checkIn)} - {formatDate(invoice.checkOut)}</p>
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
                                                    <button
                                                        type="button"
                                                        disabled={archiveMutation.isPending}
                                                        onClick={() => handleArchive(invoice)}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-light/70 bg-brand-light/70 text-brand-slate transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                                        aria-label="Archive invoice"
                                                    >
                                                        <Archive size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls meta={invoicesPage?.meta} onPageChange={setPage} />
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setShowArchived((value) => !value)}
                        className="inline-flex items-center gap-2 rounded-lg border border-brand-light/70 bg-brand-light/70 px-4 py-2 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    >
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Archived invoices {showArchived ? `(${archivedInvoicesPage?.meta.total ?? archivedInvoices.length})` : ''}
                    </button>
                </div>

                {showArchived && archivedInvoices.length === 0 && (
                    <div className="rounded-lg border border-dashed border-brand-slate/20 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">
                        No archived invoices match these filters.
                    </div>
                )}

                {showArchived && archivedInvoices.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-brand-light/70 dark:border-brand-light/10">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-brand-light/70 text-brand-slate dark:bg-brand-light/5">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Invoice</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Partner</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Stay</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Amount</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-[0.18em]">Archived</th>
                                        <th className="px-5 py-4 text-right font-semibold uppercase tracking-[0.18em]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/60 dark:divide-brand-light/10">
                                    {archivedInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="bg-brand-light/20 dark:bg-transparent">
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
                                                <p>{formatDate(invoice.checkIn)}{' -> '}{formatDate(invoice.checkOut)}</p>
                                                <p className="mt-1 text-xs">
                                                    Booking: {formatDate(invoice.bookingDate)}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <p className="font-semibold text-brand-navy dark:text-brand-light">
                                                    {formatAmount(invoice.totalsSnapshot?.totalAmount ?? invoice.totalsSnapshot?.grandTotal, invoice.currency)}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 align-top text-brand-slate dark:text-brand-light/70">
                                                {formatDate(invoice.deletedAt)}
                                            </td>
                                            <td className="px-5 py-4 align-top">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={restoreMutation.isPending}
                                                        onClick={() => handleRestore(invoice)}
                                                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-mint/10 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <RotateCcw size={14} />
                                                        Restore
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls meta={archivedInvoicesPage?.meta} onPageChange={setArchivedPage} />
                    </div>
                )}
            </SectionCard>
        </WorkspaceContainer>
    );
}
