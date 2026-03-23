import { useState, useCallback, useRef, memo } from 'react';
import { Percent, Wallet, Sun } from 'lucide-react';

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
            <div className="flex items-center justify-center h-[68px] bg-gray-100/50 opacity-50 cursor-not-allowed" title="Chambres cible non actives">
                <span className="text-[10px] text-gray-400 italic">Inactif</span>
            </div>
        );
    }

    // ── Inactive state ────────────────────────────────────────────────
    if (!cell.active) {
        return (
            <div className="flex items-center justify-between px-3 h-[68px] group/cell bg-gray-50/80 hover:bg-gray-100/60 transition-colors">
                <span className="text-[11px] text-gray-400 italic select-none">Non appliqué</span>
                <button
                    onClick={handleToggle}
                    className="relative w-8 h-4 rounded-full bg-gray-300 hover:bg-indigo-400 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm" />
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
        <div className="flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell hover:bg-indigo-50/30 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Actif</span>
                    {cell.overrideValue !== '' && <span className="w-1 h-1 rounded-full bg-indigo-500" />}
                </div>
                <button
                    onClick={handleToggle}
                    className="relative w-8 h-4 rounded-full bg-indigo-500 hover:bg-red-400 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm" />
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
                    className={`block w-full px-2 py-1 text-xs rounded-md border text-right transition-all outline-none
                        ${canOverride ? 'focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400' : 'cursor-default border-transparent bg-transparent text-gray-400'}
                        ${localValue !== '' ? 'border-indigo-300 text-indigo-700 bg-indigo-50/70 font-semibold' : 'border-gray-200 text-gray-500 bg-white'}
                    `}
                />
                {canOverride && benefitType === 'PERCENTAGE_DISCOUNT' && (
                    <Percent size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                )}
                {canOverride && benefitType === 'FIXED_DISCOUNT' && (
                    <Wallet size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                )}
                {benefitType === 'FREE_NIGHTS' && (
                    <Sun size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400" />
                )}
            </div>
        </div>
    );
});

export default SpoCell;
