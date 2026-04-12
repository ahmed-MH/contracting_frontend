import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { getDefaultPathForRole } from '../../../layouts/navigation';
import { createAcceptInviteSchema, type AcceptInviteFormValues } from '../schemas/auth.schema';

export default function AcceptInvitePage() {
    const { t } = useTranslation(['auth', 'common']);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();
    const { loginWithResponse } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const schema = useMemo(() => createAcceptInviteSchema(t), [t]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AcceptInviteFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { firstName: '', lastName: '', password: '', confirmPassword: '' },
    });

    const onSubmit = async (data: AcceptInviteFormValues) => {
        if (!token) {
            setError(t('auth:acceptInvite.errors.missingToken'));
            return;
        }
        setError('');
        setLoading(true);
        try {
            const response = await authService.acceptInvite({
                token,
                firstName: data.firstName,
                lastName: data.lastName,
                password: data.password,
            });
            loginWithResponse(response);
            navigate(getDefaultPathForRole(response.user.role), { replace: true });
        } catch {
            setError(t('auth:acceptInvite.errors.invalidToken'));
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
                <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-brand-navy dark:text-white tracking-tight mb-2">
                    {t('auth:acceptInvite.missingToken.title')}
                </h1>
                <p className="text-[14px] text-brand-slate dark:text-brand-light/75 font-medium mb-8">
                    {t('auth:acceptInvite.missingToken.subtitle')}
                </p>
                <Link to="/login">
                    <Button
                        variant="secondary"
                        className="w-full h-12 font-semibold text-[14px] gap-2 border-brand-slate/20 dark:border-brand-slate/20 hover:border-brand-mint/40"
                    >
                        <ArrowLeft size={16} />
                        {t('auth:acceptInvite.backToLogin')}
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-brand-navy dark:text-white tracking-tight leading-tight">
                    {t('auth:acceptInvite.title')}
                </h1>
                <p className="text-[14px] text-brand-slate dark:text-brand-light/75 mt-2 font-medium">
                    {t('auth:acceptInvite.subtitle')}
                </p>
            </div>

            {error && <ErrorBanner message={error} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="invite-first-name"
                            className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                        >
                            {t('auth:acceptInvite.firstNameLabel')}
                        </label>
                        <Input
                            id="invite-first-name"
                            placeholder={t('auth:acceptInvite.firstNamePlaceholder')}
                            autoComplete="given-name"
                            className="h-12 bg-brand-light dark:bg-brand-navy/80 border-brand-slate/20 dark:border-brand-slate/20 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 rounded-xl px-4 text-[14px] text-brand-navy dark:text-white transition-all"
                            {...register('firstName')}
                        />
                        {errors.firstName && (
                            <p role="alert" className="text-brand-slate text-[12px] mt-1 font-semibold">{errors.firstName.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label
                            htmlFor="invite-last-name"
                            className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                        >
                            {t('auth:acceptInvite.lastNameLabel')}
                        </label>
                        <Input
                            id="invite-last-name"
                            placeholder={t('auth:acceptInvite.lastNamePlaceholder')}
                            autoComplete="family-name"
                            className="h-12 bg-brand-light dark:bg-brand-navy/80 border-brand-slate/20 dark:border-brand-slate/20 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 rounded-xl px-4 text-[14px] text-brand-navy dark:text-white transition-all"
                            {...register('lastName')}
                        />
                        {errors.lastName && (
                            <p role="alert" className="text-brand-slate text-[12px] mt-1 font-semibold">{errors.lastName.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="invite-password"
                        className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                    >
                        {t('auth:acceptInvite.passwordLabel')}
                    </label>
                    <div className="relative">
                        <Input
                            id="invite-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('auth:shared.passwordPlaceholder')}
                            autoComplete="new-password"
                            className="h-12 bg-brand-light dark:bg-brand-navy/80 border-brand-slate/20 dark:border-brand-slate/20 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 rounded-xl px-4 pr-12 text-[14px] text-brand-navy dark:text-white transition-all"
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-xl text-brand-slate hover:text-brand-navy dark:hover:text-white transition-colors cursor-pointer"
                            aria-label={showPassword ? t('auth:shared.hidePassword') : t('auth:shared.showPassword')}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p role="alert" className="text-brand-slate text-[12px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="invite-confirm-password"
                        className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                    >
                        {t('auth:acceptInvite.confirmPasswordLabel')}
                    </label>
                    <Input
                        id="invite-confirm-password"
                        type="password"
                        placeholder={t('auth:shared.passwordPlaceholder')}
                        autoComplete="new-password"
                        className="h-12 bg-brand-light dark:bg-brand-navy/80 border-brand-slate/20 dark:border-brand-slate/20 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 rounded-xl px-4 text-[14px] text-brand-navy dark:text-white transition-all"
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
                        className="w-full h-12 font-bold text-[14px] bg-brand-mint hover:bg-brand-mint text-white border-none shadow-md hover:shadow-md hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Spinner />
                                {t('auth:acceptInvite.loading')}
                            </span>
                        ) : (
                            t('auth:acceptInvite.submit')
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
