import { Pencil, Trash2, RotateCcw, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { TemplateEarlyBooking } from '../types/early-bookings.types';
import type { PageMeta } from '../../../../types';

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
                    <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nom</th>
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Réservation</th>
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((eb) => (
                        <tr key={eb.id} className="hover:bg-gray-100 transition-colors">
                            <td className="px-5 py-3 text-gray-500">{eb.name}</td>
                            <td className="px-5 py-3">
                                {eb.bookingWindowStart || eb.bookingWindowEnd ? (
                                    <span className="text-xs text-gray-500 font-mono">{formatDate(eb.bookingWindowStart)} – {formatDate(eb.bookingWindowEnd)}</span>
                                ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                )}
                            </td>
                            <td className="px-5 py-3 text-right">
                                {onRestore && (
                                    <button onClick={() => onRestore(eb)} disabled={restorePending}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50">
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Offre & Release</th>
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Réservation</th>
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Séjour</th>
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Valeur</th>
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Prépayé</th>
                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((eb) => (
                        <tr key={eb.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 leading-tight">{eb.name}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm text-gray-500 font-mono">{eb.reference || 'EBO-PENDING'}</span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-tighter">
                                            <Clock size={10} /> J-{eb.releaseDays}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-3 text-gray-600 text-[11px] font-mono text-center">
                                {eb.bookingWindowStart ? (
                                    <>
                                        <div className="text-gray-400 lowercase text-[9px]">du</div> {formatDate(eb.bookingWindowStart)}
                                        <div className="text-gray-400 lowercase text-[9px]">au</div> {formatDate(eb.bookingWindowEnd)}
                                    </>
                                ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-3 text-gray-600 text-[11px] font-mono text-center">
                                {eb.stayWindowStart ? (
                                    <>
                                        <div className="text-gray-400 lowercase text-[9px]">du</div> {formatDate(eb.stayWindowStart)}
                                        <div className="text-gray-400 lowercase text-[9px]">au</div> {formatDate(eb.stayWindowEnd)}
                                    </>
                                ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-3">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 font-mono">
                                        {eb.calculationType === 'PERCENTAGE' ? `-${eb.value}%` : `${eb.value} TND`}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                                        {eb.calculationType === 'PERCENTAGE' ? 'Pourcentage' : 'Fixe'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-5 py-3">
                                {eb.isPrepaid ? (
                                    <div className="flex flex-col animate-in fade-in duration-300">
                                        <span className="text-xs font-bold text-amber-600">Oui</span>
                                        <span className="text-[10px] text-amber-500 font-mono">({eb.prepaymentPercentage}%)</span>
                                    </div>
                                ) : <span className="text-xs text-gray-400">Non</span>}
                            </td>
                            <td className="px-5 py-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                    {onEdit && (
                                        <button onClick={() => onEdit(eb)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border-none outline-none" title="Modifier">
                                            <Pencil size={15} />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button onClick={() => onDelete(eb)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-none outline-none" title="Archiver">
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
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium tracking-tight">
                        Affichage de <span className="font-bold text-gray-700">{(meta.page - 1) * (meta.limit || 10) + 1}</span> à <span className="font-bold text-gray-700">{Math.min(meta.page * (meta.limit || 10), meta.total)}</span> sur <span className="font-bold text-gray-700">{meta.total}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onPageChange(Math.max(1, meta.page - 1))}
                            disabled={meta.page <= 1}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-indigo-100"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center px-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg h-9 min-w-[36px] justify-center shadow-xs">
                            {meta.page} / {meta.lastPage}
                        </div>
                        <button
                            onClick={() => onPageChange(Math.min(meta.lastPage, meta.page + 1))}
                            disabled={meta.page >= meta.lastPage}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-indigo-100"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
