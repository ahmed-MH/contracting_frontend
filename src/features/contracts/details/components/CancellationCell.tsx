import React, { useState, useEffect, useRef } from 'react';
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
    onChange
}: CancellationCellProps) => {
    const [localValue, setLocalValue] = useState<string>(overrideValue?.toString() ?? '');
    const debounceRef = useRef<any>(null);

    useEffect(() => {
        setLocalValue(overrideValue?.toString() ?? '');
    }, [overrideValue]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onChange(val === '' ? null : parseFloat(val));
        }, 400);
    };

    const getIcon = () => {
        switch (penaltyType) {
            case CancellationPenaltyType.NIGHTS: return <Hash size={12} />;
            case CancellationPenaltyType.PERCENTAGE: return <Percent size={12} />;
            case CancellationPenaltyType.FIXED_AMOUNT: return <Banknote size={12} />;
        }
    };

    const getSuffix = () => {
        switch (penaltyType) {
            case CancellationPenaltyType.NIGHTS: return 'Nuit(s)';
            case CancellationPenaltyType.PERCENTAGE: return '%';
            case CancellationPenaltyType.FIXED_AMOUNT: return '€';
        }
    };

    if (!isActive) {
        return (
            <div className="flex items-center justify-between px-3 h-[68px] group/cell transition-colors hover:bg-gray-100/60">
                <span className="text-[11px] text-gray-400 italic select-none">Non appliqué</span>
                <button
                    onClick={() => onToggle(true)}
                    title="Activer pour cette période"
                    className="relative w-8 h-4 rounded-full bg-gray-300 hover:bg-indigo-400 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm transition-all" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-center gap-1.5 px-3 h-[68px] group/cell transition-colors hover:bg-indigo-50/30">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider select-none">Actif</span>
                <button
                    onClick={() => onToggle(false)}
                    title="Désactiver pour cette période"
                    className="relative w-8 h-4 rounded-full bg-indigo-500 hover:bg-red-400 transition-colors cursor-pointer opacity-0 group-hover/cell:opacity-100 shrink-0"
                >
                    <span className="block w-3 h-3 rounded-full bg-white absolute top-0.5 right-0.5 shadow-sm" />
                </button>
            </div>

            <div className="relative">
                <div className={`absolute left-2 top-1/2 -translate-y-1/2 transition-colors ${localValue !== '' ? 'text-indigo-500' : 'text-gray-300'}`}>
                    {getIcon()}
                </div>
                <input
                    type="number"
                    min="0"
                    value={localValue}
                    onChange={handleValueChange}
                    placeholder={`Base: ${baseValue}${getSuffix()}`}
                    title="Laisser vide pour hériter de la valeur de base"
                    className={`block w-full pl-6 pr-2 py-1 text-xs rounded-md border text-right transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 ${localValue !== '' ? 'border-indigo-300 text-indigo-700 bg-indigo-50/70 font-semibold' : 'border-gray-200 text-gray-400 bg-white'}`}
                />
                {localValue !== '' && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 pointer-events-none" />
                )}
            </div>
        </div>
    );
});

CancellationCell.displayName = 'CancellationCell';

export default CancellationCell;
