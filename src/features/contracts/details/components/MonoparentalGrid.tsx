import { useState, useCallback, useRef, memo, useEffect } from 'react';
import { Save, CheckCircle2, Pencil, Trash2, User, Percent, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractMonoparentalRule, BaseRateType, ChildSurchargeBase } from '../../../catalog/monoparental/types/monoparental.types';
import type { Period } from '../../../contracts/types/contract.types';
import { contractMonoparentalService } from '../../services/contractMonoparental.service';

interface Props {
    contractId: number;
    rules: ContractMonoparentalRule[];
    periods: Period[];
    onSaved: () => void;
    onEdit: (r: ContractMonoparentalRule) => void;
    onDelete: (r: ContractMonoparentalRule) => void;
    isDeleting: boolean;
}

interface CellData {
    active: boolean;
    overrideBaseRateType: BaseRateType | '';
    overrideChildSurchargeBase: ChildSurchargeBase | '';
    overrideChildSurchargeValue: string;
}

type Matrix = Record<number, Record<number, CellData>>;

function buildInitialMatrix(rules: ContractMonoparentalRule[]): Matrix {
    const matrix: Matrix = {};
    for (const r of rules) {
        matrix[r.id] = {};
        for (const p of r.applicablePeriods ?? []) {
            if (p.period?.id != null) {
                matrix[r.id][p.period.id] = {
                    active: true,
                    overrideBaseRateType: p.overrideBaseRateType ?? '',
                    overrideChildSurchargeBase: p.overrideChildSurchargeBase ?? '',
                    overrideChildSurchargeValue: p.overrideChildSurchargeValue != null ? String(p.overrideChildSurchargeValue) : '',
                };
            }
        }
    }
    return matrix;
}

const BASE_RATE_LABELS: Record<BaseRateType, string> = {
    SINGLE: 'Single',
    DOUBLE: 'Double',
};

const CHILD_SURCHARGE_BASE_LABELS: Record<ChildSurchargeBase, string> = {
    SINGLE: 'Chambre Single',
    DOUBLE: 'Chambre Double',
    HALF_SINGLE: 'Demi-Single',
    HALF_DOUBLE: 'Demi-Double',
};

// ── MonoparentalCell ─────────────────────────────────────────────────────
interface CellProps {
    ruleId: number;
    periodId: number;
    cell: CellData;
    rule: ContractMonoparentalRule;
    onChange: (ruleId: number, periodId: number, patch: Partial<CellData>) => void;
}

const MonoparentalCell = memo(function MonoparentalCell({
    ruleId, periodId, cell, rule, onChange,
}: CellProps) {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideChildSurchargeValue);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(ruleId, periodId, patch), 400);
    }, [onChange, ruleId, periodId]);

    const handleToggle = () => onChange(ruleId, periodId, { active: !cell.active });

    const handleValueChange = (val: string) => {
        setLocalValue(val);
        emitChange({ overrideChildSurchargeValue: val });
    };

    if (!cell.active) {
        return (
            <div className="flex items-center justify-between px-3 h-[180px] group/cell transition-colors hover:bg-gray-100/60 bg-gray-50/80">
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

    return (
        <div className="flex flex-col p-3 h-[180px] group/cell transition-colors hover:bg-indigo-50/30 gap-3">
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

            <div className="space-y-2.5">
                {/* Override Base Rate */}
                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 uppercase">
                        <User size={10} className="text-gray-400" /> Base
                    </label>
                    <select
                        value={cell.overrideBaseRateType}
                        onChange={(e) => onChange(ruleId, periodId, { overrideBaseRateType: e.target.value as any })}
                        className={`w-full px-2 py-1 text-[11px] rounded-md border transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400 ${cell.overrideBaseRateType ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 font-semibold' : 'border-gray-200 bg-white text-gray-400'}`}
                    >
                        <option value="">{BASE_RATE_LABELS[rule.baseRateType]} (Hérité)</option>
                        <option value="SINGLE">Single</option>
                        <option value="DOUBLE">Double</option>
                    </select>
                </div>

                {/* Override Child Surcharge Value */}
                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 uppercase">
                        <Percent size={10} className="text-gray-400" /> Majoration
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={localValue}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder={`${rule.childSurchargePercentage}% (Hérité)`}
                        className={`w-full px-2 py-1 text-[11px] rounded-md border text-right transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400 ${localValue !== '' ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 font-semibold' : 'border-gray-200 bg-white text-gray-400'}`}
                    />
                </div>

                {/* Override Child Surcharge Base */}
                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 uppercase">
                        <Calculator size={10} className="text-gray-400" /> Sur base
                    </label>
                    <select
                        value={cell.overrideChildSurchargeBase}
                        onChange={(e) => onChange(ruleId, periodId, { overrideChildSurchargeBase: e.target.value as any })}
                        className={`w-full px-2 py-1 text-[11px] rounded-md border transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400 ${cell.overrideChildSurchargeBase ? 'border-indigo-300 bg-indigo-50/50 text-indigo-700 font-semibold' : 'border-gray-200 bg-white text-gray-400'}`}
                    >
                        <option value="">{CHILD_SURCHARGE_BASE_LABELS[rule.childSurchargeBase]} (Hérité)</option>
                        <option value="SINGLE">Chambre Single</option>
                        <option value="DOUBLE">Chambre Double</option>
                        <option value="HALF_SINGLE">Demi-Single</option>
                        <option value="HALF_DOUBLE">Demi-Double</option>
                    </select>
                </div>
            </div>
        </div>
    );
});

