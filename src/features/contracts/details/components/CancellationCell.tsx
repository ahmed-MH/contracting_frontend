import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Percent, Banknote } from 'lucide-react';
import { CancellationPenaltyType } from '../../../catalog/cancellation/types/cancellation.types';

interface CancellationCellProps {
    isActive: boolean;
    baseValue: number;
    penaltyType: CancellationPenaltyType;
    overrideValue: number | null;
    onToggle: (active: boolean) => void;
    onChange: (value: number | null) => void;
}

const CancellationCell = React.memo(({
    isActive,
    baseValue,
    penaltyType,
    overrideValue,
    onToggle,
    onChange,
}: CancellationCellProps) => {
    const { t } = useTranslation('common');
    const [localValue, setLocalValue] = useState<string>(overrideValue?.toString() ?? '');
    const debounceRef = useRef<any>(null);

    useEffect(() => {
        setLocalValue(overrideValue?.toString() ?? '');
    }, [overrideValue]);

    const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setLocalValue(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            onChange(value === '' ? null : parseFloat(value));
        }, 400);
    };

    const getIcon = () => {
        switch (penaltyType) {
            case CancellationPenaltyType.NIGHTS:
                return <Hash size={12} />;
            case CancellationPenaltyType.PERCENTAGE:
                return <Percent size={12} />;
            case CancellationPenaltyType.FIXED_AMOUNT:
                return <Banknote size={12} />;
            default:
                return <Percent size={12} />;
        }
    };

    const getSuffix = () => {
        switch (penaltyType) {
            case CancellationPenaltyType.NIGHTS:
                return t('pages.contractDetails.cancellationCell.suffix.nights', { defaultValue: 'Night(s)' });
            case CancellationPenaltyType.PERCENTAGE:
                return '%';
            case CancellationPenaltyType.FIXED_AMOUNT:
                return t('pages.contractDetails.cancellationCell.suffix.fixedAmount', { defaultValue: '€' });
            default:
                return '';
        }
    };

    if (!isActive) {
        return (
            <div className="flex items-center justify-between px-3 h-[68px] group/cell transition-colors hover:bg-brand-light">
                <span className="text-[11px] text-brand-slate italic select-none">
                    {t('pages.contractDetails.cancellationCell.inactive', { defaultValue: 'Not applied' })}
                </span>
                <button
                    type="button"
                    onClick={() => onToggle(true)}
                    title={t('pages.contractDetails.cancellationCell.activateForPeriod', { defaultValue: 'Enable for this period' })}
                    aria-label={t('pages.contractDetails.cancellationCell.activateForPeriod', { defaultValue: 'Enable for this period' })}
                    className="relative w-8 h-4 rounded-full bg-brand-slate/10 hover:bg-brand-mint/10 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-brand-light absolute top-0.5 left-0.5 shadow-sm transition-all" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell transition-colors hover:bg-brand-mint/10">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-mint uppercase tracking-wider select-none">
                    {t('pages.contractDetails.cancellationCell.active', { defaultValue: 'Active' })}
                </span>
                <button
                    type="button"
                    onClick={() => onToggle(false)}
                    title={t('pages.contractDetails.cancellationCell.disableForPeriod', { defaultValue: 'Disable for this period' })}
                    aria-label={t('pages.contractDetails.cancellationCell.disableForPeriod', { defaultValue: 'Disable for this period' })}
                    className="relative w-8 h-4 rounded-full bg-brand-mint hover:bg-brand-slate/20 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-brand-light absolute top-0.5 right-0.5 shadow-sm" />
                </button>
            </div>

            <div className="relative">
                <div className={`absolute left-2 top-1/2 -translate-y-1/2 transition-colors ${localValue !== '' ? 'text-brand-mint' : 'text-brand-slate'}`}>
                    {getIcon()}
                </div>
                <input
                    type="number"
                    min="0"
                    value={localValue}
                    onChange={handleValueChange}
                    placeholder={t('pages.contractDetails.cancellationCell.basePlaceholder', {
                        defaultValue: 'Base: {{value}}{{suffix}}',
                        value: baseValue,
                        suffix: getSuffix(),
                    })}
                    title={t('pages.contractDetails.cancellationCell.inheritHint', { defaultValue: 'Leave empty to inherit the base value' })}
                    className={`block w-full pl-6 pr-2 py-1 text-xs rounded-xl border text-right transition-all focus:outline-none focus:ring-1 focus:ring-brand-mint focus:border-brand-mint/30 ${localValue !== '' ? 'border-brand-mint/30 text-brand-mint bg-brand-mint/10 font-semibold' : 'border-brand-slate/20 text-brand-slate bg-brand-light'}`}
                />
                {localValue !== '' && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-brand-mint pointer-events-none" />
                )}
            </div>
        </div>
    );
});

CancellationCell.displayName = 'CancellationCell';

export default CancellationCell;
