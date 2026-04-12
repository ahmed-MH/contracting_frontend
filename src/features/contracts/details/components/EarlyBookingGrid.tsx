import { useState, useCallback, useRef, memo, useEffect, useMemo } from 'react';
import { Save, Pencil, Trash2, Clock, Calendar, CreditCard, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractEarlyBooking, UpdateContractEarlyBookingPayload } from '../../../catalog/early-bookings/types/early-bookings.types';
import type { Period } from '../../../contracts/types/contract.types';
import { contractEarlyBookingService } from '../../services/contractEarlyBooking.service';
import { isEqual } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import i18next from '../../../../lib/i18n';

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
    const { t } = useTranslation('common');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideValue);

    useEffect(() => {
        setLocalValue(cell.overrideValue);
    }, [cell.overrideValue]);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(ebId, periodId, patch), 300);
    }, [onChange, ebId, periodId]);

    const handleToggle = () => onChange(ebId, periodId, { active: !cell.active });

    const handleValueChange = (val: string) => {
        setLocalValue(val);
        emitChange({ overrideValue: val });
    };

    // ── Inactive state ────────────────────────────────────────────────
    if (!cell.active) {
        return (
            <div className="flex items-center justify-between px-3 h-[68px] group/cell transition-colors hover:bg-brand-light bg-brand-light">
                <span className="text-[11px] text-brand-slate italic select-none">{t('auto.features.contracts.details.components.earlybookinggrid.ae2c4a84', { defaultValue: "Non appliqué" })}</span>
                <button
                    onClick={handleToggle}
                    title={t('auto.features.contracts.details.components.earlybookinggrid.title.85db8588', { defaultValue: "Activer pour cette période" })}
                    className="relative w-8 h-4 rounded-full bg-brand-slate/10 hover:bg-brand-mint/10 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
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
        <div className="flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell transition-colors hover:bg-brand-mint/10">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-mint uppercase tracking-wider select-none">{t('auto.features.contracts.details.components.earlybookinggrid.40a9f1dd', { defaultValue: "Actif" })}</span>
                <button
                    onClick={handleToggle}
                    title={t('auto.features.contracts.details.components.earlybookinggrid.title.982754ad', { defaultValue: "Désactiver pour cette période" })}
                    className="relative w-8 h-4 rounded-full bg-brand-mint hover:bg-brand-slate/20 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
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
                    title={t('auto.features.contracts.details.components.earlybookinggrid.title.55dc683a', { defaultValue: "Laisser vide pour hériter de la réduction de base" })}
                    className={`block w-full px-2 py-1 text-xs rounded-xl border text-right transition-all
                        focus:outline-none focus:ring-1 focus:ring-brand-mint focus:border-brand-mint/30
                        ${localValue !== ''
                            ? 'border-brand-mint/30 text-brand-mint bg-brand-mint/10 font-semibold'
                            : 'border-brand-slate/20 text-brand-slate bg-white'
                        }`}
                />
                {localValue !== '' && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-brand-mint pointer-events-none" />
                )}
            </div>
        </div>
    );
});


