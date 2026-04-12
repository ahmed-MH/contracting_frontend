import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useTranslation } from 'react-i18next';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'info';
}

interface ConfirmContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Promise-based confirmation dialog provider.
 * Renders a single global ConfirmDialog driven by the `confirm()` function.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
    const { t } = useTranslation('common');
    void t;
    const [state, setState] = useState<(ConfirmOptions & { isOpen: boolean }) | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
            setState({ ...options, isOpen: true });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        resolveRef.current?.(true);
        resolveRef.current = null;
        setState(null);
    }, []);

    const handleCancel = useCallback(() => {
        resolveRef.current?.(false);
        resolveRef.current = null;
        setState(null);
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmDialog
                isOpen={state?.isOpen ?? false}
                title={state?.title ?? ''}
                description={state?.description}
                confirmLabel={state?.confirmLabel}
                cancelLabel={state?.cancelLabel}
                variant={state?.variant}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmContextValue {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return ctx;
}
