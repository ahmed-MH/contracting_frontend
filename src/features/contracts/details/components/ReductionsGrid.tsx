import { useState, useCallback, useRef, memo, useEffect } from 'react';
import { Save, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractReduction } from '../../../catalog/reductions/types/reductions.types';
import type { Period } from '../../../contracts/types/contract.types';
import { contractReductionService } from '../../services/contractReduction.service';

interface Props {
    contractId: number;
    reductions: ContractReduction[];
    periods: Period[];
    currency?: string;
    onSaved: () => void;
    onEdit: (r: ContractReduction) => void;
    onDelete: (r: ContractReduction) => void;
    isDeleting: boolean;
}

interface CellData {
    active: boolean;
    overrideValue: string;
}

type Matrix = Record<number, Record<number, CellData>>;

function buildInitialMatrix(reductions: ContractReduction[]): Matrix {
    const matrix: Matrix = {};
    for (const r of reductions) {
        matrix[r.id] = {};
        for (const p of r.applicablePeriods ?? []) {
            if (p.period?.id != null) {
                matrix[r.id][p.period.id] = {
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
    FREE: 'Gratuit',
};

const APP_LABELS: Record<string, string> = {
    PER_NIGHT_PER_PERSON: 'Pr pers./nuit',
    PER_NIGHT_PER_ROOM: 'Pr ch./nuit',
    FLAT_RATE_PER_STAY: 'Forfait séjour',
};

// ── ReductionCell ─────────────────────────────────────────────────────
interface CellProps {
    reductionId: number;
    periodId: number;
    cell: CellData;
    baseValue: number | null;
    baseType: string;
    onChange: (reductionId: number, periodId: number, patch: Partial<CellData>) => void;
}

const ReductionCell = memo(function ReductionCell({
    reductionId, periodId, cell, baseValue, baseType, onChange,
}: CellProps) {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideValue);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(reductionId, periodId, patch), 400);
    }, [onChange, reductionId, periodId]);

    const handleToggle = () => onChange(reductionId, periodId, { active: !cell.active });

    const handleValueChange = (val: string) => {
        setLocalValue(val);
        emitChange({ overrideValue: val });
    };

    if (!cell.active) {
        return (
            <div className={`flex items-center justify-between px-3 h-[68px] group/cell transition-colors hover:bg-gray-100/60 bg-gray-50/80`}>
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

    const canEdit = baseType === 'FIXED' || baseType === 'PERCENTAGE';
    const placeholderText = baseType === 'FREE' ? 'Gratuit'
        : baseType === 'PERCENTAGE' ? `Base: ${baseValue ?? 0}%`
            : `Base: ${baseValue ?? 0}`;

    return (
        <div className={`flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell transition-colors hover:bg-indigo-50/30`}>
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
                    type={canEdit ? 'number' : 'text'}
                    min="0"
                    value={localValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    placeholder={placeholderText}
                    disabled={!canEdit}
                    title="Laisser vide pour hériter de la valeur de base"
                    className={`block w-full px-2 py-1 text-xs rounded-md border text-right transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 disabled:bg-transparent disabled:border-transparent disabled:text-gray-400 disabled:cursor-default ${localValue !== '' ? 'border-indigo-300 text-indigo-700 bg-indigo-50/70 font-semibold' : 'border-gray-200 text-gray-400 bg-white'}`}
                />
                {localValue !== '' && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 pointer-events-none" />
                )}
            </div>
        </div>
    );
});

// ── ReductionsGrid ────────────────────────────────────────────────────
export default function ReductionsGrid({
    contractId, reductions, periods, onSaved, onEdit, onDelete, isDeleting,
}: Props) {
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [matrix, setMatrix] = useState<Matrix>(() => buildInitialMatrix(reductions));

    useEffect(() => {
        setMatrix(buildInitialMatrix(reductions));
    }, [reductions]);
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

    const handleSaveRow = async (reduction: ContractReduction) => {
        setSavingId(reduction.id);
        try {
            // Fix race condition: wait for debounce to flush
            await new Promise(resolve => setTimeout(resolve, 500));

            const cellMap = matrix[reduction.id] ?? {};
            const payloadPeriods = Object.entries(cellMap)
                .filter(([, c]) => c.active)
                .map(([pidStr, c]) => ({
                    periodId: Number(pidStr),
                    overrideValue: c.overrideValue !== '' && !isNaN(Number(c.overrideValue))
                        ? Number(c.overrideValue)
                        : null,
                }));

            await contractReductionService.update(contractId, reduction.id, {
                applicablePeriods: payloadPeriods,
            });
            setSavedIds((prev) => new Set(prev).add(reduction.id));
            onSaved();
            toast.success(`Réduction "${reduction.name}" sauvegardée`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setSavingId(null);
        }
    };

    if (reductions.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-indigo-100 flex items-center gap-3 bg-linear-to-r from-indigo-50/80 to-purple-50/60">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Matrice Saisonnière
                </span>
                <span className="text-xs text-gray-400">
                    — Activez / désactivez une réduction par période · Surchargez la valeur de base si besoin
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e5e7eb] min-w-[220px]">
                                Réduction
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[130px]">
                                Base
                            </th>
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
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[110px] text-center border-l border-gray-200">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reductions.map((reduction) => {
                            const isSaving = savingId === reduction.id;
                            const isSaved = savedIds.has(reduction.id);

                            const roomCodes = (reduction.applicableContractRooms ?? [])
                                .map((r) => r.contractRoom?.roomType?.code ?? r.contractRoom?.roomType?.name)
                                .filter(Boolean);

                            const baseDisplay = reduction.calculationType === 'FREE' ? 'Gratuit'
                                : reduction.calculationType === 'PERCENTAGE' ? `${reduction.value ?? 0} %`
                                    : `${reduction.value ?? 0}`;

                            return (
                                <tr key={reduction.id} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="px-4 py-3 align-middle sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e5e7eb]">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-semibold text-gray-900 text-sm leading-tight">{reduction.name}</span>
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 leading-none shrink-0">
                                                        {reduction.systemCode === 'EXTRA_ADULT' 
                                                            ? `Adulte ${reduction.paxOrder} Suppl.` 
                                                            : reduction.systemCode === 'CHILD' 
                                                                ? `Enfant ${reduction.paxOrder} (${reduction.minAge}-${reduction.maxAge}a)` 
                                                                : 'Standard'}
                                                    </span>
                                                </div>
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

                                    <td className="px-4 py-3 align-middle">
                                        <span className="block font-mono font-semibold text-gray-800 text-sm">
                                            {baseDisplay}
                                        </span>
                                        <span className="block text-[11px] text-gray-400 mt-0.5">
                                            {TYPE_LABELS[reduction.calculationType] ?? reduction.calculationType}
                                            {reduction.calculationType === 'FIXED' && ` · ${APP_LABELS[reduction.applicationType] ?? reduction.applicationType}`}
                                        </span>
                                    </td>

                                    {sortedPeriods.map((period) => {
                                        const cellData = matrix[reduction.id]?.[period.id] ?? { active: false, overrideValue: '' };
                                        const cellBgClass = !cellData.active ? 'bg-gray-50/60' : '';

                                        return (
                                            <td
                                                key={period.id}
                                                className={`p-0 border-l border-gray-100 align-top ${cellBgClass}`}
                                            >
                                                <ReductionCell
                                                    key={`${reduction.id}-${period.id}`}
                                                    reductionId={reduction.id}
                                                    periodId={period.id}
                                                    cell={cellData}
                                                    baseValue={reduction.value}
                                                    baseType={reduction.calculationType}
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

                                    <td className="px-3 py-3 border-l border-gray-100 text-center align-middle">
                                        <div className="flex flex-col items-center gap-2">
                                            {isSaved ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                                                    <CheckCircle2 size={13} /> Sauvé
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSaveRow(reduction)}
                                                    disabled={isSaving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer w-full justify-center"
                                                >
                                                    <Save size={11} />
                                                    {isSaving ? '...' : 'Sauver'}
                                                </button>
                                            )}

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onEdit(reduction)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                    title="Modifier la coquille"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(reduction)}
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

            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-5 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    Non appliqué
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    Actif · base héritée
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-200 shrink-0" />
                    Actif · base surchargée
                </span>
            </div>
        </div>
    );
}
