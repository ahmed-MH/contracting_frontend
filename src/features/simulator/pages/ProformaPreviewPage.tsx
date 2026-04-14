import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Building2,
    Calendar,
    Clock,
    Download,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Users,
    Utensils,
    BedDouble,
    Baby,
    User,
    Printer,
} from 'lucide-react';
import { useGetProforma, useDownloadProformaPdf } from '../hooks/useProforma';
import { useHotel } from '../../hotel/context/HotelContext';
import { Spinner } from '../../../components/ui/Spinner';

function formatCurrency(value: number, currency: string) {
    return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(date: string) {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function nightsBetween(checkIn: string, checkOut: string) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ProformaPreviewPage() {
    const { t } = useTranslation('common');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentHotel } = useHotel();
    const { data: proforma, isLoading, isError } = useGetProforma(id ? Number(id) : undefined);
    const { mutate: downloadPdf, isPending: isDownloadingPdf } = useDownloadProformaPdf();

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
                    {t('pages.proforma.notFound', { defaultValue: 'Proforma not found' })}
                </p>
                <button
                    onClick={() => navigate('/simulator')}
                    className="flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-brand-light transition hover:bg-brand-navy/90"
                >
                    <ArrowLeft size={16} />
                    {t('pages.proforma.backToSimulator', { defaultValue: 'Back to Simulator' })}
                </button>
            </div>
        );
    }

    const nights = nightsBetween(proforma.checkIn, proforma.checkOut);
    const rooms: any[] = proforma.roomingSummary ?? [];
    const totals = proforma.totalsSnapshot;
    const calculation = proforma.calculationSnapshot;
    const totalAdults = rooms.reduce((acc: number, r: any) => acc + (r.adults ?? 0), 0);
    const totalChildren = rooms.reduce((acc: number, r: any) => acc + (r.children ?? 0), 0);

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
            {/* ─── Top action bar ─── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    id="proforma-back-btn"
                    onClick={() => navigate('/simulator')}
                    className="flex items-center gap-2 rounded-xl border border-brand-light/70 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                >
                    <ArrowLeft size={16} />
                    {t('pages.proforma.backToSimulator', { defaultValue: 'Back to Simulator' })}
                </button>

                <div className="flex gap-3">
                    <button
                        id="proforma-print-btn"
                        onClick={() => window.print()}
                        className="flex items-center gap-2 rounded-xl border border-brand-light/70 bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    >
                        <Printer size={16} />
                        {t('pages.proforma.print', { defaultValue: 'Print' })}
                    </button>
                    <button
                        id="proforma-download-btn"
                        disabled={isDownloadingPdf}
                        onClick={() => downloadPdf({ id: proforma.id, reference: proforma.reference })}
                        className="flex items-center gap-2 rounded-xl bg-brand-mint px-6 py-2.5 text-sm font-bold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isDownloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {isDownloadingPdf
                            ? t('pages.proforma.downloading', { defaultValue: 'Downloading...' })
                            : t('pages.proforma.downloadPdf', { defaultValue: 'Download PDF' })}
                    </button>
                </div>
            </div>

            {/* ─── Invoice Document ─── */}
            <div id="proforma-document" className="overflow-hidden rounded-3xl border border-brand-light/70 bg-white shadow-xl print:shadow-none dark:border-brand-light/10 dark:bg-brand-navy/60">

                {/* ─── Header ─── */}
                <div className="bg-brand-navy px-8 py-8 text-brand-light md:px-12">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-mint">
                                {t('pages.proforma.title', { defaultValue: 'Proforma Invoice' })}
                            </p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight">{proforma.reference}</h1>
                            <div className="mt-3 flex items-center gap-2 text-sm text-brand-light/60">
                                <Clock size={14} />
                                {t('pages.proforma.generatedOn', { defaultValue: 'Generated on' })} {formatDate(proforma.generatedAt)}
                            </div>
                        </div>

                        {currentHotel && (
                            <div className="text-right md:text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Building2 size={18} className="text-brand-mint" />
                                    <span className="text-lg font-bold">{currentHotel.name}</span>
                                </div>
                                {currentHotel.address && (
                                    <p className="mt-1 flex items-center justify-end gap-1.5 text-xs text-brand-light/60">
                                        <MapPin size={12} />
                                        {currentHotel.address}{currentHotel.city ? `, ${currentHotel.city}` : ''}
                                    </p>
                                )}
                                {currentHotel.email && (
                                    <p className="mt-0.5 flex items-center justify-end gap-1.5 text-xs text-brand-light/60">
                                        <Mail size={12} />
                                        {currentHotel.email}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Body ─── */}
                <div className="space-y-8 px-8 py-8 md:px-12">

                    {/* ─── Customer & Stay Details ─── */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Customer */}
                        <div className="rounded-2xl border border-brand-light/70 p-5 dark:border-brand-light/10">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-slate dark:text-brand-light/50">
                                {t('pages.proforma.billTo', { defaultValue: 'Bill To' })}
                            </p>
                            <p className="mt-2 text-lg font-bold text-brand-navy dark:text-brand-light">{proforma.customerName}</p>
                            {proforma.customerEmail && (
                                <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-slate dark:text-brand-light/60">
                                    <Mail size={13} />
                                    {proforma.customerEmail}
                                </p>
                            )}
                        </div>

                        {/* Stay Details */}
                        <div className="rounded-2xl border border-brand-light/70 p-5 dark:border-brand-light/10">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-slate dark:text-brand-light/50">
                                {t('pages.proforma.stayDetails', { defaultValue: 'Stay Details' })}
                            </p>
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-brand-navy dark:text-brand-light">
                                    <Calendar size={14} className="text-brand-mint" />
                                    <span className="font-semibold">{formatDateShort(proforma.checkIn)}</span>
                                    <span className="text-brand-slate dark:text-brand-light/50">→</span>
                                    <span className="font-semibold">{formatDateShort(proforma.checkOut)}</span>
                                    <span className="rounded-lg bg-brand-mint/10 px-2 py-0.5 text-xs font-bold text-brand-mint">
                                        {nights} {nights > 1 ? 'nights' : 'night'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-brand-navy dark:text-brand-light">
                                    <Utensils size={14} className="text-brand-mint" />
                                    <span>{proforma.boardTypeName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-brand-navy dark:text-brand-light">
                                    <Users size={14} className="text-brand-mint" />
                                    <span>{totalAdults} {totalAdults > 1 ? 'adults' : 'adult'}{totalChildren > 0 && `, ${totalChildren} ${totalChildren > 1 ? 'children' : 'child'}`}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Rooming List ─── */}
                    <div>
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-brand-navy dark:text-brand-light">
                            <BedDouble size={16} className="text-brand-mint" />
                            {t('pages.proforma.roomingList', { defaultValue: 'Rooming List' })}
                        </h2>
                        <div className="overflow-hidden rounded-2xl border border-brand-light/70 dark:border-brand-light/10">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-brand-navy/5 dark:bg-brand-light/5">
                                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate dark:text-brand-light/50">
                                            {t('pages.proforma.room', { defaultValue: 'Room' })}
                                        </th>
                                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate dark:text-brand-light/50">
                                            {t('pages.proforma.roomType', { defaultValue: 'Room Type' })}
                                        </th>
                                        <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate dark:text-brand-light/50">
                                            {t('pages.proforma.guests', { defaultValue: 'Guests' })}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-light/70 dark:divide-brand-light/10">
                                    {rooms.map((room: any, idx: number) => (
                                        <tr key={idx} className="transition hover:bg-brand-mint/3">
                                            <td className="px-5 py-3 font-semibold text-brand-navy dark:text-brand-light">
                                                {room.roomName ?? `Room ${idx + 1}`}
                                            </td>
                                            <td className="px-5 py-3 text-brand-slate dark:text-brand-light/70">
                                                {room.roomTypeName ?? '-'}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className="flex items-center gap-1 text-brand-navy dark:text-brand-light">
                                                        <User size={13} />
                                                        {room.adults ?? 0}
                                                    </span>
                                                    {(room.children ?? 0) > 0 && (
                                                        <span className="flex items-center gap-1 text-brand-slate dark:text-brand-light/60">
                                                            <Baby size={13} />
                                                            {room.children}
                                                            {room.childrenAges?.length > 0 && (
                                                                <span className="text-xs text-brand-slate/70">
                                                                    ({room.childrenAges.join(', ')} yrs)
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ─── Per-Room Pricing Breakdown ─── */}
                    {calculation?.roomsBreakdown && (
                        <div>
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-brand-navy dark:text-brand-light">
                                <FileText size={16} className="text-brand-mint" />
                                {t('pages.proforma.priceBreakdown', { defaultValue: 'Price Breakdown' })}
                            </h2>
                            <div className="overflow-hidden rounded-2xl border border-brand-light/70 dark:border-brand-light/10">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-brand-navy/5 dark:bg-brand-light/5">
                                            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate dark:text-brand-light/50">
                                                {t('pages.proforma.description', { defaultValue: 'Description' })}
                                            </th>
                                            <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate dark:text-brand-light/50">
                                                {t('pages.proforma.nights', { defaultValue: 'Nights' })}
                                            </th>
                                            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate dark:text-brand-light/50">
                                                {t('pages.proforma.grossAmount', { defaultValue: 'Gross' })}
                                            </th>
                                            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-brand-slate dark:text-brand-light/50">
                                                {t('pages.proforma.netAmount', { defaultValue: 'Net' })}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-light/70 dark:divide-brand-light/10">
                                        {calculation.roomsBreakdown.map((room: any, idx: number) => (
                                            <tr key={idx} className="transition hover:bg-brand-mint/3">
                                                <td className="px-5 py-3">
                                                    <span className="font-semibold text-brand-navy dark:text-brand-light">
                                                        {room.roomTypeName ?? `Room ${idx + 1}`}
                                                    </span>
                                                    <span className="ml-2 text-xs text-brand-slate dark:text-brand-light/50">
                                                        ({room.occupantsBreakdown?.adults ?? 0} ad.{(room.occupantsBreakdown?.children ?? 0) > 0 ? ` + ${room.occupantsBreakdown.children} ch.` : ''})
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center text-brand-slate dark:text-brand-light/60">
                                                    {room.dailyRates?.length ?? nights}
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-brand-slate dark:text-brand-light/70">
                                                    {formatCurrency(room.totalBrut ?? 0, proforma.currency)}
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-brand-navy dark:text-brand-light">
                                                    {formatCurrency(room.totalNet ?? 0, proforma.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ─── Notes ─── */}
                    {proforma.notes && (
                        <div className="rounded-2xl border border-brand-light/70 bg-brand-navy/3 p-5 dark:border-brand-light/10 dark:bg-brand-light/3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-slate dark:text-brand-light/50">
                                {t('pages.proforma.notes', { defaultValue: 'Notes' })}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-brand-navy dark:text-brand-light">{proforma.notes}</p>
                        </div>
                    )}

                    {/* ─── Totals ─── */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-brand-slate dark:text-brand-light/60">
                                    {t('pages.proforma.subtotal', { defaultValue: 'Subtotal (Gross)' })}
                                </span>
                                <span className="font-medium text-brand-navy dark:text-brand-light">
                                    {formatCurrency(totals.subtotal, proforma.currency)}
                                </span>
                            </div>
                            {totals.discountTotal !== 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-brand-slate dark:text-brand-light/60">
                                        {t('pages.proforma.discounts', { defaultValue: 'Discounts' })}
                                    </span>
                                    <span className="font-medium text-red-500">
                                        {formatCurrency(totals.discountTotal, proforma.currency)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-brand-light/70 pt-3 dark:border-brand-light/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-bold text-brand-navy dark:text-brand-light">
                                        {t('pages.proforma.grandTotal', { defaultValue: 'Grand Total' })}
                                    </span>
                                    <span className="text-2xl font-black text-brand-mint">
                                        {formatCurrency(totals.grandTotal, proforma.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ─── Footer ─── */}
                <div className="border-t border-brand-light/70 bg-brand-navy/3 px-8 py-5 text-center dark:border-brand-light/10 dark:bg-brand-light/3 md:px-12">
                    <p className="text-[10px] text-brand-slate dark:text-brand-light/40">
                        {t('pages.proforma.disclaimer', {
                            defaultValue: 'This is a proforma invoice and does not constitute a legal or fiscal document. Prices are indicative and subject to availability at the time of confirmation.',
                        })}
                    </p>
                </div>

            </div>
        </div>
    );
}
