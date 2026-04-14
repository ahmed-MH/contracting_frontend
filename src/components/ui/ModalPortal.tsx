import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

let openModalCount = 0;
let previousBodyOverflow = '';

interface ModalPortalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    closeOnEscape?: boolean;
    initialFocusRef?: RefObject<HTMLElement>;
}

export default function ModalPortal({
    isOpen,
    onClose,
    children,
    closeOnEscape = true,
    initialFocusRef,
}: ModalPortalProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen || typeof document === 'undefined') return;

        previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        if (openModalCount === 0) {
            previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        openModalCount += 1;

        const focusTimer = window.setTimeout(() => {
            const root = rootRef.current;
            if (!root) return;
            const preferred = initialFocusRef?.current;
            const firstFocusable = root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            (preferred ?? firstFocusable ?? root).focus({ preventScroll: true });
        }, 0);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && closeOnEscape) {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab') return;
            const root = rootRef.current;
            if (!root) return;

            const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
                .filter((element) => element.offsetParent !== null || element === document.activeElement);

            if (focusable.length === 0) {
                event.preventDefault();
                root.focus({ preventScroll: true });
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', handleKeyDown);
            openModalCount = Math.max(0, openModalCount - 1);
            if (openModalCount === 0) {
                document.body.style.overflow = previousBodyOverflow;
            }
            previouslyFocusedRef.current?.focus?.({ preventScroll: true });
        };
    }, [closeOnEscape, initialFocusRef, isOpen, onClose]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div ref={rootRef} tabIndex={-1}>
            {children}
        </div>,
        document.body,
    );
}
