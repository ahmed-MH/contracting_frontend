import { useState, useCallback, useRef, memo, useEffect, useMemo } from 'react';
import { Save, Pencil, Trash2, Tag, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractReduction } from '../../../catalog/reductions/types/reductions.types';
import type { Period } from '../../../contracts/types/contract.types';
import { contractReductionService } from '../../services/contractReduction.service';
import { isEqual } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import i18next from '../../../../lib/i18n';

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
    const { t } = useTranslation('common');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideValue);

    useEffect(() => {
        setLocalValue(cell.overrideValue);
    }, [cell.overrideValue]);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(reductionId, periodId, patch), 300);
    }, [onChange, reductionId, periodId]);

    const handleToggle = () => onChange(reductionId, periodId, { active: !cell.active });

    const handleValueChange = (val: string) => {
        setLocalValue(val);
        emitChange({ overrideValue: val });
    };

    if (!cell.active) {
        return (
            <div className={`flex items-center justify-between px-3 h-[68px] group/cell transition-colors hover:bg-brand-light bg-brand-light`}>
                <span className="text-[11px] text-brand-slate italic select-none">{t('auto.features.contracts.details.components.reductionsgrid.ba91f984', { defaultValue: "Non appliqué" })}</span>
                <button
                    onClick={handleToggle}
                    title={t('auto.features.contracts.details.components.reductionsgrid.title.a6f5ed53', { defaultValue: "Activer pour cette période" })}
                    className="relative w-8 h-4 rounded-full bg-brand-slate/10 hover:bg-brand-mint/10 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
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
        <div className={`flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell transition-colors hover:bg-brand-mint/10`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-mint uppercase tracking-wider select-none">{t('auto.features.contracts.details.components.reductionsgrid.02f320aa', { defaultValue: "Actif" })}</span>
                <button
                    onClick={handleToggle}
                    title={t('auto.features.contracts.details.components.reductionsgrid.title.9b669364', { defaultValue: "Désactiver pour cette période" })}
                    className="relative w-8 h-4 rounded-full bg-brand-mint hover:bg-brand-slate/20 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
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
                    title={t('auto.features.contracts.details.components.reductionsgrid.title.e2fda476', { defaultValue: "Laisser vide pour hériter de la valeur de base" })}
                    className={`block w-full px-2 py-1 text-xs rounded-xl border text-right transition-all focus:outline-none focus:ring-1 focus:ring-brand-mint focus:border-brand-mint/30 disabled:bg-transparent disabled:border-transparent disabled:text-brand-slate disabled:cursor-default ${localValue !== '' ? 'border-brand-mint/30 text-brand-mint bg-brand-mint/10 font-semibold' : 'border-brand-slate/20 text-brand-slate bg-white'}`}
                />
                {localValue !== '' && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-brand-mint pointer-events-none" />
                )}
            </div>
        </div>
    );
});

