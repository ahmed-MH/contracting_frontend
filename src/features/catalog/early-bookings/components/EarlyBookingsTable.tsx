import { Pencil, Trash2, RotateCcw, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { TemplateEarlyBooking } from '../types/early-bookings.types';
import type { PageMeta } from '../../../../types';
import { useTranslation } from 'react-i18next';

interface EarlyBookingsTableProps {
    data: TemplateEarlyBooking[];
    meta?: PageMeta;
    isArchivedView?: boolean;
    onEdit?: (eb: TemplateEarlyBooking) => void;
    onDelete?: (eb: TemplateEarlyBooking) => void;
    onRestore?: (eb: TemplateEarlyBooking) => void;
    onPageChange?: (newPage: number) => void;
    restorePending?: boolean;
}

export default function EarlyBookingsTable({
    data,
    meta,
    isArchivedView = false,
    onEdit,
    onDelete,
    onRestore,
    onPageChange,
    restorePending = false,
}: EarlyBookingsTableProps) {
    const { t } = useTranslation('common');
    void t;
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        try {
            return new Intl.DateTimeFormat('fr-FR').format(new Date(dateString));
        } catch {
            return dateString;
        }
    };

    if (isArchivedView) {
        return (
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-brand-light border-b border-brand-slate/20">
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.early.bookings.components.earlybookingstable.09eb62dd', { defaultValue: "Nom" })}</th>
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.early.bookings.components.earlybookingstable.772de13a', { defaultValue: "Réservation" })}</th>
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.catalog.early.bookings.components.earlybookingstable.61e1442d', { defaultValue: "Action" })}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate/10">
                    {data.map((eb) => (
                        <tr key={eb.id} className="hover:bg-brand-light transition-colors">
                            <td className="px-5 py-3 text-brand-slate">{eb.name}</td>
                            <td className="px-5 py-3">
                                {eb.bookingWindowStart || eb.bookingWindowEnd ? (
                                    <span className="text-xs text-brand-slate font-mono">{formatDate(eb.bookingWindowStart)} – {formatDate(eb.bookingWindowEnd)}</span>
                                ) : (
                                    <span className="text-xs text-brand-slate">—</span>
                                )}
                            </td>
                            <td className="px-5 py-3 text-right">
                                {onRestore && (
                                    <button onClick={() => onRestore(eb)} disabled={restorePending}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-mint/10 text-brand-mint text-xs font-medium rounded-xl hover:bg-brand-mint/10 transition-colors cursor-pointer disabled:opacity-50">
                                        <RotateCcw size={14} /> Restaurer
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-brand-slate/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-brand-light border-b border-brand-slate/20">
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.early.bookings.components.earlybookingstable.4fbd11a1', { defaultValue: "Offre & Release" })}</th>
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.catalog.early.bookings.components.earlybookingstable.772de13a', { defaultValue: "Réservation" })}</th>
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.catalog.early.bookings.components.earlybookingstable.d04ebc7e', { defaultValue: "Séjour" })}</th>
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.early.bookings.components.earlybookingstable.311a698c', { defaultValue: "Valeur" })}</th>
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.catalog.early.bookings.components.earlybookingstable.43465562', { defaultValue: "Prépayé" })}</th>
                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.catalog.early.bookings.components.earlybookingstable.9af038e3', { defaultValue: "Actions" })}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-slate/10">
                    {data.map((eb) => (
                        <tr key={eb.id} className="hover:bg-brand-light transition-colors group">
                            <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="font-medium text-brand-navy leading-tight">{eb.name}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm text-brand-slate font-mono">{eb.reference || 'EBO-PENDING'}</span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-mint/10 text-brand-mint border border-brand-mint/30 uppercase tracking-tighter">
                                            <Clock size={10} /> J-{eb.releaseDays}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-3 text-brand-slate text-[11px] font-mono text-center">
                                {eb.bookingWindowStart ? (
                                    <>
                                        <div className="text-brand-slate lowercase text-[9px]">{t('auto.features.catalog.early.bookings.components.earlybookingstable.1e0e5058', { defaultValue: "du" })}</div> {formatDate(eb.bookingWindowStart)}
                                        <div className="text-brand-slate lowercase text-[9px]">{t('auto.features.catalog.early.bookings.components.earlybookingstable.6bce5812', { defaultValue: "au" })}</div> {formatDate(eb.bookingWindowEnd)}
                                    </>
                                ) : <span className="text-brand-slate">—</span>}
                            </td>
                            <td className="px-5 py-3 text-brand-slate text-[11px] font-mono text-center">
                                {eb.stayWindowStart ? (
                                    <>
                                        <div className="text-brand-slate lowercase text-[9px]">{t('auto.features.catalog.early.bookings.components.earlybookingstable.1e0e5058', { defaultValue: "du" })}</div> {formatDate(eb.stayWindowStart)}
                                        <div className="text-brand-slate lowercase text-[9px]">{t('auto.features.catalog.early.bookings.components.earlybookingstable.6bce5812', { defaultValue: "au" })}</div> {formatDate(eb.stayWindowEnd)}
                                    </>
                                ) : <span className="text-brand-slate">—</span>}
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-brand-navy font-mono">
                                        {eb.calculationType === 'PERCENTAGE' ? `-${eb.value}%` : `${eb.value} TND`}
                                    </span>
                                    <span className="text-[10px] text-brand-slate font-medium uppercase tracking-tight">
                                        {eb.calculationType === 'PERCENTAGE' ? 'Pourcentage' : 'Fixe'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-5 py-3">
                                {eb.isPrepaid ? (
                                    <div className="flex flex-col animate-in fade-in duration-300">
                                        <span className="text-xs font-bold text-brand-slate">{t('auto.features.catalog.early.bookings.components.earlybookingstable.24b40c97', { defaultValue: "Oui" })}</span>
                                        <span className="text-[10px] text-brand-slate font-mono">({eb.prepaymentPercentage}%)</span>
                                    </div>
                                ) : <span className="text-xs text-brand-slate">{t('auto.features.catalog.early.bookings.components.earlybookingstable.74474d60', { defaultValue: "Non" })}</span>}
                            </td>
                            <td className="px-5 py-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                    {onEdit && (
                                        <button onClick={() => onEdit(eb)}
                                            className="p-1.5 rounded-xl text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer border-none outline-none" title={t('auto.features.catalog.early.bookings.components.earlybookingstable.title.f3f3d1eb', { defaultValue: "Modifier" })}>
                                            <Pencil size={15} />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button onClick={() => onDelete(eb)}
                                            className="p-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer border-none outline-none" title={t('auto.features.catalog.early.bookings.components.earlybookingstable.title.ffe3b18a', { defaultValue: "Archiver" })}>
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ─── Pagination Standard ────────────────────────────────── */}
            {meta && meta.lastPage > 0 && onPageChange && (
                <div className="px-5 py-3 bg-brand-light border-t border-brand-slate/20 flex items-center justify-between">
                    <p className="text-xs text-brand-slate font-medium tracking-tight">
                        {t('auto.pagination.summary', { defaultValue: 'Affichage de {{from}} ? {{to}} sur {{total}}', from: (meta.page - 1) * (meta.limit || 10) + 1, to: Math.min(meta.page * (meta.limit || 10), meta.total), total: meta.total })}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onPageChange(Math.max(1, meta.page - 1))}
                            disabled={meta.page <= 1}
                            className="p-1.5 text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-brand-mint/30"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center px-2.5 text-xs font-bold text-brand-slate bg-white border border-brand-slate/20 rounded-xl h-9 min-w-[36px] justify-center shadow-xs">
                            {meta.page} / {meta.lastPage}
                        </div>
                        <button
                            onClick={() => onPageChange(Math.min(meta.lastPage, meta.page + 1))}
                            disabled={meta.page >= meta.lastPage}
                            className="p-1.5 text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-brand-mint/30"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
