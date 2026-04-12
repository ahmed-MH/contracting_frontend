import { useTranslation } from 'react-i18next';

interface ErrorBannerProps {
    message: string;
}

export const ErrorBanner = ({ message }: ErrorBannerProps) => {
    const { t } = useTranslation('common');
    void t;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl
                       bg-brand-slate/10 dark:bg-brand-navy/80
                       border border-brand-slate/30 dark:border-brand-slate/30
                       animate-in fade-in slide-in-from-top-2 duration-300"
        >
            <div className="shrink-0 w-8 h-8 rounded-xl bg-brand-slate/10 dark:bg-brand-navy/80 flex items-center justify-center">
                <svg
                    className="w-4 h-4 text-brand-slate"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <p className="text-[13px] font-semibold text-brand-slate dark:text-brand-light/75">{message}</p>
        </div>
    );
};
