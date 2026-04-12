import { useState, useCallback, useRef, memo, useEffect, useMemo } from 'react';
import { Save, Pencil, Trash2, CalendarDays, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractSupplement, PeriodOverridePayload } from '../../../catalog/supplements/types/supplements.types';
import type { Period } from '../../../contracts/types/contract.types';
import type { ContractLineData } from '../../services/contract.service';
import { contractSupplementService } from '../../services/contractSupplement.service';
import { isEqual } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import i18next from '../../../../lib/i18n';

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
    return eventMs >= start && eventMs <= end;
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
    const { t } = useTranslation('common');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideValue);

    useEffect(() => {
        setLocalValue(cell.overrideValue);
    }, [cell.overrideValue]);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(suppId, periodId, patch), 300);
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
                bg-brand-light grayscale opacity-60 cursor-not-allowed`} title={t('auto.features.contracts.details.components.supplementsgrid.title.998125aa', { defaultValue: "Réservé à la période de l'évènement" })}>
                <span className="text-[10px] text-brand-slate italic font-medium leading-tight">
                    Hors Période
                </span>
            </div>
        );
    }

    // ── Pre-disabled state (not contracted) ──────────────────────
    if (!isContractedPeriod) {
        return (
            <div className={`flex items-center justify-between px-3 h-[68px] 
                bg-brand-light grayscale opacity-60 cursor-not-allowed`} title={t('auto.features.contracts.details.components.supplementsgrid.title.77926823', { defaultValue: "Chambres cible non contractées sur cette période" })}>
                <span className="text-[10px] text-brand-slate italic font-medium leading-tight">
                    Chambres non actives
                </span>
            </div>
        );
    }

    // ── Inactive state ────────────────────────────────────────────────
    if (!cell.active) {
        return (
            <div className={`flex items-center justify-between px-3 h-[68px] group/cell transition-colors
                hover:bg-brand-light ${isEventCell ? 'bg-brand-mint/10' : 'bg-brand-light'}`}>
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-brand-slate italic select-none">{t('auto.features.contracts.details.components.supplementsgrid.09578b41', { defaultValue: "Non appliqué" })}</span>
                    {isEventCell && (
                        <span className="text-[10px] text-brand-mint font-semibold flex items-center gap-1">
                            <CalendarDays size={10} /> Période de l'évènement
                        </span>
                    )}
                </div>
                <button
                    onClick={handleToggle}
                    title={t('auto.features.contracts.details.components.supplementsgrid.title.f680af63', { defaultValue: "Activer pour cette période" })}
                    className="relative w-8 h-4 rounded-full bg-brand-slate/10 hover:bg-brand-mint/10 transition-colors cursor-pointer
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
            ${isEventCell ? 'hover:bg-brand-mint/10' : 'hover:bg-brand-mint/10'}`}>
            {/* Header row: label + toggle to deactivate */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-brand-mint uppercase tracking-wider select-none">{t('auto.features.contracts.details.components.supplementsgrid.d7c2f25b', { defaultValue: "Actif" })}</span>
                    {isEventCell && (
                        <span className="flex items-center gap-0.5 text-[10px] text-brand-mint font-semibold">
                            <CalendarDays size={10} /> Évènement
                        </span>
                    )}
                </div>
                <button
                    onClick={handleToggle}
                    title={t('auto.features.contracts.details.components.supplementsgrid.title.a6e5ebae', { defaultValue: "Désactiver pour cette période" })}
                    className="relative w-8 h-4 rounded-full bg-brand-mint hover:bg-brand-slate/20 transition-colors cursor-pointer
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
                    title={t('auto.features.contracts.details.components.supplementsgrid.title.3542ed29', { defaultValue: "Laisser vide pour hériter du prix de base" })}
                    className={`block w-full px-2 py-1 text-xs rounded-xl border text-right transition-all
                        focus:outline-none focus:ring-1 focus:ring-brand-mint focus:border-brand-mint/30
                        disabled:bg-transparent disabled:border-transparent disabled:text-brand-slate disabled:cursor-default
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

// ── SupplementsGrid ────────────────────────────────────────────────────
export default function SupplementsGrid({
    contractId, supplements, periods, currency, onSaved, onEdit, onDelete, isDeleting, contractLines,
}: Props) {
    const { t } = useTranslation('common');
    void t;
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [initialMatrix, setInitialMatrix] = useState<Matrix>(() => buildInitialMatrix(supplements));
    const [editedMatrix, setEditedMatrix] = useState<Matrix>(initialMatrix);

    useEffect(() => {
        const newMatrix = buildInitialMatrix(supplements);
        setInitialMatrix(newMatrix);
        setEditedMatrix(newMatrix);
    }, [supplements]);

    const [isSaving, setIsSaving] = useState(false);

    const isDirty = useMemo(() => !isEqual(initialMatrix, editedMatrix), [initialMatrix, editedMatrix]);

    const handleCellChange = useCallback((suppId: number, periodId: number, patch: Partial<CellData>) => {
        setEditedMatrix((prev) => {
            const currentCell = prev[suppId]?.[periodId] ?? { active: false, overrideValue: '' };
            const newMatrix = { ...prev };
            newMatrix[suppId] = { ...prev[suppId], [periodId]: { ...currentCell, ...patch } };
            return newMatrix;
        });
    }, []);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const modifiedSuppIds = Object.keys(editedMatrix)
                .map(Number)
                .filter(suppId => !isEqual(initialMatrix[suppId], editedMatrix[suppId]));

            if (modifiedSuppIds.length === 0) {
                toast.info(i18next.t('auto.features.contracts.details.components.supplementsgrid.toast.info.cd236ebf', { defaultValue: "Aucune modification à enregistrer." }));
                return;
            }

            const savePromises = modifiedSuppIds.map(suppId => {
                const cellMap = editedMatrix[suppId] ?? {};
                const payload: PeriodOverridePayload[] = Object.entries(cellMap)
                    .filter(([, c]) => c.active)
                    .map(([pidStr, c]) => ({
                        periodId: Number(pidStr),
                        overrideValue: c.overrideValue !== '' && !isNaN(Number(c.overrideValue))
                            ? Number(c.overrideValue)
                            : null,
                    }));

                return contractSupplementService.upsertPeriodOverrides(contractId, suppId, payload);
            });

            await Promise.all(savePromises);

            setInitialMatrix(editedMatrix);
            onSaved();
            toast.success(`${modifiedSuppIds.length} supplément(s) sauvegardé(s)`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setIsSaving(false);
        }
    };

    if (supplements.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-brand-mint rounded-xl overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-b border-brand-mint/30 flex items-center justify-between bg-linear-to-r from-brand-mint to-brand-mint">
                <div className="flex items-center gap-3">
                    <span className="bg-brand-mint p-1 rounded-xl text-white">
                        <CalendarDays size={14} />
                    </span>
                    <span className="text-xs font-bold text-brand-mint uppercase tracking-widest">
                        Matrice de Suppléments
                    </span>
                </div>
                <div className='flex items-center gap-4'>
                    <div className="flex items-center gap-2 group cursor-help">
                        <Info size={14} className="text-brand-mint group-hover:text-brand-mint transition-colors" />
                        <span className="text-[10px] text-brand-slate font-medium">
                            Activez par période & surchargez le prix si nécessaire
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

            {/* ── Scrollable table ─────────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-light border-b-2 border-brand-slate/20">
                            {/* Supplement name col (sticky) */}
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase sticky left-0 bg-brand-light z-10 shadow-md min-w-[240px]">
                                Supplément
                            </th>
                            {/* Merged base col */}
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[130px]">
                                Base Globale
                            </th>
                            {/* Dynamic period cols */}
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
                            {/* Actions col */}
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[110px] text-center border-l border-brand-slate/20 sticky right-0 bg-brand-light shadow-md">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-slate/10">
                        {supplements.map((supp) => {
                            const isRowDirty = !isEqual(initialMatrix[supp.id], editedMatrix[supp.id]);

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
                                <tr key={supp.id} className="group hover:bg-brand-light transition-colors">
                                    {/* ── Supplement name (sticky) ── */}
                                    <td className="px-4 py-4 align-middle sticky left-0 bg-white z-10 shadow-md group-hover:bg-brand-light transition-colors">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-brand-navy text-sm leading-tight">{supp.name}</span>
                                                    {isRowDirty && <span className='w-2 h-2 rounded-full bg-brand-slate/20' title='Modifications non enregistrées'></span>}
                                                    {supp.isMandatory && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-slate/10 text-brand-slate leading-none shrink-0 border border-brand-slate/30">
                                                            Obligatoire
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Specific date badge */}
                                                {supp.specificDate && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <CalendarDays size={11} className="text-brand-mint shrink-0" />
                                                        <span className="text-[11px] text-brand-mint font-semibold">
                                                            {formatShortDate(supp.specificDate)}
                                                        </span>
                                                    </div>
                                                )}
                                                {roomCodes.length > 0 ? (
                                                    <p className="text-[10px] text-brand-slate mt-0.5 font-mono truncate max-w-[200px]" title={roomCodes.join(', ')}>
                                                        🏨 {roomCodes.join(' · ')}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-brand-slate mt-0.5 italic">{t('auto.features.contracts.details.components.supplementsgrid.15c47541', { defaultValue: "Toutes chambres" })}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* ── Merged base value ── */}
                                    <td className="px-4 py-4 align-middle">
                                        <span className="block font-mono font-bold text-brand-navy text-sm">
                                            {baseDisplay}
                                        </span>
                                        <span className="block text-[10px] text-brand-slate font-medium">
                                            {TYPE_LABELS[supp.type] ?? supp.type}
                                            {' · '}
                                            {APP_LABELS[supp.applicationType] ?? supp.applicationType}
                                        </span>
                                    </td>

                                    {/* ── Period cells ── */}
                                    {sortedPeriods.map((period) => {
                                        const cellData = editedMatrix[supp.id]?.[period.id] ?? { active: false, overrideValue: '' };
                                        const eventCell = isEventPeriod(supp.specificDate, period);
                                        const isContractedPeriod = hasContractedRoomsInPeriod(supp, period.id, contractLines);
                                        const isDisabledEventPeriod = !!supp.specificDate && !eventCell;

                                        return (
                                            <td
                                                key={period.id}
                                                className={`p-0 border-l border-brand-slate/20 align-top`}
                                            >
                                                <SupplementCell
                                                    suppId={supp.id}
                                                    periodId={period.id}
                                                    cell={cellData}
                                                    baseValue={supp.value}
                                                    baseType={supp.type}
                                                    currency={currency}
                                                    isEventCell={eventCell}
                                                    isContractedPeriod={isContractedPeriod}
                                                    isDisabledEventPeriod={isDisabledEventPeriod}
                                                    onChange={handleCellChange}
                                                />
                                            </td>
                                        );
                                    })}

                                    {/* ── Actions ── */}
                                    <td className="px-3 py-4 border-l border-brand-slate/20 text-center align-middle sticky right-0 bg-white group-hover:bg-brand-light transition-colors shadow-md">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(supp)}
                                                className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer"
                                                title={t('auto.features.contracts.details.components.supplementsgrid.title.c3f4499f', { defaultValue: "Modifier la coquille" })}
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(supp)}
                                                disabled={isDeleting}
                                                className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50"
                                                title={t('auto.features.contracts.details.components.supplementsgrid.title.68c1669f', { defaultValue: "Supprimer du contrat" })}
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

