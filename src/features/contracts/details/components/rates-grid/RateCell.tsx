import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingPatchRef = useRef<Partial<CellState> & { prices: any }>({ prices: {} });

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

    if (!cell.isContracted) {
        return (
            <div className="group flex min-h-[112px] min-w-[248px] items-center justify-between gap-3 bg-brand-light/35 px-4 py-4 opacity-75 transition-opacity hover:opacity-100 dark:bg-brand-navy/40">
                <span className="inline-flex items-center whitespace-nowrap rounded-xl border border-brand-slate/20 bg-brand-light px-3 py-1.5 text-xs font-medium text-brand-slate shadow-sm dark:border-brand-light/10 dark:bg-brand-light/10 dark:text-brand-light/70">
                    {t('auto.features.contracts.details.components.rates.grid.ratecell.notContracted', { defaultValue: 'Not contracted' })}
                </span>
                <button
                    type="button"
                    onClick={toggleContracted}
                    className="relative h-4 w-8 shrink-0 rounded-full bg-brand-slate/10 opacity-0 transition-colors hover:bg-brand-slate/10 group-hover:opacity-100 dark:bg-brand-light/15"
                    title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.e6a64ab5', { defaultValue: 'Enable this cell' })}
                    aria-label={t('auto.features.contracts.details.components.rates.grid.ratecell.title.e6a64ab5', { defaultValue: 'Enable this cell' })}
                >
                    <span className="absolute left-0.5 top-0.5 block h-3 w-3 rounded-full bg-brand-light shadow-sm" />
                </button>
            </div>
        );
    }

    return (
        <div className="group flex min-h-[112px] min-w-[248px] flex-col justify-center gap-3 px-4 py-4 transition-colors hover:bg-brand-mint/4 dark:hover:bg-brand-light/4">
            <div className="grid w-full grid-cols-[124px_84px_32px] items-center gap-2">
                <div className="flex min-w-0 items-center overflow-hidden rounded-lg border border-brand-slate/15 bg-brand-light/95 shadow-sm transition-colors focus-within:border-brand-mint/45 focus-within:ring-2 focus-within:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-navy/70">
                    <span className="shrink-0 border-r border-brand-slate/10 px-2.5 text-[11px] font-semibold text-brand-slate/80 dark:border-brand-light/10 dark:text-brand-light/60">{currency}</span>
                    <input
                        type="number"
                        min="0"
                        value={localState.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="block h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-right text-sm font-bold text-brand-navy outline-none placeholder:text-brand-slate/50 transition-colors dark:text-brand-light dark:placeholder:text-brand-light/45"
                        placeholder="0"
                        title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.5e3ea50e', { defaultValue: 'Price per night' })}
                    />
                </div>
                <div className="flex min-w-0 items-center overflow-hidden rounded-lg border border-brand-mint/20 bg-brand-mint/10 shadow-sm transition-colors focus-within:border-brand-mint/45 focus-within:bg-brand-light focus-within:ring-2 focus-within:ring-brand-mint/15 dark:border-brand-mint/25 dark:bg-brand-mint/10 dark:focus-within:bg-brand-navy/70">
                    <input
                        type="number"
                        min="0"
                        value={localState.allotment}
                        onChange={(e) => handleAllotmentChange(e.target.value)}
                        className="block h-10 min-w-0 flex-1 border-0 bg-transparent px-1.5 text-right text-sm font-bold text-brand-mint outline-none placeholder:text-brand-slate/50 transition-colors"
                        placeholder="0"
                        title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.267b30e9', { defaultValue: 'Allotment' })}
                    />
                    <span className="shrink-0 pr-2 text-[10px] font-semibold text-brand-mint">{t('auto.features.contracts.details.components.rates.grid.ratecell.34f9fd4a', { defaultValue: 'Ch.' })}</span>
                </div>
                <div className="flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                        type="button"
                        onClick={toggleContracted}
                        title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.9467c3e9', { defaultValue: 'Disable this cell' })}
                        aria-label={t('auto.features.contracts.details.components.rates.grid.ratecell.title.9467c3e9', { defaultValue: 'Disable this cell' })}
                        className="relative h-4 w-8 rounded-full bg-brand-mint transition-colors hover:bg-brand-mint/90"
                    >
                        <span className="absolute right-0.5 top-0.5 block h-3 w-3 rounded-full bg-brand-light shadow-sm" />
                    </button>
                </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
                    <label className="min-w-0 space-y-1">
                        <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-brand-mint" title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.964f35b8', { defaultValue: 'Minimum stay' })}>
                            {t('auto.features.contracts.details.components.rates.grid.ratecell.d82876f6', { defaultValue: 'Min' })}
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={localState.minStay}
                            onChange={(e) => handleMinStayChange(e.target.value)}
                            className="block h-8 w-full rounded-lg border border-dashed border-brand-mint/30 bg-brand-light/80 px-2 text-right text-xs font-medium text-brand-slate transition-all placeholder:text-brand-slate/45 focus:border-brand-mint/40 focus:border-solid focus:ring-2 focus:ring-brand-mint/15 dark:bg-brand-navy/60 dark:text-brand-light dark:placeholder:text-brand-light/40"
                            placeholder={periodDefaultMinStay ? t('auto.features.contracts.details.components.rates.grid.ratecell.inheritedMin', { defaultValue: 'Inherited: {{value}}', value: periodDefaultMinStay }) : '-'}
                            title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.dfcf1f0e', { defaultValue: 'Override min stay (leave empty to inherit from the period)' })}
                        />
                    </label>
                    <label className="min-w-0 space-y-1">
                        <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-brand-mint" title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.4731f333', { defaultValue: 'Release deadline' })}>
                            {t('auto.features.contracts.details.components.rates.grid.ratecell.d2396715', { defaultValue: 'Rel.' })}
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={localState.releaseDays}
                            onChange={(e) => handleReleaseChange(e.target.value)}
                            className="block h-8 w-full rounded-lg border border-dashed border-brand-mint/30 bg-brand-light/80 px-2 text-right text-xs font-medium text-brand-slate transition-all placeholder:text-brand-slate/45 focus:border-brand-mint/40 focus:border-solid focus:ring-2 focus:ring-brand-mint/15 dark:bg-brand-navy/60 dark:text-brand-light dark:placeholder:text-brand-light/40"
                            placeholder={periodDefaultRelease ? t('auto.features.contracts.details.components.rates.grid.ratecell.inheritedRelease', { defaultValue: 'Inherited: {{value}}', value: periodDefaultRelease }) : '-'}
                            title={t('auto.features.contracts.details.components.rates.grid.ratecell.title.2483b63e', { defaultValue: 'Override release days (leave empty to inherit from the period)' })}
                        />
                    </label>
            </div>
        </div>
    );
});

export default RateCell;
