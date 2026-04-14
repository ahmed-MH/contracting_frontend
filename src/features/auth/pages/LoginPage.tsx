import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { createLoginSchema, type LoginFormValues } from '../schemas/auth.schema';

export default function LoginPage() {
    const { login } = useAuth();
    const { t } = useTranslation(['auth', 'common']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const schema = useMemo(() => createLoginSchema(t), [t]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        setError(null);
        try {
            await login(data.email, data.password);
        } catch {
            setError(t('auth:errors.invalidCredentials'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-brand-navy dark:text-brand-light tracking-tight leading-tight">
                    {t('auth:login.title')}
                </h1>
                <p className="text-[14px] text-brand-slate dark:text-brand-light/75 mt-2 font-medium">
                    {t('auth:login.subtitle')}
                </p>
            </div>

            {error && <ErrorBanner message={error} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                    <label
                        htmlFor="login-email"
                        className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                    >
                        {t('auth:login.emailLabel')}
                    </label>
                    <Input
                        id="login-email"
                        type="email"
                        placeholder={t('auth:login.emailPlaceholder')}
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

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="login-password"
                            className="block text-[13px] font-semibold text-brand-navy dark:text-brand-light/75"
                        >
                            {t('auth:login.passwordLabel')}
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-[12px] font-semibold text-brand-mint hover:text-brand-mint dark:hover:text-brand-light/75 transition-colors"
                        >
                            {t('auth:login.forgotPassword')}
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('auth:shared.passwordPlaceholder')}
                            autoComplete="current-password"
                            className="h-12 bg-brand-light dark:bg-brand-navy/80 border-brand-slate/20 dark:border-brand-slate/20 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/15 rounded-xl px-4 pr-12 text-[14px] text-brand-navy dark:text-brand-light transition-all"
                            {...register('password')}
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
                    {errors.password && (
                        <p role="alert" className="text-brand-slate text-[12px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1">
                            {errors.password.message}
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
                                {t('auth:login.loading')}
                            </span>
                        ) : (
                            t('auth:login.submit')
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
