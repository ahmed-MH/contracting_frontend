import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Hotel, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface ResetForm {
    newPassword: string;
    confirmPassword: string;
}

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>({
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    const passwordValue = watch('newPassword');

    const onSubmit = async (data: ResetForm) => {
        if (!token) {
            setError('Token manquant.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await authService.resetPassword(token, data.newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        } catch {
            setError('Token invalide ou expiré.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center max-w-md">
                    <p className="text-red-300 mb-4">Aucun token de réinitialisation trouvé.</p>
                    <Link to="/login" className="text-indigo-300 hover:text-indigo-200 text-sm">← Retour à la connexion</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-500/30">
                        <Hotel className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Nouveau mot de passe</h1>
                    <p className="text-violet-300 text-sm mt-1">Définissez votre nouveau mot de passe</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                    {success ? (
                        <div className="text-center py-4">
                            <CheckCircle className="mx-auto text-emerald-400 mb-4" size={48} />
                            <p className="text-white font-medium mb-1">Mot de passe modifié !</p>
                            <p className="text-indigo-300 text-sm">Redirection vers la connexion...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Nouveau mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('newPassword', {
                                            required: 'Requis',
                                            minLength: { value: 6, message: 'Min. 6 caractères' },
                                        })}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none pr-12"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 cursor-pointer">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Confirmer</label>
                                <input
                                    type="password"
                                    {...register('confirmPassword', {
                                        required: 'Requis',
                                        validate: (val) => val === passwordValue || 'Les mots de passe ne correspondent pas',
                                    })}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                                />
                                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full py-3 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/30">
                                {loading ? 'Réinitialisation...' : 'Réinitialiser'}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors">← Retour à la connexion</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
