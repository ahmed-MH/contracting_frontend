import { useState, useCallback, useRef, memo, useEffect } from 'react';
import { Save, CheckCircle2, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractSupplement, PeriodOverridePayload } from '../../../catalog/supplements/types/supplements.types';
import type { Period } from '../../../contracts/types/contract.types';
import type { ContractLineData } from '../../services/contract.service';
import { contractSupplementService } from '../../services/contractSupplement.service';

// ── Types ─────────────────────────────────────────────────────────────
interface Props {
    contractId: number;
    supplements: ContractSupplement[];
    periods: Period[];
    currency: string;
    onSaved: () => void;
    onEdit: (s: ContractSupplement) => void;
    onDelete: (s: ContractSupplement) => void;
    isDeleting: boolean;
    contractLines: ContractLineData[];
}

interface CellData {
    active: boolean;
    overrideValue: string;
}
type Matrix = Record<number, Record<number, CellData>>;

function buildInitialMatrix(supplements: ContractSupplement[]): Matrix {
    const matrix: Matrix = {};
    for (const s of supplements) {
        matrix[s.id] = {};
        for (const p of s.applicablePeriods ?? []) {
            if (p.period?.id != null) {
                matrix[s.id][p.period.id] = {
                    active: true,
                    overrideValue: p.overrideValue != null ? String(p.overrideValue) : '',
                };
            }
        }
    }
    return matrix;
}

const TYPE_LABELS: Record<string, string> = {
    FIXED: 'Fixe',
    PERCENTAGE: '%',
    FORMULA: 'Formule',
    FREE: 'Gratuit',
};

const APP_LABELS: Record<string, string> = {
    PER_NIGHT_PER_PERSON: 'Pr pers./nuit',
    PER_NIGHT_PER_ROOM: 'Pr ch./nuit',
    FLAT_RATE_PER_STAY: 'Forfait séjour',
};

// Helper: does a period contain the supplement's specific event date?
function isEventPeriod(specificDate: string | null, period: { startDate: Date | string; endDate: Date | string }): boolean {
    if (!specificDate) return false;
    const eventMs = new Date(specificDate).getTime();
    const start = new Date(period.startDate).getTime();
    const end = new Date(period.endDate).getTime();
    return eventMs >= start && eventMs < end;
}

function formatShortDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Helper to check if ANY targeted room is actually contracted in the period
function hasContractedRoomsInPeriod(
    supp: ContractSupplement,
    periodId: number,
    contractLines: ContractLineData[]
): boolean {
    // Rooms contracted in this period
    const contractedRoomIds = contractLines
        .filter((l) => l.period.id === periodId && l.isContracted)
        .map((l) => l.contractRoom.id);

    const targetRoomIds = supp.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) ?? [];

    if (targetRoomIds.length === 0) {
        // Global supplement: true if at least one room is contracted in the period
        return contractedRoomIds.length > 0;
    }

    // Specific rooms: true if ANY of the targeted rooms is contracted
    return targetRoomIds.some((id) => contractedRoomIds.includes(id));
}

// ── SupplementCell ─────────────────────────────────────────────────────
interface CellProps {
    suppId: number;
    periodId: number;
    cell: CellData;
    baseValue: number | null;
    baseType: string;
    currency: string;
    isEventCell: boolean;
    isContractedPeriod: boolean; // false if NO target rooms are contracted
    isDisabledEventPeriod: boolean; // true if specificDate exists but this isn't the event period
    onChange: (suppId: number, periodId: number, patch: Partial<CellData>) => void;
}

