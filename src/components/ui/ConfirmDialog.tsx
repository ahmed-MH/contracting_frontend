import { useId } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import ModalPortal from './ModalPortal';

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
    const titleId = useId();
    const descriptionId = useId();

    if (!isOpen) return null;

    const isDanger = variant === 'danger';
    const resolvedConfirmLabel = confirmLabel ?? t('actions.confirm', { defaultValue: 'Confirm' });
    const resolvedCancelLabel = cancelLabel ?? t('actions.cancel', { defaultValue: 'Cancel' });

    return (
        <ModalPortal isOpen={isOpen} onClose={onCancel}>
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-brand-navy/55 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
                onClick={onCancel}
            />

            {/* Panel */}
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className="
                relative z-10 w-full max-w-sm mx-auto
                rounded-2xl shadow-md animate-[scaleIn_200ms_ease-out]
                bg-brand-light/95 dark:bg-brand-navy/95 backdrop-blur-xl
                border border-brand-light/60 dark:border-brand-light/10
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
                        <h3 id={titleId} className="text-base font-semibold text-brand-navy dark:text-brand-light">
                            {title}
                        </h3>
                        {description && (
                            <p id={descriptionId} className="text-sm text-brand-slate mt-1 leading-relaxed">
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
                    <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm}>
                        {resolvedConfirmLabel}
                    </Button>
                </div>
            </div>
        </div>
        </ModalPortal>
    );
}