// ── EarlyBookingGrid ───────────────────────────────────────────────────
export default function EarlyBookingGrid({
    earlyBookings, periods, onSaved, onEdit, onDelete, isDeleting,
}: Props) {
    const { t } = useTranslation('common');
    void t;
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [initialMatrix, setInitialMatrix] = useState<Matrix>(() => buildInitialMatrix(earlyBookings));
    const [editedMatrix, setEditedMatrix] = useState<Matrix>(initialMatrix);

    useEffect(() => {
        const newMatrix = buildInitialMatrix(earlyBookings);
        setInitialMatrix(newMatrix);
        setEditedMatrix(newMatrix);
    }, [earlyBookings]);

    const [isSaving, setIsSaving] = useState(false);

    const isDirty = useMemo(() => !isEqual(initialMatrix, editedMatrix), [initialMatrix, editedMatrix]);

    const handleCellChange = useCallback((ebId: number, periodId: number, patch: Partial<CellData>) => {
        setEditedMatrix((prev) => {
            const currentCell = prev[ebId]?.[periodId] ?? { active: false, overrideValue: '' };
            const newMatrix = { ...prev };
            newMatrix[ebId] = { ...prev[ebId], [periodId]: { ...currentCell, ...patch } };
            return newMatrix;
        });
    }, []);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const modifiedEbIds = Object.keys(editedMatrix)
                .map(Number)
                .filter(ebId => !isEqual(initialMatrix[ebId], editedMatrix[ebId]));

            if (modifiedEbIds.length === 0) {
                toast.info(i18next.t('auto.features.contracts.details.components.earlybookinggrid.toast.info.465088e0', { defaultValue: "Aucune modification à enregistrer." }));
                return;
            }

            const savePromises = modifiedEbIds.map(ebId => {
                const cellMap = editedMatrix[ebId] ?? {};
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
                return contractEarlyBookingService.update(ebId, payload);
            });

            await Promise.all(savePromises);

            setInitialMatrix(editedMatrix); // Sync initial state with last saved state
            onSaved();
            toast.success(`${modifiedEbIds.length} offre(s) Early Booking sauvegardée(s)`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setIsSaving(false);
        }
    };


    if (earlyBookings.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-brand-mint rounded-xl overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-b border-brand-mint/30 flex items-center justify-between bg-linear-to-r from-brand-mint to-brand-mint">
                <div className="flex items-center gap-3">
                    <span className="bg-brand-mint p-1 rounded-xl text-white">
                        <Calendar size={14} />
                    </span>
                    <span className="text-xs font-bold text-brand-mint uppercase tracking-widest">
                        Matrice de Réduction Early Booking
                    </span>
                </div>
                <div className='flex items-center gap-4'>
                    <div className="flex items-center gap-2 group cursor-help">
                        <Info size={14} className="text-brand-mint group-hover:text-brand-mint transition-colors" />
                        <span className="text-[10px] text-brand-slate font-medium">
                            Activez par période & surchargez la valeur si nécessaire
                        </span>
                    </div>

                    <button
                        onClick={handleSaveAll}
                        disabled={!isDirty || isSaving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-brand-mint text-white hover:bg-brand-mint shadow-md shadow-brand-mint/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                    >
                        <Save size={13} />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </div>

            {/* ── Scrollable grid ──────────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-light border-b-2 border-brand-slate/20">
                            {/* Rule info (sticky) */}
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase sticky left-0 bg-brand-light z-10 shadow-md min-w-[240px]">
                                Offre & Conditions
                            </th>
                            {/* Base */}
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[120px]">
                                Base Globale
                            </th>
                            {/* Dynamic periods */}
                            {sortedPeriods.map((period) => (
                                <th
                                    key={period.id}
                                    className="px-4 py-3 text-xs font-semibold text-brand-slate min-w-[140px] text-center border-l border-brand-slate/20"
                                >
                                    <div className="font-bold text-brand-navy">{period.name}</div>
                                    <div className="text-[10px] text-brand-slate font-normal mt-0.5">
                                        {new Date(period.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – {new Date(period.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </div>
                                </th>
                            ))}
                            {/* Actions */}
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[110px] text-center border-l border-brand-slate/20 sticky right-0 bg-brand-light shadow-md">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-slate/10">
                        {earlyBookings.map((eb) => {
                            const isRowDirty = !isEqual(initialMatrix[eb.id], editedMatrix[eb.id]);

                            return (
                                <tr key={eb.id} className="group hover:bg-brand-light transition-colors">
                                    {/* ── Rule info (sticky) ── */}
                                    <td className="px-4 py-4 sticky left-0 bg-white z-10 shadow-md group-hover:bg-brand-light transition-colors">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-brand-navy text-sm tracking-tight">{eb.name}</span>
                                                {isRowDirty && <span className='w-2 h-2 rounded-full bg-brand-slate/20' title='Modifications non enregistrées'></span>}
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-mint/10 text-brand-mint border border-brand-mint/30">
                                                    <Clock size={10} /> J-{eb.releaseDays}
                                                </span>
                                            </div>

                                            {/* Stay/Booking windows badges */}
                                            <div className="flex flex-wrap gap-1">
                                                {eb.bookingWindowStart && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-brand-mint/10 text-brand-mint border border-brand-mint/30 rounded font-medium">
                                                        📅 Résa: {formatShortDate(eb.bookingWindowStart)} → {formatShortDate(eb.bookingWindowEnd || '')}
                                                    </span>
                                                )}
                                                {eb.isPrepaid && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-brand-slate/10 text-brand-slate border border-brand-slate/30 rounded font-bold">
                                                        <CreditCard size={9} className="inline mr-1" /> PRÉPAYÉ
                                                    </span>
                                                )}
                                            </div>

                                            {eb.applicableContractRooms?.length ? (
                                                <p className="text-[10px] text-brand-slate font-mono truncate max-w-[200px]" title={eb.applicableContractRooms?.map(r => r.contractRoom?.roomType?.code).filter(Boolean).join(', ')}>
                                                    🏨 {eb.applicableContractRooms?.map(r => r.contractRoom?.roomType?.code).filter(Boolean).join(' · ')}
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-brand-slate italic">{t('auto.features.contracts.details.components.earlybookinggrid.0ee9f45d', { defaultValue: "Toutes chambres" })}</p>
                                            )}
                                        </div>
                                    </td>

                                    {/* ── Base ── */}
                                    <td className="px-4 py-4 align-middle">
                                        <div className="flex flex-col">
                                            <span className="font-mono font-bold text-brand-navy text-sm">
                                                {eb.calculationType === 'PERCENTAGE' ? `-${eb.value}%` : `${eb.value} TND`}
                                            </span>
                                            <span className="text-[10px] text-brand-slate font-medium">
                                                {CALC_LABELS[eb.calculationType] || eb.calculationType}
                                                {eb.calculationType === 'FIXED' && ` · ${APP_LABELS[eb.applicationType] ?? eb.applicationType}`}
                                            </span>
                                        </div>
                                    </td>

                                    {/* ── Period cells ── */}
                                    {sortedPeriods.map((period) => (
                                        <td key={period.id} className="p-0 border-l border-brand-slate/20 align-top">
                                            <EarlyBookingCell
                                                ebId={eb.id}
                                                periodId={period.id}
                                                cell={editedMatrix[eb.id]?.[period.id] ?? { active: false, overrideValue: '' }}
                                                baseValue={eb.value}
                                                baseType={eb.calculationType}
                                                onChange={handleCellChange}
                                            />
                                        </td>
                                    ))}

                                    {/* ── Actions ── */}
                                    <td className="px-3 py-4 border-l border-brand-slate/20 text-center align-middle sticky right-0 bg-white group-hover:bg-brand-light transition-colors shadow-md">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onEdit(eb)} className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer" title={t('auto.features.contracts.details.components.earlybookinggrid.title.1b407077', { defaultValue: "Modifier la coquille" })}><Pencil size={12} /></button>
                                            <button onClick={() => onDelete(eb)} disabled={isDeleting} className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50" title={t('auto.features.contracts.details.components.earlybookinggrid.title.03f923a9', { defaultValue: "Supprimer du contrat" })}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Legend ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 bg-brand-light border-t border-brand-slate/20 flex items-center gap-6 text-[10px] text-brand-slate font-medium">
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-slate/10" />
                    Non appliqué
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-mint" />
                    Valeur par défaut héritée
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-mint ring-4 ring-brand-mint" />
                    Valeur surchargée
                </span>
                 <span className="flex items-center gap-2 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-slate/20" />
                    Modification non enregistrée
                </span>
            </div>
        </div>
    );
}