const SupplementCell = memo(function SupplementCell({
    suppId, periodId, cell, baseValue, baseType, currency, isEventCell, isContractedPeriod, isDisabledEventPeriod, onChange,
}: CellProps) {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideValue);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(suppId, periodId, patch), 400);
    }, [onChange, suppId, periodId]);

    const handleToggle = () => onChange(suppId, periodId, { active: !cell.active });

    const handleValueChange = (val: string) => {
        setLocalValue(val);
        emitChange({ overrideValue: val });
    };

    // ── Pre-disabled state (Event restricted) ──────────────────────
    if (isDisabledEventPeriod) {
        return (
            <div className={`flex items-center justify-between px-3 h-[68px] 
                bg-gray-100/30 grayscale opacity-60 cursor-not-allowed`} title="Réservé à la période de l'évènement">
                <span className="text-[10px] text-gray-400 italic font-medium leading-tight">
                    Hors Période
                </span>
            </div>
        );
    }

    // ── Pre-disabled state (not contracted) ──────────────────────
    if (!isContractedPeriod) {
        return (
            <div className={`flex items-center justify-between px-3 h-[68px] 
                bg-gray-100/50 grayscale opacity-60 cursor-not-allowed`} title="Chambres cible non contractées sur cette période">
                <span className="text-[10px] text-gray-400 italic font-medium leading-tight">
                    Chambres non actives
                </span>
            </div>
        );
    }

    // ── Inactive state ────────────────────────────────────────────────
    if (!cell.active) {
        return (
            <div className={`flex items-center justify-between px-3 h-[68px] group/cell transition-colors
                hover:bg-gray-100/60 ${isEventCell ? 'bg-purple-50/40' : 'bg-gray-50/80'}`}>
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400 italic select-none">Non appliqué</span>
                    {isEventCell && (
                        <span className="text-[10px] text-purple-500 font-semibold flex items-center gap-1">
                            <CalendarDays size={10} /> Période de l'évènement
                        </span>
                    )}
                </div>
                <button
                    onClick={handleToggle}
                    title="Activer pour cette période"
                    className="relative w-8 h-4 rounded-full bg-gray-300 hover:bg-indigo-400 transition-colors cursor-pointer
                               opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm transition-all" />
                </button>
            </div>
        );
    }

    // ── Active state ──────────────────────────────────────────────────
    const canEdit = baseType === 'FIXED' || baseType === 'PERCENTAGE';
    const placeholderText = baseType === 'FREE' ? 'Gratuit'
        : baseType === 'PERCENTAGE' ? `Base: ${baseValue ?? 0}%`
            : `Base: ${baseValue ?? 0} ${currency}`;

    return (
        <div className={`flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell transition-colors
            ${isEventCell ? 'hover:bg-purple-50/40' : 'hover:bg-indigo-50/30'}`}>
            {/* Header row: label + toggle to deactivate */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider select-none">Actif</span>
                    {isEventCell && (
                        <span className="flex items-center gap-0.5 text-[10px] text-purple-600 font-semibold">
                            <CalendarDays size={10} /> Évènement
                        </span>
                    )}
                </div>
                <button
                    onClick={handleToggle}
                    title="Désactiver pour cette période"
                    className="relative w-8 h-4 rounded-full bg-indigo-500 hover:bg-red-400 transition-colors cursor-pointer
                               opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm" />
                </button>
            </div>

            {/* Override value input */}
            <div className="relative">
                <input
                    type={canEdit ? 'number' : 'text'}
                    min="0"
                    value={localValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    placeholder={placeholderText}
                    disabled={!canEdit}
                    title="Laisser vide pour hériter du prix de base"
                    className={`block w-full px-2 py-1 text-xs rounded-md border text-right transition-all
                        focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400
                        disabled:bg-transparent disabled:border-transparent disabled:text-gray-400 disabled:cursor-default
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

// ── SupplementsGrid ────────────────────────────────────────────────────
export default function SupplementsGrid({
    contractId, supplements, periods, currency, onSaved, onEdit, onDelete, isDeleting, contractLines,
}: Props) {
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [matrix, setMatrix] = useState<Matrix>(() => buildInitialMatrix(supplements));

    useEffect(() => {
        setMatrix(buildInitialMatrix(supplements));
    }, [supplements]);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

    const handleCellChange = useCallback(
        (suppId: number, periodId: number, patch: Partial<CellData>) => {
            setMatrix((prev) => ({
                ...prev,
                [suppId]: {
                    ...prev[suppId],
                    [periodId]: { ...(prev[suppId]?.[periodId] ?? { active: false, overrideValue: '' }), ...patch },
                },
            }));
            setSavedIds((prev) => { const n = new Set(prev); n.delete(suppId); return n; });
        },
        [],
    );

    const handleTogglePeriod = useCallback(
        (suppId: number, periodId: number) => {
            setMatrix((prev) => {
                const existing = prev[suppId]?.[periodId];
                return {
                    ...prev,
                    [suppId]: {
                        ...prev[suppId],
                        [periodId]: { active: !(existing?.active ?? false), overrideValue: existing?.overrideValue ?? '' },
                    },
                };
            });
            setSavedIds((prev) => { const n = new Set(prev); n.delete(suppId); return n; });
        },
        [],
    );

    const handleSaveRow = async (supp: ContractSupplement) => {
        setSavingId(supp.id);
        try {
            // Flush debounce promises
            await new Promise(resolve => setTimeout(resolve, 500));

            const cellMap = matrix[supp.id] ?? {};
            const payload: PeriodOverridePayload[] = Object.entries(cellMap)
                .filter(([, c]) => c.active)
                .map(([pidStr, c]) => ({
                    periodId: Number(pidStr),
                    overrideValue: c.overrideValue !== '' && !isNaN(Number(c.overrideValue))
                        ? Number(c.overrideValue)
                        : null,
                }));

            await contractSupplementService.upsertPeriodOverrides(contractId, supp.id, payload);
            setSavedIds((prev) => new Set(prev).add(supp.id));
            onSaved();
            toast.success(`Supplément "${supp.name}" sauvegardé`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setSavingId(null);
        }
    };

    if (supplements.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-b border-indigo-100 flex items-center gap-3 bg-linear-to-r from-indigo-50/80 to-purple-50/60">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Matrice Saisonnière
                </span>
                <span className="text-xs text-gray-400">
                    — Activez / désactivez un supplément par période · Surchargez le prix de base si besoin
                </span>
            </div>

            {/* ── Scrollable table ─────────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            {/* Supplement name col (sticky) */}
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e5e7eb] min-w-[220px]">
                                Supplément
                            </th>
                            {/* Merged base col */}
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[130px]">
                                Base
                            </th>
                            {/* Dynamic period cols */}
                            {sortedPeriods.map((period) => (
                                <th
                                    key={period.id}
                                    className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[130px] text-center border-l border-gray-200"
                                >
                                    <div className="font-bold text-gray-700">{period.name}</div>
                                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                                        {new Date(period.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                        {' – '}
                                        {new Date(period.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </div>
                                </th>
                            ))}
                            {/* Actions col */}
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[110px] text-center border-l border-gray-200">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {supplements.map((supp) => {
                            const isSaving = savingId === supp.id;
                            const isSaved = savedIds.has(supp.id);

                            // Room targeting summary for sub-label
                            const roomCodes = (supp.applicableContractRooms ?? [])
                                .map((r) => r.contractRoom?.roomType?.code ?? r.contractRoom?.roomType?.name)
                                .filter(Boolean);

                            // Base value display
                            const baseDisplay = supp.type === 'FREE' ? 'Gratuit'
                                : supp.type === 'FORMULA' ? supp.formula ?? '—'
                                    : supp.type === 'PERCENTAGE' ? `${supp.value ?? 0} %`
                                        : `${supp.value ?? 0} ${currency}`;

                            return (
                                <tr key={supp.id} className="hover:bg-slate-50/40 transition-colors">
                                    {/* ── Supplement name (sticky) ── */}
                                    <td className="px-4 py-3 align-middle sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e5e7eb]">
                                        {/* ── supplement name sub-label: date badge ── */}
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-semibold text-gray-900 text-sm leading-tight">{supp.name}</span>
                                                    {supp.isMandatory && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 leading-none shrink-0">
                                                            Obligatoire
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Specific date badge */}
                                                {supp.specificDate && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <CalendarDays size={11} className="text-purple-500 shrink-0" />
                                                        <span className="text-[11px] text-purple-600 font-semibold">
                                                            {formatShortDate(supp.specificDate)}
                                                        </span>
                                                    </div>
                                                )}
                                                {roomCodes.length > 0 ? (
                                                    <p className="text-[11px] text-gray-400 mt-0.5 font-mono truncate max-w-[180px]" title={roomCodes.join(', ')}>
                                                        🏨 {roomCodes.join(' · ')}
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] text-gray-400 mt-0.5 italic">Toutes chambres</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* ── Merged base value ── */}
                                    <td className="px-4 py-3 align-middle">
                                        <span className="block font-mono font-semibold text-gray-800 text-sm">
                                            {baseDisplay}
                                        </span>
                                        <span className="block text-[11px] text-gray-400 mt-0.5">
                                            {TYPE_LABELS[supp.type] ?? supp.type}
                                            {' · '}
                                            {APP_LABELS[supp.applicationType] ?? supp.applicationType}
                                        </span>
                                    </td>

                                    {/* ── Period cells ── */}
                                    {sortedPeriods.map((period) => {
                                        const cellData = matrix[supp.id]?.[period.id] ?? { active: false, overrideValue: '' };
                                        const eventCell = isEventPeriod(supp.specificDate, period);
                                        const isContractedPeriod = hasContractedRoomsInPeriod(supp, period.id, contractLines);
                                        const isDisabledEventPeriod = !!supp.specificDate && !eventCell;

                                        // Auto-disable if not contracted, but keep UI aligned
                                        const cellBgClass = isDisabledEventPeriod || !isContractedPeriod
                                            ? 'bg-gray-100/50'
                                            : !cellData.active
                                                ? eventCell ? 'bg-purple-50/30' : 'bg-gray-50/60'
                                                : '';

                                        return (
                                            <td
                                                key={period.id}
                                                className={`p-0 border-l border-gray-100 align-top ${cellBgClass}`}
                                            >
                                                <SupplementCell
                                                    key={`${supp.id}-${period.id}`}
                                                    suppId={supp.id}
                                                    periodId={period.id}
                                                    cell={cellData}
                                                    baseValue={supp.value}
                                                    baseType={supp.type}
                                                    currency={currency}
                                                    isEventCell={eventCell}
                                                    isContractedPeriod={isContractedPeriod}
                                                    isDisabledEventPeriod={isDisabledEventPeriod}
                                                    onChange={(sId, pId, patch) => {
                                                        if ('active' in patch) {
                                                            handleTogglePeriod(sId, pId);
                                                        } else {
                                                            handleCellChange(sId, pId, patch);
                                                        }
                                                    }}
                                                />
                                            </td>
                                        );
                                    })}

                                    {/* ── Actions ── */}
                                    <td className="px-3 py-3 border-l border-gray-100 text-center align-middle">
                                        <div className="flex flex-col items-center gap-2">
                                            {/* Save / Saved */}
                                            {isSaved ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                                                    <CheckCircle2 size={13} /> Sauvé
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSaveRow(supp)}
                                                    disabled={isSaving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer w-full justify-center"
                                                >
                                                    <Save size={11} />
                                                    {isSaving ? '...' : 'Sauver'}
                                                </button>
                                            )}

                                            {/* Edit & Delete */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onEdit(supp)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                    title="Modifier la coquille"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(supp)}
                                                    disabled={isDeleting}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
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
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-5 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    Non appliqué
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    Actif · prix de base hérité
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-200 shrink-0" />
                    Actif · prix saisonnier surchargé
                </span>
            </div>
        </div>
    );
}
