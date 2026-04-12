import { useState, useCallback, useEffect, useMemo } from 'react';
import { Save, Pencil, Trash2, Gift, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractSpo, UpdateContractSpoPayload } from '../../../catalog/spos/types/spos.types';
import type { Period } from '../../../contracts/types/contract.types';
import type { ContractLineData } from '../../services/contract.service';
import { contractSpoService } from '../../services/contractSpo.service';
import SpoCell from './SpoCell';
import { isEqual } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import i18next from '../../../../lib/i18n';

interface Props {
    contractId: number;
    spos: ContractSpo[];
    periods: Period[];
    onSaved: () => void;
    onEdit: (s: ContractSpo) => void;
    onDelete: (s: ContractSpo) => void;
    isDeleting: boolean;
    contractLines: ContractLineData[];
}

interface CellData {
    active: boolean;
    overrideValue: string;
}
type Matrix = Record<number, Record<number, CellData>>;

const BENEFIT_LABELS: Record<string, string> = {
    PERCENTAGE_DISCOUNT: '% Remise',
    FIXED_DISCOUNT: 'Montant Fixe',
    FREE_NIGHTS: 'Nuits Gratuites',
};

const APP_LABELS: Record<string, string> = {
    PER_NIGHT_PER_PERSON: 'Pr pers./nuit',
    PER_NIGHT_PER_ROOM: 'Pr ch./nuit',
    FLAT_RATE_PER_STAY: 'Forfait séjour',
};

function buildInitialMatrix(spos: ContractSpo[]): Matrix {
    const matrix: Matrix = {};
    for (const s of spos) {
        matrix[s.id] = {};
        for (const ap of s.applicablePeriods ?? []) {
            if (ap.period?.id != null) {
                matrix[s.id][ap.period.id] = {
                    active: true,
                    overrideValue: ap.overrideValue != null ? String(ap.overrideValue) : '',
                };
            }
        }
    }
    return matrix;
}

function hasContractedRoomsInPeriod(
    spo: ContractSpo,
    periodId: number,
    contractLines: ContractLineData[]
): boolean {
    const contractedRoomIds = contractLines
        .filter((l) => l.period.id === periodId && l.isContracted)
        .map((l) => l.contractRoom.id);

    const targetRoomIds = spo.applicableContractRooms?.map((r) => r.contractRoom?.id).filter(Boolean) ?? [];

    if (targetRoomIds.length === 0) return contractedRoomIds.length > 0;
    return targetRoomIds.some((id) => contractedRoomIds.includes(id));
}

