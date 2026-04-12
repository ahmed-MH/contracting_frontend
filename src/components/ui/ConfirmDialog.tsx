import { useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'info',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const { t } = useTranslation('common');
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const isDanger = variant === 'danger';
    const resolvedConfirmLabel = confirmLabel ?? t('actions.confirm', { defaultValue: 'Confirm' });
    const resolvedCancelLabel = cancelLabel ?? t('actions.cancel', { defaultValue: 'Cancel' });

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
                onClick={onCancel}
            />

            {/* Panel */}
            <div className="
                relative z-10 w-full max-w-sm mx-auto
                rounded-xl shadow-md animate-[scaleIn_200ms_ease-out]
                bg-white dark:bg-brand-navy
                border border-transparent dark:border-brand-slate/20
            ">
                {/* Icon + Text */}
                <div className="px-6 pt-6 pb-2 flex items-start gap-4">
                    <div className={`shrink-0 p-2 rounded-full ${
                        isDanger
                            ? 'bg-brand-slate/10 text-brand-slate dark:bg-brand-navy/80 dark:text-brand-light/75'
                            : 'bg-brand-mint/10 text-brand-mint'
                    }`}>
                        {isDanger ? <AlertTriangle size={20} /> : <Info size={20} />}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-brand-navy dark:text-brand-light">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-sm text-brand-slate mt-1 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 mt-2 border-t border-brand-slate/15 dark:border-brand-slate/20">
                    <Button variant="secondary" onClick={onCancel}>
                        {resolvedCancelLabel}
                    </Button>
                    {isDanger ? (
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-xl
                                bg-brand-slate/20 hover:bg-brand-slate/20 transition-all duration-300 cursor-pointer"
                        >
                            {resolvedConfirmLabel}
                        </button>
                    ) : (
                        <Button variant="primary" onClick={onConfirm}>
                            {resolvedConfirmLabel}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
