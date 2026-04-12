import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, CheckCircle2, Clock, Ban, AlertTriangle } from 'lucide-react';
import type { ContractStatus } from '../types/contract.types';
import { useUpdateContract } from '../hooks/useContracts';

interface StatusDropdownProps {
    contractId: number;
    currentStatus: ContractStatus;
    size?: 'sm' | 'md';
}

export default function StatusDropdown({ contractId, currentStatus, size = 'sm' }: StatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { mutate: updateContract, isPending } = useUpdateContract(contractId);
    const { t } = useTranslation('common');

    const statusConfig: Record<ContractStatus, { label: string; color: string; icon: React.ReactNode }> = {
        DRAFT: {
            label: t('pages.contractDetails.status.draft', { defaultValue: 'Draft' }),
            color: 'bg-brand-light text-brand-slate ring-1 ring-brand-slate/20',
            icon: <Clock size={13} />,
        },
        ACTIVE: {
            label: t('pages.contractDetails.status.active', { defaultValue: 'Active' }),
            color: 'bg-brand-mint/10 text-brand-mint ring-1 ring-brand-mint',
            icon: <CheckCircle2 size={13} />,
        },
        EXPIRED: {
            label: t('pages.contractDetails.status.expired', { defaultValue: 'Expired' }),
            color: 'bg-brand-slate/10 text-brand-slate ring-1 ring-brand-mint',
            icon: <AlertTriangle size={13} />,
        },
        TERMINATED: {
            label: t('pages.contractDetails.status.terminated', { defaultValue: 'Terminated' }),
            color: 'bg-brand-light text-brand-slate ring-1 ring-brand-mint',
            icon: <Ban size={13} />,
        },
    };

    const statusTransitions: Record<ContractStatus, ContractStatus[]> = {
        DRAFT: ['ACTIVE', 'TERMINATED'],
        ACTIVE: ['DRAFT', 'TERMINATED'],
        EXPIRED: ['ACTIVE', 'TERMINATED'],
        TERMINATED: [],
    };

    const transitions = statusTransitions[currentStatus];
    const cfg = statusConfig[currentStatus];

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
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
                onClick={() => transitions.length > 0 && setOpen((value) => !value)}
                disabled={isPending || transitions.length === 0}
                title={transitions.length === 0
                    ? t('pages.contractDetails.status.terminalHint', { defaultValue: 'Terminal state, no transition available' })
                    : t('pages.contractDetails.status.changeHint', { defaultValue: 'Click to change status' })}
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
                    : cfg.icon}
                {cfg.label}
                {transitions.length > 0 && (
                    <ChevronDown
                        size={size === 'md' ? 13 : 10}
                        className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-2 z-50 min-w-[200px] bg-white rounded-xl shadow-md border border-brand-slate/20 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="px-3.5 py-2 text-[10px] font-bold text-brand-slate uppercase tracking-widest border-b border-brand-slate/20">
                        {t('pages.contractDetails.status.changeTo', { defaultValue: 'Change status to' })}
                    </p>
                    {transitions.map((target) => {
                        const targetConfig = statusConfig[target];
                        return (
                            <button
                                key={target}
                                onClick={() => handleTransition(target)}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-left hover:bg-brand-light transition-colors group"
                            >
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${targetConfig.color} group-hover:shadow-sm transition-shadow`}>
                                    {targetConfig.icon}
                                    {targetConfig.label}
                                </span>
                                <span className="text-xs text-brand-slate">
                                    {t('pages.contractDetails.status.apply', { defaultValue: 'Apply' })}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
