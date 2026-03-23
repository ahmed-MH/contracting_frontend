import { useState, useCallback, useEffect } from 'react';
import { Save, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractSpo, UpdateContractSpoPayload } from '../../../catalog/spos/types/spos.types';
import type { Period } from '../../../contracts/types/contract.types';
import type { ContractLineData } from '../../services/contract.service';
import { contractSpoService } from '../../services/contractSpo.service';
import SpoCell from './SpoCell';

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
    const sortedPeriods = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    const [matrix, setMatrix] = useState<Matrix>(() => buildInitialMatrix(spos));

    useEffect(() => {
        setMatrix(buildInitialMatrix(spos));
    }, [spos]);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

    const handleCellChange = useCallback(
        (spoId: number, periodId: number, patch: Partial<CellData>) => {
            setMatrix((prev) => ({
                ...prev,
                [spoId]: {
                    ...prev[spoId],
                    [periodId]: { ...(prev[spoId]?.[periodId] ?? { active: false, overrideValue: '' }), ...patch },
                },
            }));
            setSavedIds((prev) => { const n = new Set(prev); n.delete(spoId); return n; });
        },
        [],
    );

    const handleSaveRow = async (spo: ContractSpo) => {
        setSavingId(spo.id);
        try {
            // Anti-race condition delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const cellMap = matrix[spo.id] ?? {};
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

            await contractSpoService.update(contractId, spo.id, payload);
            setSavedIds((prev) => new Set(prev).add(spo.id));
            onSaved();
            toast.success(`Offre "${spo.name}" sauvegardée`);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setSavingId(null);
        }
    };

    if (spos.length === 0) return null;

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden mt-6">
            <div className="px-5 py-3 border-b border-indigo-100 flex items-center gap-3 bg-linear-to-r from-indigo-50/80 to-purple-50/60">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Matrice Saisonnière
                </span>
                <span className="text-xs text-gray-400">
                    — Activez / désactivez une offre par période · Surchargez la remise si besoin
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[240px]">
                                Offre Spéciale
                            </th>
                            <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider min-w-[140px]">
                                Configuration
                            </th>
                            {sortedPeriods.map((period) => (
                                <th key={period.id} className="px-4 py-3 text-center border-l border-gray-100 min-w-[140px]">
                                    <span className="block text-[11px] font-bold text-gray-700 uppercase">{period.name}</span>
                                    <span className="text-[9px] text-gray-400 font-medium uppercase mt-0.5 tracking-tighter">
                                        {new Date(period.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → {new Date(period.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </span>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center border-l border-gray-200 min-w-[120px]">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {spos.map((spo) => {
                            const isSaving = savingId === spo.id;
                            const isSaved = savedIds.has(spo.id);
                            const roomCodes = (spo.applicableContractRooms ?? []).map(r => r.contractRoom?.roomType?.code || '??');
                            const boardCodes = (spo.applicableArrangements ?? []).map(a => a.arrangement?.code || '??');

                            // Effective base value fallback for legacy data
                            const isDiscount = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(spo.benefitType);
                            const effectiveValue = (spo.value && Number(spo.value) !== 0) ? spo.value : (isDiscount ? (spo.benefitValue ?? 0) : spo.value);

                            return (
                                <tr key={spo.id} className="group hover:bg-slate-50/40 transition-colors">
                                    <td className="px-4 py-4 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-bold text-gray-900 text-sm leading-none">{spo.name}</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {roomCodes.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-mono font-bold text-gray-600 border border-gray-200 uppercase">
                                                        🏨 {roomCodes.join(', ')}
                                                    </span>
                                                ) : <span className="text-[10px] text-gray-400 italic">Toutes chambres</span>}
                                                {boardCodes.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-mono font-bold text-amber-600 border border-amber-100 uppercase">
                                                        🍽️ {boardCodes.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">{spo.conditionType}</span>
                                                {spo.conditionValue != null && <span className="text-xs font-mono font-bold text-gray-600">[{spo.conditionValue}]</span>}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase leading-none">
                                                        {BENEFIT_LABELS[spo.benefitType] || spo.benefitType}
                                                    </span>
                                                    <span className="text-xs font-mono font-bold text-gray-900">
                                                        {spo.benefitType === 'FREE_NIGHTS' ? `${spo.stayNights}=${spo.payNights}` : `${effectiveValue}${spo.benefitType === 'FIXED_DISCOUNT' ? ' TND' : '%'}`}
                                                    </span>
                                                </div>
                                                {spo.benefitType === 'FIXED_DISCOUNT' && (
                                                    <span className="text-[9px] text-gray-400 font-medium ml-1">
                                                        ↳ {APP_LABELS[spo.applicationType] ?? spo.applicationType}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {sortedPeriods.map((period) => {
                                        const cellData = matrix[spo.id]?.[period.id] ?? { active: false, overrideValue: '' };
                                        const isContracted = hasContractedRoomsInPeriod(spo, period.id, contractLines);
                                        return (
                                            <td key={period.id} className={`p-0 border-l border-gray-100 ${!isContracted ? 'bg-gray-100/30' : ''}`}>
                                                <SpoCell
                                                    spoId={spo.id}
                                                    periodId={period.id}
                                                    cell={cellData}
                                                    baseValue={effectiveValue}
                                                    benefitType={spo.benefitType}
                                                    stayNights={spo.stayNights}
                                                    payNights={spo.payNights}
                                                    isContractedPeriod={isContracted}
                                                    onChange={(sId, pId, patch) => handleCellChange(sId, pId, patch)}
                                                />
                                            </td>
                                        );
                                    })}

                                    <td className="px-4 py-4 border-l border-gray-100 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            {isSaved ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                                    <CheckCircle2 size={12} /> Sauvé
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSaveRow(spo)}
                                                    disabled={isSaving}
                                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                                                >
                                                    <Save size={12} /> {isSaving ? '...' : 'Sauver'}
                                                </button>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => onEdit(spo)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Modifier la coquille">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => onDelete(spo)} disabled={isDeleting} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50" title="Supprimer l'offre">
                                                    <Trash2 size={14} />
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
                    Actif · valeur surchargée
                </span>
            </div>
        </div>
    );
}
