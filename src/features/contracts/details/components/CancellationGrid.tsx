import { useState, useCallback, useEffect, useMemo } from 'react';
import { Save, Pencil, Trash2, ShieldX, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractCancellationRule } from '../../../catalog/cancellation/types/cancellation.types';
import type { Period } from '../../../contracts/types/contract.types';
import { useUpdateContractCancellation } from '../../hooks/useContractCancellation';
import CancellationCell from './CancellationCell';
import { isEqual } from 'lodash-es';
import { useTranslation } from 'react-i18next';

interface CancellationGridProps {
    contractId: number;
    rules: ContractCancellationRule[];
    periods: Period[];
    onSaved: () => void;
    onEdit: (rule: ContractCancellationRule) => void;
    onDelete: (rule: ContractCancellationRule) => void;
    isDeleting: boolean;
}

type GridData = Record<number, { periodId: number; overrideValue: number | null }[]>;

function buildGridData(rules: ContractCancellationRule[]): GridData {
    const initial: GridData = {};
    rules.forEach(rule => {
        initial[rule.id] = (rule.applicablePeriods || []).map(ap => ({
            periodId: Number(ap.periodId || ap.period?.id),
            overrideValue: ap.overrideValue !== null ? Number(ap.overrideValue) : null
        })).filter(p => !isNaN(p.periodId));
    });
    return initial;
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
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';

    const updateMutation = useUpdateContractCancellation(contractId);

    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [initialGridData, setInitialGridData] = useState<GridData>(() => buildGridData(rules));
    const [editedGridData, setEditedGridData] = useState<GridData>(initialGridData);

    useEffect(() => {
        const newData = buildGridData(rules);
        setInitialGridData(newData);
        setEditedGridData(newData);
    }, [rules]);

    const [isSaving, setIsSaving] = useState(false);
    const isDirty = useMemo(() => !isEqual(initialGridData, editedGridData), [initialGridData, editedGridData]);

    const handleToggle = useCallback((ruleId: number, periodId: number, active: boolean) => {
        setEditedGridData(prev => {
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
    }, []);

    const handleValueChange = useCallback((ruleId: number, periodId: number, value: number | null) => {
        setEditedGridData(prev => {
            const current = [...(prev[ruleId] || [])];
            const pid = Number(periodId);
            const index = current.findIndex(p => p.periodId === pid);
            if (index !== -1) {
                current[index] = { ...current[index], overrideValue: value !== null ? Number(value) : null };
            }
            return { ...prev, [ruleId]: current };
        });
    }, []);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const modifiedRuleIds = Object.keys(editedGridData)
                .map(Number)
                .filter(ruleId => !isEqual(initialGridData[ruleId], editedGridData[ruleId]));

            if (modifiedRuleIds.length === 0) {
                toast.info(t('pages.contractDetails.grid.toast.noChanges', { defaultValue: 'No changes to save.' }));
                return;
            }

            const savePromises = modifiedRuleIds.map(ruleId => {
                const applicablePeriods = (editedGridData[ruleId] || [])
                    .filter(p => p.periodId && !isNaN(p.periodId))
                    .map(p => ({
                        periodId: Number(p.periodId),
                        overrideValue: (p.overrideValue !== null && p.overrideValue !== undefined)
                            ? Number(p.overrideValue)
                            : undefined
                    }));

                return updateMutation.mutateAsync({
                    id: ruleId,
                    payload: { applicablePeriods }
                });
            });

            await Promise.all(savePromises);
            setInitialGridData(editedGridData);
            onSaved();
            toast.success(t('pages.contractDetails.grid.toast.savedCancellation', {
                defaultValue: '{{count}} cancellation rule(s) saved',
                count: modifiedRuleIds.length,
            }));
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? t('pages.contractDetails.grid.toast.saveError', { defaultValue: 'Error saving changes' })));
        } finally {
            setIsSaving(false);
        }
    };

    const formatPenalty = (value: number, type: string) => {
        switch (type) {
            case 'NIGHTS': return `${value} ${t('pages.contractDetails.grid.cancellation.nights', { defaultValue: 'N' })}`;
            case 'PERCENTAGE': return `${value}%`;
            case 'FIXED_AMOUNT': return `${value}`;
            default: return `${value}`;
        }
    };

    const getPenaltyLabel = (type: string): string => {
        switch (type) {
            case 'NIGHTS': return t('pages.contractDetails.grid.cancellation.penaltyNights', { defaultValue: 'Nights' });
            case 'PERCENTAGE': return '%';
            case 'FIXED_AMOUNT': return t('pages.contractDetails.grid.cancellation.penaltyAmount', { defaultValue: 'Amount' });
            default: return type;
        }
    };

    return (
        <div className="contract-matrix-surface overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 border-b border-brand-slate/10 bg-brand-light/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-brand-mint/10 p-1.5 text-brand-mint">
                        <ShieldX size={14} />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-navy">
                        {t('pages.contractDetails.grid.cancellationMatrix', { defaultValue: 'Cancellation Matrix' })}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 group cursor-help">
                        <Info size={14} className="text-brand-mint group-hover:text-brand-mint transition-colors" />
                        <span className="text-[10px] text-brand-slate font-medium">
                            {t('pages.contractDetails.grid.hintActivateOverride', { defaultValue: 'Enable per period & override price if needed' })}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={!isDirty || isSaving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-mint px-4 py-2 text-xs font-bold text-brand-light transition-colors hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save size={13} />
                        {isSaving
                            ? t('pages.contractDetails.grid.saving', { defaultValue: 'Saving...' })
                            : t('pages.contractDetails.grid.saveChanges', { defaultValue: 'Save changes' })}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-light border-b-2 border-brand-slate/20">
                            <th scope="col" className="px-4 py-3 text-xs font-bold text-brand-slate uppercase sticky left-0 bg-brand-light z-10 shadow-md min-w-[260px]">
                                {t('pages.contractDetails.grid.col.cancellationPolicy', { defaultValue: 'Cancellation Policy' })}
                            </th>
                            <th scope="col" className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[130px]">
                                {t('pages.contractDetails.grid.col.globalBase', { defaultValue: 'Global base' })}
                            </th>
                            {sortedPeriods.map(period => (
                                <th
                                    key={period.id}
                                    scope="col"
                                    className="px-4 py-3 text-xs font-semibold text-brand-slate min-w-[140px] text-center border-l border-brand-slate/20"
                                >
                                    <div className="font-bold text-brand-navy">{period.name}</div>
                                    <div className="text-[10px] text-brand-slate font-normal mt-0.5">
                                        {new Date(period.startDate).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                                        {' – '}
                                        {new Date(period.endDate).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                                    </div>
                                </th>
                            ))}
                            <th scope="col" className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[110px] text-center border-l border-brand-slate/20 sticky right-0 bg-brand-light shadow-md">
                                {t('pages.contractDetails.grid.col.actions', { defaultValue: 'Actions' })}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-slate/10">
                        {rules.map(rule => {
                            const isRowDirty = !isEqual(initialGridData[rule.id], editedGridData[rule.id]);

                            return (
                                <tr key={rule.id} className="group hover:bg-brand-light transition-colors">
                                    {/* ─── Description cell ───── */}
                                    <td className="px-4 py-4 align-middle sticky left-0 bg-brand-light z-10 shadow-md group-hover:bg-brand-light transition-colors">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-brand-navy text-sm leading-tight">{rule.name}</span>
                                                    {isRowDirty && (
                                                        <span
                                                            className="w-2 h-2 rounded-full bg-brand-slate/20"
                                                            title={t('pages.contractDetails.grid.unsavedChanges', { defaultValue: 'Unsaved changes' })}
                                                        />
                                                    )}
                                                    {!!rule.appliesToNoShow && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-slate/10 text-brand-slate leading-none shrink-0 border border-brand-slate/30">
                                                            {t('pages.contractDetails.grid.cancellation.noShow', { defaultValue: 'No-Show' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-brand-slate mt-0.5 font-medium">
                                                    {t('pages.contractDetails.grid.cancellation.ifCancelledWithin', {
                                                        defaultValue: 'If cancelled ≤ {{days}} days',
                                                        days: rule.daysBeforeArrival,
                                                    })}
                                                    {rule.minStayCondition && (
                                                        <span className="ml-1">
                                                            · {t('pages.contractDetails.grid.cancellation.minStay', {
                                                                defaultValue: 'Min stay: {{n}} nights',
                                                                n: rule.minStayCondition,
                                                            })}
                                                        </span>
                                                    )}
                                                </p>
                                                {rule.applicableRooms.length > 0 ? (
                                                    <p className="text-[10px] text-brand-slate mt-0.5 font-mono truncate max-w-[200px]"
                                                        title={rule.applicableRooms.map(ar => ar.contractRoom?.roomType?.code).join(', ')}>
                                                        🏨 {rule.applicableRooms.map(ar => ar.contractRoom?.roomType?.code).join(' · ')}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-brand-slate mt-0.5 italic">
                                                        {t('pages.contractDetails.grid.allRooms', { defaultValue: 'All rooms' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* ─── Base cell ────────────── */}
                                    <td className="px-4 py-4 align-middle">
                                        <span className="block font-mono font-bold text-brand-navy text-sm">
                                            {formatPenalty(rule.baseValue, rule.penaltyType)}
                                        </span>
                                        <span className="block text-[10px] text-brand-slate font-medium">
                                            {getPenaltyLabel(rule.penaltyType)}
                                        </span>
                                    </td>

                                    {/* ─── Period cells ─────────── */}
                                    {sortedPeriods.map(period => {
                                        const appPeriod = (editedGridData[rule.id] || []).find(p => p.periodId === period.id);
                                        return (
                                            <td
                                                key={period.id}
                                                className="p-0 border-l border-brand-slate/20 align-top"
                                            >
                                                <CancellationCell
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

                                    {/* ─── Actions cell ─────────── */}
                                    <td className="px-3 py-4 border-l border-brand-slate/20 text-center align-middle sticky right-0 bg-brand-light group-hover:bg-brand-light transition-colors shadow-md">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => onEdit(rule)}
                                                className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer"
                                                title={t('pages.contractDetails.grid.editRule', { defaultValue: 'Edit rule' })}
                                                aria-label={t('pages.contractDetails.grid.editRule', { defaultValue: 'Edit rule' })}
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDelete(rule)}
                                                disabled={isDeleting}
                                                className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50"
                                                title={t('pages.contractDetails.grid.removeFromContract', { defaultValue: 'Remove from contract' })}
                                                aria-label={t('pages.contractDetails.grid.removeFromContract', { defaultValue: 'Remove from contract' })}
                                            >
                                                <Trash2 size={12} />
                                            </button>
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
                    {t('pages.contractDetails.grid.legend.notApplied', { defaultValue: 'Not applied' })}
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-mint" />
                    {t('pages.contractDetails.grid.legend.defaultInherited', { defaultValue: 'Default inherited' })}
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-mint ring-4 ring-brand-mint" />
                    {t('pages.contractDetails.grid.legend.overridden', { defaultValue: 'Value overridden' })}
                </span>
                <span className="flex items-center gap-2 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-slate/20" />
                    {t('pages.contractDetails.grid.legend.unsaved', { defaultValue: 'Unsaved change' })}
                </span>
            </div>
        </div>
    );
}
