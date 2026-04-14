import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { createResetPasswordSchema, type ResetPasswordFormValues } from '../schemas/auth.schema';

export default function ResetPasswordPage() {
    const { t } = useTranslation(['auth', 'common']);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const schema = useMemo(() => createResetPasswordSchema(t), [t]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    useEffect(() => {
        if (!success) return;
        const timer = setTimeout(() => navigate('/login', { replace: true }), 3000);
        return () => clearTimeout(timer);
    }, [success, navigate]);

    const onSubmit = async (data: ResetPasswordFormValues) => {
        if (!token) {
            setError(t('auth:resetPassword.errors.missingToken'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            await authService.resetPassword(token, data.newPassword);
            setSuccess(true);
        } catch {
            setError(t('auth:resetPassword.errors.invalidToken'));
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="w-full text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-slate/10 dark:bg-brand-navy/80 border border-brand-slate/30 dark:border-brand-slate/30 flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-brand-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-brand-navy dark:text-brand-light tracking-tight mb-2">
                    {t('auth:resetPassword.missingToken.title')}
                </h1>
                <p className="text-[14px] text-brand-slate dark:text-brand-light/75 font-medium mb-8">
                    {t('auth:resetPassword.missingToken.subtitle')}
                </p>
                <Link to="/login">
                    <Button
                        variant="secondary"
                        className="w-full h-12 font-semibold text-[14px] gap-2 border-brand-slate/20 dark:border-brand-slate/20 hover:border-brand-mint/40"
                    >
                        <ArrowLeft size={16} />
                        {t('auth:resetPassword.backToLogin')}
                    </Button>
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="w-full text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-mint/10 border border-brand-mint/20 flex items-center justify-center mb-6">
                    <CheckCircle size={32} className="text-brand-mint" />
                </div>
                <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-brand-navy dark:text-brand-light tracking-tight mb-2">
                    {t('auth:resetPassword.success.title')}
                </h1>
                <p className="text-[14px] text-brand-slate dark:text-brand-light/75 font-medium leading-relaxed mb-2 max-w-xs mx-auto">
                    {t('auth:resetPassword.success.subtitle')}
                </p>
                <p className="text-[13px] text-brand-mint font-semibold">
                    {t('auth:resetPassword.success.redirecting')}
                </p>
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
                {t('auth:resetPassword.back')}
            </Link>

            <div className="mb-8">
                <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-brand-navy dark:text-brand-light tracking-tight leading-tight">
                    {t('auth:resetPassword.title')}
                </h1>
                <p className="text-[14px] text-brand-slate dark:text-brand-light/75 mt-2 font-medium">
                    {t('auth:resetPassword.subtitle')}
                </p>
            </div>

            {error && <ErrorBanner message={error} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                    <label
                        htmlFor="reset-new-password"
                        className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                    >
                        {t('auth:resetPassword.newPasswordLabel')}
                    </label>
                    <div className="relative">
                        <Input
                            id="reset-new-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('auth:shared.passwordPlaceholder')}
                            className="h-12 bg-brand-light dark:bg-brand-navy/80 border-brand-slate/20 dark:border-brand-slate/20 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 rounded-xl px-4 pr-12 text-[14px] text-brand-navy dark:text-brand-light transition-all"
                            {...register('newPassword')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-xl text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer"
                            aria-label={showPassword ? t('auth:shared.hidePassword') : t('auth:shared.showPassword')}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.newPassword && (
                        <p role="alert" className="text-brand-slate text-[12px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1">
                            {errors.newPassword.message}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="reset-confirm-password"
                        className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                    >
                        {t('auth:resetPassword.confirmPasswordLabel')}
                    </label>
                    <Input
                        id="reset-confirm-password"
                        type="password"
                        placeholder={t('auth:shared.passwordPlaceholder')}
                        className="h-12 bg-brand-light dark:bg-brand-navy/80 border-brand-slate/20 dark:border-brand-slate/20 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 rounded-xl px-4 text-[14px] text-brand-navy dark:text-brand-light transition-all"
                        {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                        <p role="alert" className="text-brand-slate text-[12px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1">
                            {errors.confirmPassword.message}
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
                                {t('auth:resetPassword.loading')}
                            </span>
                        ) : (
                            t('auth:resetPassword.submit')
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
