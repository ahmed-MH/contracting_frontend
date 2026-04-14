import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, CheckCircle2, Clock, Ban, AlertTriangle } from 'lucide-react';
import type { ActivationValidationIssue, ContractStatus } from '../types/contract.types';
import { useContractActivationCheck, useUpdateContract } from '../hooks/useContracts';

interface StatusDropdownProps {
    contractId: number;
    currentStatus: ContractStatus;
    size?: 'sm' | 'md';
}

export default function StatusDropdown({ contractId, currentStatus, size = 'sm' }: StatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const [activationErrors, setActivationErrors] = useState<ActivationValidationIssue[]>([]);
    const ref = useRef<HTMLDivElement>(null);
    const { mutate: updateContract, isPending } = useUpdateContract(contractId);
    const { t } = useTranslation('common');

    const statusConfig: Record<ContractStatus, { label: string; color: string; icon: React.ReactNode }> = {
        DRAFT: {
            label: t('pages.contractDetails.status.draft', { defaultValue: 'Draft' }),
            color: 'bg-brand-light text-brand-slate ring-1 ring-brand-slate/20 dark:bg-brand-light/8 dark:text-brand-light/70 dark:ring-brand-light/15',
            icon: <Clock size={13} />,
        },
        ACTIVE: {
            label: t('pages.contractDetails.status.active', { defaultValue: 'Active' }),
            color: 'bg-brand-mint/10 text-brand-mint ring-1 ring-brand-mint',
            icon: <CheckCircle2 size={13} />,
        },
        EXPIRED: {
            label: t('pages.contractDetails.status.expired', { defaultValue: 'Expired' }),
            color: 'bg-brand-slate/10 text-brand-slate ring-1 ring-brand-slate/40 dark:text-brand-light/50',
            icon: <AlertTriangle size={13} />,
        },
        TERMINATED: {
            label: t('pages.contractDetails.status.terminated', { defaultValue: 'Terminated' }),
            color: 'bg-brand-light text-brand-slate ring-1 ring-brand-slate/30 dark:bg-brand-light/8 dark:text-brand-light/50 dark:ring-brand-light/15',
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
    const canActivate = transitions.includes('ACTIVE');
    const cfg = statusConfig[currentStatus];
    const activationCheck = useContractActivationCheck(contractId, open && canActivate);

    const handleClose = useCallback(() => setOpen(false), []);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handleClose();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClose]);

    const handleTransition = async (newStatus: ContractStatus) => {
        setActivationErrors([]);

        if (newStatus === 'ACTIVE') {
            const result = activationCheck.data ?? (await activationCheck.refetch()).data;
            if (result && !result.isValid) {
                setActivationErrors(result.errors);
                return;
            }
        }

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
                aria-haspopup="listbox"
                aria-expanded={open}
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
                <div
                    role="listbox"
                    aria-label={t('pages.contractDetails.status.changeTo', { defaultValue: 'Change status to' })}
                    className="absolute left-0 top-full mt-2 z-50 min-w-[200px] rounded-xl shadow-md border py-1.5 animate-in fade-in slide-in-from-top-1 duration-150
                        bg-brand-light border-brand-slate/20
                        dark:bg-brand-navy dark:border-brand-light/12"
                >
                    <p className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest border-b
                        text-brand-slate border-brand-slate/20
                        dark:text-brand-light/50 dark:border-brand-light/10">
                        {t('pages.contractDetails.status.changeTo', { defaultValue: 'Change status to' })}
                    </p>
                    {canActivate && (activationCheck.isFetching || activationErrors.length > 0 || activationCheck.data?.isValid === false) && (
                        <div className="mx-2 my-2 rounded-lg border px-3 py-2 text-xs
                            border-red-200 bg-red-50 text-red-700
                            dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
                            {activationCheck.isFetching ? (
                                <p>{t('pages.contractDetails.status.checkingActivation', { defaultValue: 'Checking activation readiness...' })}</p>
                            ) : (
                                <>
                                    <p className="font-semibold">
                                        {t('pages.contractDetails.status.activationBlocked', { defaultValue: 'Activation blocked' })}
                                    </p>
                                    <ul className="mt-1 space-y-1">
                                        {(activationErrors.length > 0 ? activationErrors : activationCheck.data?.errors ?? []).slice(0, 5).map((issue) => (
                                            <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}

                    {transitions.map((target) => {
                        const targetConfig = statusConfig[target];
                        return (
                            <button
                                key={target}
                                role="option"
                                onClick={() => handleTransition(target)}
                                disabled={target === 'ACTIVE' && activationCheck.isFetching}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-left transition-colors group
                                    hover:bg-brand-slate/5 dark:hover:bg-brand-light/6
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${targetConfig.color} group-hover:shadow-sm transition-shadow`}>
                                    {targetConfig.icon}
                                    {targetConfig.label}
                                </span>
                                <span className="text-xs text-brand-slate dark:text-brand-light/50">
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
