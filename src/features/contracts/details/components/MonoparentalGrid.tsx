import { useState, useCallback, useRef, memo, useEffect, useMemo } from 'react';
import { Save, Pencil, Trash2, User, Percent, Calculator, Info, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractMonoparentalRule, BaseRateType, ChildSurchargeBase } from '../../../catalog/monoparental/types/monoparental.types';
import type { Period } from '../../../contracts/types/contract.types';
import { contractMonoparentalService } from '../../services/contractMonoparental.service';
import { isEqual } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import i18next from '../../../../lib/i18n';

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
    const { t } = useTranslation('common');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideChildSurchargeValue);

    useEffect(() => {
        setLocalValue(cell.overrideChildSurchargeValue);
    }, [cell.overrideChildSurchargeValue]);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(ruleId, periodId, patch), 300);
    }, [onChange, ruleId, periodId]);

    const handleToggle = () => onChange(ruleId, periodId, { active: !cell.active });

    const handleValueChange = (val: string) => {
        setLocalValue(val);
        emitChange({ overrideChildSurchargeValue: val });
    };

    if (!cell.active) {
        return (
            <div className="flex items-center justify-between px-3 h-[180px] group/cell transition-colors hover:bg-brand-light bg-brand-light">
                <span className="text-[11px] text-brand-slate italic select-none">{t('auto.features.contracts.details.components.monoparentalgrid.a659d759', { defaultValue: "Non appliqué" })}</span>
                <button
                    onClick={handleToggle}
                    title={t('auto.features.contracts.details.components.monoparentalgrid.title.e6413a78', { defaultValue: "Activer pour cette période" })}
                    className="relative w-8 h-4 rounded-full bg-brand-slate/10 hover:bg-brand-mint/10 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm transition-all" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-3 h-[180px] group/cell transition-colors hover:bg-brand-mint/10 gap-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-mint uppercase tracking-wider select-none">{t('auto.features.contracts.details.components.monoparentalgrid.cdcf47d0', { defaultValue: "Actif" })}</span>
                <button
                    onClick={handleToggle}
                    title={t('auto.features.contracts.details.components.monoparentalgrid.title.8dc05cef', { defaultValue: "Désactiver pour cette période" })}
                    className="relative w-8 h-4 rounded-full bg-brand-mint hover:bg-brand-slate/20 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm" />
                </button>
            </div>

            <div className="space-y-2.5">
                {/* Override Base Rate */}
                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-medium text-brand-slate uppercase">
                        <User size={10} className="text-brand-slate" /> Base
                    </label>
                    <select
                        value={cell.overrideBaseRateType}
                        onChange={(e) => onChange(ruleId, periodId, { overrideBaseRateType: e.target.value as any })}
                        className={`w-full px-2 py-1 text-[11px] rounded-xl border transition-all focus:outline-none focus:ring-1 focus:ring-brand-mint ${cell.overrideBaseRateType ? 'border-brand-mint/30 bg-brand-mint/10 text-brand-mint font-semibold' : 'border-brand-slate/20 bg-white text-brand-slate'}`}
                    >
                        <option value="">{BASE_RATE_LABELS[rule.baseRateType]} (Hérité)</option>
                        <option value="SINGLE">{t('auto.features.contracts.details.components.monoparentalgrid.e4b574d1', { defaultValue: "Single" })}</option>
                        <option value="DOUBLE">{t('auto.features.contracts.details.components.monoparentalgrid.7b0ef8d8', { defaultValue: "Double" })}</option>
                    </select>
                </div>

                {/* Override Child Surcharge Value */}
                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-medium text-brand-slate uppercase">
                        <Percent size={10} className="text-brand-slate" /> Majoration
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={localValue}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder={`${rule.childSurchargePercentage}% (Hérité)`}
                        className={`w-full px-2 py-1 text-[11px] rounded-xl border text-right transition-all focus:outline-none focus:ring-1 focus:ring-brand-mint ${localValue !== '' ? 'border-brand-mint/30 bg-brand-mint/10 text-brand-mint font-semibold' : 'border-brand-slate/20 bg-white text-brand-slate'}`}
                    />
                </div>

                {/* Override Child Surcharge Base */}
                <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-medium text-brand-slate uppercase">
                        <Calculator size={10} className="text-brand-slate" /> Sur base
                    </label>
                    <select
                        value={cell.overrideChildSurchargeBase}
                        onChange={(e) => onChange(ruleId, periodId, { overrideChildSurchargeBase: e.target.value as any })}
                        className={`w-full px-2 py-1 text-[11px] rounded-xl border transition-all focus:outline-none focus:ring-1 focus:ring-brand-mint ${cell.overrideChildSurchargeBase ? 'border-brand-mint/30 bg-brand-mint/10 text-brand-mint font-semibold' : 'border-brand-slate/20 bg-white text-brand-slate'}`}
                    >
                        <option value="">{CHILD_SURCHARGE_BASE_LABELS[rule.childSurchargeBase]} (Hérité)</option>
                        <option value="SINGLE">{t('auto.features.contracts.details.components.monoparentalgrid.e196bf28', { defaultValue: "Chambre Single" })}</option>
                        <option value="DOUBLE">{t('auto.features.contracts.details.components.monoparentalgrid.599523ea', { defaultValue: "Chambre Double" })}</option>
                        <option value="HALF_SINGLE">{t('auto.features.contracts.details.components.monoparentalgrid.8a40ccb4', { defaultValue: "Demi-Single" })}</option>
                        <option value="HALF_DOUBLE">{t('auto.features.contracts.details.components.monoparentalgrid.7828cd9d', { defaultValue: "Demi-Double" })}</option>
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
    const { t } = useTranslation('common');
    void t;
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [initialMatrix, setInitialMatrix] = useState<Matrix>(() => buildInitialMatrix(rules));
    const [editedMatrix, setEditedMatrix] = useState<Matrix>(initialMatrix);

    useEffect(() => {
        const newMatrix = buildInitialMatrix(rules);
        setInitialMatrix(newMatrix);
        setEditedMatrix(newMatrix);
    }, [rules]);

    const [isSaving, setIsSaving] = useState(false);

    const isDirty = useMemo(() => !isEqual(initialMatrix, editedMatrix), [initialMatrix, editedMatrix]);

    const handleCellChange = useCallback((ruleId: number, periodId: number, patch: Partial<CellData>) => {
        setEditedMatrix((prev) => {
            const currentCell = prev[ruleId]?.[periodId] ?? { active: false, overrideBaseRateType: '', overrideChildSurchargeBase: '', overrideChildSurchargeValue: '' };
            const newMatrix = { ...prev };
            newMatrix[ruleId] = { ...prev[ruleId], [periodId]: { ...currentCell, ...patch } };
            return newMatrix;
        });
    }, []);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const modifiedRuleIds = Object.keys(editedMatrix)
                .map(Number)
                .filter(ruleId => !isEqual(initialMatrix[ruleId], editedMatrix[ruleId]));

            if (modifiedRuleIds.length === 0) {
                toast.info(i18next.t('auto.features.contracts.details.components.monoparentalgrid.toast.info.0700a39f', { defaultValue: "Aucune modification à enregistrer." }));
                return;
            }

            const savePromises = modifiedRuleIds.map(ruleId => {
                const cellMap = editedMatrix[ruleId] ?? {};
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

                return contractMonoparentalService.update(contractId, ruleId, {
                    applicablePeriods: payloadPeriods,
                });
            });

            await Promise.all(savePromises);

            setInitialMatrix(editedMatrix);
            onSaved();
            toast.success(`${modifiedRuleIds.length} règle(s) monoparentale(s) sauvegardée(s)`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setIsSaving(false);
        }
    };

    if (rules.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-brand-mint rounded-xl overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-b border-brand-mint/30 flex items-center justify-between bg-linear-to-r from-brand-mint to-brand-mint">
                <div className="flex items-center gap-3">
                    <span className="bg-brand-mint p-1 rounded-xl text-white">
                        <Users size={14} />
                    </span>
                    <span className="text-xs font-bold text-brand-mint uppercase tracking-widest">
                        Matrice Monoparentale
                    </span>
                </div>
                <div className='flex items-center gap-4'>
                    <div className="flex items-center gap-2 group cursor-help">
                        <Info size={14} className="text-brand-mint group-hover:text-brand-mint transition-colors" />
                        <span className="text-[10px] text-brand-slate font-medium">
                            Surchargez n'importe quel paramètre selon la saison
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

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-light border-b-2 border-brand-slate/20">
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase sticky left-0 bg-brand-light z-10 shadow-md min-w-[220px]">
                                Règle & Coquille de Base
                            </th>
                            {sortedPeriods.map((period) => (
                                <th
                                    key={period.id}
                                    className="px-4 py-3 text-xs font-semibold text-brand-slate min-w-[170px] text-center border-l border-brand-slate/20"
                                >
                                    <div className="font-bold text-brand-navy">{period.name}</div>
                                    <div className="text-[10px] text-brand-slate font-normal mt-0.5">
                                        {new Date(period.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                        {' – '}
                                        {new Date(period.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </div>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[110px] text-center border-l border-brand-slate/20 sticky right-0 bg-brand-light shadow-md">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-slate/10">
                        {rules.map((rule) => {
                            const isRowDirty = !isEqual(initialMatrix[rule.id], editedMatrix[rule.id]);

                            const roomCodes = (rule.applicableContractRooms ?? [])
                                .map((r) => r.contractRoom?.roomType?.code ?? r.contractRoom?.roomType?.name)
                                .filter(Boolean);

                            return (
                                <tr key={rule.id} className="group hover:bg-brand-light transition-colors">
                                    <td className="px-4 py-4 align-middle sticky left-0 bg-white z-10 shadow-md group-hover:bg-brand-light transition-colors">
                                        <div className="space-y-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-brand-navy text-sm leading-tight">{rule.name}</span>
                                                    {isRowDirty && <span className='w-2 h-2 rounded-full bg-brand-slate/20' title='Modifications non enregistrées'></span>}
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-mint/10 text-brand-mint leading-none shrink-0 border border-brand-mint/30">
                                                        {rule.adultCount} Ad + {rule.childCount} Ch ({rule.minAge}-{rule.maxAge}a)
                                                    </span>
                                                </div>
                                                {roomCodes.length > 0 ? (
                                                    <p className="text-[10px] text-brand-slate mt-0.5 font-mono truncate max-w-[180px]" title={roomCodes.join(', ')}>
                                                        🏨 {roomCodes.join(' · ')}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-brand-slate mt-0.5 italic">{t('auto.features.contracts.details.components.monoparentalgrid.3af84798', { defaultValue: "Toutes chambres" })}</p>
                                                )}
                                            </div>

                                            {/* Formula Preview */}
                                            <div className="p-2 rounded-xl bg-brand-light border border-brand-slate/20 flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-[10px] text-brand-slate font-medium uppercase tracking-tighter">
                                                    <span>{t('auto.features.contracts.details.components.monoparentalgrid.c8ee5f3e', { defaultValue: "Formule de base" })}</span>
                                                </div>
                                                <div className="text-[11px] leading-tight text-brand-slate">
                                                    <span className="font-bold text-brand-navy">{BASE_RATE_LABELS[rule.baseRateType]}</span>
                                                    <span className="mx-1">+</span>
                                                    <span className="font-bold text-brand-navy">{rule.childSurchargePercentage}%</span>
                                                    <span className="mx-1">{t('auto.features.contracts.details.components.monoparentalgrid.435d1958', { defaultValue: "de" })}</span>
                                                    <span className="font-bold text-brand-navy truncate block mt-0.5">{CHILD_SURCHARGE_BASE_LABELS[rule.childSurchargeBase]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {sortedPeriods.map((period) => (
                                        <td
                                            key={period.id}
                                            className={`p-0 border-l border-brand-slate/20 align-top`}
                                        >
                                            <MonoparentalCell
                                                ruleId={rule.id}
                                                periodId={period.id}
                                                cell={editedMatrix[rule.id]?.[period.id] ?? { active: false, overrideBaseRateType: '', overrideChildSurchargeBase: '', overrideChildSurchargeValue: '' }}
                                                rule={rule}
                                                onChange={handleCellChange}
                                            />
                                        </td>
                                    ))}

                                    <td className="px-3 py-4 border-l border-brand-slate/20 text-center align-middle sticky right-0 bg-white group-hover:bg-brand-light transition-colors shadow-md">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(rule)}
                                                className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer"
                                                title={t('auto.features.contracts.details.components.monoparentalgrid.title.1c2903ed', { defaultValue: "Modifier la coquille" })}
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(rule)}
                                                disabled={isDeleting}
                                                className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50"
                                                title={t('auto.features.contracts.details.components.monoparentalgrid.title.a3a309c2', { defaultValue: "Supprimer du contrat" })}
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

            <div className="px-5 py-3 bg-brand-light border-t border-brand-slate/20 flex items-center flex-wrap gap-x-8 gap-y-2 text-[10px] text-brand-slate font-medium">
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

