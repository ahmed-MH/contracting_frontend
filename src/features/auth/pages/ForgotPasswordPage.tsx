import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { createForgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth.schema';

export default function ForgotPasswordPage() {
    const { t } = useTranslation(['auth', 'common']);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [networkError, setNetworkError] = useState<string | null>(null);
    const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setLoading(true);
        setNetworkError(null);
        try {
            await authService.forgotPassword(data.email);
            setSent(true);
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (!status || status >= 500) {
                setNetworkError(t('auth:errors.genericServer'));
            } else {
                setSent(true);
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="w-full text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-mint/10 border border-brand-mint/20 flex items-center justify-center mb-6">
                    <CheckCircle size={32} className="text-brand-mint" />
                </div>

                <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-brand-navy dark:text-brand-light tracking-tight mb-2">
                    {t('auth:forgotPassword.successTitle')}
                </h1>
                <p className="text-[14px] text-brand-slate dark:text-brand-light/75 font-medium leading-relaxed mb-8 max-w-xs mx-auto">
                    {t('auth:forgotPassword.successSubtitle')}
                </p>

                <Link to="/login">
                    <Button
                        variant="secondary"
                        className="w-full h-12 font-semibold text-[14px] gap-2 border-brand-slate/20 dark:border-brand-slate/20 hover:border-brand-mint/40"
                    >
                        <ArrowLeft size={16} />
                        {t('auth:forgotPassword.backToLogin')}
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full">
            <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-slate hover:text-brand-mint transition-colors uppercase tracking-wider mb-8"
            >
                <ArrowLeft size={14} />
                {t('auth:forgotPassword.back')}
            </Link>

            <div className="mb-8">
                <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-brand-navy dark:text-brand-light tracking-tight leading-tight">
                    {t('auth:forgotPassword.title')}
                </h1>
                <p className="text-[14px] text-brand-slate dark:text-brand-light/75 mt-2 font-medium">
                    {t('auth:forgotPassword.subtitle')}
                </p>
            </div>

            {networkError && <ErrorBanner message={networkError} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                    <label
                        htmlFor="forgot-email"
                        className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                    >
                        {t('auth:forgotPassword.emailLabel')}
                    </label>
                    <Input
                        id="forgot-email"
                        type="email"
                        placeholder={t('auth:forgotPassword.emailPlaceholder')}
                        autoComplete="email"
                        className="h-12 bg-brand-light dark:bg-brand-navy/80 border-brand-slate/20 dark:border-brand-slate/20 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 rounded-xl px-4 text-[14px] text-brand-navy dark:text-brand-light transition-all"
                        {...register('email')}
                    />
                    {errors.email && (
                        <p role="alert" className="text-brand-slate text-[12px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="w-full h-12 font-bold text-[14px] bg-brand-mint hover:bg-brand-mint text-brand-light border-none shadow-md hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Spinner />
                                {t('auth:forgotPassword.loading')}
                            </span>
                        ) : (
                            t('auth:forgotPassword.submit')
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
