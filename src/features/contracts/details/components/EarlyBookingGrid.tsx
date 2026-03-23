import { useState, useCallback, useRef, memo, useEffect } from 'react';
import { Save, CheckCircle2, Pencil, Trash2, Clock, Calendar, CreditCard, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractEarlyBooking, UpdateContractEarlyBookingPayload } from '../../../catalog/early-bookings/types/early-bookings.types';
import type { Period } from '../../../contracts/types/contract.types';
import { contractEarlyBookingService } from '../../services/contractEarlyBooking.service';

// ── Types ─────────────────────────────────────────────────────────────
interface Props {
    earlyBookings: ContractEarlyBooking[];
    periods: Period[];
    onSaved: () => void;
    onEdit: (eb: ContractEarlyBooking) => void;
    onDelete: (eb: ContractEarlyBooking) => void;
    isDeleting: boolean;
}

interface CellData {
    active: boolean;
    overrideValue: string;
}
type Matrix = Record<number, Record<number, CellData>>;

function buildInitialMatrix(earlyBookings: ContractEarlyBooking[]): Matrix {
    const matrix: Matrix = {};
    for (const eb of earlyBookings) {
        matrix[eb.id] = {};
        for (const p of eb.applicablePeriods ?? []) {
            if (p.period?.id != null) {
                matrix[eb.id][p.period.id] = {
                    active: true,
                    overrideValue: p.overrideValue != null ? String(p.overrideValue) : '',
                };
            }
        }
    }
    return matrix;
}

const CALC_LABELS: Record<string, string> = {
    FIXED: 'Fixe',
    PERCENTAGE: '%',
    FREE: 'Gratuit',
};

const APP_LABELS: Record<string, string> = {
    PER_NIGHT_PER_PERSON: 'Pr pers./nuit',
    PER_NIGHT_PER_ROOM: 'Pr ch./nuit',
    FLAT_RATE_PER_STAY: 'Forfait séjour',
};

function formatShortDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// ── EarlyBookingCell ──────────────────────────────────────────────────
interface CellProps {
    ebId: number;
    periodId: number;
    cell: CellData;
    baseValue: number;
    baseType: string;
    onChange: (ebId: number, periodId: number, patch: Partial<CellData>) => void;
}

const EarlyBookingCell = memo(function EarlyBookingCell({
    ebId, periodId, cell, baseValue, baseType, onChange,
}: CellProps) {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideValue);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(ebId, periodId, patch), 400);
    }, [onChange, ebId, periodId]);

    const handleToggle = () => onChange(ebId, periodId, { active: !cell.active });

    const handleValueChange = (val: string) => {
        setLocalValue(val);
        emitChange({ overrideValue: val });
    };

    // ── Inactive state ────────────────────────────────────────────────
    if (!cell.active) {
        return (
            <div className="flex items-center justify-between px-3 h-[68px] group/cell transition-colors hover:bg-gray-100/60 bg-gray-50/80">
                <span className="text-[11px] text-gray-400 italic select-none">Non appliqué</span>
                <button
                    onClick={handleToggle}
                    title="Activer pour cette période"
                    className="relative w-8 h-4 rounded-full bg-gray-300 hover:bg-indigo-400 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm transition-all" />
                </button>
            </div>
        );
    }

    // ── Active state ──────────────────────────────────────────────────
    const placeholderText = baseType === 'FREE' ? 'Gratuit'
        : baseType === 'PERCENTAGE' ? `Base: ${baseValue}%`
            : `Base: ${baseValue}`;

    return (
        <div className="flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell transition-colors hover:bg-indigo-50/30">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider select-none">Actif</span>
                <button
                    onClick={handleToggle}
                    title="Désactiver pour cette période"
                    className="relative w-8 h-4 rounded-full bg-indigo-500 hover:bg-red-400 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm" />
                </button>
            </div>

            <div className="relative">
                <input
                    type="number"
                    min="0"
                    value={localValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    placeholder={placeholderText}
                    title="Laisser vide pour hériter de la réduction de base"
                    className={`block w-full px-2 py-1 text-xs rounded-md border text-right transition-all
                        focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400
                        ${localValue !== ''
                            ? 'border-indigo-300 text-indigo-700 bg-indigo-50/70 font-semibold'
                            : 'border-gray-200 text-gray-400 bg-white'
                        }`}
                />
                {localValue !== '' && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 pointer-events-none" />
                )}
            </div>
        </div>
    );
});