export default function SpoGrid({
    contractId, spos, periods, onSaved, onEdit, onDelete, isDeleting, contractLines,
}: Props) {
    const { t } = useTranslation('common');
    void t;
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [initialMatrix, setInitialMatrix] = useState<Matrix>(() => buildInitialMatrix(spos));
    const [editedMatrix, setEditedMatrix] = useState<Matrix>(initialMatrix);

    useEffect(() => {
        const newMatrix = buildInitialMatrix(spos);
        setInitialMatrix(newMatrix);
        setEditedMatrix(newMatrix);
    }, [spos]);

    const [isSaving, setIsSaving] = useState(false);

    const isDirty = useMemo(() => !isEqual(initialMatrix, editedMatrix), [initialMatrix, editedMatrix]);

    const handleCellChange = useCallback((spoId: number, periodId: number, patch: Partial<CellData>) => {
        setEditedMatrix((prev) => {
            const currentCell = prev[spoId]?.[periodId] ?? { active: false, overrideValue: '' };
            const newMatrix = { ...prev };
            newMatrix[spoId] = { ...prev[spoId], [periodId]: { ...currentCell, ...patch } };
            return newMatrix;
        });
    }, []);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const modifiedSpoIds = Object.keys(editedMatrix)
                .map(Number)
                .filter(spoId => !isEqual(initialMatrix[spoId], editedMatrix[spoId]));

            if (modifiedSpoIds.length === 0) {
                toast.info(i18next.t('auto.features.contracts.details.components.spogrid.toast.info.148acb8b', { defaultValue: "Aucune modification à enregistrer." }));
                return;
            }

            const savePromises = modifiedSpoIds.map(spoId => {
                const cellMap = editedMatrix[spoId] ?? {};
                const applicablePeriods = Object.entries(cellMap)
                    .filter(([, c]) => c.active)
                    .map(([pidStr, c]) => ({
                        periodId: Number(pidStr),
                        overrideValue: c.overrideValue !== '' && !isNaN(Number(c.overrideValue))
                            ? Number(c.overrideValue)
                            : null,
                    }));

                const payload: UpdateContractSpoPayload = {
                    applicablePeriods
                };

                return contractSpoService.update(contractId, spoId, payload);
            });

            await Promise.all(savePromises);

            setInitialMatrix(editedMatrix);
            onSaved();
            toast.success(`${modifiedSpoIds.length} offre(s) spéciale(s) sauvegardée(s)`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setIsSaving(false);
        }
    };

    if (spos.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-brand-mint rounded-xl overflow-hidden mt-6">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-b border-brand-mint/30 flex items-center justify-between bg-linear-to-r from-brand-mint to-brand-mint">
                <div className="flex items-center gap-3">
                    <span className="bg-brand-mint p-1 rounded-xl text-white">
                        <Gift size={14} />
                    </span>
                    <span className="text-xs font-bold text-brand-mint uppercase tracking-widest">
                        Matrice d'Offres Spéciales (SPO)
                    </span>
                </div>
                <div className='flex items-center gap-4'>
                    <div className="flex items-center gap-2 group cursor-help">
                        <Info size={14} className="text-brand-mint group-hover:text-brand-mint transition-colors" />
                        <span className="text-[10px] text-brand-slate font-medium">
                            Activez par période & surchargez la remise si nécessaire
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
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase sticky left-0 bg-brand-light z-10 shadow-md min-w-[240px]">
                                Offre Spéciale
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[140px]">
                                Configuration
                            </th>
                            {sortedPeriods.map((period) => (
                                <th key={period.id} className="px-4 py-3 text-center border-l border-brand-slate/20 min-w-[140px]">
                                    <span className="block text-[11px] font-bold text-brand-navy uppercase">{period.name}</span>
                                    <span className="text-[9px] text-brand-slate font-medium uppercase mt-0.5 tracking-tighter">
                                        {new Date(period.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → {new Date(period.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </span>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-xs font-bold text-brand-slate uppercase min-w-[120px] text-center border-l border-brand-slate/20 sticky right-0 bg-brand-light shadow-md">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-slate/10">
                        {spos.map((spo) => {
                            const isRowDirty = !isEqual(initialMatrix[spo.id], editedMatrix[spo.id]);
                            const roomCodes = (spo.applicableContractRooms ?? []).map(r => r.contractRoom?.roomType?.code || '??');
                            const boardCodes = (spo.applicableArrangements ?? []).map(a => a.arrangement?.code || '??');

                            // Effective base value fallback for legacy data
                            const isDiscount = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(spo.benefitType);
                            const effectiveValue = (spo.value && Number(spo.value) !== 0) ? spo.value : (isDiscount ? (spo.benefitValue ?? 0) : spo.value);

                            return (
                                <tr key={spo.id} className="group hover:bg-brand-light transition-colors">
                                    <td className="px-4 py-4 sticky left-0 bg-white z-10 shadow-md group-hover:bg-brand-light transition-colors">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-brand-navy text-sm leading-none">{spo.name}</span>
                                                {isRowDirty && <span className='w-2 h-2 rounded-full bg-brand-slate/20' title='Modifications non enregistrées'></span>}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {roomCodes.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-light text-[10px] font-mono font-bold text-brand-slate border border-brand-slate/20 uppercase">
                                                        🏨 {roomCodes.join(', ')}
                                                    </span>
                                                ) : <span className="text-[10px] text-brand-slate italic">{t('auto.features.contracts.details.components.spogrid.3f2fb0bf', { defaultValue: "Toutes chambres" })}</span>}
                                                {boardCodes.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-slate/10 text-[10px] font-mono font-bold text-brand-slate border border-brand-slate/30 uppercase">
                                                        🍽️ {boardCodes.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-brand-slate bg-brand-slate/10 px-1.5 py-0.5 rounded uppercase">{spo.conditionType}</span>
                                                {spo.conditionValue != null && <span className="text-xs font-mono font-bold text-brand-slate">[{spo.conditionValue}]</span>}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-brand-mint bg-brand-mint/10 px-1.5 py-0.5 rounded uppercase leading-none">
                                                        {BENEFIT_LABELS[spo.benefitType] || spo.benefitType}
                                                    </span>
                                                    <span className="text-xs font-mono font-bold text-brand-navy">
                                                        {spo.benefitType === 'FREE_NIGHTS' ? `${spo.stayNights}=${spo.payNights}` : `${effectiveValue}${spo.benefitType === 'FIXED_DISCOUNT' ? ' TND' : '%'}`}
                                                    </span>
                                                </div>
                                                {spo.benefitType === 'FIXED_DISCOUNT' && (
                                                    <span className="text-[9px] text-brand-slate font-medium ml-1">
                                                        ↳ {APP_LABELS[spo.applicationType] ?? spo.applicationType}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {sortedPeriods.map((period) => {
                                        const cellData = editedMatrix[spo.id]?.[period.id] ?? { active: false, overrideValue: '' };
                                        const isContracted = hasContractedRoomsInPeriod(spo, period.id, contractLines);
                                        return (
                                            <td key={period.id} className={`p-0 border-l border-brand-slate/20 ${!isContracted ? 'bg-brand-light' : ''}`}>
                                                <SpoCell
                                                    spoId={spo.id}
                                                    periodId={period.id}
                                                    cell={cellData}
                                                    baseValue={effectiveValue}
                                                    benefitType={spo.benefitType}
                                                    stayNights={spo.stayNights}
                                                    payNights={spo.payNights}
                                                    isContractedPeriod={isContracted}
                                                    onChange={handleCellChange}
                                                />
                                            </td>
                                        );
                                    })}

                                    <td className="px-4 py-4 border-l border-brand-slate/20 text-center sticky right-0 bg-white group-hover:bg-brand-light transition-colors shadow-md">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onEdit(spo)} className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer" title={t('auto.features.contracts.details.components.spogrid.title.be88e85a', { defaultValue: "Modifier la coquille" })}>
                                                <Pencil size={12} />
                                            </button>
                                            <button onClick={() => onDelete(spo)} disabled={isDeleting} className="p-1 px-1.5 rounded-xl text-brand-slate hover:text-brand-slate hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50" title={t('auto.features.contracts.details.components.spogrid.title.32f0bf50', { defaultValue: "Supprimer l'offre" })}>
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

