import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`
                    relative z-10 w-full ${maxWidth} mx-auto
                    flex flex-col max-h-[90vh] overflow-hidden
                    rounded-xl shadow-md animate-in fade-in
                    bg-white dark:bg-brand-navy
                    border border-transparent dark:border-brand-slate/20
                `}
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-brand-slate/15 dark:border-brand-slate/20">
                    <h2 className="text-lg font-semibold text-brand-navy dark:text-brand-light">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
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
    );
}
