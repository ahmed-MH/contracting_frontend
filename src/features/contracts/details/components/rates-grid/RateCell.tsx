import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';

export interface CellState {
    isContracted: boolean;
    allotment: number;
    // map: arrangementId -> { amount, minStay, releaseDays }
    prices: Record<number, { amount: string; minStay: string; releaseDays: string }>;
}

interface Props {
    roomId: number;
    periodId: number;
    arrangementId: number;
    currency: string;
    cell: CellState;
    periodDefaultMinStay: string;
    periodDefaultRelease: string;
    onCellUpdate: (roomId: number, periodId: number, patch: Partial<CellState>) => void;
}

const RateCell = memo(function RateCell({
    roomId, periodId, arrangementId, currency,
    cell, periodDefaultMinStay, periodDefaultRelease, onCellUpdate
}: Props) {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingPatchRef = useRef<Partial<CellState> & { prices: any }>({ prices: {} });
    const [showOverride, setShowOverride] = useState(false);

    const priceEntry = cell.prices[arrangementId] ?? { amount: '', minStay: '', releaseDays: '' };

    const [localState, setLocalState] = useState({
        amount: priceEntry.amount,
        minStay: priceEntry.minStay,
        releaseDays: priceEntry.releaseDays,
        allotment: cell.allotment === 0 ? '' : String(cell.allotment),
    });

    useEffect(() => {
        setLocalState({
            amount: priceEntry.amount,
            minStay: priceEntry.minStay,
            releaseDays: priceEntry.releaseDays,
            allotment: cell.allotment === 0 ? '' : String(cell.allotment),
        });
    }, [priceEntry.amount, priceEntry.minStay, priceEntry.releaseDays, cell.allotment]);

    const emitUpdate = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onCellUpdate(roomId, periodId, { ...pendingPatchRef.current });
            pendingPatchRef.current = { prices: {} };
        }, 500);
    }, [onCellUpdate, roomId, periodId]);

    const updatePriceField = (field: keyof typeof priceEntry, val: string) => {
        if (!pendingPatchRef.current.prices[arrangementId]) {
            // Buffer initialises with the latest value from props so we only overwrite the changed field
            pendingPatchRef.current.prices[arrangementId] = { ...priceEntry };
        }
        pendingPatchRef.current.prices[arrangementId][field] = val;
        setLocalState(prev => ({ ...prev, [field]: val }));
        emitUpdate();
    };

    const handleAmountChange = (val: string) => updatePriceField('amount', val);
    const handleMinStayChange = (val: string) => updatePriceField('minStay', val);
    const handleReleaseChange = (val: string) => updatePriceField('releaseDays', val);

    const handleAllotmentChange = (val: string) => {
        pendingPatchRef.current.allotment = Number(val) || 0;
        setLocalState(prev => ({ ...prev, allotment: val }));
        emitUpdate();
    };
    const toggleContracted = () => {
        pendingPatchRef.current.isContracted = !cell.isContracted;
        emitUpdate();
    };

    // Helper: does cell have an explicit override for minStay or release?
    const hasOverride = priceEntry.minStay !== '' || priceEntry.releaseDays !== '';

    if (!cell.isContracted) {
        return (
            <div className="flex items-center justify-between px-4 min-w-[220px] h-[80px] bg-gray-50 opacity-70 transition-opacity hover:opacity-100 group">
                <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-200 shadow-sm">
                    Non contracté
                </span>
                <button
                    onClick={toggleContracted}
                    className="w-8 h-4 rounded-full bg-gray-300 relative transition-colors hover:bg-gray-400 cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Activer cette cellule"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col justify-center px-4 min-w-[220px] h-[80px] group hover:bg-indigo-50/10 transition-colors">

            {/* ── Top-right controls (hover) ──────────────────────── */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 z-10 transition-opacity">
                {/* Override toggle */}
                <button
                    onClick={() => setShowOverride(v => !v)}
                    title={showOverride ? 'Masquer les surcharges' : 'Surcharger Min Stay / Release'}
                    className={`p-1 rounded transition-colors cursor-pointer ${hasOverride || showOverride
                        ? 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
                        : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                >
                    <Settings2 size={13} />
                </button>
                {/* De-contract toggle */}
                <button
                    onClick={toggleContracted}
                    title="Désactiver cette cellule"
                    className="w-8 h-4 rounded-full bg-indigo-500 relative transition-colors hover:bg-indigo-600 cursor-pointer"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm" />
                </button>
            </div>

            {/* ── Row 1: Price & Allotment ────────────────────────── */}
            <div className="flex items-center gap-2 w-full mt-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs font-medium">{currency}</span>
                    </div>
                    <input
                        type="number"
                        min="0"
                        value={localState.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="block w-full pl-9 pr-2 py-1.5 text-sm font-semibold text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm placeholder:text-gray-300 transition-colors"
                        placeholder="0"
                        title="Prix / Nuit"
                    />
                </div>
                <div className="relative w-20 shrink-0">
                    <input
                        type="number"
                        min="0"
                        value={localState.allotment}
                        onChange={(e) => handleAllotmentChange(e.target.value)}
                        className="block w-full pl-2 pr-7 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50/50 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white shadow-sm placeholder:text-gray-300 transition-colors text-right"
                        placeholder="0"
                        title="Allotement"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <span className="text-indigo-400/70 text-[10px] font-semibold">Ch.</span>
                    </div>
                </div>
            </div>

            {/* ── Row 2: Override MinStay & Release (collapsible) ─── */}
            {(showOverride || hasOverride) && (
                <div className="flex items-center gap-2 w-full mt-1.5">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span className="text-blue-400/80 text-[10px] font-medium" title="Minimum Stay">🌙 Min</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={localState.minStay}
                            onChange={(e) => handleMinStayChange(e.target.value)}
                            className="block w-full pl-11 pr-2 py-1 text-xs font-medium text-gray-600 bg-white border border-dashed border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-solid focus:border-indigo-500 placeholder:text-gray-300 transition-all text-right"
                            placeholder={periodDefaultMinStay ? `Hérité : ${periodDefaultMinStay}` : '-'}
                            title="Surcharge Min Stay (laissez vide pour hériter de la période)"
                        />
                    </div>
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span className="text-blue-400/80 text-[10px] font-medium" title="Release Days">⏳ Rel</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={localState.releaseDays}
                            onChange={(e) => handleReleaseChange(e.target.value)}
                            className="block w-full pl-10 pr-2 py-1 text-xs font-medium text-gray-600 bg-white border border-dashed border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-solid focus:border-indigo-500 placeholder:text-gray-300 transition-all text-right"
                            placeholder={periodDefaultRelease ? `Hérité : ${periodDefaultRelease}` : '-'}
                            title="Surcharge Release Days (laissez vide pour hériter de la période)"
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

export default RateCell;
