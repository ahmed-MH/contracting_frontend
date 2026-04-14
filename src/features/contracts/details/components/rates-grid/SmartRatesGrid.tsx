import { useState, useCallback, useEffect } from 'react';
import { Save, RefreshCw, PlusCircle, PlusSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { contractService, type ContractLineData, type CellDto } from '../../../services/contract.service';
import { arrangementService } from '../../../../arrangements/services/arrangement.service';
import type { Arrangement } from '../../../../arrangements/types/arrangement.types';
import type { Contract, Period, ContractRoom } from '../../../types/contract.types';
import RateCell, { type CellState } from './RateCell';
import CreatePeriodModal from '../../modals/CreatePeriodModal';
import ImportContractRoomsModal from '../../modals/ImportContractRoomsModal';
import { useAddPeriod, useDeletePeriod, useDeleteContractRoom } from '../../../hooks/useContracts';
import { useConfirm } from '../../../../../context/ConfirmContext';
import { useTranslation } from 'react-i18next';
import i18next from '../../../../../lib/i18n';

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
    const { t } = useTranslation('common');
    void t;
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
            title: t('auto.features.contracts.details.components.rates.grid.smartratesgrid.confirm.deletePeriodTitle', { defaultValue: 'Delete period' }),
            description: t('auto.features.contracts.details.components.rates.grid.smartratesgrid.confirm.deletePeriodDescription', {
                defaultValue: 'Do you really want to delete the period "{{periodName}}"? This action is immediate and cannot be undone.',
                periodName,
            }),
            confirmLabel: t('auto.features.contracts.details.components.rates.grid.smartratesgrid.confirm.delete', { defaultValue: 'Delete' }),
            variant: 'danger',
        });
        if (ok) deletePeriodMutation.mutate(periodId);
    };

    const handleDeleteRoom = async (roomId: number, roomName: string) => {
        const ok = await confirm({
            title: t('auto.features.contracts.details.components.rates.grid.smartratesgrid.confirm.removeRoomTitle', { defaultValue: 'Remove room' }),
            description: t('auto.features.contracts.details.components.rates.grid.smartratesgrid.confirm.removeRoomDescription', {
                defaultValue: 'Do you really want to remove "{{roomName}}" from this rates grid? Its prices will be lost.',
                roomName,
            }),
            confirmLabel: t('auto.features.contracts.details.components.rates.grid.smartratesgrid.confirm.remove', { defaultValue: 'Remove' }),
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
                    : (msg ?? t('auto.features.contracts.details.components.rates.grid.smartratesgrid.loadError', { defaultValue: 'Error while loading the rates grid' }))
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
            toast.success(i18next.t('auto.features.contracts.details.components.rates.grid.smartratesgrid.toast.success.0e9fc8fc', { defaultValue: 'Rates grid saved successfully.' }));
            // Refresh grid from backend
            const lines = await contractService.getContractPrices(contract.id);
            setGrid(buildInitialGrid(contract.contractRooms, sortedPeriods, lines));
        } catch (error: any) {
            const msg = error?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg ?? t('auto.features.contracts.details.components.rates.grid.smartratesgrid.saveError', { defaultValue: 'Error while saving' })));
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Loading ──────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
            </div>
        );
    }


    return (
        <div className="space-y-6">

            {/* ══ Grille Tarifaire ═══════════════════════════════════════ */}
            <div className="space-y-4">
                {/* ── Toolbar ─────────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 rounded-lg border border-brand-slate/10 bg-brand-light/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-brand-light/10 dark:bg-brand-light/5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-brand-slate">
                        <span className="rounded-full border border-brand-slate/15 bg-brand-light px-2.5 py-1 dark:border-brand-light/10 dark:bg-brand-light/5">
                            {contract.currency}
                        </span>
                        <span className="rounded-full border border-brand-slate/15 bg-brand-light px-2.5 py-1 dark:border-brand-light/10 dark:bg-brand-light/5">
                            {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.roomsCount', { defaultValue: '{{count}} rooms', count: contract.contractRooms.length })}
                        </span>
                        <span className="rounded-full border border-brand-slate/15 bg-brand-light px-2.5 py-1 dark:border-brand-light/10 dark:bg-brand-light/5">
                            {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.periodsCount', { defaultValue: '{{count}} periods', count: sortedPeriods.length })}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={loadData}
                            title={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.title.4b61b345', { defaultValue: "Recharger" })}
                            aria-label={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.title.4b61b345', { defaultValue: "Reload" })}
                            className="rounded-lg p-2 text-brand-slate transition-colors hover:bg-brand-mint/10 hover:text-brand-mint"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowPeriodModal(true)}
                            className="rounded-lg bg-brand-mint/10 px-3 py-2 text-sm font-medium text-brand-mint transition-colors hover:bg-brand-mint/15"
                        >
                            {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.addPeriod', { defaultValue: 'Add period' })}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-medium text-brand-light transition-colors hover:bg-brand-mint/90 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving
                                ? t('auto.features.contracts.details.components.rates.grid.smartratesgrid.saving', { defaultValue: 'Saving...' })
                                : t('auto.features.contracts.details.components.rates.grid.smartratesgrid.saveGrid', { defaultValue: 'Save grid' })}
                        </button>
                    </div>
                </div>

                {(sortedPeriods.length === 0 || contract.contractRooms.length === 0) && (
                    <div className="rounded-lg border border-dashed border-brand-slate/20 bg-brand-light/70 px-6 py-8 text-center dark:border-brand-light/10 dark:bg-brand-light/5">
                        <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                            {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.setupTitle', { defaultValue: 'Complete the commercial setup before entering prices' })}
                        </p>
                        <p className="mx-auto mt-1 max-w-2xl text-sm leading-6 text-brand-slate dark:text-brand-light/70">
                            {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.setupDescription', { defaultValue: 'Add at least one contract period and one room category so the grid can create editable price cells.' })}
                        </p>
                        <div className="mt-5 flex flex-wrap justify-center gap-3">
                            {sortedPeriods.length === 0 && (
                                <button
                                    onClick={() => setShowPeriodModal(true)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-brand-mint/20 bg-brand-mint/10 px-4 py-2 text-sm font-semibold text-brand-mint transition-colors hover:bg-brand-mint/15"
                                >
                                    <PlusCircle size={16} /> {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.addPeriod', { defaultValue: 'Add period' })}
                                </button>
                            )}
                            {contract.contractRooms.length === 0 && (
                                <button
                                    onClick={() => setShowRoomModal(true)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-brand-mint/20 bg-brand-mint/10 px-4 py-2 text-sm font-semibold text-brand-mint transition-colors hover:bg-brand-mint/15"
                                >
                                    <PlusSquare size={16} /> {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.addRoomCategory', { defaultValue: 'Add room category' })}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Arrangement Tabs ─────────────────────────────────────── */}
                {arrangements.length > 1 && (
                    <div className="flex w-max shrink-0 overflow-x-auto rounded-lg bg-brand-slate/10 p-1">
                        {arrangements.map(arr => (
                            <button
                                key={arr.id}
                                onClick={() => setSelectedArrangementId(arr.id)}
                                className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${selectedArrangementId === arr.id
                                    ? 'bg-brand-light dark:bg-brand-navy text-brand-mint shadow-sm'
                                    : 'text-brand-slate hover:text-brand-navy'
                                    }`}
                            >
                                {arr.code} - {arr.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Table ────────────────────────────────────────────────── */}
                <div className="contract-matrix-surface overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                        <thead className="bg-brand-light/80 border-b border-brand-slate/10">
                            <tr>
                                <th className="px-6 py-5 font-bold text-brand-navy text-sm border-r border-brand-slate/10 sticky left-0 z-10 min-w-[200px] w-64 shadow-sm" >
                                    {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.roomType', { defaultValue: 'Room type' })}
                                </th>
                                {sortedPeriods.map(period => (
                                    <th key={period.id} className="px-6 py-4 font-semibold border-r border-brand-slate/10 min-w-[220px] align-middle">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-brand-navy font-bold text-[15px]">{period.name}</div>
                                                <div className="text-[11px] text-brand-slate/70 font-medium uppercase mt-1 tracking-wider">
                                                    {new Date(period.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                    {' - '}
                                                    {new Date(period.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeletePeriod(period.id, period.name)}
                                                className="p-1.5 -mr-2 text-brand-slate/45 hover:text-brand-navy hover:bg-brand-slate/10 rounded transition-colors cursor-pointer"
                                                title={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.title.c0957662', { defaultValue: "Delete period" })}
                                                aria-label={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.title.c0957662', { defaultValue: "Delete period" })}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                {/* Add Period Column Header */}
                                <th className="px-6 py-4 min-w-[140px] align-middle bg-brand-light/70 border-l border-dashed border-brand-slate/15 w-32">
                                    <button
                                        onClick={() => setShowPeriodModal(true)}
                                        className="flex items-center gap-2 text-sm font-semibold text-brand-mint hover:text-brand-mint/80 transition-colors cursor-pointer w-full"
                                    >
                                        <PlusCircle size={16} /> {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.addPeriod', { defaultValue: 'Add period' })}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {contract.contractRooms.map((room, idx) => (
                                <tr key={room.id} className={idx % 2 === 0 ? 'bg-brand-light dark:bg-brand-navy group/row' : 'bg-brand-light/60 dark:bg-brand-navy/80 group/row'}>
                                    <td className="px-6 py-4 border-r border-brand-slate/10 sticky left-0 z-10 shadow-sm align-middle" >
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <div className="font-bold text-brand-navy text-[15px]">{room.roomType?.name}</div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    {room.roomType?.code && (
                                                        <span className="inline-flex px-1.5 py-0.5 bg-brand-slate/10 rounded text-[11px] font-bold text-brand-slate uppercase tracking-wider shrink-0 shadow-sm border border-brand-slate/15">
                                                            {room.roomType.code}
                                                        </span>
                                                    )}
                                                    {room.reference && (
                                                        <span className="text-sm font-medium text-brand-slate/70">{room.reference}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id, room.roomType?.name || t('auto.features.contracts.details.components.rates.grid.smartratesgrid.thisRoom', { defaultValue: 'This room' }))}
                                                className="p-1.5 text-brand-slate/45 hover:text-brand-navy hover:bg-brand-slate/10 rounded transition-colors opacity-0 group-hover/row:opacity-100 cursor-pointer shrink-0"
                                                title={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.title.a45947a0', { defaultValue: "Remove room" })}
                                                aria-label={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.title.a45947a0', { defaultValue: "Remove room" })}
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
                                            <td key={period.id} className={`p-0 border-r border-brand-slate/10 min-w-[220px] align-top bg-transparent ${!cell.isContracted ? 'bg-brand-light dark:bg-brand-navy' : 'hover:bg-brand-mint/10'}`}>
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
                                    <td className="border-l border-dashed border-brand-slate/15 bg-brand-light/70"></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            {/* Period Defaults Row: MinStay & Release */}
                            <tr className="bg-brand-mint/5 border-t-2 border-brand-mint/20">
                                <td className="px-6 py-3 sticky left-0 z-10 bg-brand-mint/5 shadow-sm">
                                    <div className="text-[10px] font-bold text-brand-mint uppercase tracking-widest">{t('auto.features.contracts.details.components.rates.grid.smartratesgrid.8711b328', { defaultValue: "Period defaults" })}</div>
                                    <div className="text-[10px] text-brand-slate/70 mt-0.5">{t('auto.features.contracts.details.components.rates.grid.smartratesgrid.f9b3c277', { defaultValue: "Min Stay / Release (nuits / jours)" })}</div>
                                </td>
                                {sortedPeriods.map(period => (
                                    <td key={period.id} className="px-4 py-3 border-r border-brand-slate/10">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={periodDefaults[period.id]?.minStay ?? ''}
                                                onChange={(e) => handlePeriodDefaultChange(period.id, 'minStay', e.target.value)}
                                                className="block w-full px-2 py-1 text-xs font-medium text-brand-navy bg-brand-light dark:bg-brand-navy border border-brand-mint/20 rounded-xl focus:ring-1 focus:ring-brand-mint focus:border-brand-mint placeholder:text-brand-slate/45 text-right"
                                                placeholder={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.placeholder.8ab5b0bc', { defaultValue: "Min Stay" })}
                                                title={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.title.85c0082d', { defaultValue: "Default min stay for the full period" })}
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                value={periodDefaults[period.id]?.releaseDays ?? ''}
                                                onChange={(e) => handlePeriodDefaultChange(period.id, 'releaseDays', e.target.value)}
                                                className="block w-full px-2 py-1 text-xs font-medium text-brand-navy bg-brand-light dark:bg-brand-navy border border-brand-mint/20 rounded-xl focus:ring-1 focus:ring-brand-mint focus:border-brand-mint placeholder:text-brand-slate/45 text-right"
                                                placeholder={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.placeholder.1025cc59', { defaultValue: "Release" })}
                                                title={t('auto.features.contracts.details.components.rates.grid.smartratesgrid.title.f302b4c5', { defaultValue: "Default release days for the full period" })}
                                            />
                                        </div>
                                    </td>
                                ))}
                                <td className="bg-brand-light/70 border-l border-dashed border-brand-slate/15" />
                            </tr>
                            {/* Add Room Row */}
                            <tr>
                                <td colSpan={sortedPeriods.length + 2} className="px-6 py-4 bg-brand-light/70 border-t border-brand-slate/10">
                                    <button
                                        onClick={() => setShowRoomModal(true)}
                                        className="w-full py-3 flex justify-center items-center gap-2 border border-brand-mint/20 rounded-xl text-brand-mint font-semibold text-sm hover:bg-brand-mint/10 transition-colors cursor-pointer"
                                    >
                                        <PlusSquare size={16} /> {t('auto.features.contracts.details.components.rates.grid.smartratesgrid.addRoomFromInventory', { defaultValue: 'Add room category from master inventory' })}
                                    </button>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* ── Period Form Modal ────────────────────────────────────── */}
                {showPeriodModal && (
                    <CreatePeriodModal
                        isOpen={showPeriodModal}
                        onClose={() => setShowPeriodModal(false)}
                        onSubmit={(data) => addPeriodMutation.mutate({ ...data, contractId: contract.id })}
                        isPending={addPeriodMutation.isPending}
                        contractStartDate={contract.startDate}
                        contractEndDate={contract.endDate}
                        existingPeriods={sortedPeriods}
                        defaultValues={{
                            name: t('auto.features.contracts.details.components.rates.grid.smartratesgrid.autoCalculatedName', { defaultValue: '[Calculated automatically]' }),
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
