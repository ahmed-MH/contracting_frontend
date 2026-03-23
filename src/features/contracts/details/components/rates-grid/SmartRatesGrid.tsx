import { useState, useCallback, useEffect } from 'react';
import { Save, Calculator, RefreshCw, PlusCircle, PlusSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { contractService, type ContractLineData, type CellDto } from '../../../services/contract.service';
import { arrangementService } from '../../../../arrangements/services/arrangement.service';
import type { Arrangement } from '../../../../arrangements/types/arrangement.types';
import type { Contract, Period, ContractRoom } from '../../../types/contract.types';
import RateCell, { type CellState } from './RateCell';
import PeriodFormModal from '../../modals/PeriodFormModal';
import ImportContractRoomsModal from '../../modals/ImportContractRoomsModal';
import { useAddPeriod, useDeletePeriod, useDeleteContractRoom } from '../../../hooks/useContracts';
import { useConfirm } from '../../../../../context/ConfirmContext';

// ── Grid state: roomId -> periodId -> CellState
type GridMap = Record<number, Record<number, CellState>>;

// ── Period-level defaults: periodId -> { minStay, releaseDays }
type PeriodDefaults = Record<number, { minStay: string; releaseDays: string }>;

function buildInitialGrid(
    rooms: ContractRoom[],
    periods: Period[],
    lines: ContractLineData[],
): GridMap {
    const grid: GridMap = {};

    for (const room of rooms) {
        grid[room.id] = {};
        for (const period of periods) {
            // Find existing ContractLine for this cell
            const line = lines.find(
                (l) => l.contractRoom.id === room.id && l.period.id === period.id
            );

            const pricesMap: CellState['prices'] = {};
            if (line) {
                for (const p of line.prices) {
                    // Guard: skip if the arrangement was deleted
                    if (!p.arrangement?.id) continue;
                    pricesMap[p.arrangement.id] = {
                        amount: String(p.amount ?? ''),
                        minStay: String(p.minStay ?? ''),
                        releaseDays: String(p.releaseDays ?? ''),
                    };
                }
            }

            grid[room.id][period.id] = {
                isContracted: line ? line.isContracted : true,
                allotment: line ? line.allotment : 0,
                prices: pricesMap,
            };
        }
    }
    return grid;
}

interface Props {
    contract: Contract;
}

export default function SmartRatesGrid({ contract }: Props) {
    const [arrangements, setArrangements] = useState<Arrangement[]>([]);
    const [selectedArrangementId, setSelectedArrangementId] = useState<number | null>(null);
    const [grid, setGrid] = useState<GridMap>({});
    const [periodDefaults, setPeriodDefaults] = useState<PeriodDefaults>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);

    const { confirm } = useConfirm();
    const addPeriodMutation = useAddPeriod(contract.id, () => setShowPeriodModal(false));
    const deletePeriodMutation = useDeletePeriod(contract.id);
    const deleteRoomMutation = useDeleteContractRoom(contract.id);

    const handleDeletePeriod = async (periodId: number, periodName: string) => {
        const ok = await confirm({
            title: 'Supprimer la période',
            description: `Voulez-vous vraiment supprimer la période "${periodName}" ? Cette action est immédiate et irréversible.`,
            confirmLabel: 'Supprimer',
            variant: 'danger',
        });
        if (ok) deletePeriodMutation.mutate(periodId);
    };

    const handleDeleteRoom = async (roomId: number, roomName: string) => {
        const ok = await confirm({
            title: 'Retirer la chambre',
            description: `Voulez-vous vraiment retirer "${roomName}" de cette grille tarifaire ? Ses prix seront perdus.`,
            confirmLabel: 'Retirer',
            variant: 'danger',
        });
        if (ok) deleteRoomMutation.mutate(roomId);
    };

    const sortedPeriods = [...contract.periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // ─── Load data ────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [arrs, lines] = await Promise.all([
                arrangementService.getArrangements(),
                contractService.getContractPrices(contract.id),
            ]);

            let filtered = arrs;
            if (contract.baseArrangement?.id) {
                const baseLevel = arrs.find(a => a.id === contract.baseArrangement!.id)?.level ?? 0;
                filtered = arrs.filter(a => (a.level ?? 0) >= baseLevel);
            }
            filtered.sort((a, b) => (a.level ?? 0) - (b.level ?? 0));

            setArrangements(filtered);
            setSelectedArrangementId(filtered[0]?.id ?? null);
            setGrid(buildInitialGrid(contract.contractRooms, sortedPeriods, lines));
        } catch (error: any) {
            console.error('[SmartRatesGrid] loadData error:', error);
            const msg = error?.response?.data?.message;
            toast.error(
                Array.isArray(msg)
                    ? msg.join(', ')
                    : (msg ?? 'Erreur lors du chargement de la grille tarifaire')
            );
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contract.id]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── Cell Update (from RateCell) ──────────────────────────────────
    const handleCellUpdate = useCallback((roomId: number, periodId: number, patch: Partial<CellState>) => {
        setGrid(prev => {
            const oldCell = prev[roomId]?.[periodId] || { isContracted: true, allotment: 0, prices: {} };
            const newPrices = patch.prices ? { ...oldCell.prices, ...patch.prices } : oldCell.prices;

            return {
                ...prev,
                [roomId]: {
                    ...prev[roomId],
                    [periodId]: { ...oldCell, ...patch, prices: newPrices },
                },
            };
        });
    }, []);

    const handlePeriodDefaultChange = useCallback((periodId: number, field: 'minStay' | 'releaseDays', val: string) => {
        setPeriodDefaults(prev => ({
            ...prev,
            [periodId]: {
                ...prev[periodId],
                [field]: val,
            },
        }));
    }, []);

    // ─── Save ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Flush debounce promises
            await new Promise(resolve => setTimeout(resolve, 500));

            const cells: CellDto[] = [];

            for (const room of contract.contractRooms) {
                for (const period of sortedPeriods) {
                    const cell = grid[room.id]?.[period.id];
                    if (!cell) continue;

                    const priceEntries = Object.entries(cell.prices)
                        .filter(([, v]) => v.amount !== '' && !isNaN(Number(v.amount)))
                        .map(([arrId, v]) => {
                            // Inherit period-level defaults if cell has no explicit override
                            const periodDefault = periodDefaults[period.id] ?? {};
                            const minStayVal = v.minStay !== '' ? Number(v.minStay)
                                : (periodDefault.minStay !== '' && periodDefault.minStay !== undefined)
                                    ? Number(periodDefault.minStay)
                                    : 1;
                            const releaseVal = v.releaseDays !== '' ? Number(v.releaseDays)
                                : (periodDefault.releaseDays !== '' && periodDefault.releaseDays !== undefined)
                                    ? Number(periodDefault.releaseDays)
                                    : 0;
                            return {
                                periodId: period.id,
                                contractRoomId: room.id,
                                arrangementId: Number(arrId),
                                amount: Number(v.amount),
                                minStay: minStayVal,
                                releaseDays: releaseVal,
                            };
                        });

                    const hasPrices = priceEntries.length > 0;
                    const hasAllotment = cell.allotment > 0;
                    const isContracted = cell.isContracted;

                    // Si la cellule est vide (ni prix, ni allotement)
                    // mais qu'elle est "contractée", ça sert à rien de l'envoyer.
                    // On ne l'envoie QUE si elle a de la donnée OU si elle est explicitement Not Contracted.
                    if (!hasPrices && !hasAllotment && isContracted) {
                        continue;
                    }

                    cells.push({
                        periodId: period.id,
                        contractRoomId: room.id,
                        isContracted: cell.isContracted,
                        allotment: cell.allotment,
                        prices: priceEntries,
                    });
                }
            }

            await contractService.batchUpsertPrices(contract.id, { cells });
            toast.success('Grille tarifaire sauvegardée avec succès !');
            // Refresh grid from backend
            const lines = await contractService.getContractPrices(contract.id);
            setGrid(buildInitialGrid(contract.contractRooms, sortedPeriods, lines));
        } catch (error: any) {
            const msg = error?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de la sauvegarde'));
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Loading ──────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }


    return (
        <div className="space-y-6">

            {/* ══ Grille Tarifaire ═══════════════════════════════════════ */}
            <div className="space-y-4">
                {/* ── Toolbar ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-base font-bold text-gray-900">Grille Tarifaire
                            <span className="ml-2 text-xs font-normal text-gray-400">({contract.currency})</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadData}
                            title="Recharger"
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowPeriodModal(true)}
                            className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                            + Période
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder la grille'}
                        </button>
                    </div>
                </div>

                {/* ── Arrangement Tabs ─────────────────────────────────────── */}
                {arrangements.length > 1 && (
                    <div className="flex bg-gray-100 p-1 rounded-lg w-max overflow-x-auto shrink-0 mb-4">
                        {arrangements.map(arr => (
                            <button
                                key={arr.id}
                                onClick={() => setSelectedArrangementId(arr.id)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${selectedArrangementId === arr.id
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {arr.code} — {arr.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Table ────────────────────────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-5 font-bold text-gray-800 text-sm border-r border-gray-100 sticky left-0 z-10 min-w-[200px] w-64 shadow-[1px_0_0_0_#f3f4f6]" style={{ backgroundColor: '#f8f9fa' }}>
                                    Room Type
                                </th>
                                {sortedPeriods.map(period => (
                                    <th key={period.id} className="px-6 py-4 font-semibold border-r border-gray-100 min-w-[220px] align-middle">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-gray-900 font-bold text-[15px]">{period.name}</div>
                                                <div className="text-[11px] text-gray-400 font-medium uppercase mt-1 tracking-wider">
                                                    {new Date(period.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                    {' - '}
                                                    {new Date(period.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeletePeriod(period.id, period.name)}
                                                className="p-1.5 -mr-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                title="Supprimer la période"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                {/* Add Period Column Header */}
                                <th className="px-6 py-4 min-w-[140px] align-middle bg-[#fcfcfd] border-l border-dashed border-gray-200 w-32">
                                    <button
                                        onClick={() => setShowPeriodModal(true)}
                                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer w-full"
                                    >
                                        <PlusCircle size={16} /> Add Period
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contract.contractRooms.map((room, idx) => (
                                <tr key={room.id} className={idx % 2 === 0 ? 'bg-white group/row' : 'bg-[#fafafa] group/row'}>
                                    <td className="px-6 py-4 border-r border-gray-100 sticky left-0 z-10 shadow-[1px_0_0_0_#f3f4f6] align-middle" style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <div className="font-bold text-gray-900 text-[15px]">{room.roomType?.name}</div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    {room.roomType?.code && (
                                                        <span className="inline-flex px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0 shadow-sm border border-gray-200/60">
                                                            {room.roomType.code}
                                                        </span>
                                                    )}
                                                    {room.reference && (
                                                        <span className="text-sm font-medium text-gray-400">{room.reference}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id, room.roomType?.name || 'Cette chambre')}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover/row:opacity-100 cursor-pointer shrink-0"
                                                title="Retirer la chambre"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    {sortedPeriods.map(period => {
                                        const cell = grid[room.id]?.[period.id] ?? {
                                            isContracted: true,
                                            allotment: 0,
                                            prices: {},
                                        };
                                        return (
                                            <td key={period.id} className={`p-0 border-r border-gray-100 min-w-[220px] align-top bg-transparent ${!cell.isContracted ? 'bg-white' : 'hover:bg-blue-50/10'}`}>
                                                {selectedArrangementId && (
                                                    <RateCell
                                                        key={`${room.id}-${period.id}-${selectedArrangementId}`}
                                                        roomId={room.id}
                                                        periodId={period.id}
                                                        arrangementId={selectedArrangementId}
                                                        currency={contract.currency}
                                                        cell={cell}
                                                        periodDefaultMinStay={periodDefaults[period.id]?.minStay ?? ''}
                                                        periodDefaultRelease={periodDefaults[period.id]?.releaseDays ?? ''}
                                                        onCellUpdate={handleCellUpdate}
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                    {/* Empty cell under Add Period */}
                                    <td className="border-l border-dashed border-gray-200 bg-[#fcfcfd]"></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            {/* Period Defaults Row: MinStay & Release */}
                            <tr className="bg-[#fafcff] border-t-2 border-indigo-100">
                                <td className="px-6 py-3 sticky left-0 z-10 bg-[#fafcff] shadow-[1px_0_0_0_#e5e7eb]">
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Défauts Période</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">Min Stay / Release (nuits / jours)</div>
                                </td>
                                {sortedPeriods.map(period => (
                                    <td key={period.id} className="px-4 py-3 border-r border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={periodDefaults[period.id]?.minStay ?? ''}
                                                onChange={(e) => handlePeriodDefaultChange(period.id, 'minStay', e.target.value)}
                                                className="block w-full px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder:text-gray-300 text-right"
                                                placeholder="Min Stay"
                                                title="Min Stay par défaut pour toute la période"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                value={periodDefaults[period.id]?.releaseDays ?? ''}
                                                onChange={(e) => handlePeriodDefaultChange(period.id, 'releaseDays', e.target.value)}
                                                className="block w-full px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder:text-gray-300 text-right"
                                                placeholder="Release"
                                                title="Release Days par défaut pour toute la période"
                                            />
                                        </div>
                                    </td>
                                ))}
                                <td className="bg-[#fcfcfd] border-l border-dashed border-gray-200" />
                            </tr>
                            {/* Add Room Row */}
                            <tr>
                                <td colSpan={sortedPeriods.length + 2} className="px-6 py-4 bg-[#fefefe] border-t border-gray-100">
                                    <button
                                        onClick={() => setShowRoomModal(true)}
                                        className="w-full py-3 flex justify-center items-center gap-2 border border-blue-100 rounded-xl text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors cursor-pointer"
                                    >
                                        <PlusSquare size={16} /> Add Room Category from Master Inventory
                                    </button>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* ── Period Form Modal ────────────────────────────────────── */}
                {showPeriodModal && (
                    <PeriodFormModal
                        isOpen={showPeriodModal}
                        onClose={() => setShowPeriodModal(false)}
                        onSubmit={(data) => addPeriodMutation.mutate({ ...data, contractId: contract.id })}
                        isPending={addPeriodMutation.isPending}
                        contractStartDate={contract.startDate}
                        contractEndDate={contract.endDate}
                        existingPeriods={sortedPeriods}
                        defaultValues={{
                            name: '[Calculé Automatiquement]',
                            startDate: sortedPeriods.length > 0
                                ? new Date(new Date(sortedPeriods[sortedPeriods.length - 1].endDate).getTime() + 86400000).toISOString()
                                : contract.startDate,
                        }}
                    />
                )}

                {/* ── Room Form Modal ────────────────────────────────────── */}
                {showRoomModal && (
                    <ImportContractRoomsModal
                        isOpen={showRoomModal}
                        onClose={() => setShowRoomModal(false)}
                        contractId={contract.id}
                        existingRoomTypeIds={contract.contractRooms.map((cr) => cr.roomType?.id).filter(Boolean) as number[]}
                    />
                )}
            </div>
        </div>
    );
}
