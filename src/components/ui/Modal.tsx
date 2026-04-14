import { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ModalPortal from './ModalPortal';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'max-w-md',
}: ModalProps) {
    const { t } = useTranslation('common');
    void t;
    const panelRef = useRef<HTMLDivElement>(null);
    const titleId = useId();

    if (!isOpen) return null;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-brand-navy/55 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`
                    relative z-10 w-full ${maxWidth} mx-auto
                    flex flex-col max-h-[90vh] overflow-hidden
                    rounded-2xl shadow-md animate-in scale-in
                    bg-brand-light/95 dark:bg-brand-navy/95 backdrop-blur-xl
                    border border-brand-light/60 dark:border-brand-light/10
                `}
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-brand-slate/15 dark:border-brand-slate/20">
                    <h2 id={titleId} className="text-lg font-semibold text-brand-navy dark:text-brand-light">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('actions.close', { defaultValue: 'Close' })}
                        className="p-1.5 rounded-xl transition-colors cursor-pointer
                            text-brand-slate hover:text-brand-navy hover:bg-brand-slate/10
                            dark:hover:text-brand-light dark:hover:bg-brand-slate/20"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>
            </div>
            </div>
        </ModalPortal>
    );
}
