import { useState, useCallback, useRef, memo } from 'react';
import { Percent, Wallet, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CellData {
    active: boolean;
    overrideValue: string;
}

interface SpoCellProps {
    spoId: number;
    periodId: number;
    cell: CellData;
    baseValue: number;
    benefitType: string;
    stayNights: number;
    payNights: number;
    isContractedPeriod: boolean;
    onChange: (spoId: number, periodId: number, patch: Partial<CellData>) => void;
}

const SpoCell = memo(function SpoCell({
    spoId,
    periodId,
    cell,
    baseValue,
    benefitType,
    stayNights,
    payNights,
    isContractedPeriod,
    onChange,
}: SpoCellProps) {
    const { t } = useTranslation('common');
    void t;
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localValue, setLocalValue] = useState(cell.overrideValue);

    const emitChange = useCallback((patch: Partial<CellData>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onChange(spoId, periodId, patch), 400);
    }, [onChange, spoId, periodId]);

    const handleToggle = () => onChange(spoId, periodId, { active: !cell.active });

    const handleValueChange = (val: string) => {
        setLocalValue(val);
        emitChange({ overrideValue: val });
    };

    // ── Pre-disabled state (not contracted) ──────────────────────
    if (!isContractedPeriod) {
        return (
            <div className="flex items-center justify-center h-[68px] bg-brand-light opacity-50 cursor-not-allowed" title={t('auto.features.contracts.details.components.spocell.title.9b640f42', { defaultValue: "Chambres cible non actives" })}>
                <span className="text-[10px] text-brand-slate italic">{t('auto.features.contracts.details.components.spocell.1ca2c9a7', { defaultValue: "Inactif" })}</span>
            </div>
        );
    }

    // ── Inactive state ────────────────────────────────────────────────
    if (!cell.active) {
        return (
            <div className="flex items-center justify-between px-3 h-[68px] group/cell bg-brand-light hover:bg-brand-light transition-colors">
                <span className="text-[11px] text-brand-slate italic select-none">{t('auto.features.contracts.details.components.spocell.edb8534c', { defaultValue: "Non appliqué" })}</span>
                <button
                    type="button"
                    onClick={handleToggle}
                    aria-label={t('auto.features.contracts.details.components.spocell.enableForPeriod', { defaultValue: 'Enable for this period' })}
                    className="relative w-8 h-4 rounded-full bg-brand-slate/10 hover:bg-brand-mint/10 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-brand-light absolute top-0.5 left-0.5 shadow-sm" />
                </button>
            </div>
        );
    }

    // ── Active state ──────────────────────────────────────────────────
    const canOverride = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'].includes(benefitType);
    const placeholderText = benefitType === 'FREE_NIGHTS' ? `${stayNights}=${payNights}` 
                          : benefitType === 'PERCENTAGE_DISCOUNT' ? `${baseValue}%` 
                          : `${baseValue} TND`;

    return (
        <div className="flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell hover:bg-brand-mint/10 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-brand-mint uppercase tracking-tighter">{t('auto.features.contracts.details.components.spocell.808b2a32', { defaultValue: "Actif" })}</span>
                    {cell.overrideValue !== '' && <span className="w-1 h-1 rounded-full bg-brand-mint" />}
                </div>
                <button
                    type="button"
                    onClick={handleToggle}
                    aria-label={t('auto.features.contracts.details.components.spocell.disableForPeriod', { defaultValue: 'Disable for this period' })}
                    className="relative w-8 h-4 rounded-full bg-brand-mint hover:bg-brand-slate/20 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-brand-light absolute top-0.5 right-0.5 shadow-sm" />
                </button>
            </div>

            <div className="relative">
                <input
                    type={canOverride ? 'number' : 'text'}
                    min="0"
                    step="0.01"
                    value={canOverride ? localValue : placeholderText}
                    onChange={(e) => canOverride && handleValueChange(e.target.value)}
                    placeholder={canOverride ? placeholderText : ''}
                    disabled={!canOverride}
                    className={`block w-full px-2 py-1 text-xs rounded-xl border text-right transition-all outline-none
                        ${canOverride ? 'focus:ring-1 focus:ring-brand-mint focus:border-brand-mint/30' : 'cursor-default border-transparent bg-transparent text-brand-slate'}
                        ${localValue !== '' ? 'border-brand-mint/30 text-brand-mint bg-brand-mint/10 font-semibold' : 'border-brand-slate/20 text-brand-slate bg-brand-light'}
                    `}
                />
                {canOverride && benefitType === 'PERCENTAGE_DISCOUNT' && (
                    <Percent size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-slate" />
                )}
                {canOverride && benefitType === 'FIXED_DISCOUNT' && (
                    <Wallet size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-slate" />
                )}
                {benefitType === 'FREE_NIGHTS' && (
                    <Sun size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-mint" />
                )}
            </div>
        </div>
    );
});

export default SpoCell;