// ── EarlyBookingGrid ───────────────────────────────────────────────────
export default function EarlyBookingGrid({
    earlyBookings, periods, onSaved, onEdit, onDelete, isDeleting,
}: Props) {
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [matrix, setMatrix] = useState<Matrix>(() => buildInitialMatrix(earlyBookings));

    useEffect(() => {
        setMatrix(buildInitialMatrix(earlyBookings));
    }, [earlyBookings]);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

    const handleCellChange = useCallback(
        (ebId: number, periodId: number, patch: Partial<CellData>) => {
            setMatrix((prev) => ({
                ...prev,
                [ebId]: {
                    ...prev[ebId],
                    [periodId]: { ...(prev[ebId]?.[periodId] ?? { active: false, overrideValue: '' }), ...patch },
                },
            }));
            setSavedIds((prev) => { const n = new Set(prev); n.delete(ebId); return n; });
        },
        [],
    );

    const handleSaveRow = async (eb: ContractEarlyBooking) => {
        setSavingId(eb.id);
        try {
            // Race condition prevention
            await new Promise(resolve => setTimeout(resolve, 500));

            const cellMap = matrix[eb.id] ?? {};
            const payloadPeriods = Object.entries(cellMap)
                .filter(([, c]) => c.active)
                .map(([pidStr, c]) => ({
                    periodId: Number(pidStr),
                    overrideValue: c.overrideValue !== '' && !isNaN(Number(c.overrideValue))
                        ? Number(c.overrideValue)
                        : null,
                }));

            const payload: UpdateContractEarlyBookingPayload = {
                applicablePeriods: payloadPeriods,
            };

            await contractEarlyBookingService.update(eb.id, payload);
            setSavedIds((prev) => new Set(prev).add(eb.id));
            onSaved();
            toast.success(`Early Booking "${eb.name}" sauvegardé`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setSavingId(null);
        }
    };

    if (earlyBookings.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-b border-indigo-100 flex items-center justify-between bg-linear-to-r from-indigo-50/80 to-purple-50/60">
                <div className="flex items-center gap-3">
                    <span className="bg-indigo-600 p-1 rounded-lg text-white">
                        <Calendar size={14} />
                    </span>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                        Matrice de Réduction Early Booking
                    </span>
                </div>
                <div className="flex items-center gap-2 group cursor-help">
                    <Info size={14} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-[10px] text-gray-500 font-medium">
                        Activez par période & surchargez la valeur si nécessaire
                    </span>
                </div>
            </div>

            {/* ── Scrollable grid ──────────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            {/* Rule info (sticky) */}
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[240px]">
                                Offre & Conditions
                            </th>
                            {/* Base */}
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase min-w-[120px]">
                                Base Globale
                            </th>
                            {/* Dynamic periods */}
                            {sortedPeriods.map((period) => (
                                <th
                                    key={period.id}
                                    className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[140px] text-center border-l border-gray-200"
                                >
                                    <div className="font-bold text-gray-800">{period.name}</div>
                                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                                        {new Date(period.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – {new Date(period.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </div>
                                </th>
                            ))}
                            {/* Actions */}
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase min-w-[110px] text-center border-l border-gray-200 sticky right-0 bg-gray-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                Sauvegarde
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {earlyBookings.map((eb) => {
                            const isSaving = savingId === eb.id;
                            const isSaved = savedIds.has(eb.id);
                            const roomCodes = eb.applicableContractRooms?.map(r => r.contractRoom?.roomType?.code).filter(Boolean);

                            return (
                                <tr key={eb.id} className="group hover:bg-slate-50/40 transition-colors">
                                    {/* ── Rule info (sticky) ── */}
                                    <td className="px-4 py-4 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-sm tracking-tight">{eb.name}</span>
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                    <Clock size={10} /> J-{eb.releaseDays}
                                                </span>
                                            </div>

                                            {/* Stay/Booking windows badges */}
                                            <div className="flex flex-wrap gap-1">
                                                {eb.bookingWindowStart && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded font-medium">
                                                        📅 Résa: {formatShortDate(eb.bookingWindowStart)} → {formatShortDate(eb.bookingWindowEnd || '')}
                                                    </span>
                                                )}
                                                {eb.isPrepaid && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded font-bold">
                                                        <CreditCard size={9} className="inline mr-1" /> PRÉPAYÉ
                                                    </span>
                                                )}
                                            </div>

                                            {roomCodes?.length ? (
                                                <p className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]" title={roomCodes.join(', ')}>
                                                    🏨 {roomCodes.join(' · ')}
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-gray-400 italic">Toutes chambres</p>
                                            )}
                                        </div>
                                    </td>

                                    {/* ── Base ── */}
                                    <td className="px-4 py-4 align-middle">
                                        <div className="flex flex-col">
                                            <span className="font-mono font-bold text-gray-800 text-sm">
                                                {eb.calculationType === 'PERCENTAGE' ? `-${eb.value}%` : `${eb.value} TND`}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {CALC_LABELS[eb.calculationType] || eb.calculationType}
                                                {eb.calculationType === 'FIXED' && ` · ${APP_LABELS[eb.applicationType] ?? eb.applicationType}`}
                                            </span>
                                        </div>
                                    </td>

                                    {/* ── Period cells ── */}
                                    {sortedPeriods.map((period) => (
                                        <td key={period.id} className="p-0 border-l border-gray-100 align-top">
                                            <EarlyBookingCell
                                                ebId={eb.id}
                                                periodId={period.id}
                                                cell={matrix[eb.id]?.[period.id] ?? { active: false, overrideValue: '' }}
                                                baseValue={eb.value}
                                                baseType={eb.calculationType}
                                                onChange={handleCellChange}
                                            />
                                        </td>
                                    ))}

                                    {/* ── Actions ── */}
                                    <td className="px-3 py-4 border-l border-gray-100 text-center align-middle sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        <div className="flex flex-col items-center gap-2">
                                            {isSaved ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Sauvé</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleSaveRow(eb)}
                                                    disabled={isSaving}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 disabled:opacity-60 transition-all cursor-pointer w-full justify-center"
                                                >
                                                    <Save size={13} />
                                                    {isSaving ? '...' : 'Sauver'}
                                                </button>
                                            )}

                                            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onEdit(eb)} className="p-1 px-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer" title="Coquille"><Pencil size={12} /></button>
                                                <button onClick={() => onDelete(eb)} disabled={isDeleting} className="p-1 px-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50" title="Supprimer"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Legend ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-6 text-[10px] text-gray-500 font-medium">
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    Non appliqué
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Valeur par défaut héritée
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                    Valeur surchargée
                </span>
            </div>
        </div>
    );
}
