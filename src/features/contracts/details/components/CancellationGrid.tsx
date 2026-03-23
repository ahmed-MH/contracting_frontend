import { useState, useCallback, useEffect } from 'react';
import { Save, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractCancellationRule } from '../../../catalog/cancellation/types/cancellation.types';
import type { Period } from '../../../contracts/types/contract.types';
import { useUpdateContractCancellation } from '../../hooks/useContractCancellation';
import CancellationCell from './CancellationCell';

interface CancellationGridProps {
    contractId: number;
    rules: ContractCancellationRule[];
    periods: Period[];
    onSaved: () => void;
    onEdit: (rule: ContractCancellationRule) => void;
    onDelete: (rule: ContractCancellationRule) => void;
    isDeleting: boolean;
}

export default function CancellationGrid({
    contractId,
    rules,
    periods,
    onSaved,
    onEdit,
    onDelete,
    isDeleting,
}: CancellationGridProps) {
    const updateMutation = useUpdateContractCancellation(contractId);

    // ─── Sort periods chronologically (mirror of ReductionsGrid) ──────
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    // ─── Local state ──────────────────────────────────────────────────
    const [gridData, setGridData] = useState<Record<number, { periodId: number; overrideValue: number | null }[]>>(() => {
        const initial: Record<number, { periodId: number; overrideValue: number | null }[]> = {};
        rules.forEach(rule => {
            initial[rule.id] = (rule.applicablePeriods || []).map(ap => ({
                periodId: Number(ap.periodId || ap.period?.id),
                overrideValue: ap.overrideValue !== null ? Number(ap.overrideValue) : null
            })).filter(p => !isNaN(p.periodId));
        });
        return initial;
    });

    useEffect(() => {
        const initial: Record<number, { periodId: number; overrideValue: number | null }[]> = {};
        rules.forEach(rule => {
            initial[rule.id] = (rule.applicablePeriods || []).map(ap => ({
                periodId: Number(ap.periodId || ap.period?.id),
                overrideValue: ap.overrideValue !== null ? Number(ap.overrideValue) : null
            })).filter(p => !isNaN(p.periodId));
        });
        setGridData(initial);
    }, [rules]);

    const [savingId, setSavingId] = useState<number | null>(null);
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

    const handleToggle = useCallback((ruleId: number, periodId: number, active: boolean) => {
        setGridData(prev => {
            const current = [...(prev[ruleId] || [])];
            const pid = Number(periodId);
            if (active) {
                if (!current.find(p => p.periodId === pid)) {
                    current.push({ periodId: pid, overrideValue: null });
                }
            } else {
                return { ...prev, [ruleId]: current.filter(p => p.periodId !== pid) };
            }
            return { ...prev, [ruleId]: current };
        });
        setSavedIds(prev => { const n = new Set(prev); n.delete(ruleId); return n; });
    }, []);

    const handleValueChange = useCallback((ruleId: number, periodId: number, value: number | null) => {
        setGridData(prev => {
            const current = [...(prev[ruleId] || [])];
            const pid = Number(periodId);
            const index = current.findIndex(p => p.periodId === pid);
            if (index !== -1) {
                current[index] = { ...current[index], overrideValue: value !== null ? Number(value) : null };
            }
            return { ...prev, [ruleId]: current };
        });
        setSavedIds(prev => { const n = new Set(prev); n.delete(ruleId); return n; });
    }, []);

    const handleSave = async (rule: ContractCancellationRule) => {
        setSavingId(rule.id);
        try {
            // Fix race condition: wait for debounce to flush
            await new Promise(resolve => setTimeout(resolve, 500));

            const applicablePeriods = (gridData[rule.id] || [])
                .filter(p => p.periodId && !isNaN(p.periodId))
                .map(p => ({
                    periodId: Number(p.periodId),
                    overrideValue: (p.overrideValue !== null && p.overrideValue !== undefined)
                        ? Number(p.overrideValue)
                        : undefined
                }));

            await updateMutation.mutateAsync({
                id: rule.id,
                payload: { applicablePeriods }
            });
            setSavedIds(prev => new Set(prev).add(rule.id));
            onSaved();
            toast.success(`Règle "${rule.name}" sauvegardée`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setSavingId(null);
        }
    };

    const formatPenalty = (value: number, type: string) => {
        switch (type) {
            case 'NIGHTS': return `${value} n`;
            case 'PERCENTAGE': return `${value}%`;
            case 'FIXED_AMOUNT': return `${value} €`;
            default: return `${value}`;
        }
    };

    const PENALTY_LABELS: Record<string, string> = {
        NIGHTS: 'Nuits',
        PERCENTAGE: '%',
        FIXED_AMOUNT: '€',
    };

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden mt-6">
            <div className="px-5 py-3 border-b border-indigo-100 flex items-center gap-3 bg-linear-to-r from-indigo-50/80 to-purple-50/60">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Matrice d'Annulation
                </span>
                <span className="text-xs text-gray-400">
                    — Activez / désactivez une pénalité par période · Surchargez la valeur de base si besoin
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            {/* ─── Col 1 : Politique ──────────────────────── */}
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e5e7eb] min-w-[260px]">
                                Politique d'Annulation
                            </th>
                            {/* ─── Col 2 : Base ───────────────────────────── */}
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[130px]">
                                Base
                            </th>
                            {/* ─── Cols périodes ──────────────────────────── */}
                            {sortedPeriods.map(period => (
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
                            {/* ─── Col Actions ────────────────────────────── */}
                            <th className="px-4 py-3 text-xs font-semibold text-gray-600 min-w-[110px] text-center border-l border-gray-200">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rules.map(rule => {
                            const isSaving = savingId === rule.id;
                            const isSaved = savedIds.has(rule.id);

                            return (
                                <tr key={rule.id} className="hover:bg-slate-50/40 transition-colors">
                                    {/* ─── Cellule description ────────────── */}
                                    <td className="px-4 py-3 align-middle sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e5e7eb]">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-semibold text-gray-900 text-sm leading-tight">{rule.name}</span>
                                                    {!!rule.appliesToNoShow && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 leading-none shrink-0">
                                                            No-Show
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Si annulation ≤{' '}
                                                    <span className="font-semibold text-gray-600">{rule.daysBeforeArrival}j</span>
                                                    {rule.minStayCondition && (
                                                        <span className="ml-1">· Séjour min: {rule.minStayCondition}n</span>
                                                    )}
                                                </p>
                                                {rule.applicableRooms.length > 0 ? (
                                                    <p className="text-[11px] text-gray-400 mt-0.5 font-mono truncate max-w-[200px]"
                                                        title={rule.applicableRooms.map(ar => ar.contractRoom?.roomType?.code).join(', ')}>
                                                        🏨 {rule.applicableRooms.map(ar => ar.contractRoom?.roomType?.code).join(' · ')}
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] text-gray-400 mt-0.5 italic">Toutes chambres</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* ─── Cellule Base ───────────────────── */}
                                    <td className="px-4 py-3 align-middle">
                                        <span className="block font-mono font-semibold text-gray-800 text-sm">
                                            {formatPenalty(rule.baseValue, rule.penaltyType)}
                                        </span>
                                        <span className="block text-[11px] text-gray-400 mt-0.5">
                                            {PENALTY_LABELS[rule.penaltyType] ?? rule.penaltyType}
                                        </span>
                                    </td>

                                    {/* ─── Cellules périodes ──────────────── */}
                                    {sortedPeriods.map(period => {
                                        const appPeriod = (gridData[rule.id] || []).find(p => p.periodId === period.id);
                                        return (
                                            <td
                                                key={period.id}
                                                className={`p-0 border-l border-gray-100 align-top ${!appPeriod ? 'bg-gray-50/60' : ''}`}
                                            >
                                                <CancellationCell
                                                    key={`${rule.id}-${period.id}`}
                                                    isActive={!!appPeriod}
                                                    baseValue={rule.baseValue}
                                                    penaltyType={rule.penaltyType}
                                                    overrideValue={appPeriod?.overrideValue ?? null}
                                                    onToggle={(active) => handleToggle(rule.id, period.id, active)}
                                                    onChange={(val) => handleValueChange(rule.id, period.id, val)}
                                                />
                                            </td>
                                        );
                                    })}

                                    {/* ─── Cellule actions ────────────────── */}
                                    <td className="px-3 py-3 border-l border-gray-100 text-center align-middle">
                                        <div className="flex flex-col items-center gap-2">
                                            {isSaved ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                                                    <CheckCircle2 size={13} /> Sauvé
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSave(rule)}
                                                    disabled={isSaving}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer w-full justify-center"
                                                >
                                                    <Save size={11} />
                                                    {isSaving ? '...' : 'Sauver'}
                                                </button>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onEdit(rule)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                    title="Modifier la règle"
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