// ── ReductionsGrid ────────────────────────────────────────────────────
export default function ReductionsGrid({
    contractId, reductions, periods, onSaved, onEdit, onDelete, isDeleting,
}: Props) {
    const { t } = useTranslation('common');
    void t;
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [initialMatrix, setInitialMatrix] = useState<Matrix>(() => buildInitialMatrix(reductions));
    const [editedMatrix, setEditedMatrix] = useState<Matrix>(initialMatrix);

    useEffect(() => {
        const newMatrix = buildInitialMatrix(reductions);
        setInitialMatrix(newMatrix);
        setEditedMatrix(newMatrix);
    }, [reductions]);

    const [isSaving, setIsSaving] = useState(false);

    const isDirty = useMemo(() => !isEqual(initialMatrix, editedMatrix), [initialMatrix, editedMatrix]);

    const handleCellChange = useCallback((redId: number, periodId: number, patch: Partial<CellData>) => {
        setEditedMatrix((prev) => {
            const currentCell = prev[redId]?.[periodId] ?? { active: false, overrideValue: '' };
            const newMatrix = { ...prev };
            newMatrix[redId] = { ...prev[redId], [periodId]: { ...currentCell, ...patch } };
            return newMatrix;
        });
    }, []);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const modifiedRedIds = Object.keys(editedMatrix)
                .map(Number)
                .filter(redId => !isEqual(initialMatrix[redId], editedMatrix[redId]));

            if (modifiedRedIds.length === 0) {
                toast.info(i18next.t('auto.features.contracts.details.components.reductionsgrid.toast.info.f9e1e563', { defaultValue: "Aucune modification à enregistrer." }));
                return;
            }

            const savePromises = modifiedRedIds.map(redId => {
                const cellMap = editedMatrix[redId] ?? {};
                const payloadPeriods = Object.entries(cellMap)
                    .filter(([, c]) => c.active)
                    .map(([pidStr, c]) => ({
                        periodId: Number(pidStr),
                        overrideValue: c.overrideValue !== '' && !isNaN(Number(c.overrideValue))
                            ? Number(c.overrideValue)
                            : null,
                    }));

                return contractReductionService.update(contractId, redId, {
                    applicablePeriods: payloadPeriods,
                });
            });

            await Promise.all(savePromises);

            setInitialMatrix(editedMatrix);
            onSaved();
            toast.success(`${modifiedRedIds.length} réduction(s) sauvegardée(s)`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setIsSaving(false);
        }
    };

    if (reductions.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-brand-mint rounded-xl overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-b border-brand-mint/30 flex items-center justify-between bg-linear-to-r from-brand-mint to-brand-mint">
                <div className="flex items-center gap-3">
                    <span className="bg-brand-mint p-1 rounded-xl text-white">
                        <Tag size={14} />
                    </span>
                    <span className="text-xs font-bold text-brand-mint uppercase tracking-widest">
                        Matrice de Réductions
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

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-light border-b-2 border-brand-slate/20">
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase sticky left-0 bg-brand-light z-10 shadow-md min-w-[220px]">
                                Réduction
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[130px]">
                                Base Globale
                            </th>
                            {sortedPeriods.map((period) => (
                                <th
                                    key={period.id}
                                    className="px-4 py-3 text-xs font-semibold text-brand-slate min-w-[140px] text-center border-l border-brand-slate/20"
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
                        {reductions.map((reduction) => {
                            const isRowDirty = !isEqual(initialMatrix[reduction.id], editedMatrix[reduction.id]);

                            const roomCodes = (reduction.applicableContractRooms ?? [])
                                .map((r) => r.contractRoom?.roomType?.code ?? r.contractRoom?.roomType?.name)
                                .filter(Boolean);

                            const baseDisplay = reduction.calculationType === 'FREE' ? 'Gratuit'
                                : reduction.calculationType === 'PERCENTAGE' ? `${reduction.value ?? 0} %`
                                    : `${reduction.value ?? 0}`;

                            return (
                                <tr key={reduction.id} className="group hover:bg-brand-light transition-colors">
                                    <td className="px-4 py-4 align-middle sticky left-0 bg-white z-10 shadow-md group-hover:bg-brand-light transition-colors">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-brand-navy text-sm leading-tight">{reduction.name}</span>
                                                    {isRowDirty && <span className='w-2 h-2 rounded-full bg-brand-slate/20' title='Modifications non enregistrées'></span>}
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-mint/10 text-brand-mint leading-none shrink-0 border border-brand-mint/30">
                                                        {reduction.systemCode === 'EXTRA_ADULT' 
                                                            ? `Adulte ${reduction.paxOrder} Suppl.` 
                                                            : reduction.systemCode === 'CHILD' 
                                                                ? `Enfant ${reduction.paxOrder} (${reduction.minAge}-${reduction.maxAge}a)` 
                                                                : 'Standard'}
                                                    </span>
                                                </div>
                                                {roomCodes.length > 0 ? (
                                                    <p className="text-[10px] text-brand-slate mt-0.5 font-mono truncate max-w-[180px]" title={roomCodes.join(', ')}>
                                                        🏨 {roomCodes.join(' · ')}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-brand-slate mt-0.5 italic">{t('auto.features.contracts.details.components.reductionsgrid.bf937af5', { defaultValue: "Toutes chambres" })}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 align-middle">
                                        <span className="block font-mono font-bold text-brand-navy text-sm">
                                            {baseDisplay}
                                        </span>
                                        <span className="block text-[10px] text-brand-slate font-medium">
                                            {TYPE_LABELS[reduction.calculationType] ?? reduction.calculationType}
                                            {reduction.calculationType === 'FIXED' && ` · ${APP_LABELS[reduction.applicationType] ?? reduction.applicationType}`}
                                        </span>
                                    </td>

                                    {sortedPeriods.map((period) => (
                                        <td
                                            key={period.id}
                                            className={`p-0 border-l border-brand-slate/20 align-top`}
                                        >
                                            <ReductionCell
                                                reductionId={reduction.id}
                                                periodId={period.id}
                                                cell={editedMatrix[reduction.id]?.[period.id] ?? { active: false, overrideValue: '' }}
                                                baseValue={reduction.value}
                                                baseType={reduction.calculationType}
                                                onChange={handleCellChange}
                                            />
                                        </td>
                                    ))}

                                    <td className="px-3 py-4 border-l border-brand-slate/20 text-center align-middle sticky right-0 bg-white group-hover:bg-brand-light transition-colors shadow-md">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(reduction)}
                                                className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer"
                                                title={t('auto.features.contracts.details.components.reductionsgrid.title.0904100a', { defaultValue: "Modifier la coquille" })}
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(reduction)}
                                                disabled={isDeleting}
                                                className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50"
                                                title={t('auto.features.contracts.details.components.reductionsgrid.title.6b4ee57b', { defaultValue: "Supprimer du contrat" })}
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

