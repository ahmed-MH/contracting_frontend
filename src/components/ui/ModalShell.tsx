import { useId } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Save } from 'lucide-react';
import ModalPortal from './ModalPortal';

/**
 * ModalShell — shared self-contained overlay for all business modals.
 *
 * Two usage modes:
 *
 * MODE A – Built-in submit footer (simple forms):
 *   <ModalShell isOpen onClose={onClose} title="My Modal"
 *     onSubmit={handleSubmit(fn)} submitLabel="Save" isSubmitting={isPending}>
 *     {children}
 *   </ModalShell>
 *
 * MODE B – Custom footer (complex multi-step or multi-button footers):
 *   <ModalShell isOpen onClose={onClose} title="My Modal" footer={<>...</>}>
 *     {children}
 *   </ModalShell>
 *
 * Both modes support: icon, iconBg, subtitle, maxWidth.
 */

interface ModalShellProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    /** Optional icon element displayed in the header left of the title */
    icon?: React.ReactNode;
    /** Tailwind classes for the icon wrapper background + text color */
    iconBg?: string;
    /** Custom footer JSX — if provided, the built-in Cancel/Submit buttons are NOT rendered */
    footer?: React.ReactNode;
    /** Called when the form submits — pass handleSubmit(onSubmit) directly if wrapping a <form> */
    onSubmit?: React.FormEventHandler<HTMLFormElement>;
    submitLabel?: string;
    isSubmitting?: boolean;
    /** Disable submit (e.g. when form is not dirty) */
    submitDisabled?: boolean;
    maxWidth?: string;
    children: React.ReactNode;
}

export default function ModalShell({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    iconBg = 'bg-brand-mint/10 dark:bg-brand-mint/5 text-brand-mint',
    footer,
    onSubmit,
    submitLabel,
    isSubmitting = false,
    submitDisabled = false,
    maxWidth = 'max-w-2xl',
    children,
}: ModalShellProps) {
    const { t } = useTranslation('common');
    const titleId = useId();
    const subtitleId = useId();

    if (!isOpen) return null;
    const resolvedSubmitLabel = submitLabel ?? t('actions.save', { defaultValue: 'Save' });
    const cancelLabel = t('actions.cancel', { defaultValue: 'Cancel' });

    const builtInFooter = (
        <div className="
            px-6 py-4 sticky bottom-0 z-10
            flex flex-wrap items-center justify-end gap-3
            border-t border-brand-slate/15 dark:border-brand-slate/20
            bg-brand-light/80 dark:bg-brand-navy/80 backdrop-blur-sm
            rounded-b-2xl
        ">
            <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="px-5"
            >
                {cancelLabel}
            </Button>
            <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || submitDisabled}
                className="gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting
                    ? <div className="w-4 h-4 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                    : <Save size={16} />
                }
                {resolvedSubmitLabel}
            </Button>
        </div>
    );

    const customFooter = footer ? (
        <div className="
            px-6 py-4 sticky bottom-0 z-10
            flex flex-wrap items-center justify-end gap-3
            border-t border-brand-slate/15 dark:border-brand-slate/20
            bg-brand-light/80 dark:bg-brand-navy/80 backdrop-blur-sm
            rounded-b-2xl
        ">
            {footer}
        </div>
    ) : null;

    const resolvedFooter = footer ? customFooter : builtInFooter;

    const header = (
        <div className="
            px-6 py-4 sticky top-0 z-10
            flex items-center justify-between
            border-b border-brand-slate/15 dark:border-brand-slate/20
            bg-brand-light dark:bg-brand-navy
        ">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                        {icon}
                    </div>
                )}
                <div>
                    <h3 id={titleId} className="text-lg font-bold text-brand-navy dark:text-brand-light">
                        {title}
                    </h3>
                    {subtitle && (
                        <p id={subtitleId} className="text-xs text-brand-slate font-medium uppercase tracking-wider mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label={t('actions.close', { defaultValue: 'Close' })}
                className="p-2 rounded-full transition-colors cursor-pointer
                    text-brand-slate hover:text-brand-navy hover:bg-brand-slate/10
                    dark:hover:text-brand-light dark:hover:bg-brand-slate/20"
            >
                <X size={20} />
            </button>
        </div>
    );

    const panelClasses = `
        relative z-10 w-full ${maxWidth} mx-auto
        flex flex-col max-h-[90vh] overflow-hidden
        rounded-2xl shadow-md
        bg-brand-light/95 dark:bg-brand-navy/95 backdrop-blur-xl
        border border-brand-light/60 dark:border-brand-light/10
    `;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-brand-navy/55 backdrop-blur-sm animate-in fade-in">
            {/* Backdrop — click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Panel */}
            {onSubmit ? (
                <form onSubmit={onSubmit} className={panelClasses} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={subtitle ? subtitleId : undefined}>
                    {header}
                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>
                    {resolvedFooter}
                </form>
            ) : (
                <div className={panelClasses} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={subtitle ? subtitleId : undefined}>
                    {header}
                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>
                    {resolvedFooter}
                </div>
            )}
        </div>
        </ModalPortal>
    );
}
