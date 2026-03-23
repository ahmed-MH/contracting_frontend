import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle2, Clock, Ban, AlertTriangle } from 'lucide-react';
import type { ContractStatus } from '../types/contract.types';
import { useUpdateContract } from '../hooks/useContracts';

// ─── Config & Transitions ─────────────────────────────────────────────

export const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT:      { label: 'Brouillon',  color: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',   icon: <Clock size={13} /> },
    ACTIVE:     { label: 'Actif',      color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: <CheckCircle2 size={13} /> },
    EXPIRED:    { label: 'Expiré',     color: 'bg-red-50 text-red-700 ring-1 ring-red-200',             icon: <AlertTriangle size={13} /> },
    TERMINATED: { label: 'Résilié',    color: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',         icon: <Ban size={13} /> },
};

export const STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    DRAFT:      ['ACTIVE', 'TERMINATED'],
    ACTIVE:     ['DRAFT', 'TERMINATED'],
    EXPIRED:    ['ACTIVE', 'TERMINATED'],
    TERMINATED: [],
};

// ─── Component ────────────────────────────────────────────────────────

interface StatusDropdownProps {
    contractId: number;
    currentStatus: ContractStatus;
    /** 'sm' for compact list usage, 'md' for header usage */
    size?: 'sm' | 'md';
}

export default function StatusDropdown({ contractId, currentStatus, size = 'sm' }: StatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { mutate: updateContract, isPending } = useUpdateContract(contractId);
    const transitions = STATUS_TRANSITIONS[currentStatus];
    const cfg = STATUS_CONFIG[currentStatus];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleTransition = (newStatus: ContractStatus) => {
        updateContract({ status: newStatus }, { onSuccess: () => setOpen(false) });
    };

    const sizeClasses = size === 'md'
        ? 'px-3.5 py-1.5 text-sm gap-2'
        : 'px-2.5 py-1 text-xs gap-1.5';

    return (
        <div ref={ref} className="relative inline-flex">
            <button
                onClick={() => transitions.length > 0 && setOpen(v => !v)}
                disabled={isPending || transitions.length === 0}
                title={transitions.length === 0 ? 'État terminal — aucune transition possible' : 'Cliquer pour changer le statut'}
                className={`
                    inline-flex items-center font-semibold rounded-full transition-all select-none
                    ${sizeClasses}
                    ${cfg.color}
                    ${transitions.length > 0 ? 'cursor-pointer hover:shadow-md hover:scale-105 active:scale-95' : 'cursor-default'}
                    ${isPending ? 'opacity-60 pointer-events-none' : ''}
                `}
            >
                {isPending
                    ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    : cfg.icon
                }
                {cfg.label}
                {transitions.length > 0 && (
                    <ChevronDown
                        size={size === 'md' ? 13 : 10}
                        className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-2 z-50 min-w-[200px] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="px-3.5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        Changer le statut vers
                    </p>
                    {transitions.map(target => {
                        const t = STATUS_CONFIG[target];
                        return (
                            <button
                                key={target}
                                onClick={() => handleTransition(target)}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors group"
                            >
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${t.color} group-hover:shadow-sm transition-shadow`}>
                                    {t.icon}
                                    {t.label}
                                </span>
                                <span className="text-xs text-gray-400">→ Appliquer</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
