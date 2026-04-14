import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('common');
    void t;
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
            <div className="flex items-center justify-between px-4 min-w-[220px] h-[80px] bg-brand-light opacity-70 transition-opacity hover:opacity-100 group">
                <span className="inline-flex items-center rounded-xl bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-slate border border-brand-slate/20 shadow-sm">
                    Non contracté
                </span>
                <button
                    type="button"
                    onClick={toggleContracted}
                    className="w-8 h-4 rounded-full bg-brand-slate/10 relative transition-colors hover:bg-brand-slate/10 cursor-pointer opacity-0 group-hover:opacity-100"
                    title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.e6a64ab5', { defaultValue: "Activer cette cellule" })}
                    aria-label={t('auto.features.contracts.details.components.rates.grid.ratecell.title.e6a64ab5', { defaultValue: "Enable this cell" })}
                >
                    <span className="block w-3 h-3 rounded-full bg-brand-light absolute top-0.5 left-0.5 shadow-sm" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col justify-center px-4 min-w-[220px] h-[80px] group hover:bg-brand-mint/10 transition-colors">

            {/* ── Top-right controls (hover) ──────────────────────── */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 z-10 transition-opacity">
                {/* Override toggle */}
                <button
                    type="button"
                    onClick={() => setShowOverride(v => !v)}
                    title={showOverride
                        ? t('auto.features.contracts.details.components.rates.grid.ratecell.hideOverrides', { defaultValue: 'Hide overrides' })
                        : t('auto.features.contracts.details.components.rates.grid.ratecell.showOverrides', { defaultValue: 'Override min stay / release' })}
                    aria-label={showOverride
                        ? t('auto.features.contracts.details.components.rates.grid.ratecell.hideOverrides', { defaultValue: 'Hide overrides' })
                        : t('auto.features.contracts.details.components.rates.grid.ratecell.showOverrides', { defaultValue: 'Override min stay / release' })}
                    className={`p-1 rounded transition-colors cursor-pointer ${hasOverride || showOverride
                        ? 'text-brand-mint bg-brand-mint/10 hover:bg-brand-mint/10'
                        : 'text-brand-slate hover:text-brand-mint hover:bg-brand-mint/10'
                        }`}
                >
                    <Settings2 size={13} />
                </button>
                {/* De-contract toggle */}
                <button
                    type="button"
                    onClick={toggleContracted}
                    title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.9467c3e9', { defaultValue: "Désactiver cette cellule" })}
                    aria-label={t('auto.features.contracts.details.components.rates.grid.ratecell.title.9467c3e9', { defaultValue: "Disable this cell" })}
                    className="w-8 h-4 rounded-full bg-brand-mint relative transition-colors hover:bg-brand-mint cursor-pointer"
                >
                    <span className="block w-3 h-3 rounded-full bg-brand-light absolute top-0.5 right-0.5 shadow-sm" />
                </button>
            </div>

            {/* ── Row 1: Price & Allotment ────────────────────────── */}
            <div className="flex items-center gap-2 w-full mt-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-brand-slate text-xs font-medium">{currency}</span>
                    </div>
                    <input
                        type="number"
                        min="0"
                        value={localState.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="block w-full pl-9 pr-2 py-1.5 text-sm font-semibold text-brand-navy border border-brand-slate/20 rounded-xl focus:ring-1 focus:ring-brand-mint focus:border-brand-mint/30 shadow-sm placeholder:text-brand-slate transition-colors"
                        placeholder="0"
                        title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.5e3ea50e', { defaultValue: "Prix / Nuit" })}
                    />
                </div>
                <div className="relative w-20 shrink-0">
                    <input
                        type="number"
                        min="0"
                        value={localState.allotment}
                        onChange={(e) => handleAllotmentChange(e.target.value)}
                        className="block w-full pl-2 pr-7 py-1.5 text-sm font-medium text-brand-mint bg-brand-mint/10 border border-brand-slate/20 rounded-xl focus:ring-1 focus:ring-brand-mint focus:border-brand-mint/30 focus:bg-brand-light shadow-sm placeholder:text-brand-slate transition-colors text-right"
                        placeholder="0"
                        title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.267b30e9', { defaultValue: "Allotment" })}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <span className="text-brand-mint text-[10px] font-semibold">{t('auto.features.contracts.details.components.rates.grid.ratecell.34f9fd4a', { defaultValue: "Ch." })}</span>
                    </div>
                </div>
            </div>

            {/* ── Row 2: Override MinStay & Release (collapsible) ─── */}
            {(showOverride || hasOverride) && (
                <div className="flex items-center gap-2 w-full mt-1.5">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span className="text-brand-mint text-[10px] font-medium" title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.964f35b8', { defaultValue: "Minimum Stay" })}>{t('auto.features.contracts.details.components.rates.grid.ratecell.d82876f6', { defaultValue: "🌙 Min" })}</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={localState.minStay}
                            onChange={(e) => handleMinStayChange(e.target.value)}
                            className="block w-full pl-11 pr-2 py-1 text-xs font-medium text-brand-slate bg-brand-light border border-dashed border-brand-mint/30 rounded focus:ring-1 focus:ring-brand-mint focus:border-solid focus:border-brand-mint/30 placeholder:text-brand-slate transition-all text-right"
                            placeholder={periodDefaultMinStay ? t('auto.features.contracts.details.components.rates.grid.ratecell.inheritedMin', { defaultValue: 'Inherited: {{value}}', value: periodDefaultMinStay }) : '-'}
                            title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.dfcf1f0e', { defaultValue: "Override min stay (leave empty to inherit from the period)" })}
                        />
                    </div>
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <span className="text-brand-mint text-[10px] font-medium" title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.4731f333', { defaultValue: "Release Days" })}>{t('auto.features.contracts.details.components.rates.grid.ratecell.d2396715', { defaultValue: "⏳ Rel" })}</span>
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={localState.releaseDays}
                            onChange={(e) => handleReleaseChange(e.target.value)}
                            className="block w-full pl-10 pr-2 py-1 text-xs font-medium text-brand-slate bg-brand-light border border-dashed border-brand-mint/30 rounded focus:ring-1 focus:ring-brand-mint focus:border-solid focus:border-brand-mint/30 placeholder:text-brand-slate transition-all text-right"
                            placeholder={periodDefaultRelease ? t('auto.features.contracts.details.components.rates.grid.ratecell.inheritedRelease', { defaultValue: 'Inherited: {{value}}', value: periodDefaultRelease }) : '-'}
                            title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.2483b63e', { defaultValue: "Override release days (leave empty to inherit from the period)" })}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

export default RateCell;