// ── MonoparentalGrid ────────────────────────────────────────────────────
export default function MonoparentalGrid({
    contractId, rules, periods, onSaved, onEdit, onDelete, isDeleting,
}: Props) {
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [matrix, setMatrix] = useState<Matrix>(() => buildInitialMatrix(rules));

    useEffect(() => {
        setMatrix(buildInitialMatrix(rules));
    }, [rules]);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

    const handleCellChange = useCallback(
        (suppId: number, periodId: number, patch: Partial<CellData>) => {
            setMatrix((prev) => ({
                ...prev,
                [suppId]: {
                    ...prev[suppId],
                    [periodId]: { ...(prev[suppId]?.[periodId] ?? { active: false, overrideBaseRateType: '', overrideChildSurchargeBase: '', overrideChildSurchargeValue: '' }), ...patch },
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
                        [periodId]: {
                            active: !(existing?.active ?? false),
                            overrideBaseRateType: existing?.overrideBaseRateType ?? '',
                            overrideChildSurchargeBase: existing?.overrideChildSurchargeBase ?? '',
                            overrideChildSurchargeValue: existing?.overrideChildSurchargeValue ?? ''
                        },
                    },
                };
            });
            setSavedIds((prev) => { const n = new Set(prev); n.delete(suppId); return n; });
        },
        [],
    );

    const handleSaveRow = async (rule: ContractMonoparentalRule) => {
        setSavingId(rule.id);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const cellMap = matrix[rule.id] ?? {};
            const payloadPeriods = Object.entries(cellMap)
                .filter(([, c]) => c.active)
                .map(([pidStr, c]) => ({
                    periodId: Number(pidStr),
                    overrideBaseRateType: c.overrideBaseRateType || null,
                    overrideChildSurchargeBase: c.overrideChildSurchargeBase || null,
                    overrideChildSurchargeValue: c.overrideChildSurchargeValue !== '' && !isNaN(Number(c.overrideChildSurchargeValue))
                        ? Number(c.overrideChildSurchargeValue)
                        : null,
                }));

            await contractMonoparentalService.update(contractId, rule.id, {
                applicablePeriods: payloadPeriods,
            });
            setSavedIds((prev) => new Set(prev).add(rule.id));
            onSaved();
            toast.success(`Règle "${rule.name}" sauvegardée`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setSavingId(null);
        }
    };

    if (rules.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-indigo-100 flex items-center gap-3 bg-linear-to-r from-indigo-50/80 to-purple-50/60">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Matrice Saisonnière Avancée
                </span>
                <span className="text-xs text-gray-400">
                    — Surchargez n'importe quel paramètre de la formule selon la saison
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e5e7eb] min-w-[220px]">
                                Règle & Coquille de Base
                            </th>
                            {sortedPeriods.map((period) => (
                                <th
                                    key={period.id}
                                    className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[170px] text-center border-l border-gray-200"
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
                        {rules.map((rule) => {
                            const isSaving = savingId === rule.id;
                            const isSaved = savedIds.has(rule.id);

                            const roomCodes = (rule.applicableContractRooms ?? [])
                                .map((r) => r.contractRoom?.roomType?.code ?? r.contractRoom?.roomType?.name)
                                .filter(Boolean);

                            return (
                                <tr key={rule.id} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="px-4 py-3 align-middle sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e5e7eb]">
                                        <div className="space-y-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-semibold text-gray-900 text-sm leading-tight">{rule.name}</span>
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 leading-none shrink-0">
                                                        {rule.adultCount} Ad + {rule.childCount} Ch ({rule.minAge}-{rule.maxAge}a)
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

                                            {/* Formula Preview */}
                                            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                                    <span>Formule de base</span>
                                                </div>
                                                <div className="text-[11px] leading-tight text-gray-600">
                                                    <span className="font-bold text-gray-900">{BASE_RATE_LABELS[rule.baseRateType]}</span>
                                                    <span className="mx-1">+</span>
                                                    <span className="font-bold text-gray-900">{rule.childSurchargePercentage}%</span>
                                                    <span className="mx-1">de</span>
                                                    <span className="font-bold text-gray-900 truncate block mt-0.5">{CHILD_SURCHARGE_BASE_LABELS[rule.childSurchargeBase]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {sortedPeriods.map((period) => {
                                        const cellData = matrix[rule.id]?.[period.id] ?? { active: false, overrideBaseRateType: '', overrideChildSurchargeBase: '', overrideChildSurchargeValue: '' };
                                        const cellBgClass = !cellData.active ? 'bg-gray-50/60' : '';

                                        return (
                                            <td
                                                key={period.id}
                                                className={`p-0 border-l border-gray-100 align-top ${cellBgClass}`}
                                            >
                                                <MonoparentalCell
                                                    key={`${rule.id}-${period.id}`}
                                                    ruleId={rule.id}
                                                    periodId={period.id}
                                                    cell={cellData}
                                                    rule={rule}
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
                                                    onClick={() => handleSaveRow(rule)}
                                                    disabled={isSaving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer w-full justify-center shadow-sm"
                                                >
                                                    <Save size={11} />
                                                    {isSaving ? '...' : 'Sauver'}
                                                </button>
                                            )}

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onEdit(rule)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                    title="Modifier la coquille"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(rule)}
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

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center flex-wrap gap-x-8 gap-y-2 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    Non appliqué
                </span>
                <span className="flex items-center gap-1.5 font-medium text-indigo-600">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    Actif (Valeurs de base héritées par défaut)
                </span>
                <span className="flex items-center gap-1.5 italic text-gray-400">
                    💡 Modifiez un champ dans une cellule pour surcharger localement la règle.
                </span>
            </div>
        </div>
    );
}
